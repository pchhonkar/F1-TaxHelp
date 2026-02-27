/**
 * Seed the knowledge_base table from:
 * 1. PDF files in F1-TaxHelp/Data/
 * 2. Hardcoded chunks from knowledge-data.ts
 *
 * Run: npm run seed
 */

import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import { PDFParse } from 'pdf-parse';
import { embedBatch } from '../lib/embeddings';
import { PDF_SOURCE_MAP, HARDCODED_CHUNKS } from '../lib/tax-rules/knowledge-data';

const DATA_DIR = path.resolve(__dirname, '../../Data');
const CHUNK_SIZE = 600;
const CHUNK_OVERLAP = 100;

async function loadEnv() {
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

function chunkText(text: string): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const chunks: string[] = [];
  let i = 0;
  while (i < words.length) {
    const slice = words.slice(i, i + CHUNK_SIZE);
    if (slice.length === 0) break;
    chunks.push(slice.join(' '));
    i += CHUNK_SIZE - CHUNK_OVERLAP;
  }
  return chunks.filter((c) => c.trim().length > 80);
}


async function main() {
  await loadEnv();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const placeholders = ['your_key_here', 'your_url_here', 'your_'];
  const isPlaceholder = (v: string) =>
    placeholders.some((p) => v.includes(p) || v === p.trim());

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
    console.error('Add them to tax-buddy/.env.local (see README). No OpenAI key needed — embeddings run locally.');
    process.exit(1);
  }
  if (isPlaceholder(supabaseUrl) || isPlaceholder(supabaseKey)) {
    console.error(
      'Replace placeholder values in .env.local with real Supabase URL and keys.'
    );
    console.error('Get them from: Supabase Dashboard → Project Settings → API');
    process.exit(1);
  }
  if (!supabaseUrl.startsWith('http')) {
    console.error(
      'NEXT_PUBLIC_SUPABASE_URL must be a valid URL (e.g. https://xxx.supabase.co)'
    );
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  type ChunkInput = { content: string; source: string; category: string };

  const allChunks: ChunkInput[] = [];

  // 1. Parse PDFs from Data/
  if (fs.existsSync(DATA_DIR)) {
    const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith('.pdf'));
    for (const file of files) {
      const config = PDF_SOURCE_MAP[file];
      const source = config?.source ?? file.replace('.pdf', '');
      const category = config?.category ?? 'general';

      const filePath = path.join(DATA_DIR, file);
      let parser: PDFParse | null = null;
      try {
        const buffer = fs.readFileSync(filePath);
        parser = new PDFParse({ data: buffer });
        const result = await parser.getText();
        const text = (result?.text || '').replace(/\s+/g, ' ').trim();
        await parser.destroy?.();
        if (text.length < 100) continue;

        const chunks = chunkText(text);
        for (const c of chunks) {
          allChunks.push({ content: c, source, category });
        }
        console.log(`Parsed ${file}: ${chunks.length} chunks`);
      } catch (err) {
        if (parser && typeof parser.destroy === 'function') await parser.destroy();
        console.warn(`Skip ${file}:`, (err as Error).message);
      }
    }
  } else {
    console.warn('Data folder not found, using hardcoded chunks only.');
  }

  // 2. Add hardcoded chunks
  for (const h of HARDCODED_CHUNKS) {
    allChunks.push({
      content: h.content,
      source: h.source,
      category: h.category,
    });
  }
  console.log(`Total chunks to embed: ${allChunks.length}`);

  // 3. Embed (local, free) and insert
  console.log('Generating embeddings (local model, first run may download ~80MB)...');
  const texts = allChunks.map((c) => c.content);
  const embeddings = await embedBatch(texts);

  for (let i = 0; i < allChunks.length; i++) {
    const chunk = allChunks[i];
    const embedding = embeddings[i];
    if (!embedding) continue;

    const { error } = await supabase.from('knowledge_base').insert({
      content: chunk.content,
      source: chunk.source,
      category: chunk.category,
      embedding,
    });
    if (error) {
      console.error(`Insert error at ${i}:`, error.message);
    }
  }

  console.log(`Seeded ${allChunks.length} rows into knowledge_base.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
