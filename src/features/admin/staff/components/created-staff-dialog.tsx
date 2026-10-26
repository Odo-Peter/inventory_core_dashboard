import { useEffect, useRef, useState } from 'react';
import { CheckIcon, CopyIcon } from 'lucide-react';
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

export interface CreatedStaffInfo {
  name: string;
  staff_code: string;
  temporary_pin: string;
}

interface CreatedStaffDialogProps {
  open: boolean;
  onClose: () => void;
  staff: CreatedStaffInfo | null;
}

function CopyRow({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  const [copied, setCopied] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timeout.current), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      clearTimeout(timeout.current);
      timeout.current = setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error('Could not copy. Select the text and copy it manually.');
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5">
      <div className="min-w-0">
        <p className="text-muted-foreground text-[11px] tracking-wide uppercase">{label}</p>
        <p
          className={
            mono ? 'truncate font-mono text-sm font-medium' : 'truncate text-sm font-medium'
          }
        >
          {value}
        </p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={copy}
        aria-label={copied ? `${label} copied` : `Copy ${label.toLowerCase()}`}
      >
        {copied ? <CheckIcon className="size-4 text-green-600" /> : <CopyIcon className="size-4" />}
      </Button>
    </div>
  );
}

export function CreatedStaffDialog({ open, staff, onClose }: CreatedStaffDialogProps) {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" showCloseButton={false}>
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Staff account created</DialogTitle>
          <DialogDescription>
            Share these login details with the new staff member. The temporary PIN is shown only
            once, and they will be asked to change it at first sign in.
          </DialogDescription>
        </DialogHeader>

        {staff && (
          <div className="flex flex-col gap-2">
            <CopyRow label="Name" value={staff.name} />
            <CopyRow label="Staff code" value={staff.staff_code} mono />
            <CopyRow label="Temporary PIN" value={staff.temporary_pin} mono />
          </div>
        )}

        <DialogFooter>
          <Button type="button" onClick={onClose}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
