"use client";

import { useState } from "react";
import { Snippet } from "../lib/types";

interface SnippetCardProps {
  snippet: Snippet;
  onDelete: (id: string) => void;
}

function getPreview(text: string): string {
  const sentences = text.match(/[^.!?]+[.!?]*/g) ?? [text];
  const preview = sentences.slice(0, 2).join("").trim();
  if (preview.length < text.trim().length) {
    return preview.length > 0 ? `${preview}` : text;
  }
  return preview;
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
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const preview = getPreview(snippet.text);
  const hasMore = preview.length < snippet.text.trim().length;

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(snippet.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      onClick={() => setExpanded((v) => !v)}
      className="cursor-pointer rounded-2xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm leading-relaxed text-foreground">
          {expanded ? snippet.text : preview}
          {!expanded && hasMore && (
            <span className="text-muted">&nbsp;&hellip;</span>
          )}
        </p>
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-muted">
        <span>{formatTime(snippet.createdAt)}</span>
        <div className="flex items-center gap-3">
          {expanded && (
            <button
              type="button"
              onClick={handleCopy}
              className="rounded-full px-3 py-1 font-semibold text-foreground transition-colors hover:bg-accent-soft"
            >
              {copied ? "Copied" : "Copy"}
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(snippet.id);
            }}
            className="rounded-full px-3 py-1 font-semibold transition-colors hover:bg-accent-soft hover:text-foreground"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
