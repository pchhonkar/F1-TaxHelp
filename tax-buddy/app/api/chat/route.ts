/**
 * Chat API — RAG + DeepSeek streaming.
 * POST { message, history?, userProfile? } → streaming AI response
 */

import { NextRequest, NextResponse } from 'next/server';
import { retrieveContext } from '@/lib/rag';
import { streamChat } from '@/lib/chat';
import type { ChatMessage, UserProfile } from '@/types';

function buildSystemPrompt(ragContext: string, userProfile?: Partial<UserProfile>): string {
  const visaType = userProfile?.visaType ?? 'Not specified';
  const countryOfOrigin = userProfile?.countryOfOrigin ?? 'Not specified';
  const yearsInUS = userProfile?.yearsInUS ?? 0;
  const stateOfResidence = userProfile?.stateOfResidence ?? 'Not specified';
  const incomeTypes = userProfile?.incomeTypes?.join(', ') ?? 'Not specified';
  const ficaWithheld = userProfile?.ficaWithheld ?? false;

  return `You are TaxBuddy, a friendly and expert tax assistant specifically for international students in the USA. You help students maximize their tax refunds and file correctly.

STUDENT PROFILE:
- Visa Type: ${visaType}
- Country: ${countryOfOrigin}
- Years in US: ${yearsInUS}
- State: ${stateOfResidence}
- Income Types: ${incomeTypes}
- FICA Withheld by Employer: ${ficaWithheld}
- Tax Year: 2024

RELEVANT TAX RULES (from IRS publications and tax treaties):
${ragContext}

YOUR RULES:
1. ALWAYS check for applicable tax treaty benefits for the student's country FIRST
2. ALWAYS check if they qualify for FICA refund if visa is F1/J1
3. Explain every tax term in SIMPLE English — assume zero tax knowledge
4. Be encouraging and specific — tell them exactly what forms to fill and in what order
5. Always tell them the potential refund amount when calculable
6. If you're not 100% sure about something, say so clearly and recommend consulting a CPA
7. Keep responses concise and structured with clear action items
8. Never give advice on illegal tax evasion — only legal deductions and exemptions`;
}

function historyToMessages(history: ChatMessage[]): Array<{ role: 'user' | 'assistant'; content: string }> {
  return history
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .map((m) => ({ role: m.role, content: m.content }));
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    const history: ChatMessage[] = Array.isArray(body.history) ? body.history : [];
    const userProfile: Partial<UserProfile> | undefined = body.userProfile ?? undefined;

    if (!message) {
      return NextResponse.json({ error: 'message is required' }, { status: 400 });
    }

    // 1. Get RAG context
    const ragContext = await retrieveContext(message, userProfile);

    // 2. Build system prompt with RAG + profile
    const systemPrompt = buildSystemPrompt(ragContext, userProfile);

    // 3. Build messages: history + new user message
    const messages = [
      ...historyToMessages(history),
      { role: 'user' as const, content: message },
    ];

    // 4. Stream response
    const stream = await streamChat({
      systemPrompt,
      messages,
      stream: true,
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (e) {
    console.error('Chat API error:', e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Chat failed' },
      { status: 500 }
    );
  }
}
