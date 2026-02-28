"""Neo4j knowledge graph utilities for tax domain."""

import logging
from typing import List, Dict, Any, Optional

from neo4j import AsyncGraphDatabase

from .config import NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD

logger = logging.getLogger(__name__)

_driver = None


def get_driver():
    global _driver
    if _driver is None:
        _driver = AsyncGraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
    return _driver


async def init_graph():
    """Initialize graph and create constraints if needed."""
    driver = get_driver()
    async with driver.session() as session:
        await session.run(
            "CREATE CONSTRAINT country_name IF NOT EXISTS FOR (c:Country) REQUIRE c.name IS UNIQUE"
        )
        await session.run(
            "CREATE CONSTRAINT treaty_name IF NOT EXISTS FOR (t:Treaty) REQUIRE t.name IS UNIQUE"
        )
        await session.run(
            "CREATE CONSTRAINT form_name IF NOT EXISTS FOR (f:Form) REQUIRE f.name IS UNIQUE"
        )
        await session.run(
            "CREATE CONSTRAINT concept_name IF NOT EXISTS FOR (x:TaxConcept) REQUIRE x.name IS UNIQUE"
        )
    logger.info("Neo4j graph initialized")


async def close_graph():
    global _driver
    if _driver:
        await _driver.close()
        _driver = None
    logger.info("Neo4j connection closed")


async def search_knowledge_graph(query: str, limit: int = 10) -> List[Dict[str, Any]]:
    """
    Search the knowledge graph for facts matching the query.
    Uses full-text style Cypher to find entities and relationships.
    """
    driver = get_driver()
    results = []

    # Normalize query for matching
    q_lower = query.lower()
    q_words = q_lower.split()[:5]  # First 5 words

    async with driver.session() as session:
        # Match countries mentioned in query
        if any(w in ["india", "china", "germany", "korea", "japan", "canada", "mexico", "france"] for w in q_words):
            r = await session.run(
                """
                MATCH (c:Country)-[:HAS_TREATY]->(t:Treaty)-[:HAS_ARTICLE]->(a:Article)
                WHERE toLower(c.name) IN $terms OR toLower(t.name) CONTAINS $q
                RETURN c.name AS country, t.name AS treaty, a.name AS article, a.summary AS summary
                LIMIT $limit
                """,
                terms=[w for w in q_words if len(w) > 2],
                q=q_lower[:50],
                limit=limit,
            )
            async for rec in r:
                results.append({
                    "fact": f"{rec['country']} treaty {rec['treaty']} - {rec['article']}: {rec['summary'] or 'N/A'}",
                    "country": rec["country"],
                    "treaty": rec["treaty"],
                    "article": rec["article"],
                })

        # Match forms (1040-NR, 8843, 843, FICA, etc.)
        if any(w in ["1040", "8843", "843", "8316", "fica", "form"] for w in q_words):
            r = await session.run(
                """
                MATCH (f:Form)-[:REQUIRED_FOR]->(x:TaxConcept)
                WHERE toLower(f.name) CONTAINS $q OR toLower(x.name) CONTAINS $q
                RETURN f.name AS form, x.name AS concept, f.purpose AS purpose
                LIMIT $limit
                """,
                q=q_lower[:50],
                limit=limit,
            )
            async for rec in r:
                results.append({
                    "fact": f"Form {rec['form']} - {rec['concept']}: {rec['purpose'] or 'N/A'}",
                    "form": rec["form"],
                    "concept": rec["concept"],
                })

        # Match FICA / treaty article concepts
        r = await session.run(
            """
            MATCH (x:TaxConcept)
            WHERE toLower(x.name) CONTAINS $q OR toLower(x.summary) CONTAINS $q
            RETURN x.name AS name, x.summary AS summary
            LIMIT $limit
            """,
            q=q_lower[:80],
            limit=limit,
        )
        async for rec in r:
            results.append({
                "fact": f"{rec['name']}: {rec['summary'] or 'N/A'}",
                "concept": rec["name"],
            })

    return results[:limit]


async def get_entity_relationships(entity_name: str, depth: int = 2) -> Dict[str, Any]:
    """Get relationships for an entity (Country, Treaty, Form, etc.)."""
    driver = get_driver()
    central = entity_name.strip()
    if not central:
        return {"central_entity": "", "related_entities": [], "relationships": [], "depth": depth}

    rels: List[Dict[str, str]] = []
    seen: set = set()
    try:
        async with driver.session() as session:
            r = await session.run(
                """
                MATCH (n)-[r]-(m)
                WHERE toLower(n.name) CONTAINS toLower($entity)
                   OR toLower(m.name) CONTAINS toLower($entity)
                RETURN labels(n)[0] AS nlab, n.name AS nname, labels(m)[0] AS mlab, m.name AS mname, type(r) AS rel
                LIMIT 20
                """,
                entity=central,
            )
            async for rec in r:
                nlab = rec.get("nlab") or "Node"
                nname = rec.get("nname") or ""
                mlab = rec.get("mlab") or "Node"
                mname = rec.get("mname") or ""
                rel = rec.get("rel") or "RELATED_TO"
                key = (nname, mname)
                if key not in seen:
                    seen.add(key)
                    rels.append({
                        "from": f"{nlab}({nname})",
                        "to": f"{mlab}({mname})",
                        "relationship": rel,
                    })
    except Exception as e:
        logger.debug(f"Entity relationships: {e}")

    return {
        "central_entity": central,
        "related_entities": list({r["to"] for r in rels}),
        "relationships": rels,
        "depth": depth,
    }


async def clear_graph():
    """Remove all nodes and relationships (for re-ingestion)."""
    driver = get_driver()
    async with driver.session() as session:
        await session.run("MATCH (n) DETACH DELETE n")
    logger.info("Knowledge graph cleared")
