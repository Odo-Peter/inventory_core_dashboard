import { Badge } from '@/components/ui/badge';

import { staffRoleLabels, type StaffRole } from '../types';

const roleVariants: Record<StaffRole, 'default' | 'secondary' | 'outline'> = {
  cashier: 'outline',
  manager: 'secondary',
  admin: 'default',
};

export function StaffRoleBadge({ role }: { role: StaffRole }) {
  return <Badge variant={roleVariants[role]}>{staffRoleLabels[role]}</Badge>;
}

export function StaffStatusBadges({ active, isLocked }: { active: boolean; isLocked: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      <Badge variant={active ? 'success' : 'inactive'}>{active ? 'Active' : 'Inactive'}</Badge>
      {isLocked ? <Badge variant="destructive">Locked</Badge> : null}
    </div>
  );
}
