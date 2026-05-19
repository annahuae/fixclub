'use client';

import { useState } from 'react';

export function CopyButton({
  text,
  label = 'Copy link',
  className = ''
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          // ignore
        }
      }}
      className={`text-xs px-2.5 py-1 rounded-md border border-border hover:border-accent hover:text-accent transition ${className}`}
    >
      {copied ? '✓ Copied' : label}
    </button>
  );
}
