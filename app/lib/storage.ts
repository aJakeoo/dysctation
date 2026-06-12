import { Snippet } from "./types";

const STORAGE_KEY = "dictation-snippets";

export function loadSnippets(): Snippet[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSnippets(snippets: Snippet[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snippets));
}

export function addSnippet(text: string): Snippet[] {
  const snippet: Snippet = {
    id: crypto.randomUUID(),
    text,
    createdAt: Date.now(),
  };
  const updated = [snippet, ...loadSnippets()];
  saveSnippets(updated);
  return updated;
}

export function deleteSnippet(id: string): Snippet[] {
  const updated = loadSnippets().filter((s) => s.id !== id);
  saveSnippets(updated);
  return updated;
}
