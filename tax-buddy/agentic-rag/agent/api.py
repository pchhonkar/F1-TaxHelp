"""FastAPI server for TaxBuddy agentic RAG agent."""

import logging
import uuid
from typing import List, Dict, Any, Optional

from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from contextlib import asynccontextmanager

from .main_agent import rag_agent
from .config import APP_PORT
from .graph_utils import init_graph, close_graph

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize and cleanup resources."""
    try:
        await init_graph()
    except Exception as e:
        logger.warning("Neo4j init skipped (graph search may be empty): %s", e)
    try:
        yield
    finally:
        try:
            await close_graph()
        except Exception:
            pass


app = FastAPI(
    title="TaxBuddy Agentic RAG API",
    description="Agentic RAG with Knowledge Graph for international student tax Q&A",
    lifespan=lifespan,
)


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None


class ChatResponse(BaseModel):
    response: str
    session_id: str
    tools_used: List[str] = []


class HealthResponse(BaseModel):
    status: str
    message: str


@app.get("/health", response_model=HealthResponse)
async def health():
    """Health check endpoint."""
    return HealthResponse(status="ok", message="TaxBuddy Agentic RAG API is running")


def _extract_tools_used(result) -> List[str]:
    """Extract tool names from agent run result."""
    tools = []
    try:
        for msg in result.all_messages():
            if hasattr(msg, "parts"):
                for p in msg.parts:
                    if hasattr(p, "tool_name") and p.tool_name:
                        tools.append(p.tool_name)
    except Exception:
        pass
    return list(dict.fromkeys(tools))  # dedupe preserve order


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """Non-streaming chat with the agent."""
    session_id = request.session_id or str(uuid.uuid4())

    try:
        result = await rag_agent.run(request.message)
        response_text = str(result.output or "")
        tools_used = _extract_tools_used(result)

        return ChatResponse(
            response=response_text,
            session_id=session_id,
            tools_used=tools_used,
        )
    except Exception as e:
        logger.exception("Chat failed")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    """Streaming chat with the agent."""
    async def generate():
        try:
            async with rag_agent.run_stream(request.message) as result:
                async for text in result.stream_output():
                    if text:
                        yield f"data: {text}\n\n"
        except Exception as e:
            logger.exception("Stream chat failed")
            yield f"data: {{\"error\": \"{str(e)}\"}}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"},
    )


def main():
    import uvicorn
    uvicorn.run(
        "agent.api:app",
        host="0.0.0.0",
        port=APP_PORT,
        reload=True,
    )


if __name__ == "__main__":
    main()
