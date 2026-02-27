/**
 * Local text embeddings — FREE, no API key required.
 *
 * WHY @xenova/transformers (all-MiniLM-L6-v2) INSTEAD OF OTHER OPTIONS:
 *
 * 1. vs OpenAI embeddings: FREE (OpenAI charges ~$0.02/1M tokens), no API key, works offline
 * 2. vs Hugging Face Inference API: No rate limits, no HF token, no 30k chars/month cap
 * 3. vs Cohere / Voyage AI: Zero signup, zero cost, no external API calls
 * 4. vs Larger models: Faster, smaller download (~80MB), good enough for tax Q&A
 *
 * Model: Xenova/all-MiniLM-L6-v2 — 384 dimensions
 * First run downloads model; subsequent runs use cache.
 */

import { pipeline } from '@xenova/transformers';

const MODEL = 'Xenova/all-MiniLM-L6-v2';
const EMBED_DIM = 384;

let extractor: Awaited<ReturnType<typeof pipeline>> | null = null;

async function getExtractor() {
  if (!extractor) {
    extractor = await pipeline('feature-extraction', MODEL, {
      quantized: true,
    });
  }
  return extractor;
}

/** Flatten tensor to number[] — handles [1,384] or [384] shape */
function tensorToArray(tensor: { data: Float32Array | Float64Array; dims?: number[] }): number[] {
  return Array.from(tensor.data);
}

/**
 * Embed a single text. Returns 384-dimensional vector.
 */
export async function embedText(text: string): Promise<number[]> {
  const ext = await getExtractor();
  const truncated = text.slice(0, 512);
  const output = await (ext as (text: string, opts?: { pooling?: string; normalize?: boolean }) => Promise<{ data: Float32Array }>)(
    truncated,
    { pooling: 'mean', normalize: true }
  );
  return tensorToArray(output as { data: Float32Array });
}

/**
 * Embed multiple texts. Processes sequentially.
 */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  const results: number[][] = [];
  for (const t of texts) {
    results.push(await embedText(t));
  }
  return results;
}

export { EMBED_DIM };
