import { calculateAgeInDays, calculatePregnancyWeek, daysBetween, toUtcDateOnly } from "@/lib/timeline/dates";
import type { TimelineProfile } from "@/lib/timeline/types";

const pregnancyLengthWeeks = 40;
const millisecondsPerDay = 1000 * 60 * 60 * 24;

/** ISO date (UTC) midway through pregnancy week `week` for a given due date. */
export function dateForPregnancyWeek(dueDate: string, week: number): string {
  const clampedWeek = Math.max(1, Math.min(pregnancyLengthWeeks, week));
  const daysPregnant = (clampedWeek - 1) * 7 + 3;
  const daysUntilDue = pregnancyLengthWeeks * 7 - daysPregnant;
  const due = toUtcDateOnly(dueDate);
  const current = new Date(due.getTime() - daysUntilDue * millisecondsPerDay);

  return current.toISOString().slice(0, 10);
}

/** ISO date midway through baby week `week` (week 1 = days 0–6) since birth. */
export function dateForBabyWeek(birthDate: string, week: number): string {
  const clampedWeek = Math.max(1, week);
  const ageInDays = (clampedWeek - 1) * 7 + 3;
  const birth = toUtcDateOnly(birthDate);
  const current = new Date(birth.getTime() + ageInDays * millisecondsPerDay);

  return current.toISOString().slice(0, 10);
}

export function formatWeekContext(profile: Pick<
  TimelineProfile,
  "currentDate" | "birthDate" | "dueDate" | "isBorn"
>): string {
  if (profile.isBorn && profile.birthDate) {
    const ageInDays = calculateAgeInDays(profile.birthDate, profile.currentDate);
    const babyWeek = Math.floor(ageInDays / 7) + 1;
    return `Baby week ${babyWeek} · Day ${ageInDays} since birth · ${profile.currentDate}`;
  }

  if (!profile.isBorn && profile.dueDate) {
    const pregnancyWeek = calculatePregnancyWeek(profile.dueDate, profile.currentDate);
    const daysUntilDue = daysBetween(profile.currentDate, profile.dueDate);
    return `Pregnancy week ${pregnancyWeek} · ${daysUntilDue} days until due · ${profile.currentDate}`;
  }

  return profile.currentDate;
}
