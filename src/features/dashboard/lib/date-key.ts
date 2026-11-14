const WEEKDAY_FORMATTER = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  timeZone: 'UTC',
});

/** Build a UTC date from an API `YYYY-MM-DD` key without a local-zone shift. */
export function parseDateKey(dateKey: string): Date {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

/** Short weekday for an API date key, formatted in UTC so the day never shifts. */
export function formatDateKey(dateKey: string): string {
  const date = parseDateKey(dateKey);
  return Number.isNaN(date.getTime()) ? dateKey : WEEKDAY_FORMATTER.format(date);
}
