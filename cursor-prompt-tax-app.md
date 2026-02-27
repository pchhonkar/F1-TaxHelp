# 🎯 CURSOR PROMPT — International Student Tax Filing App

## COPY EVERYTHING BELOW THIS LINE INTO CURSOR

---

## 🧭 PROJECT GOAL

Build a **full-stack AI-powered web application** that helps international students in the USA file their taxes easily, step-by-step, and claim the **maximum possible refund**.

The app should:
- Guide students through a simple wizard (no tax knowledge needed)
- Auto-detect their visa type, treaty benefits, FICA exemptions
- Generate ready-to-file PDF forms (1040-NR, 8843)
- Use RAG (Retrieval-Augmented Generation) + Claude AI for smart, context-aware answers
- Be simple, friendly, and mobile-responsive

---

## 🏗️ TECH STACK

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router) + Tailwind CSS |
| Backend | Next.js API Routes (keep it monorepo) |
| AI | Anthropic Claude API (claude-sonnet-4-20250514) |
| Vector DB | Supabase (pgvector extension) |
| Embeddings | OpenAI text-embedding-3-small |
| PDF Generation | pdf-lib |
| Auth | Supabase Auth |
| Database | Supabase PostgreSQL |
| Hosting | Vercel |

---

## 📁 PROJECT STRUCTURE

```
tax-app/
├── app/
│   ├── page.tsx                    # Landing page
│   ├── dashboard/page.tsx          # User dashboard
│   ├── wizard/
│   │   ├── page.tsx                # Wizard entry
│   │   └── [step]/page.tsx         # Each wizard step
│   ├── chat/page.tsx               # AI chat assistant
│   ├── forms/page.tsx              # Generated forms download
│   └── api/
│       ├── chat/route.ts           # Claude AI endpoint
│       ├── embed/route.ts          # Embedding endpoint
│       ├── search/route.ts         # RAG search endpoint
│       └── generate-pdf/route.ts   # PDF generation endpoint
├── components/
│   ├── wizard/
│   │   ├── WizardLayout.tsx
│   │   ├── StepIndicator.tsx
│   │   └── steps/
│   │       ├── Step1_VisaType.tsx
│   │       ├── Step2_Country.tsx
│   │       ├── Step3_YearsInUS.tsx
│   │       ├── Step4_IncomeTypes.tsx
│   │       ├── Step5_Employer.tsx
│   │       ├── Step6_Education.tsx
│   │       └── Step7_Review.tsx
│   ├── chat/
│   │   ├── ChatInterface.tsx
│   │   └── MessageBubble.tsx
│   ├── refund/
│   │   └── RefundCalculator.tsx
│   └── ui/                         # Reusable UI components
├── lib/
│   ├── claude.ts                   # Claude API client
│   ├── supabase.ts                 # Supabase client
│   ├── embeddings.ts               # Embedding logic
│   ├── rag.ts                      # RAG pipeline
│   ├── pdf-generator.ts            # PDF form filling
│   └── tax-rules/
│       ├── treaties.ts             # Country tax treaty data
│       ├── fica.ts                 # FICA exemption rules
│       └── refund-calculator.ts    # Refund estimation logic
├── types/
│   └── index.ts                    # All TypeScript types
└── scripts/
    └── seed-knowledge-base.ts      # Script to embed tax docs
```

---

## ✅ TASKS — FOLLOW IN EXACT ORDER

> Complete each task fully before moving to the next. Do not skip ahead.

---

### TASK 1 — Project Setup & Dependencies

**Instructions:**
1. Initialize a new Next.js 14 project with TypeScript and Tailwind CSS
2. Install all required dependencies:
   ```bash
   npm install @anthropic-ai/sdk openai @supabase/supabase-js pdf-lib
   npm install @supabase/auth-helpers-nextjs lucide-react
   npm install -D @types/node
   ```
3. Create `.env.local` with these variables (leave values as placeholders):
   ```
   ANTHROPIC_API_KEY=your_key_here
   OPENAI_API_KEY=your_key_here
   NEXT_PUBLIC_SUPABASE_URL=your_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_key_here
   ```
