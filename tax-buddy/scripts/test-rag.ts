/**
 * Test RAG pipeline with env loading.
 * Run: npx tsx scripts/test-rag.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { embedQuery, searchKnowledgeBase, formatContext } from '../lib/rag';

function loadEnv() {
  const envPath = path.resolve(__dirname, '../.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const match = line.match(/^([^#=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim();
        if (value && !process.env[key]) process.env[key] = value;
      }
    }
  }
}

async function main() {
  loadEnv();
  const q = 'FICA exemption for F1 students';
  console.log('Testing RAG pipeline...');
  const emb = await embedQuery(q);
  console.log('embedQuery:', emb.length === 384 ? 'OK (384 dims)' : 'FAIL');
  const chunks = await searchKnowledgeBase(emb);
  console.log('searchKnowledgeBase:', chunks.length, 'chunks');
  const ctx = formatContext(chunks);
  console.log('formatContext:', ctx.length > 0 ? 'OK' : 'FAIL');
  if (chunks.length > 0) {
    console.log('\nSample chunk:', chunks[0]?.source, '-', (chunks[0]?.content || '').slice(0, 80) + '...');
  }
  console.log('\nRAG pipeline OK');
}

main().catch((e) => {
  console.error('RAG test failed:', e.message);
  process.exit(1);
});
