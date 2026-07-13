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
      <p className="mt-5 text-center text-sm font-semibold text-muted-light">
        No transcriptions yet
      </p>
    );
  }

  return (
    <div className="flex w-full flex-col gap-3.5">
      {snippets.map((snippet) => (
        <SnippetCard key={snippet.id} snippet={snippet} onDelete={onDelete} />
      ))}
    </div>
  );
}
