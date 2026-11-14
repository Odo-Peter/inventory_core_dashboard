import type { ReactNode } from 'react';

import { cn } from 'cn';
import { CartesianGrid, ComposedChart, XAxis, YAxis } from 'recharts';
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { ChartSeries } from './time-series-chart-series';
import { resolveHighlightedIndex } from './time-series-chart.utils';

export type TimeSeriesPoint = Record<string, string | number>;

export interface TimeSeriesSeries {
  key: string;
  label: string;
  color?: string;
}

export interface TimeSeriesChartProps {
  data: TimeSeriesPoint[];
  xKey: string;
  series: TimeSeriesSeries[];
  type?: 'bar' | 'line' | 'area';
  stacked?: boolean;
  highlight?: 'max' | number | null;
  xTickFormatter?: (value: string | number) => string;
  valueFormatter?: (value: number) => string;
  yTickFormatter?: (value: number) => string;
  height?: number;
  ariaLabel: string;
  emptyState?: ReactNode;
  className?: string;
  hideYAxis?: boolean;
}

const DEFAULT_HEIGHT_CLASS = 'h-44';

export function TimeSeriesChart({
  data,
  xKey,
  series,
  type = 'bar',
  stacked = false,
  highlight = null,
  xTickFormatter,
  valueFormatter = (value) => String(value),
  yTickFormatter,
  height,
  ariaLabel,
  emptyState,
  className,
  hideYAxis = false,
}: TimeSeriesChartProps) {
  const config: ChartConfig = Object.fromEntries(
    series.map((item, index) => [
      item.key,
      { label: item.label, color: item.color ?? `var(--chart-${(index % 5) + 1})` },
    ]),
  );

  const isEmpty =
    data.length === 0 ||
    series.every((item) => data.every((point) => Number(point[item.key] ?? 0) === 0));
  const highlightedIndex =
    type === 'bar' ? resolveHighlightedIndex(data, series[0]?.key ?? '', highlight) : null;
  const formatValue = (value: unknown) => valueFormatter(Number(value));

  return (
    <div
      role="img"
      aria-label={ariaLabel}
      data-chart-type={type}
      className={cn('w-full', className)}
    >
      {isEmpty ? (
        <div
          data-chart-empty="true"
          className={cn(
            'text-muted-foreground flex items-center justify-center text-center text-xs',
            DEFAULT_HEIGHT_CLASS,
          )}
        >
          {emptyState}
        </div>
      ) : (
        <ChartContainer
          config={config}
          className={cn('aspect-auto w-full', height ? undefined : DEFAULT_HEIGHT_CLASS)}
          style={height ? { height } : undefined}
        >
          <ComposedChart
            accessibilityLayer
            data={data}
            margin={{ left: 0, right: 4, top: 8, bottom: 0 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey={xKey}
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={xTickFormatter}
            />
            <YAxis
              hide={hideYAxis}
              tickLine={false}
              axisLine={false}
              width={44}
              tickFormatter={(value) => (yTickFormatter ?? valueFormatter)(Number(value))}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  formatter={(value, name) => (
                    <div className="flex flex-1 items-center justify-between gap-3">
                      <span className="text-muted-foreground">{String(name)}</span>
                      <span className="font-mono font-medium tabular-nums">
                        {formatValue(value)}
                      </span>
                    </div>
                  )}
                />
              }
            />
            {series.length > 1 ? (
              <ChartLegend content={<ChartLegendContent />} verticalAlign="bottom" />
            ) : null}

            <ChartSeries
              data={data}
              series={series}
              type={type}
              stacked={stacked}
              highlightedIndex={highlightedIndex}
            />
          </ComposedChart>
        </ChartContainer>
      )}
    </div>
  );
}
