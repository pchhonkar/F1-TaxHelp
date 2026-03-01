"""Embeddings for vector search — 384 dims, matches Supabase knowledge_base."""

import logging
from typing import List

from .config import EMBED_API_URL, EMBEDDING_MODEL, EMBED_DIM

logger = logging.getLogger(__name__)

_model = None


def embed_text(text: str) -> List[float]:
    """Embed a single text. Returns 384-dimensional vector.
    Uses tax-buddy embed API if EMBED_API_URL is set (avoids HuggingFace download).
    Otherwise falls back to sentence-transformers.
    """
    truncated = text[:512] if len(text) > 512 else text

    # Prefer embed API (tax-buddy uses Xenova — no HF download)
    if EMBED_API_URL:
        try:
            import httpx
            r = httpx.post(
                EMBED_API_URL,
                json={"text": truncated},
                timeout=30.0,
            )
            r.raise_for_status()
            data = r.json()
            emb = data.get("embedding", [])
            if len(emb) == 384:
                return emb
        except Exception as e:
            logger.warning("Embed API failed, falling back to local: %s", e)

    # Fallback: sentence-transformers (requires HuggingFace download on first run)
    try:
        from sentence_transformers import SentenceTransformer
        global _model
        if _model is None:
            _model = SentenceTransformer(EMBEDDING_MODEL)
        vector = _model.encode(truncated, normalize_embeddings=True)
        return vector.tolist()
    except Exception as e:
        logger.error("Embedding failed: %s. Ensure tax-buddy is running (npm run dev) and EMBED_API_URL is set.", e)
        raise


def embed_texts(texts: List[str]) -> List[List[float]]:
    """Embed multiple texts."""
    return [embed_text(t) for t in texts]
