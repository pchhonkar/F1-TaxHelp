# Integrating Agentic RAG with Next.js Chat

When you implement the chat API (Task 5), you can use the agentic RAG backend instead of the simple RAG pipeline.

## Option A: Call the Agentic RAG API from Next.js

If the agentic RAG server is running (`python run.py` on port 8058):

```typescript
// app/api/chat/route.ts
const AGENTIC_RAG_URL = process.env.AGENTIC_RAG_URL || "http://localhost:8058";

export async function POST(req: Request) {
  const { message, sessionId } = await req.json();
  const res = await fetch(`${AGENTIC_RAG_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, session_id: sessionId }),
  });
  const data = await res.json();
  return Response.json({
    content: data.response,
    toolsUsed: data.tools_used,
    sessionId: data.session_id,
  });
}
```

Add to `.env.local`:
```
AGENTIC_RAG_URL=http://localhost:8058
```

## Option B: Keep Simple RAG

The existing `lib/rag.ts` + DeepSeek flow continues to work. Use agentic RAG when you need:
- Country → Treaty → Article relationship queries
- Form → TaxConcept connections
- Multi-tool agentic reasoning
