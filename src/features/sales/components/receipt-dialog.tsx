import { PrinterIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

import type { ReceiptResponse } from '../types';
import { ReceiptView } from './receipt-view';

interface ReceiptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  receipt: ReceiptResponse | null;
  onNewSale?: () => void;
}

export function ReceiptDialog({ open, onOpenChange, receipt, onNewSale }: ReceiptDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Receipt</DialogTitle>
          <DialogDescription>
            The sale is recorded. Print the receipt for the customer.
          </DialogDescription>
        </DialogHeader>

        {receipt ? <ReceiptView receipt={receipt} /> : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              onNewSale?.();
            }}
          >
            New sale
          </Button>
          <Button type="button" onClick={() => window.print()} disabled={!receipt}>
            <PrinterIcon />
            Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
