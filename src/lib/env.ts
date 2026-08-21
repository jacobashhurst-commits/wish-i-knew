/**
 * Email secrets for Resend.
 *
 * Use static `process.env.NAME` access. Next.js 16 + Turbopack leave dynamic
 * lookups (`process.env[name]`, globalThis) empty even when Encrypted vars are
 * present on the Vercel deployment.
 */
export async function getEmailSecrets(): Promise<{
  apiKey: string;
  from: string;
}> {
  return {
    apiKey: process.env.RESEND_API_KEY?.trim() ?? "",
    from: process.env.WIK_FROM_EMAIL?.trim() ?? "",
  };
}

export function getServerEnv(name: "RESEND_API_KEY" | "WIK_FROM_EMAIL" | "CRON_SECRET" | "SUPABASE_SERVICE_ROLE_KEY" | "WIK_EMAIL_TOKEN_SECRET"): string {
  switch (name) {
    case "RESEND_API_KEY":
      return process.env.RESEND_API_KEY?.trim() ?? "";
    case "WIK_FROM_EMAIL":
      return process.env.WIK_FROM_EMAIL?.trim() ?? "";
    case "CRON_SECRET":
      return process.env.CRON_SECRET?.trim() ?? "";
    case "SUPABASE_SERVICE_ROLE_KEY":
      return process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
    case "WIK_EMAIL_TOKEN_SECRET":
      return process.env.WIK_EMAIL_TOKEN_SECRET?.trim() ?? "";
    default:
      return "";
  }
}
