import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/form/input';
import { Spinner } from '@/components/ui/spinner';

interface ConfirmDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Id passed back to onConfirm */
  entityId: string | null;
  /** Human-readable name shown in the copy, e.g. "Micheal Baraka" */
  entityName?: string;
  /** Entity type, e.g. "staff member", "product" */
  entityLabel?: string;
  /** Calls the deactivate endpoint; throw/reject to show an error */
  onConfirm: (id: string) => Promise<unknown>;
  onSuccess?: () => void;
  /** Word the admin must type, case-sensitive */
  confirmText?: string;
  confirmButtonLabel?: string;
}

export function ConfirmDeleteDialog({
  open,
  onOpenChange,
  entityId,
  entityName,
  entityLabel = 'item',
  onConfirm,
  onSuccess,
  confirmText = 'DELETE',
  confirmButtonLabel = 'Delete',
}: ConfirmDeleteDialogProps) {
  const [isPending, setIsPending] = useState(false);

  // Can't close while the request is in flight
  const handleOpenChange = (next: boolean) => {
    if (isPending) return;
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Delete {entityLabel}</DialogTitle>
          <DialogDescription>
            This will remove <b className="text-primary">{entityName ?? `this ${entityLabel}`}</b>{' '}
            and revoke any access tied to it. This action cannot be undone from the app.
          </DialogDescription>
        </DialogHeader>

        {/* Mounted only while open, so the typed text resets every time */}
        {open && entityId && (
          <ConfirmForm
            entityId={entityId}
            confirmText={confirmText}
            confirmButtonLabel={confirmButtonLabel}
            isPending={isPending}
            onCancel={() => handleOpenChange(false)}
            onSubmit={async () => {
              setIsPending(true);
              try {
                await onConfirm(entityId);
                onSuccess?.();
                onOpenChange(false);
              } catch (error) {
                toast.error(error instanceof Error ? error.message : 'Something went wrong');
              } finally {
                setIsPending(false);
              }
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

interface ConfirmFormProps {
  entityId: string;
  confirmText: string;
  confirmButtonLabel: string;
  isPending: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}

function ConfirmForm({
  entityId,
  confirmText,
  confirmButtonLabel,
  isPending,
  onCancel,
  onSubmit,
}: ConfirmFormProps) {
  const [value, setValue] = useState('');
  const canConfirm = value === confirmText && !isPending;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (canConfirm) onSubmit();
      }}
      className="flex flex-col gap-4"
    >
      <Input
        htmlFor={`confirm-delete-${entityId}`}
        label={`Type ${confirmText} to confirm`}
        placeholder="Confirm delete...."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        disabled={isPending}
        error
      />

      <DialogFooter className="mx-0 mb-0 border-t-0 bg-transparent p-0">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" variant="destructive" disabled={!canConfirm}>
          {isPending ? (
            <span className="inline-flex items-center gap-2">
              <Spinner className="h-3.5 w-3.5" />
              Deleting...
            </span>
          ) : (
            confirmButtonLabel
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}
