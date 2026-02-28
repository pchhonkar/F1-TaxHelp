# Agentic RAG with Knowledge Graph for TaxBuddy

Agentic knowledge retrieval combining **vector search** (Supabase pgvector) and **knowledge graph** (Neo4j) for international student tax Q&A. Based on [ottomator-agents/agentic-rag-knowledge-graph](https://github.com/coleam00/ottomator-agents/tree/main/agentic-rag-knowledge-graph).

## Architecture

- **Vector Store**: Supabase (pgvector) — same `knowledge_base` as TaxBuddy
- **Knowledge Graph**: Neo4j — tax entities (Country, Treaty, Article, Form) and relationships
- **Agent**: Pydantic AI with tools: `vector_search`, `graph_search`, `hybrid_search`, `get_entity_relationships`
- **LLM**: DeepSeek (configurable)

## Prerequisites

- Python 3.11+
- Neo4j (local or Aura)
- Supabase (already configured)
- DeepSeek API key (or other LLM)

## Setup

```bash
cd tax-buddy/agentic-rag
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with Supabase, Neo4j, DeepSeek credentials
```

## Run

```bash
cd tax-buddy/agentic-rag
source venv/bin/activate  # or venv\Scripts\activate on Windows

# 1. Seed the knowledge graph (run after npm run seed in tax-buddy)
python -m ingestion.ingest

# 2. Start the agent API
python run.py
# Or: python -m uvicorn agent.api:app --host 0.0.0.0 --port 8058

# 3. Use CLI or Next.js chat (API at http://localhost:8058)
python cli.py
```

## Tax Domain Schema (Neo4j)

- **Country** — India, China, Germany, etc.
- **Treaty** — US-India, US-China, etc.
- **Article** — Treaty article (e.g., Article 21 student exemption)
- **Form** — 1040-NR, 8843, 843, 8316, etc.
- **TaxConcept** — FICA, Substantial Presence, etc.

Relationships: `(Country)-[:HAS_TREATY]->(Treaty)`, `(Treaty)-[:HAS_ARTICLE]->(Article)`, `(Article)-[:COVERS]->(TaxConcept)`, `(Form)-[:REQUIRED_FOR]->(TaxConcept)`.
