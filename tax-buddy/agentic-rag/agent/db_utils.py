"""Supabase vector search utilities — calls match_documents RPC."""

import logging
from typing import List, Dict, Any, Optional

import httpx

from .config import SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
from .embedder import embed_text

logger = logging.getLogger(__name__)


async def vector_search(embedding: List[float], limit: int = 10) -> List[Dict[str, Any]]:
    """
    Call Supabase match_documents RPC for vector similarity search.
    Returns chunks from knowledge_base.
    """
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        logger.warning("Supabase not configured; returning empty vector results")
        return []

    url = f"{SUPABASE_URL}/rest/v1/rpc/match_documents"
    headers = {
        "apikey": SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }
    payload = {
        "query_embedding": embedding,
        "match_threshold": 0.5,
        "match_count": limit,
        "filter_category": None,
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            r = await client.post(url, json=payload, headers=headers)
            r.raise_for_status()
            data = r.json() or []
            return [
                {
                    "chunk_id": str(row.get("id", "")),
                    "content": row.get("content", ""),
                    "similarity": float(row.get("similarity", 0)),
                    "source": row.get("source", ""),
                    "category": row.get("category", ""),
                }
                for row in data
            ]
    except Exception as e:
        logger.error(f"Vector search failed: {e}")
        return []


async def hybrid_search(
    embedding: List[float],
    query_text: str,
    limit: int = 10,
    text_weight: float = 0.3,
) -> List[Dict[str, Any]]:
    """
    Hybrid search: vector similarity + keyword boost.
    For now, uses vector search and boosts by query word overlap.
    """
    results = await vector_search(embedding=embedding, limit=limit * 2)
    q_words = set(query_text.lower().split())
    scored = []
    for r in results:
        content_lower = (r.get("content", "") or "").lower()
        matches = sum(1 for w in q_words if w in content_lower)
        keyword_score = matches / max(len(q_words), 1)
        vec_score = r.get("similarity", 0)
        combined = (1 - text_weight) * vec_score + text_weight * min(keyword_score, 1.0)
        scored.append({**r, "combined_score": combined})
    scored.sort(key=lambda x: x["combined_score"], reverse=True)
    return scored[:limit]
