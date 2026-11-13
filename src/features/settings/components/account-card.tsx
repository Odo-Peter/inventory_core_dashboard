import { StaffRoleBadge } from '@/features/admin/staff/components/staff-badges';
import { useAuth } from '@/features/auth/hooks/useAuth';

import { DetailGrid, DetailRow, SettingsCard } from './settings-card';

interface AccountCardProps {
  storeName?: string;
}

export function AccountCard({ storeName }: AccountCardProps) {
  const { staff } = useAuth();

  const name = staff?.name;
  const staffCode = staff?.staff_code;
  const store = staff?.store_name ?? storeName;

  return (
    <SettingsCard title="My account" description="Your staff profile at this store.">
      <DetailGrid>
        <DetailRow label="Name">{name || '—'}</DetailRow>
        <DetailRow label="Staff code">{staffCode || '—'}</DetailRow>
        <DetailRow label="Role">{staff ? <StaffRoleBadge role={staff.role} /> : '—'}</DetailRow>
        <DetailRow label="Store">{store || '—'}</DetailRow>
      </DetailGrid>
    </SettingsCard>
  );
}
