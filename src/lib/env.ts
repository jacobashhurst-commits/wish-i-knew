/**
 * Read a server env var at runtime.
 *
 * Prefer bracket access for secrets: Vercel "Sensitive" vars are unavailable at
 * build time, and Next.js can inline `process.env.FOO` to `undefined` during
 * `next build`, which then sticks even after the var exists at runtime.
 */
export function getServerEnv(name: string): string {
  return process.env[name]?.trim() ?? "";
}
