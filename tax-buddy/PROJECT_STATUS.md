# Project Status & Fixes

## Errors Fixed

### 1. Seed script error message
**Before:** `Invalid supabaseUrl: Must be a valid HTTP or HTTPS URL` (unclear)  
**After:** Clear messages when env has placeholders:
- "Replace OPENAI_API_KEY in .env.local with a real key from platform.openai.com"
- "Replace placeholder values in .env.local with real Supabase URL and keys"
- "NEXT_PUBLIC_SUPABASE_URL must be a valid URL (e.g. https://xxx.supabase.co)"

### 2. README setup instructions
Added setup section with env vars, Supabase migration, and seed steps.

---

## Embeddings — Free Local Model

We use **@xenova/transformers** (Xenova/all-MiniLM-L6-v2) for embeddings — **no API key, no cost**.

**Why this instead of others:** OpenAI charges; HF Inference has rate limits; Cohere/Voyage need signup. Xenova runs locally, unlimited, free.

## Known Issues (Not Code Bugs)

| Issue | Cause | Fix |
|-------|-------|-----|
| Seed fails with placeholders | .env.local has your_* placeholders | Add real Supabase URL + keys (no OpenAI needed) |
| Build font errors | Sandbox/network when fetching fonts | Run `npm run build` locally outside sandbox |
| Dev server uv_interface_addresses | Sandbox network restrictions | Run `npm run dev` locally |

---

## Prompt Files Reference

### cursor-prompt-tax-app.md
Main app spec. Tasks 1–4 done. Uses simpler wizard (7 steps) and `UserProfile` type.

### cursor-prompt-wizard-questions.md
Detailed wizard spec. **14 steps**, richer types (`WizardAnswers`, `IncomeSource`, `ScholarshipInfo`, etc.). Includes:
- Refund engine (FICA, treaty, bank interest, amended returns)
- Forms determinator
- Residency calculator
- More income types: plasma donation, crypto, rental, gambling, etc.

**When building wizard:** Align with wizard-questions for full refund logic, or use tax-app’s simpler 7 steps first.

### cursor-prompt-rag-pipeline.md
Advanced RAG: hybrid search (vector + BM25), HyDE, reranking. Current implementation uses simpler vector-only search from tax-app.

---

## Done vs Remaining

**Done:** Tasks 1–4 (setup, schema, seed, RAG)  
**Remaining:** Tasks 5–13 (chat API, tax rules, wizard, refund calc, chat UI, PDF, landing, auth, polish)
