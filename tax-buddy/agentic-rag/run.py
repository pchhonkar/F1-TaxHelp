#!/usr/bin/env python3
"""Run the TaxBuddy Agentic RAG API server."""

import uvicorn
from agent.config import APP_PORT

if __name__ == "__main__":
    uvicorn.run(
        "agent.api:app",
        host="0.0.0.0",
        port=APP_PORT,
        reload=True,
    )
