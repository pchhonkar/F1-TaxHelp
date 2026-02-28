"""Embeddings for vector search — 384 dims, matches Supabase knowledge_base."""

from typing import List
from sentence_transformers import SentenceTransformer

from .config import EMBEDDING_MODEL, EMBED_DIM

_model = None


def get_embedder():
    global _model
    if _model is None:
        _model = SentenceTransformer(EMBEDDING_MODEL)
    return _model


def embed_text(text: str) -> List[float]:
    """Embed a single text. Returns 384-dimensional vector."""
    model = get_embedder()
    truncated = text[:512] if len(text) > 512 else text
    vector = model.encode(truncated, normalize_embeddings=True)
    return vector.tolist()


def embed_texts(texts: List[str]) -> List[List[float]]:
    """Embed multiple texts."""
    model = get_embedder()
    truncated = [t[:512] if len(t) > 512 else t for t in texts]
    vectors = model.encode(truncated, normalize_embeddings=True)
    return [v.tolist() for v in vectors]
