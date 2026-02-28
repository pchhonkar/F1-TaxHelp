#!/usr/bin/env python3
"""CLI for TaxBuddy Agentic RAG — chat with the agent."""

import argparse
import httpx
import sys


def main():
    parser = argparse.ArgumentParser(description="TaxBuddy Agentic RAG CLI")
    parser.add_argument("--url", default="http://localhost:8058", help="API base URL")
    parser.add_argument("--port", type=int, help="Override port (ignored if --url set)")
    args = parser.parse_args()

    base_url = args.url
    if args.port and args.url == "http://localhost:8058":
        base_url = f"http://localhost:{args.port}"

    print("TaxBuddy Agentic RAG with Knowledge Graph CLI")
    print("=" * 60)
    print(f"Connected to: {base_url}")
    print()
    print("Commands: help | health | clear | exit | quit")
    print()

    session_id = None

    while True:
        try:
            user_input = input("You: ").strip()
            if not user_input:
                continue
            if user_input.lower() in ("exit", "quit"):
                print("Bye!")
                break
            if user_input.lower() == "help":
                print("Commands: help, health, clear, exit, quit")
                continue
            if user_input.lower() == "health":
                r = httpx.get(f"{base_url}/health")
                print(r.json())
                continue
            if user_input.lower() == "clear":
                session_id = None
                print("Session cleared.")
                continue

            payload = {"message": user_input}
            if session_id:
                payload["session_id"] = session_id

            r = httpx.post(f"{base_url}/chat", json=payload, timeout=60.0)
            r.raise_for_status()
            data = r.json()
            session_id = data.get("session_id")
            print(f"\nAssistant: {data.get('response', '')}")
            tools = data.get("tools_used", [])
            if tools:
                print(f"\nTools used: {', '.join(tools)}")
            print("\n" + "-" * 60)

        except KeyboardInterrupt:
            print("\nBye!")
            break
        except Exception as e:
            print(f"Error: {e}", file=sys.stderr)


if __name__ == "__main__":
    main()
