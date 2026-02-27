# 🧠 CURSOR PROMPT — RAG Pipeline for TaxBuddy (International Student Tax App)

## COPY EVERYTHING BELOW THIS LINE INTO CURSOR

---

## 🎯 WHAT WE ARE BUILDING

A production-grade RAG (Retrieval-Augmented Generation) pipeline for a tax filing assistant
app for international students in the USA. The RAG pipeline will:

- Store IRS tax documents, treaty rules, and FICA exemption info in a Supabase vector DB
- Retrieve the most relevant chunks for any user query
- Use the user's profile (visa type, country, income) to filter results BEFORE searching
- Combine keyword search (BM25) + vector search (Hybrid Search) for best accuracy
- Rerank results using a cross-encoder model for final quality
- Use HyDE (Hypothetical Document Embeddings) for vague/complex queries
- Return a clean context string ready to inject into Claude's system prompt

## ⚙️ TECH STACK FOR THIS RAG MODULE

- **Vector DB**: Supabase with pgvector extension
- **Embeddings**: OpenAI `text-embedding-3-small` (1536 dimensions)
- **BM25 / Keyword search**: Postgres full-text search (tsvector) — built into Supabase
- **Reranker**: `cross-encoder/ms-marco-MiniLM-L-6-v2` via `@xenova/transformers` (runs in Node.js)
- **HyDE generation**: Claude API (`claude-haiku-4-5-20251001` — cheap and fast)
- **Contextual chunking**: Claude API (used ONCE at seed time, not at query time)
- **Language**: TypeScript
- **Framework**: Next.js 14 App Router (API Routes)
- **NO LangChain. NO LlamaIndex. Pure custom implementation only.**

---

## 📁 FILES TO CREATE

```
lib/
├── rag/
│   ├── index.ts              ← main entry point, exports retrieveContext()
│   ├── embed.ts              ← OpenAI embedding functions
│   ├── metadata-filter.ts    ← builds Supabase filter from user profile
│   ├── hybrid-search.ts      ← runs vector + BM25 search in parallel
│   ├── rerank.ts             ← cross-encoder reranking
│   ├── hyde.ts               ← HyDE for vague queries
│   └── format-context.ts     ← formats retrieved chunks into prompt string
│
scripts/
├── seed/
│   ├── seed-knowledge-base.ts    ← main seeding script
│   ├── parse-documents.ts        ← PDF/HTML → raw text chunks
│   ├── contextual-chunking.ts    ← adds context to each chunk via Claude
│   └── documents/
│       ├── sources.ts            ← all document URLs and metadata
│       └── (downloaded PDFs go here)
│
types/
└── rag.ts                    ← all RAG-related TypeScript types
```

---

## 📐 TYPESCRIPT TYPES — Create `types/rag.ts` first

```typescript
export type VisaType = 'F1' | 'J1' | 'OPT' | 'CPT' | 'H1B' | 'other'

export type ChunkCategory =
  | 'treaty'
  | 'fica'
  | 'forms'
  | 'residency'
  | 'income'
  | 'deadlines'
  | 'general'

export interface UserProfile {
  visaType: VisaType
  countryOfOrigin: string        // e.g. "India", "China", "Germany"
  yearsInUS: number
  stateOfResidence: string
  incomeTypes: string[]
  ficaWithheld: boolean
  taxYear: number
}

export interface KnowledgeChunk {
  id: string
  content: string
  source: string                 // e.g. "IRS Publication 519"
  category: ChunkCategory
  country?: string               // null means applies to all countries
  visaTypes?: VisaType[]        // null means applies to all visas
  similarity?: number            // populated after vector search
  bm25Score?: number            // populated after keyword search
  rerankScore?: number          // populated after reranking
}

export interface RAGResult {
  chunks: KnowledgeChunk[]
  context: string               // formatted string ready for Claude prompt
  debugInfo: {
    totalChunksSearched: number
    usedHyDE: boolean
    filterApplied: Record<string, unknown>
    retrievalTimeMs: number
  }
}

export interface RAGOptions {
  maxChunks?: number            // default: 3
  useHyDE?: boolean             // default: auto-detect
  category?: ChunkCategory      // force a specific category
  includeGeneral?: boolean      // always include general chunks (default: true)
}
```

---

## 🗄️ DATABASE SCHEMA — Run this SQL in Supabase

Create a file `supabase/migrations/002_rag_schema.sql`:

