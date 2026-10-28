import { useEffect, useRef, useState } from 'react';
import { CheckIcon, CopyIcon } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

import { StaffAvatar } from '@/features/admin/staff/components/staff-avatar';
import { StaffRoleBadge } from '@/features/admin/staff/components/staff-badges';
import { dateTimeFormatter } from '@/features/admin/staff/utils';

import type { AuditLog } from '../types';
import { formatAuditAction, humanizeKey } from '../utils';

interface AuditDetailsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event?: AuditLog | null;
}

function DetailItem({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-muted-foreground text-[11px] font-medium tracking-wide uppercase">
        {label}
      </dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

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
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={copy}
      aria-label={copied ? `${label} copied` : `Copy ${label.toLowerCase()}`}
    >
      {copied ? <CheckIcon className="size-4 text-green-600" /> : <CopyIcon className="size-4" />}
    </Button>
  );
}

/** Coerce entity_id (string | number | object) to a displayable string */
function formatEntityId(entityId: AuditLog['entity_id']): string | null {
  if (entityId == null) return null;
  if (typeof entityId === 'string' || typeof entityId === 'number') {
    return String(entityId);
  }
  // object / unexpected shape
  try {
    return JSON.stringify(entityId);
  } catch {
    return String(entityId);
  }
}

function renderDetails(details: Record<string, unknown> | null | undefined) {
  if (!details || Object.keys(details).length === 0) {
    return <p className="text-muted-foreground text-sm">No additional details recorded</p>;
  }

  const entries = Object.entries(details);

  return (
    <div className="flex flex-col gap-2">
      {entries.map(([key, value]) => {
        if (value === null || value === undefined) {
          return (
            <div key={key} className="flex items-start justify-between gap-2">
              <p className="text-muted-foreground text-xs">{humanizeKey(key)}</p>
              <p className="text-sm">—</p>
            </div>
          );
        }
        if (typeof value === 'object') {
          return (
            <div key={key} className="flex flex-col gap-1">
              <p className="text-muted-foreground text-xs">{humanizeKey(key)}</p>
              <pre className="bg-muted/40 overflow-x-auto rounded-md p-2 font-mono text-xs">
                {JSON.stringify(value, null, 2)}
              </pre>
            </div>
          );
        }
        return (
          <div key={key} className="flex items-start justify-between gap-2">
            <p className="text-muted-foreground text-xs">{humanizeKey(key)}</p>
            <p className="text-right text-sm break-all">{String(value)}</p>
          </div>
        );
      })}
    </div>
  );
}

export function AuditDetailsDrawer({ open, onOpenChange, event }: AuditDetailsDrawerProps) {
  if (!event) return null;

  const actionLabel = formatAuditAction(event.action);
  const createdDate = new Date(event.created_at);
  const localTime = dateTimeFormatter.format(createdDate);
  const entityIdDisplay = formatEntityId(event.entity_id);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b p-4 pr-12">
          <SheetTitle className="font-semibold">Audit event details</SheetTitle>
          <SheetDescription>Read-only record of this event.</SheetDescription>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {/* Summary — id, action, created_at */}
          <section className="rounded-lg border">
            <h3 className="border-b px-3 py-2 text-xs font-medium">Summary</h3>
            <dl className="grid grid-cols-1 gap-3 p-3">
              <DetailItem label="Action">
                <div className="flex flex-col">
                  <span>{actionLabel}</span>
                  <span className="text-muted-foreground font-mono text-xs">{event.action}</span>
                </div>
              </DetailItem>
              <DetailItem label="Time">
                <div className="flex flex-col">
                  <time dateTime={event.created_at}>{localTime}</time>
                  <span className="text-muted-foreground text-xs">{event.created_at}</span>
                </div>
              </DetailItem>
              <DetailItem label="Event ID">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs break-all">{event.id}</span>
                  <CopyButton value={event.id} label="Event ID" />
                </div>
              </DetailItem>
            </dl>
          </section>

          {/* Actor — id, name, staff_code, role */}
          <section className="rounded-lg border">
            <h3 className="border-b px-3 py-2 text-xs font-medium">Actor</h3>
            <div className="p-3">
              {event.actor ? (
                <div className="flex items-center gap-3">
                  <StaffAvatar
                    firstName={event.actor.name.split(' ')[0] || event.actor.name}
                    lastName={event.actor.name.split(' ').slice(1).join(' ') || ''}
                  />
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <p className="truncate text-sm font-medium">{event.actor.name}</p>
                    <p className="text-muted-foreground font-mono text-xs">
                      {event.actor.staff_code}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <StaffRoleBadge role={event.actor.role} />
                      {event.actor.id && (
                        <span className="text-muted-foreground font-mono text-[11px]">
                          {event.actor.id}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  <p className="text-muted-foreground text-sm">System or unknown</p>
                  <p className="text-muted-foreground text-xs">
                    No signed-in staff member was attached to this event, for example a failed
                    sign-in with an unknown staff code.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Entity — entity_type, entity_id */}
          <section className="rounded-lg border">
            <h3 className="border-b px-3 py-2 text-xs font-medium">Entity</h3>
            <dl className="grid grid-cols-1 gap-3 p-3">
              <DetailItem label="Entity type">{event.entity_type || 'None'}</DetailItem>
              <DetailItem label="Entity ID">
                {entityIdDisplay ? (
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs break-all">{entityIdDisplay}</span>
                    <CopyButton value={entityIdDisplay} label="Entity ID" />
                  </div>
                ) : (
                  'None'
                )}
              </DetailItem>
            </dl>
          </section>

          {/* Details — free-form object */}
          <section className="rounded-lg border">
            <h3 className="border-b px-3 py-2 text-xs font-medium">Details</h3>
            <div className="p-3">{renderDetails(event.details)}</div>
          </section>
        </div>

        <SheetFooter className="flex-row justify-end border-t">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
