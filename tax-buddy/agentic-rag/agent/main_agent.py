"""Pydantic AI agent for TaxBuddy — agentic RAG with knowledge graph."""

import logging
from typing import List, Dict, Any, Optional

from pydantic_ai import Agent
from pydantic_ai.models.openai import OpenAIModel
from pydantic_ai.providers.openai import OpenAIProvider

from .config import LLM_BASE_URL, LLM_API_KEY, LLM_CHOICE
from .prompts import SYSTEM_PROMPT
from .tools import (
    vector_search_tool,
    graph_search_tool,
    hybrid_search_tool,
    get_entity_relationships_tool,
)

logger = logging.getLogger(__name__)

_provider = OpenAIProvider(base_url=LLM_BASE_URL, api_key=LLM_API_KEY)
_model = OpenAIModel(LLM_CHOICE, provider=_provider)

rag_agent = Agent(
    model=_model,
    system_prompt=SYSTEM_PROMPT,
    retries=1,
)


@rag_agent.tool_plain
async def vector_search(query: str, limit: int = 10) -> List[Dict[str, Any]]:
    """
    Search for relevant tax information using semantic similarity.
    Use for general tax questions, form instructions, treaty details.
    """
    return await vector_search_tool(query=query, limit=limit)


@rag_agent.tool_plain
async def graph_search(query: str, limit: int = 10) -> List[Dict[str, Any]]:
    """
    Search the knowledge graph for facts and relationships.
    Use for country-specific treaty questions, form requirements, entity connections.
    """
    return await graph_search_tool(query=query, limit=limit)


@rag_agent.tool_plain
async def hybrid_search(query: str, limit: int = 10, text_weight: float = 0.3) -> List[Dict[str, Any]]:
    """
    Combine vector and keyword search for comprehensive results.
    Use when you need both semantic relevance and exact term matching.
    """
    return await hybrid_search_tool(query=query, limit=limit, text_weight=text_weight)


@rag_agent.tool_plain
async def get_entity_relationships(entity_name: str, depth: int = 2) -> Dict[str, Any]:
    """
    Get relationships for an entity (Country, Treaty, Form, TaxConcept).
    Use when the user asks about connections (e.g., "What forms does India treaty require?").
    """
    return await get_entity_relationships_tool(entity_name=entity_name, depth=depth)
