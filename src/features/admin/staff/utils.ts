const dateFormatter = new Intl.DateTimeFormat('en-NG', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat('en-NG', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export function formatStaffDate(value: string) {
  return dateFormatter.format(new Date(value));
}

export function formatStaffDateTime(value: string) {
  return dateTimeFormatter.format(new Date(value));
}

export function getStaffInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}
