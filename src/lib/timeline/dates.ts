const millisecondsPerDay = 1000 * 60 * 60 * 24;
const pregnancyLengthWeeks = 40;

export function toUtcDateOnly(value: string | Date): Date {
  const date = typeof value === "string" ? new Date(`${value}T00:00:00Z`) : value;

  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

export function daysBetween(start: string | Date, end: string | Date): number {
  const startDate = toUtcDateOnly(start);
  const endDate = toUtcDateOnly(end);

  return Math.floor((endDate.getTime() - startDate.getTime()) / millisecondsPerDay);
}

export function calculateAgeInDays(
  birthDate: string | Date,
  currentDate: string | Date,
): number {
  return Math.max(0, daysBetween(birthDate, currentDate));
}

export function calculatePregnancyWeek(
  dueDate: string | Date,
  currentDate: string | Date,
): number {
  const daysUntilDue = daysBetween(currentDate, dueDate);
  const daysPregnant = pregnancyLengthWeeks * 7 - daysUntilDue;

  return Math.max(1, Math.floor(daysPregnant / 7) + 1);
}
