import { connection } from "next/server";

/**
 * Read env at request time without Next statically inlining the value.
 *
 * Vercel "Sensitive" vars are unavailable at build time. If the bundler
 * replaces `process.env.RESEND_API_KEY` during `next build`, it bakes in an
 * empty string forever. Looking up through globalThis.process keeps a real
 * runtime read on the Node serverless runtime.
 */
function readRuntimeEnv(name: string): string {
  const env = (
    globalThis as typeof globalThis & {
      process?: { env?: Record<string, string | undefined> };
    }
  ).process?.env;
  const value = env?.[name];
  return typeof value === "string" ? value.trim() : "";
}

export async function getEmailSecrets(): Promise<{
  apiKey: string;
  from: string;
}> {
  await connection();
  return {
    apiKey: readRuntimeEnv("RESEND_API_KEY"),
    from: readRuntimeEnv("WIK_FROM_EMAIL"),
  };
}

export function getServerEnv(name: string): string {
  return readRuntimeEnv(name);
}
