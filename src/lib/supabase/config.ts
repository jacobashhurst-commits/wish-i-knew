export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function getSupabaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  // Allow pasting the REST URL by mistake  -  strip /rest/v1 suffix.
  return raw.replace(/\/rest\/v1\/?$/, "");
}

export function getSupabaseAnonKey(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
}

function isUsableSiteUrl(value: string): boolean {
  if (!value) return false;
  if (value.includes("placeholder.vercel.app")) return false;
  if (value.includes("127.0.0.1") || value.includes("localhost")) {
    // Localhost is fine for local dev only.
    return process.env.NODE_ENV !== "production" && process.env.VERCEL_ENV !== "production";
  }
  return value.startsWith("http://") || value.startsWith("https://");
}

/**
 * Canonical public site URL for emails, auth redirects, and absolute asset links.
 * Never fall back to placeholder.vercel.app (that shows as a paused deployment).
 */
export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? "";
  if (isUsableSiteUrl(configured)) {
    return configured.replace(/\/$/, "");
  }

  const vercelProduction = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercelProduction) {
    const host = vercelProduction.replace(/^https?:\/\//, "").replace(/\/$/, "");
    return `https://${host}`;
  }

  if (process.env.VERCEL_URL?.trim()) {
    return `https://${process.env.VERCEL_URL.trim().replace(/\/$/, "")}`;
  }

  return "https://wish-i-knew.vercel.app";
}
