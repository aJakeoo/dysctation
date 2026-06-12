"use client";

import { Snippet } from "../lib/types";
import { SnippetCard } from "./SnippetCard";

interface SnippetsListProps {
  snippets: Snippet[];
  onDelete: (id: string) => void;
}

export function SnippetsList({ snippets, onDelete }: SnippetsListProps) {
  if (snippets.length === 0) {
    return (
      <p className="mt-10 text-center text-sm text-muted">
        Your transcriptions will appear here.
      </p>
    );
  }

  return (
    <div className="mt-10 flex w-full flex-col gap-3">
      {snippets.map((snippet) => (
        <SnippetCard key={snippet.id} snippet={snippet} onDelete={onDelete} />
      ))}
    </div>
  );
}
