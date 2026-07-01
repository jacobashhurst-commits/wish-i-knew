import { NextResponse } from "next/server";
import { verifyPauseToken } from "@/lib/email/tokens";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

/** One-tap pause from the weekly email. Disables sends only  -  nothing is deleted. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const token = url.searchParams.get("token");

  if (!id || !token || !verifyPauseToken(id, token)) {
    return new NextResponse("This pause link is invalid or has expired.", { status: 400 });
  }

  const supabase = createServiceClient();
  const { error } = await supabase
    .from("weekly_lookahead_preferences")
    .update({ enabled: false })
    .eq("id", id);

  if (error) {
    return new NextResponse("Something went wrong pausing your emails. Please try again.", {
      status: 500,
    });
  }

  return new NextResponse(
    `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Paused  -  Wish I Knew</title></head>
<body style="margin:0;background:#FFFDF7;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:480px;margin:80px auto;padding:32px;background:#ffffff;border-radius:20px;border:1px solid #e8e4da;text-align:center;">
    <h1 style="margin:0;font-size:24px;color:#0d1b2a;">Weekly emails paused</h1>
    <p style="margin:12px 0 0 0;font-size:15px;line-height:1.6;color:#4a5468;">
      No more lookahead emails for now. Your account and timeline are untouched  - 
      you can switch them back on anytime from Settings in the app.
    </p>
  </div>
</body>
</html>`,
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}
