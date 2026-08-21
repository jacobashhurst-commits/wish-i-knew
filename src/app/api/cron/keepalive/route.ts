import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * Daily ping so free-tier Supabase does not pause from inactivity.
 * Secured with CRON_SECRET (same as the weekly lookahead cron).
 */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createServiceClient();

    // Lightweight read against a real table so the project counts as active.
    const { error, count } = await supabase
      .from("profiles")
      .select("id", { count: "exact", head: true });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      at: new Date().toISOString(),
      profiles: count ?? 0,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Keepalive failed" },
      { status: 500 },
    );
  }
}
