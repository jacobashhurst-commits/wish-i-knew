/** Shared auth cookie defaults — long-lived so magic link is not needed every visit. */
export const authCookieOptions = {
  path: "/",
  sameSite: "lax" as const,
  // Browsers cap around 400 days; keep session cookies until Auth revokes the refresh token.
  maxAge: 60 * 60 * 24 * 400,
};
