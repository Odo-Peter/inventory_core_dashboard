import { useState } from 'react';

import { StaffRoleBadge } from '@/features/admin/staff/components/staff-badges';
import { ChangePinDialog } from '@/features/auth/components/change-pin-dialog';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { Button } from '@/components/ui/button';

import { DetailGrid, DetailRow, SettingsCard } from './settings-card';

interface AccountCardProps {
  storeName?: string;
}

export function AccountCard({ storeName }: AccountCardProps) {
  const { staff } = useAuth();
  const [changePinOpen, setChangePinOpen] = useState(false);

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

      <div className="mt-4 flex justify-end">
        <Button type="button" variant="outline" onClick={() => setChangePinOpen(true)}>
          Change PIN
        </Button>
      </div>

      <ChangePinDialog
        open={changePinOpen}
        onOpenChange={setChangePinOpen}
        allowClose
        description="Enter your current PIN and choose a new one."
        onSuccess={() => setChangePinOpen(false)}
      />
    </SettingsCard>
  );
}