```sql
-- Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Knowledge base table
CREATE TABLE IF NOT EXISTS knowledge_base (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content       TEXT NOT NULL,
  source        TEXT NOT NULL,
  category      TEXT NOT NULL,
  country       TEXT,                    -- NULL = applies to all countries
  visa_types    TEXT[],                  -- NULL = applies to all visas
  raw_chunk     TEXT NOT NULL,          -- original chunk before context was added
  embedding     vector(1536),
  fts           tsvector GENERATED ALWAYS AS (to_tsvector('english', content)) STORED,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Index for vector similarity search
CREATE INDEX IF NOT EXISTS knowledge_base_embedding_idx
  ON knowledge_base
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Index for full-text search
CREATE INDEX IF NOT EXISTS knowledge_base_fts_idx
  ON knowledge_base
  USING GIN (fts);

-- Index for metadata filtering
CREATE INDEX IF NOT EXISTS knowledge_base_country_idx ON knowledge_base (country);
CREATE INDEX IF NOT EXISTS knowledge_base_category_idx ON knowledge_base (category);

-- Hybrid search function (vector + BM25 combined via RRF)
CREATE OR REPLACE FUNCTION hybrid_search(
  query_text        TEXT,
  query_embedding   vector(1536),
  filter_country    TEXT DEFAULT NULL,
  filter_category   TEXT DEFAULT NULL,
  filter_visa       TEXT DEFAULT NULL,
  match_count       INT DEFAULT 10,
  rrf_k             INT DEFAULT 60
)
RETURNS TABLE (
  id          UUID,
  content     TEXT,
  source      TEXT,
  category    TEXT,
  country     TEXT,
  visa_types  TEXT[],
  rrf_score   FLOAT
)
LANGUAGE sql AS $$
  WITH vector_results AS (
    SELECT
      id,
      ROW_NUMBER() OVER (ORDER BY embedding <=> query_embedding) AS rank
    FROM knowledge_base
    WHERE
      (filter_country IS NULL OR country IS NULL OR country = filter_country)
      AND (filter_category IS NULL OR category = filter_category)
      AND (filter_visa IS NULL OR visa_types IS NULL OR filter_visa = ANY(visa_types))
    ORDER BY embedding <=> query_embedding
    LIMIT match_count * 2
  ),
  bm25_results AS (
    SELECT
      id,
      ROW_NUMBER() OVER (ORDER BY ts_rank(fts, websearch_to_tsquery('english', query_text)) DESC) AS rank
    FROM knowledge_base
    WHERE
      fts @@ websearch_to_tsquery('english', query_text)
      AND (filter_country IS NULL OR country IS NULL OR country = filter_country)
      AND (filter_category IS NULL OR category = filter_category)
      AND (filter_visa IS NULL OR visa_types IS NULL OR filter_visa = ANY(visa_types))
    LIMIT match_count * 2
  ),
  rrf_scores AS (
    SELECT
      COALESCE(v.id, b.id) AS id,
      COALESCE(1.0 / (rrf_k + v.rank), 0) + COALESCE(1.0 / (rrf_k + b.rank), 0) AS rrf_score
    FROM vector_results v
    FULL OUTER JOIN bm25_results b ON v.id = b.id
  )
  SELECT
    kb.id,
    kb.content,
    kb.source,
    kb.category,
    kb.country,
    kb.visa_types,
    rrf.rrf_score
  FROM rrf_scores rrf
  JOIN knowledge_base kb ON kb.id = rrf.id
  ORDER BY rrf.rrf_score DESC
  LIMIT match_count;
$$;
```

---

## 📄 DOCUMENT SOURCES — Create `scripts/seed/documents/sources.ts`

