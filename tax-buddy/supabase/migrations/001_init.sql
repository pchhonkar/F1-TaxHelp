-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- User tax profiles
CREATE TABLE IF NOT EXISTS user_profiles (
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

-- Knowledge base for RAG (384 = Xenova/all-MiniLM-L6-v2, free local embeddings)
CREATE TABLE IF NOT EXISTS knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  source TEXT NOT NULL,
  category TEXT NOT NULL,
  embedding vector(384),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable vector similarity search (lists=100 for ~1000+ rows; use 10 for smaller datasets)
CREATE INDEX IF NOT EXISTS knowledge_base_embedding_idx
  ON knowledge_base
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 10);

-- Function for similarity search
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(384),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 5,
  filter_category TEXT DEFAULT NULL
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
  WHERE 
    1 - (knowledge_base.embedding <=> query_embedding) > match_threshold
    AND (filter_category IS NULL OR knowledge_base.category = filter_category)
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- Chat history
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  messages JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
