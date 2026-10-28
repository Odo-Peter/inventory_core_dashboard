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
import { cn } from '@/lib/utils';

export type ConfirmAction = 'deactivate' | 'reactivate';

interface ConfirmActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action?: ConfirmAction;
  entityId: string | null;
  entityName?: string;
  entityLabel?: string;
  onConfirm: (id: string) => Promise<unknown>;
  onSuccess?: () => void;
  confirmText?: string;
  requireConfirmText?: boolean;
}

const ACTION_CONFIG = {
  deactivate: {
    title: (label: string) => `Deactivate ${label}`,
    description: (name: string) => (
      <>
        This will remove <b className="text-primary">{name}</b> and revoke any access tied to it.
        This action can be undone only by verified amins from the app.
      </>
    ),
    button: 'Deactivate',
    pending: 'Deactivating...',
    requireText: true,
  },
  reactivate: {
    title: (label: string) => `Reactivate ${label}`,
    description: (name: string) => (
      <>
        This will restore <b className="text-primary">{name}</b> and give back the access they had
        before.
      </>
    ),
    button: 'Reactivate',
    pending: 'Reactivating...',
    requireText: false,
  },
} as const;

export function ConfirmActionDialog({
  open,
  onOpenChange,
  action = 'deactivate',
  entityId,
  entityName,
  entityLabel = 'item',
  onConfirm,
  onSuccess,
  confirmText = 'DEACTIVATE',
  requireConfirmText,
}: ConfirmActionDialogProps) {
  const [isPending, setIsPending] = useState(false);
  const config = ACTION_CONFIG[action];
  const needsTyping = requireConfirmText ?? config.requireText;

  // Can't close while the request is in flight
  const handleOpenChange = (next: boolean) => {
    if (isPending) return;
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">{config.title(entityLabel)}</DialogTitle>
          <DialogDescription>
            {config.description(entityName ?? `this ${entityLabel}`)}
          </DialogDescription>
        </DialogHeader>

        {/* Mounted only while open, so the typed text resets every time */}
        {open && entityId && (
          <ConfirmForm
            key={`${action}-${entityId}`}
            action={action}
            entityId={entityId}
            confirmText={confirmText}
            needsTyping={needsTyping}
            confirmButtonLabel={config.button}
            pendingLabel={config.pending}
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
  action: ConfirmAction;
  entityId: string;
  confirmText: string;
  needsTyping: boolean;
  confirmButtonLabel: string;
  pendingLabel: string;
  isPending: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}

function ConfirmForm({
  action,
  entityId,
  confirmText,
  needsTyping,
  confirmButtonLabel,
  pendingLabel,
  isPending,
  onCancel,
  onSubmit,
}: ConfirmFormProps) {
  const [value, setValue] = useState('');
  const canConfirm = (!needsTyping || value === confirmText) && !isPending;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (canConfirm) onSubmit();
      }}
      className="flex flex-col gap-4"
    >
      {needsTyping && (
        <Input
          htmlFor={`confirm-${action}-${entityId}`}
          label={`Type ${confirmText} to confirm`}
          placeholder="Enter text..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          disabled={isPending}
        />
      )}

      <DialogFooter className="mx-0 mb-0 border-t-0 bg-transparent p-0">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant={action === 'deactivate' ? 'destructive' : 'default'}
          className={cn(action === 'reactivate' && 'bg-green-600 text-white hover:bg-green-700')}
          disabled={!canConfirm}
        >
          {isPending ? (
            <span className="inline-flex items-center gap-2">
              <Spinner className="h-3.5 w-3.5" />
              {pendingLabel}
            </span>
          ) : (
            confirmButtonLabel
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}
