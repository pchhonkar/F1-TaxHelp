"""
Ingest tax knowledge graph into Neo4j.
Seeds Country, Treaty, Article, Form, TaxConcept nodes and relationships.
Run after npm run seed (vector store) — graph is independent.
"""

import asyncio
import logging
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))
from dotenv import load_dotenv

load_dotenv()

from agent.graph_utils import init_graph, close_graph, get_driver, clear_graph

logger = logging.getLogger(__name__)

# Tax domain data for the knowledge graph
COUNTRIES = [
    "India", "China", "Germany", "Korea", "Japan", "Canada", "Mexico", "France",
    "Thailand", "Philippines", "Indonesia", "Australia", "Bangladesh", "Barbados", "Belgium",
]

TREATIES = [
    ("US-India Tax Treaty", "India"),
    ("US-China Tax Treaty", "China"),
    ("US-Germany Tax Treaty", "Germany"),
    ("US-Korea Tax Treaty", "Korea"),
    ("US-Japan Tax Treaty", "Japan"),
    ("US-Canada Tax Treaty", "Canada"),
    ("US-Mexico Tax Treaty", "Mexico"),
    ("US-France Tax Treaty", "France"),
    ("US-Thailand Tax Treaty", "Thailand"),
    ("US-Philippines Tax Treaty", "Philippines"),
    ("US-Indonesia Tax Treaty", "Indonesia"),
    ("US-Australia Tax Treaty", "Australia"),
]

# Treaty articles relevant to students
ARTICLES = [
    ("Article 21 Students", "US-India Tax Treaty", "India treaty: scholarship/fellowship exempt; wages up to $10,000/year first 2 years. File Form 8833 with 1040-NR."),
    ("Article 20 Students", "US-China Tax Treaty", "China treaty: wages exempt 5 years; scholarships fully exempt. Broad student exemption."),
    ("Article 20 Students", "US-Germany Tax Treaty", "Germany: scholarship exempt; wages up to $9,000/year for 4 years."),
    ("Article 21 Students", "US-Korea Tax Treaty", "Korea: wages exempt up to $2,000/year for 5 years."),
    ("Article 20 Students", "US-Japan Tax Treaty", "Japan treaty: student exemptions on scholarships and limited wages."),
    ("Article 20 Students", "US-Canada Tax Treaty", "Canada: student exemptions on scholarships and wages."),
]

FORMS = [
    ("Form 1040-NR", "Nonresident tax return. File if you have US-source income. Required for most F1/J1 students with wages or scholarship.", "nonresident_return"),
    ("Form 8843", "Statement of exempt presence. REQUIRED for ALL F1/J1 even with zero income. Deadline June 15.", "substantial_presence"),
    ("Form 843", "Claim for refund. Use to claim FICA refund if employer wrongly withheld.", "fica_refund"),
    ("Form 8316", "Attach to Form 843 for FICA refund. Required with Form 843.", "fica_refund"),
    ("Form 8833", "Treaty-based return position disclosure. Attach to 1040-NR when claiming treaty benefits.", "treaty"),
]

TAX_CONCEPTS = [
    ("FICA Exemption", "F1/J1 students exempt from FICA (Social Security + Medicare) for first 5 (F1) or 2 (J1) years. File Form 843 + 8316 for refund if wrongly withheld.", "fica"),
    ("Substantial Presence Test", "F1 exempt 5 years; J1 exempt 2 years. Most F1/J1 file as nonresident aliens on 1040-NR.", "residency"),
    ("Treaty Benefits", "Country-specific. India Article 21, China Article 20, etc. File Form 8833 to claim.", "treaty"),
    ("Nonresident Alien", "File 1040-NR, not 1040. Use 8843 to establish exempt presence.", "residency"),
]


async def seed_graph(clean: bool = True):
    """Seed the Neo4j knowledge graph with tax entities."""
    await init_graph()
    driver = get_driver()

    if clean:
        await clear_graph()
        logger.info("Graph cleared")

    async with driver.session() as session:
        # Create countries
        for c in COUNTRIES:
            await session.run(
                "MERGE (c:Country {name: $name})",
                name=c,
            )
        logger.info(f"Created {len(COUNTRIES)} countries")

        # Create treaties and link to countries
        for treaty, country in TREATIES:
            await session.run(
                """
                MERGE (t:Treaty {name: $treaty})
                MERGE (c:Country {name: $country})
                MERGE (c)-[:HAS_TREATY]->(t)
                """,
                treaty=treaty,
                country=country,
            )
        logger.info(f"Created {len(TREATIES)} treaties")

        # Create articles and link to treaties
        for article, treaty, summary in ARTICLES:
            await session.run(
                """
                MERGE (a:Article {name: $article})
                SET a.summary = $summary
                MERGE (t:Treaty {name: $treaty})
                MERGE (t)-[:HAS_ARTICLE]->(a)
                """,
                article=article,
                treaty=treaty,
                summary=summary,
            )
        logger.info(f"Created {len(ARTICLES)} articles")

        # Create tax concepts
        for name, summary, _ in TAX_CONCEPTS:
            await session.run(
                "MERGE (x:TaxConcept {name: $name}) SET x.summary = $summary",
                name=name,
                summary=summary,
            )
        logger.info(f"Created {len(TAX_CONCEPTS)} tax concepts")

        # Create forms and link to concepts
        for form_name, purpose, concept_key in FORMS:
            concept_map = {c[2]: c[0] for c in TAX_CONCEPTS}
            concept_name = concept_map.get(concept_key, "Tax Filing")
            await session.run(
                """
                MERGE (f:Form {name: $form})
                SET f.purpose = $purpose
                MERGE (x:TaxConcept {name: $concept})
                MERGE (f)-[:REQUIRED_FOR]->(x)
                """,
                form=form_name,
                purpose=purpose,
                concept=concept_name,
            )
        logger.info(f"Created {len(FORMS)} forms")

    await close_graph()
    logger.info("Graph seeding complete")


async def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--no-clean", action="store_true", help="Do not clear graph before seeding")
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO)
    await seed_graph(clean=not args.no_clean)


if __name__ == "__main__":
    asyncio.run(main())
