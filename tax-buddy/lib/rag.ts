/**
 * RAG (Retrieval-Augmented Generation) pipeline for TaxBuddy.
 * Uses free local embeddings (@xenova/transformers) and Supabase vector search.
 */

import { embedText } from './embeddings';
import type { UserProfile } from '@/types';
import type { KnowledgeChunk } from '@/types';
import { getSupabaseServer } from './supabase';

const MATCH_THRESHOLD = 0.5;
const DEFAULT_MATCH_COUNT = 5;

/** Embed a query using local model (no API key) */
export async function embedQuery(text: string): Promise<number[]> {
  return embedText(text);
}

/** Search knowledge_base by embedding similarity */
export async function searchKnowledgeBase(
  embedding: number[],
  category?: string
): Promise<KnowledgeChunk[]> {
  const supabase = getSupabaseServer();
  const { data, error } = await supabase.rpc('match_documents', {
    query_embedding: embedding,
    match_threshold: MATCH_THRESHOLD,
    match_count: DEFAULT_MATCH_COUNT,
    filter_category: category ?? null,
  });

  if (error) throw new Error(`RAG search failed: ${error.message}`);

  return (data ?? []).map((row: { id: string; content: string; source: string; category: string; similarity: number }) => ({
    id: row.id,
    content: row.content,
    source: row.source,
    category: row.category,
    similarity: row.similarity,
  }));
}

/** Format retrieved chunks into a context string for the AI prompt */
export function formatContext(chunks: KnowledgeChunk[]): string {
  if (chunks.length === 0) return 'No relevant tax documents found.';

  return chunks
    .map(
      (c) =>
        `[Source: ${c.source}]\n[Category: ${c.category}]\n${c.content}`
    )
    .join('\n\n---\n\n');
}

/**
 * Main RAG function: given a user query and optional profile, return relevant context.
 * - If countryOfOrigin is set, adds a targeted query for that country's treaty
 * - If visaType is F1/J1 and ficaWithheld is true, always includes FICA context
 */
export async function retrieveContext(
  query: string,
  userProfile?: Partial<UserProfile>
): Promise<string> {
  const queries: string[] = [query];

  if (userProfile?.countryOfOrigin) {
    queries.push(
      `Tax treaty benefits for ${userProfile.countryOfOrigin} students in the USA`
    );
  }

  if (
    (userProfile?.visaType === 'F1' ||
      userProfile?.visaType === 'J1' ||
      userProfile?.visaType === 'OPT') &&
    userProfile?.ficaWithheld
  ) {
    queries.push('FICA exemption refund for F1 J1 international students');
  }

  const allChunks: KnowledgeChunk[] = [];
  const seenIds = new Set<string>();

  for (const q of queries) {
    const embedding = await embedQuery(q);
    const category =
      q.includes('treaty') || q.includes('country')
        ? 'treaty'
        : q.includes('FICA') || q.includes('Social Security')
          ? 'fica'
          : undefined;
    const chunks = await searchKnowledgeBase(embedding, category);
    for (const c of chunks) {
      if (!seenIds.has(c.id)) {
        seenIds.add(c.id);
        allChunks.push(c);
      }
    }
  }

  const topChunks = allChunks
    .sort((a, b) => (b.similarity ?? 0) - (a.similarity ?? 0))
    .slice(0, DEFAULT_MATCH_COUNT);

  return formatContext(topChunks);
}