```typescript
export interface DocumentSource {
  name: string
  url: string
  category: ChunkCategory
  country?: string           // if country-specific
  description: string
}

export const IRS_DOCUMENTS: DocumentSource[] = [
  // Core publications
  {
    name: 'IRS Publication 519 - U.S. Tax Guide for Aliens',
    url: 'https://www.irs.gov/pub/irs-pdf/p519.pdf',
    category: 'general',
    description: 'Main guide for nonresident alien tax rules, residency tests, filing requirements'
  },
  {
    name: 'IRS Publication 901 - U.S. Tax Treaties',
    url: 'https://www.irs.gov/pub/irs-pdf/p901.pdf',
    category: 'treaty',
    description: 'All country treaty benefits, student exemptions, reduced rates'
  },
  {
    name: 'IRS Publication 4152 - VITA Guide for Foreign Students',
    url: 'https://www.irs.gov/pub/irs-pdf/p4152.pdf',
    category: 'general',
    description: 'Simplified tax guide written specifically for F1/J1 students'
  },
  {
    name: 'Form 1040-NR Instructions',
    url: 'https://www.irs.gov/pub/irs-pdf/i1040nr.pdf',
    category: 'forms',
    description: 'How to fill out the nonresident alien tax return line by line'
  },
  {
    name: 'Form 8843 Instructions',
    url: 'https://www.irs.gov/pub/irs-pdf/f8843.pdf',
    category: 'forms',
    description: 'Who must file Form 8843 and instructions for completing it'
  },
  {
    name: 'Form 843 Instructions',
    url: 'https://www.irs.gov/pub/irs-pdf/i843.pdf',
    category: 'fica',
    description: 'How to claim refund for FICA taxes wrongly withheld'
  },
  {
    name: 'Form W-7 Instructions - ITIN Application',
    url: 'https://www.irs.gov/pub/irs-pdf/iw7.pdf',
    category: 'forms',
    description: 'How to apply for Individual Taxpayer Identification Number'
  },
  // Country-specific treaties (highest priority countries)
  {
    name: 'US-India Tax Treaty',
    url: 'https://www.irs.gov/pub/irs-trty/india.pdf',
    category: 'treaty',
    country: 'India',
    description: 'Article 21 student exemption, wage exemption up to $10,000 for 2 years'
  },
  {
    name: 'US-China Tax Treaty',
    url: 'https://www.irs.gov/pub/irs-trty/china.pdf',
    category: 'treaty',
    country: 'China',
    description: 'Article 20 full wage exemption for students for 5 years'
  },
  {
    name: 'US-South Korea Tax Treaty',
    url: 'https://www.irs.gov/pub/irs-trty/korea.pdf',
    category: 'treaty',
    country: 'South Korea',
    description: 'Article 21 student exemption details'
  },
  {
    name: 'US-Germany Tax Treaty',
    url: 'https://www.irs.gov/pub/irs-trty/germany.pdf',
    category: 'treaty',
    country: 'Germany',
    description: 'Article 20 student and apprentice income exemption'
  },
  {
    name: 'US-France Tax Treaty',
    url: 'https://www.irs.gov/pub/irs-trty/france.pdf',
    category: 'treaty',
    country: 'France',
    description: 'Student income exemption details'
  },
  {
    name: 'US-Japan Tax Treaty',
    url: 'https://www.irs.gov/pub/irs-trty/japan.pdf',
    category: 'treaty',
    country: 'Japan',
    description: 'Student and apprentice exemption'
  },
  {
    name: 'US-Canada Tax Treaty',
    url: 'https://www.irs.gov/pub/irs-trty/canada.pdf',
    category: 'treaty',
    country: 'Canada',
    description: 'Limited student provisions'
  },
  {
    name: 'US-UK Tax Treaty',
    url: 'https://www.irs.gov/pub/irs-trty/uk.pdf',
    category: 'treaty',
    country: 'United Kingdom',
    description: 'Student exemption articles'
  },
  {
    name: 'US-Thailand Tax Treaty',
    url: 'https://www.irs.gov/pub/irs-trty/thailand.pdf',
    category: 'treaty',
    country: 'Thailand',
    description: 'Article 22 remittances from abroad exemption for students'
  },
  {
    name: 'US-Philippines Tax Treaty',
    url: 'https://www.irs.gov/pub/irs-trty/philip.pdf',
    category: 'treaty',
    country: 'Philippines',
    description: 'Article 22 scholarship and fellowship exemption'
  },
  {
    name: 'US-Pakistan Tax Treaty',
    url: 'https://www.irs.gov/pub/irs-trty/pakistan.pdf',
    category: 'treaty',
    country: 'Pakistan',
    description: 'Article 17 student income exemption for 5 years'
  },
  {
    name: 'US-Indonesia Tax Treaty',
    url: 'https://www.irs.gov/pub/irs-trty/indo.pdf',
    category: 'treaty',
    country: 'Indonesia',
    description: 'Student exemption provisions'
  },
  {
    name: 'US-Mexico Tax Treaty',
    url: 'https://www.irs.gov/pub/irs-trty/mexico.pdf',
    category: 'treaty',
    country: 'Mexico',
    description: 'Student and researcher exemption'
  },
  {
    name: 'US-Netherlands Tax Treaty',
    url: 'https://www.irs.gov/pub/irs-trty/nether.pdf',
    category: 'treaty',
    country: 'Netherlands',
    description: 'Student provisions'
  },
  {
    name: 'US-Sweden Tax Treaty',
    url: 'https://www.irs.gov/pub/irs-trty/sweden.pdf',
    category: 'treaty',
    country: 'Sweden',
    description: 'Student exemption'
  },
  {
    name: 'US-Australia Tax Treaty',
    url: 'https://www.irs.gov/pub/irs-trty/australia.pdf',
    category: 'treaty',
    country: 'Australia',
    description: 'Student provisions'
  },
]

// Countries with NO treaty — important to tell users clearly
export const NO_TREATY_COUNTRIES = [
  'Bangladesh', 'Nepal', 'Nigeria', 'Ghana', 'Pakistan (some limitations)',
  'Brazil', 'Colombia', 'Peru', 'Saudi Arabia', 'UAE', 'Iran',
  'Ethiopia', 'Kenya', 'South Africa'
]

// Hardcoded knowledge chunks that don't come from PDFs
// These are hand-crafted facts — the most important rules in plain English
export const HARDCODED_CHUNKS = [
  // FICA Rules
  {
    content: `FICA Exemption for F1 Students: F1 visa holders are completely exempt from FICA taxes (Social Security 6.2% + Medicare 1.45% = 7.65% total) for their first 5 calendar years in the United States, as long as they remain nonresident aliens. This is based on IRS Notice 2003-57 and Publication 519. The 5 years are CALENDAR years, not continuous years. If an employer incorrectly withholds FICA from an F1 student's paycheck, the student can claim a full refund by filing Form 843 (Claim for Refund) and Form 8316 (Social Security Tax Refund). The average FICA refund for students who were wrongly withheld is $2,000 to $5,000 per year. Students on OPT (Optional Practical Training) who are still in their first 5 calendar years of F1 status also maintain this FICA exemption.`,
    source: 'IRS Notice 2003-57 + Publication 519',
    category: 'fica' as ChunkCategory,
    visaTypes: ['F1', 'OPT'] as VisaType[]
  },
  {
    content: `FICA Exemption for J1 Students: J1 visa holders (exchange visitors) are exempt from FICA taxes for their first 2 calendar years in the United States as nonresident aliens. This applies to students, researchers, and scholars on J1 visas. After 2 calendar years, J1 holders must pay FICA. J1 researchers and professors are also exempt for 2 years. To claim a FICA refund if incorrectly withheld: file Form 843 with Form 8316 attached. First request the refund from your employer. If the employer cannot refund (e.g., they have closed), file directly with the IRS.`,
    source: 'IRS Publication 519',
    category: 'fica' as ChunkCategory,
    visaTypes: ['J1'] as VisaType[]
  },
  // Form 8843 - Critical
  {
    content: `Form 8843 - Who Must File: EVERY F1 and J1 visa holder who was physically present in the United States for ANY part of the tax year MUST file Form 8843, even if they had ZERO income and owe zero taxes. This is not optional. Failing to file Form 8843 can negatively affect future immigration applications including green card applications. The form establishes that you are an "exempt individual" who should not be counted under the Substantial Presence Test. Deadline: June 15th of the following year (not April 15th) if you have no income. If you have income, it is due with your tax return by April 15th. Students with no income file ONLY Form 8843 — they do not need to file Form 1040-NR.`,
    source: 'IRS Form 8843 Instructions',
    category: 'forms' as ChunkCategory,
    visaTypes: ['F1', 'J1'] as VisaType[]
  },
  // Substantial Presence Test
  {
    content: `Substantial Presence Test and F1/J1 Exemption: Normally, you become a US Resident Alien for tax purposes if you meet the Substantial Presence Test (31+ days current year AND 183+ days using the formula: all days this year + 1/3 days last year + 1/6 days 2 years ago). HOWEVER, F1 and J1 students are EXEMPT from counting their days for the purposes of this test. F1 students are exempt for 5 calendar years total. J1 students are exempt for 2 calendar years. This means most F1/J1 students file as NONRESIDENT ALIENS on Form 1040-NR, NOT on the regular Form 1040. This distinction is critical because nonresident aliens cannot claim the standard deduction (with some treaty exceptions) and are only taxed on US-source income.`,
    source: 'IRS Publication 519 - Chapter 1',
    category: 'residency' as ChunkCategory,
    visaTypes: ['F1', 'J1'] as VisaType[]
  },
  // India Treaty - Most important
  {
    content: `India-US Tax Treaty Article 21 - Student Exemption: Students and business apprentices from India who are present in the US primarily for education are eligible for special treaty benefits. Key benefits: (1) Scholarship, fellowship, and grant income is fully exempt from US tax. (2) Wages and compensation earned in the US can be exempt up to $10,000 per tax year for the first 2 years the person is in the US. (3) Payments received from abroad (including from parents) for maintenance are exempt. To claim this benefit, the student must file Form 8833 (Treaty-Based Return Position Disclosure) with their 1040-NR. The treaty with India is one of the MOST favorable student treaties in the US tax treaty network. Many Indian students miss this benefit and overpay taxes as a result.`,
    source: 'US-India Tax Treaty Article 21',
    category: 'treaty' as ChunkCategory,
    country: 'India',
    visaTypes: ['F1', 'J1'] as VisaType[]
  },
  // China Treaty
  {
    content: `China-US Tax Treaty Article 20 - Student Exemption: Students and apprentices from China who come to the US solely for education or training are eligible for one of the broadest student treaty exemptions available. Key benefits: (1) All wages, salary, and compensation for personal services is exempt from US tax for the first 5 YEARS of presence in the US. (2) Scholarship and fellowship income is fully exempt with no dollar cap. (3) This exemption can effectively eliminate all US federal tax liability for Chinese students in their first 5 years. To claim: file Form 8833 with 1040-NR. Note: The 5-year clock starts from the first arrival in the US, not from when the student enrolled. After 5 years, income becomes taxable at normal nonresident rates.`,
    source: 'US-China Tax Treaty Article 20',
    category: 'treaty' as ChunkCategory,
    country: 'China',
    visaTypes: ['F1', 'J1'] as VisaType[]
  },
  // Scholarship taxability
  {
    content: `Scholarship and Fellowship Taxability for International Students: For nonresident alien students (F1/J1), scholarship money is taxable according to the following rules: (1) Amount used for TUITION and REQUIRED FEES — completely tax-free. (2) Amount used for ROOM AND BOARD — taxable as income. (3) Amount used for STIPEND or LIVING EXPENSES — taxable as income. (4) Amount used for BOOKS and REQUIRED SUPPLIES — tax-free. The university must report taxable scholarship amounts on Form 1042-S (not W-2). Students should receive a Form 1042-S by March 15. The taxable portion should be reported on Form 1040-NR line 12. EXCEPTION: Many countries have tax treaties that exempt all scholarship income. Always check treaty benefits for the student's home country first.`,
    source: 'IRS Publication 519 - Chapter 3',
    category: 'income' as ChunkCategory,
    visaTypes: ['F1', 'J1'] as VisaType[]
  },
  // Filing deadlines
  {
    content: `Tax Filing Deadlines for International Students: (1) Form 8843 only (no income): June 15th of the following year. Mail to: Department of the Treasury, Internal Revenue Service, Austin, TX 73301-0215. (2) Form 1040-NR (with income): April 15th. If employer withheld tax at source: June 15th. (3) Extension: File Form 4868 by April 15th to get an automatic 6-month extension to October 15th. (4) First-time filers who need an ITIN: Apply using Form W-7, which must be submitted WITH the tax return. (5) FICA refund claim (Form 843): Can be filed within 3 years of when the tax was paid. There is NO late-filing penalty for Form 8843 itself, but it affects immigration record.`,
    source: 'IRS Publication 519 + Form 8843 Instructions',
    category: 'deadlines' as ChunkCategory,
    visaTypes: ['F1', 'J1', 'OPT', 'CPT'] as VisaType[]
  },
]
```

---

## 🌱 SEEDING SCRIPT — Create `scripts/seed/seed-knowledge-base.ts`

Build this script with the following steps. Run it with `npm run seed`.

```typescript
// scripts/seed/seed-knowledge-base.ts

