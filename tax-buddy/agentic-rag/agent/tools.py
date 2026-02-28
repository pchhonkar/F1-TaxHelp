"""Tools for the Pydantic AI agent — vector, graph, hybrid search."""

import logging
from typing import List, Dict, Any, Optional

from .embedder import embed_text
from .db_utils import vector_search, hybrid_search as db_hybrid_search
from .graph_utils import search_knowledge_graph, get_entity_relationships

logger = logging.getLogger(__name__)


async def vector_search_tool(query: str, limit: int = 10) -> List[Dict[str, Any]]:
    """Vector similarity search via Supabase."""
    try:
        embedding = embed_text(query)
        results = await vector_search(embedding=embedding, limit=limit)
        return [
            {
                "content": r["content"],
                "score": r["similarity"],
                "source": r["source"],
                "category": r["category"],
                "chunk_id": r["chunk_id"],
            }
            for r in results
        ]
    except Exception as e:
        logger.error(f"Vector search failed: {e}")
        return []


async def graph_search_tool(query: str, limit: int = 10) -> List[Dict[str, Any]]:
    """Knowledge graph search via Neo4j."""
    try:
        results = await search_knowledge_graph(query=query, limit=limit)
        return [
            {
                "fact": r.get("fact", str(r)),
                "country": r.get("country"),
                "treaty": r.get("treaty"),
                "form": r.get("form"),
                "concept": r.get("concept"),
            }
            for r in results
        ]
    except Exception as e:
        logger.error(f"Graph search failed: {e}")
        return []


async def hybrid_search_tool(
    query: str, limit: int = 10, text_weight: float = 0.3
) -> List[Dict[str, Any]]:
    """Hybrid vector + keyword search."""
    try:
        embedding = embed_text(query)
        results = await db_hybrid_search(
            embedding=embedding,
            query_text=query,
            limit=limit,
            text_weight=text_weight,
        )
        return [
            {
                "content": r["content"],
                "score": r["combined_score"],
                "source": r["source"],
                "category": r["category"],
                "chunk_id": r["chunk_id"],
            }
            for r in results
        ]
    except Exception as e:
        logger.error(f"Hybrid search failed: {e}")
        return []


async def get_entity_relationships_tool(entity_name: str, depth: int = 2) -> Dict[str, Any]:
    """Get entity relationships from the knowledge graph."""
    try:
        return await get_entity_relationships(entity_name=entity_name, depth=depth)
    except Exception as e:
        logger.error(f"Entity relationships failed: {e}")
        return {
            "central_entity": entity_name,
            "related_entities": [],
            "relationships": [],
            "depth": depth,
            "error": str(e),
        }
