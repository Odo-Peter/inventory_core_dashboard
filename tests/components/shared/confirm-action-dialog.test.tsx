import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toast } from 'sonner';
import { describe, expect, it, vi } from 'vitest';

import { ConfirmActionDialog, type ConfirmAction } from '@/components/shared/confirm-action-dialog';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

interface RenderDialogOptions {
  action?: ConfirmAction;
  entityId?: string | null;
  entityName?: string;
  onConfirm?: (id: string) => Promise<unknown>;
  onSuccess?: () => void;
  onOpenChange?: (open: boolean) => void;
  requireConfirmText?: boolean;
}

function renderDialog({
  action = 'deactivate',
  entityId = 'item-1',
  entityName = 'Coca-Cola 50cl',
  onConfirm = vi.fn().mockResolvedValue(undefined),
  onSuccess = vi.fn(),
  onOpenChange = vi.fn(),
  requireConfirmText,
}: RenderDialogOptions = {}) {
  const view = render(
    <ConfirmActionDialog
      open
      action={action}
      entityId={entityId}
      entityName={entityName}
      onConfirm={onConfirm}
      onSuccess={onSuccess}
      onOpenChange={onOpenChange}
      requireConfirmText={requireConfirmText}
    />,
  );

  return { ...view, onConfirm, onSuccess, onOpenChange };
}

describe('ConfirmActionDialog', () => {
  it('requires typing the confirmation text before deactivating', async () => {
    const user = userEvent.setup();
    renderDialog();

    const dialog = screen.getByRole('dialog', { name: 'Deactivate item' });
    expect(within(dialog).getByText(/This will deactivate/)).toBeInTheDocument();
    expect(within(dialog).getByText('Coca-Cola 50cl')).toBeInTheDocument();

    const confirmButton = within(dialog).getByRole('button', { name: 'Deactivate' });
    expect(confirmButton).toBeDisabled();

    const input = within(dialog).getByLabelText('Type DEACTIVATE to confirm');
    await user.type(input, 'DEACTIVAT');
    expect(confirmButton).toBeDisabled();

    await user.type(input, 'E');
    expect(confirmButton).toBeEnabled();
  });

  it('calls onConfirm, onSuccess, and closes after a successful deactivation', async () => {
    const user = userEvent.setup();
    const { onConfirm, onSuccess, onOpenChange } = renderDialog();

    const dialog = screen.getByRole('dialog', { name: 'Deactivate item' });
    await user.type(within(dialog).getByLabelText('Type DEACTIVATE to confirm'), 'DEACTIVATE');
    await user.click(within(dialog).getByRole('button', { name: 'Deactivate' }));

    await waitFor(() => expect(onConfirm).toHaveBeenCalledWith('item-1'));
    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('does not require typing for reactivation', async () => {
    const user = userEvent.setup();
    const { onConfirm, onSuccess } = renderDialog({
      action: 'reactivate',
      entityName: 'Fanta Orange 50cl',
    });

    const dialog = screen.getByRole('dialog', { name: 'Reactivate item' });
    expect(within(dialog).getByText(/This will reactivate/)).toBeInTheDocument();
    expect(within(dialog).getByText('Fanta Orange 50cl')).toBeInTheDocument();
    expect(within(dialog).queryByRole('textbox')).not.toBeInTheDocument();

    const confirmButton = within(dialog).getByRole('button', { name: 'Reactivate' });
    expect(confirmButton).toBeEnabled();

    await user.click(confirmButton);

    await waitFor(() => expect(onConfirm).toHaveBeenCalledWith('item-1'));
    expect(onSuccess).toHaveBeenCalledTimes(1);
  });

  it('keeps the dialog open and reports an error when confirmation fails', async () => {
    const user = userEvent.setup();
    const { onConfirm, onSuccess, onOpenChange } = renderDialog({
      onConfirm: vi.fn().mockRejectedValue(new Error('Item is in use')),
    });

    const dialog = screen.getByRole('dialog', { name: 'Deactivate item' });
    await user.type(within(dialog).getByLabelText('Type DEACTIVATE to confirm'), 'DEACTIVATE');
    await user.click(within(dialog).getByRole('button', { name: 'Deactivate' }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Item is in use'));
    expect(onConfirm).toHaveBeenCalledWith('item-1');
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: 'Deactivate item' })).toBeInTheDocument();
  });

  it('shows a pending state and blocks closing while the request is in flight', async () => {
    const user = userEvent.setup();
    let resolveConfirm: (value: unknown) => void = () => {};
    const onConfirm = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveConfirm = resolve;
        }),
    );
    const { onOpenChange } = renderDialog({ onConfirm });

    const dialog = screen.getByRole('dialog', { name: 'Deactivate item' });
    await user.type(within(dialog).getByLabelText('Type DEACTIVATE to confirm'), 'DEACTIVATE');
    await user.click(within(dialog).getByRole('button', { name: 'Deactivate' }));

    expect(await within(dialog).findByText('Deactivating...')).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: /Deactivating/ })).toBeDisabled();
    expect(within(dialog).getByRole('button', { name: 'Cancel' })).toBeDisabled();

    await user.keyboard('{Escape}');
    expect(onOpenChange).not.toHaveBeenCalled();

    resolveConfirm(undefined);

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it('cancels without confirming', async () => {
    const user = userEvent.setup();
    const { onConfirm, onOpenChange } = renderDialog();

    const dialog = screen.getByRole('dialog', { name: 'Deactivate item' });
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    expect(onConfirm).not.toHaveBeenCalled();
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('falls back to a generic error message for non-Error rejections', async () => {
    const user = userEvent.setup();
    renderDialog({
      action: 'reactivate',
      onConfirm: vi.fn().mockRejectedValue('nope'),
    });

    const dialog = screen.getByRole('dialog', { name: 'Reactivate item' });
    await user.click(within(dialog).getByRole('button', { name: 'Reactivate' }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Something went wrong'));
  });

  it('does not render the form until an entity id is available', () => {
    renderDialog({ entityId: null });

    expect(screen.getByRole('dialog', { name: 'Deactivate item' })).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Deactivate' })).not.toBeInTheDocument();
  });
});
