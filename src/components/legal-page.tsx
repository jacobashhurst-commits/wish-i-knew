import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";

export function LegalPage({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen px-4 py-10 text-[#172033]">
      <article className="mx-auto max-w-2xl">
        <Link className="text-sm font-semibold text-[#1D809F] hover:underline" href="/login">
          ← Back to sign in
        </Link>
        <h1 className="font-display mt-6 text-4xl font-semibold text-[#0d1b2a]">{title}</h1>
        <div className="prose prose-sm mt-6 max-w-none space-y-4 text-sm leading-7 text-[#172033]/90">
          {children}
        </div>
        <SiteFooter className="mt-12" />
      </article>
    </main>
  );
}
