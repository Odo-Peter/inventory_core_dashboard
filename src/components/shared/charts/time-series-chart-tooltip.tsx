import type { ReactNode } from 'react';

/** One tooltip row: the series label on the left and the formatted value on the right. */
export function tooltipRow(
  value: unknown,
  name: unknown,
  formatValue: (value: number) => string,
): ReactNode {
  return (
    <div className="flex flex-1 items-center justify-between gap-3">
      <span className="text-muted-foreground">{String(name)}</span>
      <span className="font-mono font-medium tabular-nums">{formatValue(Number(value))}</span>
    </div>
  );
}
