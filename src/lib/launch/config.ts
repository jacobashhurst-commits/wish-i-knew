import { getEmailSecrets } from "@/lib/env";

export function isAuthRequired(): boolean {
  const flag = process.env.WIK_REQUIRE_AUTH?.trim().toLowerCase();

  if (flag === "false" || flag === "0") {
    return false;
  }

  if (flag === "true" || flag === "1") {
    return true;
  }

  return process.env.NODE_ENV === "production";
}

export function isBetaInviteOnly(): boolean {
  const flag = process.env.WIK_BETA_INVITE_ONLY?.trim().toLowerCase();
  return flag === "true" || flag === "1";
}

export async function isEmailConfigured(): Promise<boolean> {
  const { apiKey, from } = await getEmailSecrets();
  return Boolean(apiKey && from);
}

export const PUBLIC_PATH_PREFIXES = [
  "/login",
  "/auth/callback",
  "/privacy",
  "/terms",
  "/disclaimer",
  // API routes are NOT public by default. Each entry here must carry its own
  // auth (CRON_SECRET header or signed token) - add new routes deliberately.
  "/api/cron/weekly-lookahead",
  "/api/cron/keepalive",
  "/api/cron/smoke-email",
  "/api/cron/env-check",
  "/api/lookahead/pause",
] as const;

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
