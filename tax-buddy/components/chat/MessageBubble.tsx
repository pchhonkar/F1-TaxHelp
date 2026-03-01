'use client';

import { useState } from 'react';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
  onCopy?: () => void;
}

export function MessageBubble({ role, content, sources, onCopy }: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      onCopy?.();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const isUser = role === 'user';

  return (
    <div
      className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-emerald-600 text-white'
            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
        }`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">
              {content}
            </p>
            {sources && sources.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {sources.map((src) => (
                  <span
                    key={src}
                    className="rounded-full bg-zinc-200 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-700 dark:text-zinc-400"
                  >
                    Source: {src}
                  </span>
                ))}
              </div>
            )}
          </div>
          {!isUser && content && (
            <button
              type="button"
              onClick={handleCopy}
              className="shrink-0 rounded p-1.5 text-zinc-500 transition hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-600 dark:hover:text-zinc-300"
              title={copied ? 'Copied!' : 'Copy'}
            >
              {copied ? (
                <span className="text-xs">✓</span>
              ) : (
                <span className="text-sm">📋</span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
