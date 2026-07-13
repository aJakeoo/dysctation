import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full py-6 text-center text-xs text-muted-light">
      <p>
        Snippets are stored locally on your device only and are never
        uploaded or shared.
      </p>
      <p className="mt-3">
        <Link
          href="/contribute"
          className="inline-block rounded-full bg-accent-soft px-4 py-2 font-semibold text-foreground transition-colors hover:bg-accent-soft/80"
        >
          Contribute your voice
        </Link>
      </p>
    </footer>
  );
}