import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'
import { IRS_DOCUMENTS, HARDCODED_CHUNKS } from './documents/sources'

// ---- STEP 1: Download PDFs ----
// For each URL in IRS_DOCUMENTS, download the PDF
// Save to scripts/seed/documents/pdfs/
// Use Node.js fetch or axios

// ---- STEP 2: Parse PDFs to text ----
// Use pdf-parse npm package to extract text from each PDF
// Split text into chunks of 400-600 tokens
// Use simple sentence-boundary splitting (don't split mid-sentence)
// Each chunk should have 50 tokens of overlap with the previous chunk

// ---- STEP 3: Add contextual prefix to each chunk via Claude ----
// For each chunk, call Claude Haiku API with this prompt:
/*
const CONTEXT_PROMPT = `
Here is a tax document: <document>{FULL_DOCUMENT_SUMMARY}</document>
Here is a specific chunk from this document: <chunk>{CHUNK_TEXT}</chunk>

Write exactly 1-2 sentences that explain:
1. What document this chunk is from
2. What specific topic this chunk covers

Be specific. Mention the visa type, country, or form if relevant.
Keep it under 50 words. Output ONLY the context sentences, nothing else.
`
*/
// Prepend Claude's output to the chunk text before embedding
// Result: "[Claude's context]. [Original chunk text]"

