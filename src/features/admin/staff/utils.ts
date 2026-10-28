const dateFormatter = new Intl.DateTimeFormat('en-US', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const longDateFormatter = new Intl.DateTimeFormat('en-US', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
});

export const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
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

export function formatTimestamp(timeStamp?: string) {
  const date = timeStamp ? new Date(timeStamp) : new Date();
  const now = new Date();

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  // Format hours and minutes
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const meridiem = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12 || 12; // handle 0 as 12

  const formattedTime = `${hours}:${minutes.toString().padStart(2, '0')}${meridiem}`;

  // Build the final string
  if (isToday) {
    return `Today, ${formattedTime}`;
  } else if (isYesterday) {
    return `Yesterday, ${formattedTime}`;
  } else {
    const formattedDate = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
    return `${formattedDate}, ${formattedTime}`;
  }
}
