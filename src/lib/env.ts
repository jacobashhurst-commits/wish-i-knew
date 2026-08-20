import { env as nodeEnv } from "node:process";

/**
 * Read a server env var at runtime via node:process.
 *
 * Next.js can replace `process.env` / `process.env.FOO` during the build.
 * Vercel "Sensitive" vars are unavailable at build time, so those inlines
 * become empty and stay empty even though the value exists at runtime.
 * Reading through `node:process` keeps a real runtime lookup.
 */
export function getServerEnv(name: string): string {
  const value = nodeEnv[name];
  return typeof value === "string" ? value.trim() : "";
}
