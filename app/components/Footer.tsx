import Link from "next/link";

export function Footer() {
  return (
    <footer className="w-full py-6 text-center text-xs text-muted-light">
      <p>
        Snippets are stored locally on your device only and are never
        uploaded or shared.
      </p>
      <p className="mt-2">
        <Link href="/privacy" className="underline hover:text-muted">
          Privacy
        </Link>
      </p>
    </footer>
  );
}
