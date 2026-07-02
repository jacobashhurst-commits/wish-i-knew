import { NextResponse } from "next/server";
import { verifyPauseToken } from "@/lib/email/tokens";
import { createServiceClient } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

function invalidLinkResponse() {
  return new NextResponse("This pause link is invalid or has expired.", { status: 400 });
}

function pausedHtml() {
  return `<!doctype html>
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
</html>`;
}

function confirmHtml(id: string, token: string) {
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Pause emails?  -  Wish I Knew</title></head>
<body style="margin:0;background:#FFFDF7;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:480px;margin:80px auto;padding:32px;background:#ffffff;border-radius:20px;border:1px solid #e8e4da;text-align:center;">
    <h1 style="margin:0;font-size:24px;color:#0d1b2a;">Pause weekly emails?</h1>
    <p style="margin:12px 0 0 0;font-size:15px;line-height:1.6;color:#4a5468;">
      Mail scanners sometimes open links automatically. Confirm below if you want to pause your
      weekly Lookahead emails. Your account and timeline stay exactly as they are.
    </p>
    <form method="post" style="margin-top:24px;">
      <input type="hidden" name="id" value="${id}" />
      <input type="hidden" name="token" value="${token}" />
      <button type="submit" style="background:#0d1b2a;color:#ffffff;border:none;border-radius:12px;padding:12px 20px;font-size:15px;font-weight:bold;cursor:pointer;">
        Pause my emails
      </button>
    </form>
  </div>
</body>
</html>`;
}

function readPauseParams(request: Request, body?: FormData) {
  const url = new URL(request.url);
  const id = body?.get("id")?.toString() ?? url.searchParams.get("id");
  const token = body?.get("token")?.toString() ?? url.searchParams.get("token");
  return { id, token };
}

/** GET shows confirmation only — scanners must not disable emails on prefetch. */
export async function GET(request: Request) {
  const { id, token } = readPauseParams(request);

  if (!id || !token || !verifyPauseToken(id, token)) {
    return invalidLinkResponse();
  }

  return new NextResponse(confirmHtml(id, token), {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

/** POST actually disables weekly emails after the user confirms. */
export async function POST(request: Request) {
  const body = await request.formData();
  const { id, token } = readPauseParams(request, body);

  if (!id || !token || !verifyPauseToken(id, token)) {
    return invalidLinkResponse();
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

  return new NextResponse(pausedHtml(), {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
