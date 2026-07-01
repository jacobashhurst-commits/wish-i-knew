import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminProfile } from "@/lib/data/admin";

export const metadata = {
  title: "Content Studio  -  Wish I Knew",
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getAdminProfile();

  if (!admin) {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-[#FFFDF7] px-4 pb-16 pt-6 text-[#172033] sm:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-[1.75rem] bg-[#0d1b2a] px-6 py-4 text-white shadow-sm">
          <div>
            <p className="wik-chip bg-white/15 text-[#FFD79A]">Content Studio</p>
            <h1 className="font-display mt-1 text-xl font-semibold">Wish I Knew admin</h1>
          </div>
          <nav className="flex flex-wrap items-center gap-2 text-sm font-semibold">
            <Link className="rounded-full px-4 py-2 hover:bg-white/10" href="/admin">
              Cards
            </Link>
            <Link className="rounded-full px-4 py-2 hover:bg-white/10" href="/admin/cards/new">
              New card
            </Link>
            <Link className="rounded-full px-4 py-2 hover:bg-white/10" href="/admin/suggestions">
              Suggestions
            </Link>
            <Link className="rounded-full px-4 py-2 hover:bg-white/10" href="/admin/debugger">
              Match debugger
            </Link>
            <Link className="rounded-full bg-white/15 px-4 py-2 hover:bg-white/25" href="/">
              Back to app
            </Link>
          </nav>
        </header>

        <div className="mt-6">{children}</div>
      </div>
    </main>
  );
}
