import { createHmac, timingSafeEqual } from "node:crypto";

function secret(): string {
  // Prefer a dedicated secret so rotating CRON_SECRET does not invalidate
  // every pause link already sitting in users' inboxes (and vice versa).
  const value = process.env["WIK_EMAIL_TOKEN_SECRET"] || process.env["CRON_SECRET"];

  if (!value) {
    throw new Error("WIK_EMAIL_TOKEN_SECRET or CRON_SECRET must be configured.");
  }

  return value;
}

export function signPauseToken(preferenceId: string): string {
  return createHmac("sha256", secret()).update(`pause:${preferenceId}`).digest("hex");
}

export function verifyPauseToken(preferenceId: string, token: string): boolean {
  const expected = signPauseToken(preferenceId);
  const a = Buffer.from(expected);
  const b = Buffer.from(token);

  return a.length === b.length && timingSafeEqual(a, b);
}
