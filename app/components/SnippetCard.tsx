"use client";

import { useState } from "react";
import { Snippet } from "../lib/types";

interface SnippetCardProps {
  snippet: Snippet;
  onDelete: (id: string) => void;
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function SnippetCard({ snippet, onDelete }: SnippetCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(snippet.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  return (
    <div
      onClick={handleCopy}
      className="cursor-pointer rounded-2xl border border-border bg-card p-5 transition-shadow hover:shadow-[0_4px_18px_rgba(43,42,39,0.06)]"
    >
      <p className="text-[17px] font-bold leading-relaxed text-foreground">
        {snippet.text}
      </p>
      <div className="mt-3.5 flex items-center justify-between">
        <span className="text-[13px] font-semibold text-muted">
          {copied ? "Copied!" : formatTime(snippet.createdAt)}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(snippet.id);
          }}
          className="rounded-full p-1.5 text-[13.5px] font-bold text-muted transition-colors hover:text-[#b5533f]"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
