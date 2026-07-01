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

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim() && process.env.WIK_FROM_EMAIL?.trim());
}

export const PUBLIC_PATH_PREFIXES = [
  "/login",
  "/auth/callback",
  "/privacy",
  "/terms",
  "/disclaimer",
] as const;

export function isPublicPath(pathname: string): boolean {
  if (pathname.startsWith("/api/")) {
    return true;
  }

  return PUBLIC_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
