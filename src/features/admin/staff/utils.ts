const dateFormatter = new Intl.DateTimeFormat('en-NG', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const longDateFormatter = new Intl.DateTimeFormat('en-NG', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
});

export const dateTimeFormatter = new Intl.DateTimeFormat('en-NG', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export function formatStaffDate(value: string, isLong?: boolean) {
  return isLong ? longDateFormatter.format(new Date(value)) : dateFormatter.format(new Date(value));
}

export function formatStaffDateTime(value: string) {
  return dateTimeFormatter.format(new Date(value));
}

export function getStaffInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

const timeFormatter = new Intl.DateTimeFormat('en-US', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
});

const nairaFormatter = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  minimumFractionDigits: 2,
});

export function formatTime(value: string) {
  return timeFormatter.format(new Date(value));
}

export function formatNaira(kobo: number) {
  return nairaFormatter.format(kobo / 100);
}