// ---- STEP 4: Generate embeddings ----
// Call OpenAI text-embedding-3-small for each contextual chunk
// Batch in groups of 100 for efficiency

// ---- STEP 5: Insert into Supabase ----
// Insert each chunk with: content, source, category, country, visa_types, raw_chunk, embedding

// ---- STEP 6: Insert hardcoded chunks ----
// Also embed and insert all HARDCODED_CHUNKS from sources.ts
// These are hand-crafted high-quality facts about FICA, treaties, deadlines

// Log progress: "Seeding chunk X of Y from [source name]"
// Log total at end: "Seeded N chunks successfully"
// Add package.json script: "seed": "ts-node scripts/seed/seed-knowledge-base.ts"
```

---

## 🔧 RAG PIPELINE — Build these files in order:

---

### FILE 1: `lib/rag/embed.ts`

```typescript
// Embed a query string using OpenAI text-embedding-3-small
// Export:
//   embedQuery(text: string): Promise<number[]>
//   embedBatch(texts: string[]): Promise<number[][]>  ← for seeding
//
// Use openai npm package
// Model: "text-embedding-3-small"
// Dimensions: 1536
// Add retry logic: if API call fails, retry up to 3 times with exponential backoff
// Cache embeddings in a Map<string, number[]> during the same request lifecycle
```

---

### FILE 2: `lib/rag/metadata-filter.ts`

```typescript
// Build a metadata filter object from user profile
// Export:
//   buildFilter(profile: Partial<UserProfile>): MetadataFilter
//
// interface MetadataFilter {
//   country?: string    // the user's country OR null (search both)
//   category?: string   // optional forced category
//   visaType?: string   // the user's visa type
// }
//
// Logic:
//   - If user has countryOfOrigin, add it to filter
//   - If user.ficaWithheld is true, ALWAYS include 'fica' in the search
//     (run a separate search just for FICA chunks even if main query is unrelated)
//   - If query contains keywords like "form", "deadline", "8843", "1040",
//     add category: 'forms' to filter
//   - If query contains keywords like "treaty", "exempt", "country", "article",
//     add category: 'treaty' to filter
//   - Always search chunks where country IS NULL (general chunks) in addition
//     to country-specific chunks
//
// Export also:
//   detectCategory(query: string): ChunkCategory | null
```

---

### FILE 3: `lib/rag/hyde.ts`

```typescript
// HyDE — Hypothetical Document Embeddings
// Export:
//   shouldUseHyDE(query: string): boolean
//   generateHypotheticalAnswer(query: string, profile: Partial<UserProfile>): Promise<string>
//
// shouldUseHyDE logic — return true if query contains:
//   - question words: "should", "would", "could", "might", "do i", "am i",
//     "can i", "is it", "will i", "what if", "how do"
//   - vague concepts: "eligible", "qualify", "trouble", "problem", "worried",
//     "confused", "understand", "explain"
//   - Return FALSE for queries with specific form names, numbers, exact terms
//     like "Form 8843", "1040-NR", "FICA", "Article 21" → these are specific,
//     don't need HyDE
//
// generateHypotheticalAnswer — call Claude Haiku with:
/*
System: "You are a tax expert for international students in the USA.
         Answer the question as if you are explaining to the student
         directly. Be specific. Mention form names, treaty articles,
         visa types where relevant. Keep it under 150 words."

User: "Student profile: Visa={visaType}, Country={country}, Years={yearsInUS}
       Question: {query}"
*/
// Return the hypothetical answer text
// This text will be embedded and used for search instead of the original query
```

---

### FILE 4: `lib/rag/hybrid-search.ts`

```typescript
// Run hybrid search: vector + BM25 via Supabase RPC
// Export:
//   hybridSearch(
//     queryText: string,
//     queryEmbedding: number[],
//     filter: MetadataFilter,
//     limit?: number
//   ): Promise<KnowledgeChunk[]>
//
// Implementation:
//   1. Call the `hybrid_search` Supabase RPC function (defined in SQL migration above)
//      Pass: query_text, query_embedding, filter_country, filter_category, filter_visa
//   2. If the user's country has NO treaty (check NO_TREATY_COUNTRIES list),
//      add a NOTE chunk informing the user their country has no treaty
//   3. Return results as KnowledgeChunk[] with rrf_score populated
//
// Edge case: if hybrid search returns 0 results (e.g., rare country),
//   fall back to vector-only search without the country filter
//   Log a warning: "No results with country filter, falling back to general search"
```

---

### FILE 5: `lib/rag/rerank.ts`

```typescript
// Cross-encoder reranking using @xenova/transformers
// Export:
//   rerankChunks(
//     query: string,
//     chunks: KnowledgeChunk[],
//     topK?: number
//   ): Promise<KnowledgeChunk[]>
//
// Model: "Xenova/ms-marco-MiniLM-L-6-v2"
//   - Load model lazily (only on first call) and cache it
//   - Use pipeline('text-classification', model)
//
// Implementation:
//   1. For each chunk, create a pair: [query, chunk.content]
//   2. Run all pairs through the cross-encoder model
//   3. Get a relevance score for each pair
//   4. Sort chunks by score descending
//   5. Return top topK chunks (default: 3)
//
// Performance note: This runs in Node.js synchronously
//   It takes ~20-50ms for 10 chunks — acceptable for chat latency
//
// If @xenova/transformers fails to load (e.g., cold start):
//   Log warning and return chunks sorted by rrf_score as fallback
```

---

### FILE 6: `lib/rag/format-context.ts`

```typescript
// Format retrieved chunks into a clean context string for Claude
// Export:
//   formatContext(chunks: KnowledgeChunk[], profile?: Partial<UserProfile>): string
//
// Output format:
/*
=== TAX KNOWLEDGE RETRIEVED ===

[Source: IRS Publication 519]
[Topic: FICA Exemption | Applies to: F1, OPT visas]
F1 visa holders are completely exempt from FICA taxes for their first 5 calendar years...

---

[Source: US-India Tax Treaty Article 21]
[Topic: Treaty Benefits | Country: India]
Students from India can exempt wages up to $10,000 per year for the first 2 years...

---

[Source: IRS Form 8843 Instructions]
[Topic: Required Forms | Applies to: F1, J1 visas]
Every F1 and J1 visa holder must file Form 8843 even with zero income...

=== END OF RETRIEVED KNOWLEDGE ===
*/
//
// Also append a "NO TREATY WARNING" section if user's country has no treaty:
/*
=== IMPORTANT NOTE ===
{country} does not have a tax treaty with the United States.
Standard nonresident alien rates apply. No special student exemptions available.
=== END NOTE ===
*/
```

---

### FILE 7: `lib/rag/index.ts` — THE MAIN ENTRY POINT

```typescript
// This is the single function the rest of the app calls
// Export:
//   retrieveContext(
//     query: string,
//     profile?: Partial<UserProfile>,
//     options?: RAGOptions
//   ): Promise<RAGResult>
//
// Full pipeline:
//
//   const startTime = Date.now()
//
//   STEP 1 — Build metadata filter from user profile
//     const filter = buildFilter(profile)
//
//   STEP 2 — Decide whether to use HyDE
//     const useHyDE = options?.useHyDE ?? shouldUseHyDE(query)
//     let searchQuery = query
//     if (useHyDE) {
//       const hypothetical = await generateHypotheticalAnswer(query, profile)
//       searchQuery = hypothetical  // embed this instead of original query
//     }
//
//   STEP 3 — Embed the search query
//     const embedding = await embedQuery(searchQuery)
//
//   STEP 4 — Run hybrid search
//     const rawChunks = await hybridSearch(query, embedding, filter, 10)
//     // Note: always pass original query text to BM25, embedded query for vector
//
//   STEP 5 — Rerank
//     const rerankedChunks = await rerankChunks(query, rawChunks, options?.maxChunks ?? 3)
//
//   STEP 6 — If user has ficaWithheld = true, always ensure FICA chunks are present
//     if (profile?.ficaWithheld && !rerankedChunks.some(c => c.category === 'fica')) {
//       const ficaChunks = await hybridSearch('FICA refund F1 exempt', embedding, { category: 'fica' }, 1)
//       rerankedChunks.push(ficaChunks[0])  // inject FICA context even if not top result
//     }
//
//   STEP 7 — Format context string
//     const context = formatContext(rerankedChunks, profile)
//
//   STEP 8 — Return result
//     return {
//       chunks: rerankedChunks,
//       context,
//       debugInfo: {
//         totalChunksSearched: rawChunks.length,
//         usedHyDE: useHyDE,
//         filterApplied: filter,
//         retrievalTimeMs: Date.now() - startTime
//       }
//     }
```

---

### FILE 8: `app/api/chat/route.ts` — HOW TO USE THE RAG IN THE API

```typescript
// POST /api/chat
// Body: { message: string, history: ChatMessage[], userProfile: UserProfile }
//
// Implementation:
//
// 1. Import retrieveContext from lib/rag
// 2. Call retrieveContext(message, userProfile)
// 3. Build Claude system prompt:

