import Link from "next/link";

export function SiteFooter({ className = "" }: { className?: string }) {
  return (
    <footer className={`border-t border-[#0d1b2a]/10 pt-6 text-sm text-[#697386] ${className}`}>
      <nav className="flex flex-wrap justify-center gap-x-5 gap-y-2">
        <Link className="font-semibold hover:text-[#1D809F]" href="/privacy">
          Privacy
        </Link>
        <Link className="font-semibold hover:text-[#1D809F]" href="/terms">
          Terms
        </Link>
        <Link className="font-semibold hover:text-[#1D809F]" href="/disclaimer">
          Disclaimer
        </Link>
      </nav>
      <p className="mt-4 text-center text-xs leading-5">
        Wish I Knew is practical guidance for Australian parents, not medical advice.
      </p>
    </footer>
  );
}
