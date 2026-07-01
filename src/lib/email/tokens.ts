import { createHmac, timingSafeEqual } from "node:crypto";

function secret(): string {
  const value = process.env.CRON_SECRET;

  if (!value) {
    throw new Error("CRON_SECRET is not configured.");
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