const SYSTEM_PROMPT = `You are TaxBuddy, a friendly expert tax assistant for international 
students in the USA. You help students maximize refunds and file correctly.

STUDENT PROFILE:
- Visa Type: {visaType}
- Country of Origin: {countryOfOrigin}
- Years in the US: {yearsInUS}
- State of Residence: {stateOfResidence}
- Income Types: {incomeTypes}
- FICA Withheld by Employer: {ficaWithheld}
- Tax Year: 2024

{ragContext}

YOUR RULES — follow ALL of these in every response:
1. ALWAYS check treaty benefits for {countryOfOrigin} FIRST before anything else
2. ALWAYS check if the student qualifies for FICA refund if visa is F1 or J1
3. Explain every tax term in SIMPLE English — assume zero tax knowledge
4. Tell the student EXACTLY what forms to fill and in what order
5. When you can calculate a potential refund amount, always tell them
6. If unsure about something, say "I recommend confirming this with a CPA"
7. Never give advice on illegal tax avoidance — only legal deductions and exemptions
8. Format responses with clear sections: use **bold** for form names and key terms
9. End every response with: "📋 Next Step:" followed by the single most important action
10. Keep responses under 300 words unless the question genuinely requires more detail`

// 4. Call Claude API with streaming:
//    model: "claude-sonnet-4-20250514"
//    system: filled system prompt
//    messages: [...history, { role: 'user', content: message }]
//    max_tokens: 1024
//    stream: true
//
// 5. Return as SSE stream (ReadableStream)
//    Each chunk: "data: {text}\n\n"
//    On complete: "data: [DONE]\n\n"
//
// 6. Log to console (dev only):
//    console.log(`RAG retrieved in ${ragResult.debugInfo.retrievalTimeMs}ms`)
//    console.log(`Used HyDE: ${ragResult.debugInfo.usedHyDE}`)
//    console.log(`Chunks: ${ragResult.chunks.map(c => c.source).join(', ')}`)
```

---

## 🧪 TESTING — Create `scripts/test-rag.ts`

```typescript
// A simple test script to verify the RAG pipeline works end-to-end
// Run with: npm run test:rag
//
// Test these 5 queries and print the retrieved chunks + context:

