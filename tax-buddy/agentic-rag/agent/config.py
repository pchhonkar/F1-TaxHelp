"""Configuration for agentic RAG."""

import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()
# Also load from tax-buddy/.env.local if present (Supabase, DeepSeek)
_parent_env = Path(__file__).resolve().parent.parent.parent / ".env.local"
if _parent_env.exists():
    load_dotenv(_parent_env)

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
NEO4J_URI = os.getenv("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.getenv("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.getenv("NEO4J_PASSWORD", "")
LLM_BASE_URL = os.getenv("LLM_BASE_URL", "https://api.deepseek.com/v1")
LLM_API_KEY = os.getenv("LLM_API_KEY") or os.getenv("DEEPSEEK_API_KEY", "")
LLM_CHOICE = os.getenv("LLM_CHOICE", "deepseek-chat")
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")
EMBED_DIM = 384
# Use tax-buddy embed API to avoid HuggingFace download (same Xenova model).
# Set to empty string to use sentence-transformers instead.
EMBED_API_URL = os.getenv("EMBED_API_URL", "http://localhost:3000/api/embed")
APP_PORT = int(os.getenv("APP_PORT", "8058"))
