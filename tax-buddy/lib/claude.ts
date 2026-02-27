import Anthropic from '@anthropic-ai/sdk';

let client: Anthropic | null = null;

/**
 * Returns the Anthropic client singleton.
 * Uses ANTHROPIC_API_KEY from environment.
 */
export function getClaudeClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY is not set in environment variables');
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}