const TEST_CASES = [
  {
    query: "Do I need to file Form 8843?",
    profile: { visaType: 'F1', countryOfOrigin: 'India', yearsInUS: 2 },
    expectedCategory: 'forms'
  },
  {
    query: "My employer took out social security tax, can I get it back?",
    profile: { visaType: 'F1', countryOfOrigin: 'China', yearsInUS: 1, ficaWithheld: true },
    expectedCategory: 'fica'
  },
  {
    query: "Does India have a tax treaty with the US?",
    profile: { visaType: 'F1', countryOfOrigin: 'India', yearsInUS: 3 },
    expectedCategory: 'treaty'
  },
  {
    query: "I worked on campus this year, am I in trouble?",
    profile: { visaType: 'F1', countryOfOrigin: 'Bangladesh', yearsInUS: 1 },
    expectedCategory: 'general'  // Bangladesh has no treaty
  },
  {
    query: "What is the deadline for my tax return?",
    profile: { visaType: 'J1', countryOfOrigin: 'Germany', yearsInUS: 1 },
    expectedCategory: 'deadlines'
  }
]

// For each test case:
// 1. Run retrieveContext(query, profile)
// 2. Print: query, usedHyDE, retrievalTimeMs, chunks found (source + category)
// 3. Print first 200 chars of context
// 4. Assert expectedCategory appears in at least one chunk
// 5. Print PASS or FAIL
```

---

## ✅ COMPLETION CHECKLIST

Complete ALL of these before marking RAG as done:

- [ ] `types/rag.ts` created with all interfaces
- [ ] `supabase/migrations/002_rag_schema.sql` runs successfully in Supabase
- [ ] `scripts/seed/documents/sources.ts` created with all document URLs
- [ ] `npm run seed` downloads PDFs, parses them, adds context, embeds, and inserts into DB
- [ ] `knowledge_base` table has 200+ rows after seeding
- [ ] `lib/rag/embed.ts` works and caches embeddings
- [ ] `lib/rag/metadata-filter.ts` correctly reads user profile into filter
- [ ] `lib/rag/hyde.ts` correctly detects vague queries and generates hypothetical answers
- [ ] `lib/rag/hybrid-search.ts` calls Supabase RPC and returns results
- [ ] `lib/rag/rerank.ts` loads cross-encoder and reranks correctly
- [ ] `lib/rag/format-context.ts` outputs clean, structured context string
- [ ] `lib/rag/index.ts` pipeline runs end-to-end in < 2 seconds
- [ ] `app/api/chat/route.ts` injects RAG context into every Claude call
- [ ] `npm run test:rag` passes all 5 test cases
- [ ] FICA chunks are always injected when `ficaWithheld = true` in user profile

---

## ⚠️ RULES FOR CURSOR TO FOLLOW

1. **Build files in the exact order listed above** (types → schema → sources → seeder → each lib/rag file → API route → tests)
2. **No LangChain, no LlamaIndex** — write every function from scratch
3. **TypeScript strict mode** — no `any` types anywhere
4. **Every Supabase call must have error handling** — wrap in try/catch and throw descriptive errors
5. **The reranker model loads lazily** — do not load on startup, only on first query
6. **Never expose raw embeddings or API keys** in logs or responses
7. **The seed script is idempotent** — running it twice should not create duplicate chunks (use upsert or check-before-insert)
8. **Console logs in dev only** — wrap all debug logs with `if (process.env.NODE_ENV === 'development')`
9. **RAG must complete in under 2000ms** — if it exceeds this in testing, optimize the slowest step
10. **Test the pipeline with at least one country that HAS a treaty and one that DOES NOT**

---

## 🚀 FIRST COMMAND TO RUN

```bash
npm install openai @anthropic-ai/sdk @supabase/supabase-js pdf-parse @xenova/transformers
npm install -D @types/pdf-parse ts-node
```

Then start with **`types/rag.ts`** and build downward.