4. Set up `lib/claude.ts` — Anthropic client singleton
5. Set up `lib/supabase.ts` — Supabase client singleton
6. Create `types/index.ts` with these interfaces:
   ```typescript
   UserProfile {
     visaType: 'F1' | 'J1' | 'OPT' | 'CPT' | 'H1B' | 'other'
     countryOfOrigin: string
     yearsInUS: number
     stateOfResidence: string
     incomeTypes: IncomeType[]
     ficaWithheld: boolean
     tuitionPaid: number
     scholarshipAmount: number
   }
   
   IncomeType: 'W2' | 'stipend' | 'scholarship' | '1099' | 'TA' | 'RA' | 'fellowship'
   
   TaxCalculation {
     estimatedRefund: number
     treatyBenefit: boolean
     treatyCountry: string
     ficaRefundEligible: boolean
     ficaRefundAmount: number
     formsNeeded: string[]
   }
   
   ChatMessage {
     role: 'user' | 'assistant'
     content: string
     timestamp: Date
   }
   ```

**Done when:** Project runs with `npm run dev` and no TypeScript errors.

---

### TASK 2 — Supabase Database Schema

**Instructions:**
Create these tables in Supabase (write a SQL migration file at `supabase/migrations/001_init.sql`):

```sql
-- User tax profiles
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  visa_type TEXT,
  country_of_origin TEXT,
  years_in_us INTEGER,
  state_of_residence TEXT,
  income_types TEXT[],
  fica_withheld BOOLEAN DEFAULT false,
  tuition_paid DECIMAL,
  scholarship_amount DECIMAL,
  tax_year INTEGER DEFAULT 2024,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Knowledge base for RAG
CREATE TABLE knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  source TEXT NOT NULL,         -- e.g. "IRS Pub 519", "Form 8843 Instructions"
  category TEXT NOT NULL,       -- e.g. "treaty", "fica", "forms", "general"
  embedding vector(1536),       -- OpenAI embedding dimension
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable vector similarity search
CREATE INDEX ON knowledge_base USING ivfflat (embedding vector_cosine_ops);

-- Function for similarity search
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.78,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  source TEXT,
  category TEXT,
  similarity float
)
LANGUAGE plpgsql AS $$
BEGIN
  RETURN QUERY
  SELECT
    knowledge_base.id,
    knowledge_base.content,
    knowledge_base.source,
    knowledge_base.category,
    1 - (knowledge_base.embedding <=> query_embedding) AS similarity
  FROM knowledge_base
  WHERE 1 - (knowledge_base.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- Chat history
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  messages JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Done when:** All tables exist in Supabase dashboard.

---

### TASK 3 — Knowledge Base Seeding

**Instructions:**
Create `lib/tax-rules/knowledge-data.ts` with this tax knowledge embedded as string arrays. Include ALL of the following:

**A. Tax Treaty Countries (the most important ones):**
```
India - Article 21: Students/trainees from India can exempt scholarship/fellowship income. Also exempt wages up to $10,000 for 2 years.
China - Article 20: Students from China can exclude wages from US tax for 5 years. Scholarships fully exempt.
Germany - Article 20: Students exempt on scholarship income. Wages exempt up to $9,000/year for 4 years.
Korea - Article 21: Students can exempt wages up to $2,000/year for 5 years.
Canada, Mexico: Limited treaty benefits for students. Standard NRA rules mostly apply.
UK, France, Australia: Check specific articles for student provisions.
Thailand - Article 22: Students can claim exemption on remittances from abroad.
Philippines - Article 22: Scholarship and fellowship grants exempt.
Pakistan - Article 17: Student income exempt for 5 years.
[Include 20+ more countries with their specific article numbers and benefit amounts]
```

**B. FICA Rules:**
```
F1 visa holders are exempt from FICA (Social Security + Medicare) taxes for their first 5 calendar years in the US as a nonresident alien student. This is IRS Notice 2003-57 and Publication 519.
J1 visa holders are also exempt from FICA for 2 calendar years.
OPT students on F1 status maintain FICA exemption during OPT period IF they are still nonresident aliens.
If FICA was wrongly withheld, file Form 843 and Form 8316 to claim a refund.
Average FICA refund: $2,000 - $5,000 per year.
```

**C. Forms Guide:**
```
Form 8843: REQUIRED for ALL F1/J1 visa holders who were in the US for any part of the year, even if they had zero income. Deadline: June 15. Failure to file can affect visa status and future green card applications.
Form 1040-NR: The nonresident alien income tax return. Required if you had US-source income. Due April 15 (or June 15 if employer didn't withhold tax).
Form W-7: Apply for ITIN if you don't have a Social Security Number. Attach to first 1040-NR.
Form 843: Claim refund for FICA taxes wrongly withheld.
Form 8316: Attach to Form 843 for Social Security tax refund.
```

**D. Resident vs Non-Resident Alien (Substantial Presence Test):**
```
You are a Resident Alien for tax purposes if you pass the Substantial Presence Test:
- 31+ days in current year AND
- 183+ days total counting: all days current year + 1/3 days prior year + 1/6 days 2 years ago

F1/J1 students are EXEMPT from counting days for the first 5 calendar years (F1) or 2 calendar years (J1). This means most F1 students file as nonresident aliens on 1040-NR, not the regular 1040.
```

**E. Common Refund Scenarios:**
```
Scenario 1: F1 student, 3 years in US, employer withheld FICA → File 843/8316 → Refund: ~$2,500-$4,000
Scenario 2: Indian F1 student, treaty Article 21 not claimed → Can amend returns → Refund: up to federal tax paid
Scenario 3: Chinese student, Article 20 treaty, 5 year limit not expired → Wages may be fully exempt
Scenario 4: Student with scholarship > tuition → Excess is taxable income, but state may have deduction
Scenario 5: TA/RA stipend → Taxable, but treaty may reduce/eliminate tax liability
```

Then create `scripts/seed-knowledge-base.ts`:
- Load all the knowledge strings
- For each chunk, call OpenAI embeddings API
- Insert into Supabase `knowledge_base` table
- Add a `npm run seed` script to `package.json`

**Done when:** Running `npm run seed` populates the `knowledge_base` table with 50+ rows.

---

### TASK 4 — RAG Pipeline

**Instructions:**
Create `lib/rag.ts` with these functions:

```typescript
// Main function: given a user query + profile, return relevant context
async function retrieveContext(
  query: string,
  userProfile?: Partial<UserProfile>
): Promise<string>

// Embed query using OpenAI
async function embedQuery(text: string): Promise<number[]>

// Search Supabase vector DB
async function searchKnowledgeBase(
  embedding: number[],
  category?: string
): Promise<KnowledgeChunk[]>

// Format retrieved chunks into a context string for Claude
function formatContext(chunks: KnowledgeChunk[]): string
```

Logic in `retrieveContext`:
- If userProfile has `countryOfOrigin`, add a targeted query for that country's treaty
- If userProfile has `visaType` of F1/J1 and `ficaWithheld` is true, always include FICA context
- Return top 5 most relevant chunks formatted as a clean context string

**Done when:** Calling `retrieveContext("what forms do I need as F1 student")` returns relevant text from the DB.

---

### TASK 5 — Claude AI API Route

**Instructions:**
Create `app/api/chat/route.ts` — a POST endpoint that:

1. Accepts: `{ message: string, history: ChatMessage[], userProfile: UserProfile }`
2. Calls `retrieveContext(message, userProfile)` to get RAG context
3. Calls Claude API with this **exact system prompt**:

```
You are TaxBuddy, a friendly and expert tax assistant specifically for international students in the USA. You help students maximize their tax refunds and file correctly.

STUDENT PROFILE:
- Visa Type: {visaType}
- Country: {countryOfOrigin}  
- Years in US: {yearsInUS}
- State: {stateOfResidence}
- Income Types: {incomeTypes}
- FICA Withheld by Employer: {ficaWithheld}
- Tax Year: 2024

RELEVANT TAX RULES (from IRS publications and tax treaties):
{ragContext}

YOUR RULES:
1. ALWAYS check for applicable tax treaty benefits for the student's country FIRST
2. ALWAYS check if they qualify for FICA refund if visa is F1/J1
3. Explain every tax term in SIMPLE English — assume zero tax knowledge
4. Be encouraging and specific — tell them exactly what forms to fill and in what order
5. Always tell them the potential refund amount when calculable
6. If you're not 100% sure about something, say so clearly and recommend consulting a CPA
7. Keep responses concise and structured with clear action items
8. Never give advice on illegal tax evasion — only legal deductions and exemptions
```

4. Stream the response back using `ReadableStream`
5. Return the Claude response as streaming text

**Done when:** POST to `/api/chat` with a user message returns a streaming AI response.

---

### TASK 6 — Tax Rules Logic

**Instructions:**
Create these files in `lib/tax-rules/`:

**`treaties.ts`** — Export a `TREATY_BENEFITS` object:
```typescript
const TREATY_BENEFITS: Record<string, TreatyBenefit> = {
  'India': {
    article: 'Article 21',
    studentWageExemption: 10000,
    scholarshipExempt: true,
    years: 2,
    notes: 'Most favorable treaty for students'
  },
  'China': {
    article: 'Article 20', 
    studentWageExemption: null, // full exemption
    scholarshipExempt: true,
    years: 5,
    notes: 'Full wage exemption for 5 years'
  },
  // Add 25+ countries
}

function getTreatyBenefit(country: string): TreatyBenefit | null
function hasTreatyBenefit(country: string): boolean
```

**`fica.ts`** — Export:
```typescript
function isFICAExempt(visaType: string, yearsInUS: number): boolean
function estimateFICARefund(annualIncome: number): number
// FICA = 6.2% Social Security + 1.45% Medicare = 7.65% of wages
```

**`refund-calculator.ts`** — Export:
```typescript
function calculateEstimatedRefund(profile: UserProfile): TaxCalculation
// This should:
// 1. Check treaty benefits → calculate tax reduction
// 2. Check FICA eligibility → add potential FICA refund
// 3. Check standard deduction eligibility
// 4. Return total estimated refund with breakdown
```

**Done when:** `calculateEstimatedRefund()` returns a detailed breakdown for a sample Indian F1 student.

---

### TASK 7 — Wizard UI (Multi-Step Form)

**Instructions:**
Build a clean, modern step-by-step wizard. Store all answers in React state passed down via Context.

Create `components/wizard/WizardContext.tsx` — Context to store `UserProfile` as user answers questions.

Create each step component:

**Step 1 — Visa Type** (`Step1_VisaType.tsx`):
- Large clickable cards for: F1, J1, OPT, CPT, H1B, Other
- Each card has an icon, name, and one-line description
- "Not sure?" helper text with explanation

**Step 2 — Country of Origin** (`Step2_Country.tsx`):
- Searchable dropdown of all countries
- When a country with a treaty is selected, show a green banner: "🎉 Good news! [Country] has a tax treaty with the USA that may reduce your taxes."

**Step 3 — Years in USA** (`Step3_YearsInUS.tsx`):
- Simple number input or slider (1–10+ years)
- Show real-time message: "As an F1 student with X years in US, you file as a **Non-Resident Alien** using Form 1040-NR"
- Or: "You may now qualify as a Resident Alien — this changes your filing!"

**Step 4 — Income Types** (`Step4_IncomeTypes.tsx`):
- Multi-select checkboxes with plain English explanations:
  - ☐ W2 (regular job wages)
  - ☐ Teaching/Research Assistantship (TA/RA stipend)
  - ☐ Fellowship or Scholarship
  - ☐ Freelance / 1099 work
  - ☐ No income (I still need to file Form 8843!)

**Step 5 — Employer & FICA** (`Step5_Employer.tsx`):
- "Did your employer take out Social Security and Medicare taxes from your paycheck?"
- Yes/No toggle
- If Yes: Show alert box: "⚠️ You may be entitled to a FICA refund! Many international students are exempt from these taxes. We'll help you claim it back."
- Input for total amount withheld (check box 4 and 6 on W2)

**Step 6 — Education Expenses** (`Step6_Education.tsx`):
- Tuition and fees paid (number input)
- Scholarship/fellowship received (number input)
- State of university (dropdown)

**Step 7 — Review & Results** (`Step7_Review.tsx`):
- Show summary of all answers
- Show `RefundCalculator` component with estimated refund
- Show list of forms they need to file
- Two CTA buttons: "Chat with TaxBuddy AI" and "Generate My Forms"

**Done when:** User can complete all 7 steps and see their refund estimate.

---

### TASK 8 — Refund Calculator Component

**Instructions:**
Create `components/refund/RefundCalculator.tsx`:

Display a visual breakdown card showing:
```
┌─────────────────────────────────────┐
│   💰 Your Estimated Refund          │
│                                     │
│   Federal Tax Refund    $1,200      │
│   FICA Refund           $2,847  🔥  │
│   Treaty Benefit        $800        │
│   ─────────────────────────────     │
│   TOTAL POTENTIAL      $4,847       │
│                                     │
│   Forms you need to file:           │
│   ✓ Form 8843 (Required!)           │
│   ✓ Form 1040-NR                    │
│   ✓ Form 843 (FICA refund)          │
│   ✓ Form 8316                       │
└─────────────────────────────────────┘
```

- Use green color for positive amounts
- Animate numbers counting up on render
- Add tooltip on each line item explaining what it is
- Add disclaimer: "This is an estimate. Actual refund depends on your specific tax documents."

**Done when:** Component renders with animated numbers and correct calculations.

---

### TASK 9 — AI Chat Interface

**Instructions:**
Create `components/chat/ChatInterface.tsx`:

Features:
- Full-screen chat UI similar to Claude/ChatGPT
- Pre-populated suggested questions as clickable chips:
  - "Do I need to file Form 8843?"
  - "Am I exempt from Social Security taxes?"
  - "Does my country have a tax treaty?"
  - "What's the deadline for my tax return?"
  - "How do I get my FICA taxes back?"
- Messages stream in word by word (use SSE/streaming)
- User profile is automatically sent with every message (from Wizard context)
- Each AI response has a "📋 Copy" button
- Show sources: small badges showing "Source: IRS Pub 519" when relevant
- Input box with send button, support Enter to send

Create `app/chat/page.tsx` that renders the ChatInterface full-page.

**Done when:** User can ask tax questions and get streaming AI responses with their profile context applied.

---

### TASK 10 — PDF Form Generation

**Instructions:**
Create `lib/pdf-generator.ts` using `pdf-lib`:

**Form 8843 Generator:**
```typescript
async function generateForm8843(profile: UserProfile): Promise<Uint8Array>
```
- Download the actual IRS Form 8843 PDF template (embed as base64 in the code)
- Fill in:
  - Name, SSN/ITIN
  - Current visa type
  - Date of entry to US
  - University name and address
  - Academic degree program
  - Part I (Students) fields
- Return filled PDF as bytes

**Form 1040-NR Summary Sheet:**
```typescript  
async function generate1040NRSummary(profile: UserProfile, calculation: TaxCalculation): Promise<Uint8Array>
```
- Generate a helper/worksheet PDF (not the actual IRS form — that's too complex)
- Show: income summary, deductions, treaty benefits, what to enter on each line of 1040-NR
- Clean, formatted layout using pdf-lib

Create `app/api/generate-pdf/route.ts`:
- Accept POST with userProfile
- Call generators
- Return PDF as blob download

Create `app/forms/page.tsx`:
- List all forms the user needs
- "Download" button for each
- Brief explanation of what each form is for and when to submit it
- "Important Deadlines" section

**Done when:** Clicking "Generate Form 8843" downloads a filled PDF.

---

### TASK 11 — Landing Page & Dashboard

**Instructions:**

**Landing Page** (`app/page.tsx`):
- Hero section: "File Your US Taxes as an International Student — Get Your Maximum Refund"
- Sub-headline: "Used by 10,000+ F1 & J1 students. Average refund found: $3,200"
- 3 feature cards: "Step-by-step wizard", "AI tax assistant", "Ready-to-file forms"
- Urgency: "2024 Tax Deadline: April 15, 2025" countdown banner
- "Get Started Free" CTA button → goes to `/wizard`
- Logos of universities (MIT, Stanford, etc.) for social proof (placeholder text ok)
- FAQ section covering the 5 most common student tax questions

**Dashboard** (`app/dashboard/page.tsx`) — for returning users:
- Show saved UserProfile
- Show estimated refund amount
- Checklist of tasks: "✅ Complete profile", "⬜ Download Form 8843", "⬜ File by April 15"
- Quick "Continue to Chat" button
- "Update my information" button

**Done when:** Landing page looks professional and wizard is accessible.

---

### TASK 12 — Auth Flow (Supabase)

**Instructions:**
Add optional authentication (user can use app without auth but save progress with auth):

1. Create `app/auth/page.tsx` with email/password sign-up and sign-in using Supabase Auth
2. Add "Sign in to save your progress" banner on wizard step 3
3. After auth, save `UserProfile` to `user_profiles` table
4. On return visit, auto-load saved profile
5. Add user avatar/signout button to header when logged in

Auth should be **optional** — unauthenticated users can still use the full wizard and chat, just can't save progress.

**Done when:** User can sign up, complete wizard, and return to find their data saved.

---

### TASK 13 — Final Polish

**Instructions:**

1. **Loading States**: Add skeletons/spinners everywhere async operations happen
2. **Error Handling**: Friendly error messages (not raw error objects) throughout the app
3. **Mobile Responsive**: Test and fix all components for mobile (wizard, chat, results)
4. **SEO**: Add metadata to all pages — title tags, descriptions focused on "international student tax USA"
5. **Disclaimer Banner**: Sticky banner on all tax-related pages: "TaxBuddy provides guidance only, not professional tax advice. For complex situations, consult a licensed CPA."
6. **Progress Persistence**: Save wizard progress to localStorage so refreshing doesn't lose answers
7. **Copy to Clipboard**: On all form instructions, add copy buttons for addresses, amounts, etc.
8. **Dark Mode**: Add dark/light mode toggle using Tailwind's dark: classes
9. **Helpful Tooltips**: Every tax term (FICA, 1040-NR, NRA, treaty, etc.) should have a hover tooltip with a plain English definition
10. **README.md**: Create a comprehensive README with setup instructions, env variables needed, and how to run the seed script

**Done when:** App is fully polished, mobile-friendly, and production-ready.

---

## 🔑 ENVIRONMENT VARIABLES NEEDED

```
ANTHROPIC_API_KEY        → Get from console.anthropic.com
OPENAI_API_KEY           → Get from platform.openai.com (for embeddings only)
NEXT_PUBLIC_SUPABASE_URL → From your Supabase project settings
NEXT_PUBLIC_SUPABASE_ANON_KEY → From Supabase project settings
SUPABASE_SERVICE_ROLE_KEY    → From Supabase project settings (server-side only)
```

---

## ⚠️ IMPORTANT RULES FOR CURSOR TO FOLLOW

1. **Complete one task fully before starting the next**
2. **TypeScript strict mode** — no `any` types
3. **All API keys via environment variables** — never hardcode
4. **Every user-facing error must be caught** and shown as a friendly message
5. **The AI system prompt must include the user's profile** in every single API call
6. **RAG context must be retrieved before every Claude API call**
7. **All monetary values stored as cents** (integers) to avoid floating point bugs
8. **Form PDF templates** — use publicly available IRS PDF URLs for download, don't bundle large files
9. **Keep components small** — if a component exceeds 150 lines, split it
10. **Mobile-first CSS** — write mobile styles first, then desktop overrides

---

## 🚀 GETTING STARTED — FIRST COMMAND

```bash
npx create-next-app@latest tax-buddy --typescript --tailwind --app --src-dir=false
cd tax-buddy
```

Then begin with **Task 1** and proceed sequentially.
