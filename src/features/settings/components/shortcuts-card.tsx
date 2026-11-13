import { Link } from 'react-router';
import {
  ArrowUpRightIcon,
  CreditCardIcon,
  FileScanIcon,
  ScaleIcon,
  UsersIcon,
  type LucideIcon,
} from 'lucide-react';

import { Can, useCan, type Permission } from '@/lib/rbac';

import { SettingsCard } from './settings-card';

interface Shortcut {
  label: string;
  to: string;
  permission: Permission;
  icon: LucideIcon;
}

const shortcuts: Shortcut[] = [
  { label: 'Staff', to: '/admin/staff', permission: 'staffView', icon: UsersIcon },
  {
    label: 'Payment accounts',
    to: '/admin/payment-accounts',
    permission: 'posAccountsView',
    icon: CreditCardIcon,
  },
  { label: 'Audit log', to: '/admin/audits', permission: 'auditView', icon: FileScanIcon },
  {
    label: 'Stock reconciliation',
    to: '/admin/stock-reconciliation',
    permission: 'stockReconcile',
    icon: ScaleIcon,
  },
];

function ShortcutLink({ label, to, icon: Icon }: Shortcut) {
  return (
    <Link
      to={to}
      className="border-border hover:bg-muted/50 flex items-center gap-3 rounded-md border px-3 py-2.5 text-sm font-medium transition-colors"
    >
      <Icon className="text-muted-foreground size-4" aria-hidden="true" />
      <span className="flex-1">{label}</span>
      <ArrowUpRightIcon className="text-muted-foreground size-3.5" aria-hidden="true" />
    </Link>
  );
}

export function ShortcutsCard() {
  const canSeeStaff = useCan('staffView');
  const canSeePaymentAccounts = useCan('posAccountsView');
  const canSeeAudits = useCan('auditView');
  const canSeeReconciliation = useCan('stockReconcile');

  const hasAny = canSeeStaff || canSeePaymentAccounts || canSeeAudits || canSeeReconciliation;

  if (!hasAny) return null;

  return (
    <SettingsCard title="Shortcuts" description="Jump to the other tools your role can use.">
      <div className="grid gap-2 sm:grid-cols-2">
        {shortcuts.map((shortcut) => (
          <Can key={shortcut.to} permission={shortcut.permission}>
            <ShortcutLink {...shortcut} />
          </Can>
        ))}
      </div>
    </SettingsCard>
  );
}
