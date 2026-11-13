import { useId, type ReactNode } from 'react';
import { cn } from 'cn';

import { SectionLoading } from '@/components/states';

interface SettingsCardProps {
  title: string;
  description?: ReactNode;
  footer?: ReactNode;
  className?: string;
  children: ReactNode;
}

export function SettingsCard({
  title,
  description,
  footer,
  className,
  children,
}: SettingsCardProps) {
  const titleId = useId();

  return (
    <section
      aria-labelledby={titleId}
      className={cn('border-border bg-card rounded-lg border', className)}
    >
      <header className="border-border border-b px-4 py-3">
        <h2 id={titleId} className="text-sm font-semibold">
          {title}
        </h2>
        {description ? <p className="text-muted-foreground mt-0.5 text-xs">{description}</p> : null}
      </header>
      <div className="p-4">{children}</div>
      {footer ? (
        <div className="border-border flex flex-wrap items-center justify-end gap-2 border-t px-4 py-3">
          {footer}
        </div>
      ) : null}
    </section>
  );
}

export function SettingsCardSkeleton({ title, lines = 3 }: { title: string; lines?: number }) {
  return (
    <SettingsCard title={title}>
      <SectionLoading lines={lines} />
    </SettingsCard>
  );
}

export function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <dt className="text-muted-foreground text-xs">{label}</dt>
      <dd className="text-sm font-medium break-words">{children}</dd>
    </div>
  );
}

export function DetailGrid({ children }: { children: ReactNode }) {
  return <dl className="grid gap-4 sm:grid-cols-2">{children}</dl>;
}
