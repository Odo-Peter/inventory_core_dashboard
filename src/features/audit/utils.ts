const actionLabelMap: Record<string, string> = {
  'staff.create': 'Staff created',
  'staff.created': 'Staff created',
  'staff.deactivate': 'Staff deactivated',
  'staff.deactivated': 'Staff deactivated',
  'staff.reactivate': 'Staff reactivated',
  'staff.reactivated': 'Staff reactivated',
  'pin.reset': 'PIN reset',
  'staff.pin_reset': 'PIN reset',
  'auth.failed_login': 'Failed sign-in',
  'auth.sign_in_failed': 'Failed sign-in',
  'auth.login_failed': 'Failed sign-in',
  'shift.start': 'Shift started',
  'shift.started': 'Shift started',
  'shift.open': 'Shift started',
  'shift.close': 'Shift closed',
  'shift.closed': 'Shift closed',
  'shift.force_close': 'Shift force closed',
  'shift.force_closed': 'Shift force closed',
};

export function formatAuditAction(action: string): string {
  if (!action) return 'Unknown action';
  if (actionLabelMap[action]) {
    return actionLabelMap[action];
  }
  const normalized = action.replace(/[._-]+/g, ' ');
  return normalized
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function humanizeKey(key: string): string {
  if (!key) return key;
  return key
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(' ')
    .filter(Boolean)
    .map((part, index) => (index === 0 ? part.charAt(0).toUpperCase() + part.slice(1) : part))
    .join(' ');
}

export function truncateId(id: string, length = 8): string {
  if (!id) return 'n/a';
  if (id.length <= length) return id;
  return id.slice(0, length);
}

export function isValidUuid(value: string): boolean {
  if (!value) return true;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}
