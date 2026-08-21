import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/resend";
import { createServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEBUG = "wik-alpha-env-check-2026-08-21";

/** Temporary alpha debug — remove after email is confirmed working. */
export async function GET(request: Request) {
  const token = request.headers.get("x-wik-debug") ?? "";
  if (token !== DEBUG) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const shouldSend = url.searchParams.get("send") === "1";

  const payload = {
    resend: Boolean(process.env.RESEND_API_KEY?.trim()),
    from: Boolean(process.env.WIK_FROM_EMAIL?.trim()),
    cron: Boolean(process.env.CRON_SECRET?.trim()),
    service: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()),
    site: Boolean(process.env.NEXT_PUBLIC_SITE_URL?.trim()),
  };

  if (!shouldSend) {
    return NextResponse.json(payload);
  }

  if (!payload.resend || !payload.from) {
    return NextResponse.json({ ...payload, error: "Missing Resend env" }, { status: 503 });
  }

  let to = "jacob.ashhurst@gmail.com";
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from("profiles")
      .select("email")
      .eq("role", "admin")
      .limit(1)
      .maybeSingle();
    if (data?.email) to = data.email;
  } catch {
    // fall back to known admin inbox
  }

  const result = await sendEmail({
    to,
    subject: "[SMOKE] Wish I Knew production email works",
    html: "<p>Production Resend path is working.</p>",
    text: "Production Resend path is working.",
  });

  if (result.error) {
    return NextResponse.json({ ...payload, to, error: result.error }, { status: 502 });
  }

  return NextResponse.json({ ...payload, ok: true, to });
}
