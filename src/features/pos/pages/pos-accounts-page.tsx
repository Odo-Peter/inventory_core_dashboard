import { useCallback, useMemo, useState } from 'react';
import { PlusIcon } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/page-header';
import { ConfirmActionDialog, type ConfirmAction } from '@/components/shared/confirm-action-dialog';

import { PosAccountDetailsDrawer } from '../components/pos-account-details-drawer';
import { PosAccountFormDrawer } from '../components/pos-account-form-drawer';
import { PosAccountTable } from '../components/pos-account-table';
import { getPosAccountColumns } from '../components/pos-account-columns';

import type { PosAccount } from '../types';
import { useListPosAccounts } from '../hooks/usePosQueries';
import { useDeactivatePosAccount } from '../hooks/usePosMutations';

type FormMode = 'add' | 'edit';

export function PosAccountsPage() {
  const [formOpen, setFormOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>('add');

  const [selectedAccount, setSelectedAccount] = useState<PosAccount | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<{
    account: PosAccount;
    action: ConfirmAction;
  } | null>(null);

  const { data, isLoading } = useListPosAccounts();
  const deactivateAccount = useDeactivatePosAccount();

  const requestDeactivate = useCallback(
    (account: PosAccount) => setConfirmTarget({ account, action: 'deactivate' }),
    [],
  );

  const openEditAccount = useCallback((account: PosAccount) => {
    setFormMode('edit');
    setSelectedAccount(account);
    setFormOpen(true);
  }, []);

  const openAccountDetails = useCallback((account: PosAccount) => {
    setSelectedAccount(account);
    setDetailsOpen(true);
  }, []);

  const openAddAccount = () => {
    setFormMode('add');
    setSelectedAccount(null);
    setFormOpen(true);
  };

  const columns = useMemo(
    () =>
      getPosAccountColumns({
        onView: openAccountDetails,
        onEdit: openEditAccount,
        onDeactivate: requestDeactivate,
      }),
    [openAccountDetails, openEditAccount, requestDeactivate],
  );

  const accounts = useMemo(() => data?.data ?? [], [data]);
  const activeCount = accounts.filter((a) => a.active).length;

  const description = `${accounts.length} ${accounts.length === 1 ? 'account' : 'accounts'} · ${activeCount} active`;

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="POS Accounts"
        description="Manage POS terminals and payment accounts."
        actions={
          <Button onClick={openAddAccount}>
            <PlusIcon data-icon="inline-start" />
            Add POS Account
          </Button>
        }
      />

      <ConfirmActionDialog
        open={!!confirmTarget}
        onOpenChange={(open) => !open && setConfirmTarget(null)}
        action={confirmTarget?.action}
        entityId={confirmTarget?.account.id ?? null}
        entityName={confirmTarget?.account.label}
        entityLabel="POS account"
        onConfirm={(id) => deactivateAccount.mutateAsync(id)}
        onSuccess={() => toast.success('POS account deactivated')}
      />

      <PosAccountTable
        columns={columns}
        accounts={accounts}
        description={description}
        isLoading={isLoading}
      />

      <PosAccountFormDrawer
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        account={selectedAccount}
      />

      <PosAccountDetailsDrawer
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        account={selectedAccount}
      />
    </div>
  );
}
