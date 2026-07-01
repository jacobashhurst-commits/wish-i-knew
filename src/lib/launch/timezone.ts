const FALLBACK_TIMEZONE = "Australia/Sydney";

export function resolveBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || FALLBACK_TIMEZONE;
  } catch {
    return FALLBACK_TIMEZONE;
  }
}

/** Store lookahead times on the hour so they match hourly cron runs. */
export function normalizeLookaheadTime(value: string): string {
  const match = value.match(/^(\d{1,2})/);

  if (!match) {
    return "08:00:00";
  }

  const hour = Math.min(23, Math.max(0, Number(match[1])));
  return `${String(hour).padStart(2, "0")}:00:00`;
}

export function lookaheadTimeForUi(value: string | null | undefined): string {
  if (!value) {
    return "08:00";
  }

  return value.slice(0, 5);
}
