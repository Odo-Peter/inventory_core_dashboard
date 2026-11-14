import { Area, Bar, Cell, Line } from 'recharts';

import type { TimeSeriesChartProps, TimeSeriesPoint, TimeSeriesSeries } from './time-series-chart';

interface ChartSeriesProps {
  data: TimeSeriesPoint[];
  series: TimeSeriesSeries[];
  type: NonNullable<TimeSeriesChartProps['type']>;
  stacked: boolean;
  highlightedIndex: number | null;
}

/** Renders the bar/line/area series for a chart, including the highlighted bar. */
export function ChartSeries({ data, series, type, stacked, highlightedIndex }: ChartSeriesProps) {
  return (
    <>
      {series.map((item, index) => {
        const color = `var(--color-${item.key})`;
        const stackId = stacked && type !== 'line' ? 'stack' : undefined;

        if (type === 'line') {
          return (
            <Line
              key={item.key}
              type="monotone"
              dataKey={item.key}
              name={item.label}
              stroke={color}
              strokeWidth={2}
              dot={false}
            />
          );
        }

        if (type === 'area') {
          return (
            <Area
              key={item.key}
              type="monotone"
              dataKey={item.key}
              name={item.label}
              stroke={color}
              fill={color}
              fillOpacity={0.18}
              stackId={stackId}
            />
          );
        }

        return (
          <Bar
            key={item.key}
            dataKey={item.key}
            name={item.label}
            fill={color}
            radius={[4, 4, 0, 0]}
            maxBarSize={44}
            stackId={stackId}
          >
            {index === 0 && highlightedIndex !== null
              ? data.map((_, pointIndex) => (
                  <Cell
                    key={pointIndex}
                    data-highlighted={pointIndex === highlightedIndex ? 'true' : undefined}
                    fill={pointIndex === highlightedIndex ? color : 'var(--chart-2)'}
                  />
                ))
              : null}
          </Bar>
        );
      })}
    </>
  );
}
