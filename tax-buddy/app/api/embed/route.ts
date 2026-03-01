/**
 * Embedding API — 384 dims, same model as knowledge_base.
 * Used by agentic-rag when EMBED_API_URL is set (avoids HuggingFace download in Python).
 */

import { NextRequest, NextResponse } from 'next/server';
import { embedText } from '@/lib/embeddings';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text = typeof body.text === 'string' ? body.text : body.texts?.[0];
    if (!text) {
      return NextResponse.json({ error: 'text or texts required' }, { status: 400 });
    }
    const embedding = await embedText(text);
    return NextResponse.json({ embedding });
  } catch (e) {
    console.error('Embed API error:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Embed failed' },
      { status: 500 }
    );
  }
}
