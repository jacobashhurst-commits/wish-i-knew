import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Temporary alpha debug — remove after email is confirmed working. */
export async function GET(request: Request) {
  const token = request.headers.get("x-wik-debug") ?? "";
  if (token !== "wik-alpha-env-check-2026-08-21") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    resend: Boolean(process.env.RESEND_API_KEY?.trim()),
    from: Boolean(process.env.WIK_FROM_EMAIL?.trim()),
    cron: Boolean(process.env.CRON_SECRET?.trim()),
    service: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()),
    site: Boolean(process.env.NEXT_PUBLIC_SITE_URL?.trim()),
  });
}
