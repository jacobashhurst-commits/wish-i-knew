const FALLBACK_TIMEZONE = "Australia/Sydney";

/** Fixed send clock time (~8am Sydney when the daily cron runs). Day-of-week is the only user choice. */
export const LOOKAHEAD_SEND_TIME = "08:00:00";
export const LOOKAHEAD_SEND_TIME_UI = "08:00";

export function resolveBrowserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || FALLBACK_TIMEZONE;
  } catch {
    return FALLBACK_TIMEZONE;
  }
}

/** Normalise a time string to HH:00:00; defaults to the fixed Lookahead send time. */
export function normalizeLookaheadTime(value: string): string {
  const match = value.match(/^(\d{1,2})/);

  if (!match) {
    return LOOKAHEAD_SEND_TIME;
  }

  const hour = Math.min(23, Math.max(0, Number(match[1])));
  return `${String(hour).padStart(2, "0")}:00:00`;
}

export function lookaheadTimeForUi(value: string | null | undefined): string {
  if (!value) {
    return LOOKAHEAD_SEND_TIME_UI;
  }

  return value.slice(0, 5);
}
