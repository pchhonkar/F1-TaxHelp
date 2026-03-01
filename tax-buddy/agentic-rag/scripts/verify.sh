#!/bin/bash
# Verify agentic-rag with embed API. Requires tax-buddy running on port 3000 (or set EMBED_API_URL).
# Usage: ./scripts/verify.sh [port]
set -e
PORT=${1:-3000}
export EMBED_API_URL="http://localhost:${PORT}/api/embed"
echo "Using EMBED_API_URL=$EMBED_API_URL"
cd "$(dirname "$0")/.."
source venv/bin/activate
python -c '
import asyncio
from agent.tools import vector_search_tool
r = asyncio.run(vector_search_tool("FICA exemption", limit=3))
print("vector_search_tool:", len(r), "results")
if r:
    c = r[0].get("content", "") or ""
    print("Sample:", r[0].get("source"), "-", c[:70] + "...")
print("Agentic RAG vector search: OK")
'
