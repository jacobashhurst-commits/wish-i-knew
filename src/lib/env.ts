import { connection } from "next/server";
import { env as nodeEnv } from "node:process";

/**
 * Read email secrets at request time.
 *
 * Next.js 16 can inline `process.env.FOO` at build. Vercel "Sensitive" vars are
 * not available during build, so those inlines become empty. `connection()`
 * forces a runtime request context; we also fall back to node:process.
 */
export async function getEmailSecrets(): Promise<{
  apiKey: string;
  from: string;
}> {
  await connection();

  const apiKey =
    (typeof process.env.RESEND_API_KEY === "string" ? process.env.RESEND_API_KEY : "") ||
    (typeof nodeEnv.RESEND_API_KEY === "string" ? nodeEnv.RESEND_API_KEY : "") ||
    "";
  const from =
    (typeof process.env.WIK_FROM_EMAIL === "string" ? process.env.WIK_FROM_EMAIL : "") ||
    (typeof nodeEnv.WIK_FROM_EMAIL === "string" ? nodeEnv.WIK_FROM_EMAIL : "") ||
    "";

  return { apiKey: apiKey.trim(), from: from.trim() };
}

/** Generic runtime env read (prefer getEmailSecrets for Resend). */
export function getServerEnv(name: string): string {
  const value = nodeEnv[name];
  return typeof value === "string" ? value.trim() : "";
}
