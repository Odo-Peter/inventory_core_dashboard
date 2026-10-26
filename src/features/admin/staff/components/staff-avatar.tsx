import { cn } from 'cn';

import { getStaffInitials } from '../utils';

interface StaffAvatarProps {
  firstName: string;
  lastName: string;
  size?: 'sm' | 'lg';
  className?: string;
}

export function StaffAvatar({ firstName, lastName, size = 'sm', className }: StaffAvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'bg-muted text-muted-foreground flex shrink-0 items-center justify-center rounded-full font-medium',
        size === 'sm' ? 'size-8 text-[11px]' : 'size-14 text-lg',
        className,
      )}
    >
      {getStaffInitials(firstName, lastName)}
    </span>
  );
}
