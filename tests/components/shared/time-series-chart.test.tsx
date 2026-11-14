import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { TimeSeriesChart } from '@/components/shared/charts';
import { tooltipRow } from '@/components/shared/charts/time-series-chart-tooltip';
import { resolveHighlightedIndex } from '@/components/shared/charts/time-series-chart.utils';
import { formatNaira } from '@/features/admin/staff/utils';

const points = [
  { date: '2026-11-08', total: 120_000 },
  { date: '2026-11-09', total: 80_000 },
  { date: '2026-11-10', total: 40_000 },
];

const series = [{ key: 'total', label: 'Sales' }];

function chartStyle(container: HTMLElement) {
  return container.querySelector('style')?.textContent ?? '';
}

describe('TimeSeriesChart', () => {
  it('exposes the aria label and renders the x axis labels', () => {
    render(
      <TimeSeriesChart
        data={points}
        xKey="date"
        series={series}
        ariaLabel="Sales for the last three days"
        xTickFormatter={(value) => String(value).slice(-2)}
      />,
    );

    expect(screen.getByRole('img', { name: 'Sales for the last three days' })).toBeInTheDocument();
    expect(screen.getByText('08')).toBeInTheDocument();
    expect(screen.getByText('09')).toBeInTheDocument();
  });

  it('renders the empty state instead of a chart when there is no data', () => {
    const { container } = render(
      <TimeSeriesChart
        data={[]}
        xKey="date"
        series={series}
        ariaLabel="Empty chart"
        emptyState={<p>No sales yet</p>}
      />,
    );

    expect(screen.getByText('No sales yet')).toBeInTheDocument();
    expect(container.querySelector('[data-chart-empty="true"]')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="chart"]')).not.toBeInTheDocument();
  });

  it('treats an all-zero series as empty', () => {
    render(
      <TimeSeriesChart
        data={[
          { date: '2026-11-08', total: 0 },
          { date: '2026-11-09', total: 0 },
        ]}
        xKey="date"
        series={series}
        ariaLabel="No sales chart"
        emptyState={<p>Nothing to plot</p>}
      />,
    );

    expect(screen.getByText('Nothing to plot')).toBeInTheDocument();
  });

  it('renders one bar per data point for a bar chart', () => {
    const { container } = render(
      <TimeSeriesChart data={points} xKey="date" series={series} type="bar" ariaLabel="Bars" />,
    );

    expect(container.querySelectorAll('.recharts-bar-rectangle')).toHaveLength(points.length);
  });

  it('marks only the highlighted bar', () => {
    const { container } = render(
      <TimeSeriesChart
        data={points}
        xKey="date"
        series={series}
        type="bar"
        highlight={1}
        ariaLabel="Highlighted bars"
      />,
    );

    const highlighted = container.querySelectorAll('[data-highlighted="true"]');
    expect(highlighted).toHaveLength(1);
    expect(highlighted[0]).toHaveAttribute('fill', 'var(--color-total)');
  });

  it('highlights the maximum bar when asked to', () => {
    const { container } = render(
      <TimeSeriesChart
        data={points}
        xKey="date"
        series={series}
        type="bar"
        highlight="max"
        ariaLabel="Max bars"
      />,
    );

    const highlighted = container.querySelectorAll('[data-highlighted="true"]');
    expect(highlighted).toHaveLength(1);
  });

  it('writes the series colors to the chart style block', () => {
    const { container } = render(
      <TimeSeriesChart
        data={points}
        xKey="date"
        series={[
          { key: 'total', label: 'Sales', color: '#123456' },
          { key: 'count', label: 'Count' },
        ]}
        ariaLabel="Colored chart"
      />,
    );

    const css = chartStyle(container);
    expect(css).toContain('--color-total: #123456');
    expect(css).toContain('--color-count: var(--chart-2)');
  });

  it('shows a legend only when there is more than one series', () => {
    const { rerender } = render(
      <TimeSeriesChart data={points} xKey="date" series={series} ariaLabel="Single" />,
    );

    expect(screen.queryByText('Count')).not.toBeInTheDocument();

    rerender(
      <TimeSeriesChart
        data={points.map((point) => ({ ...point, count: point.total / 100 }))}
        xKey="date"
        series={[...series, { key: 'count', label: 'Count' }]}
        ariaLabel="Multiple"
      />,
    );

    expect(screen.getByText('Count')).toBeInTheDocument();
  });

  it.each(['bar', 'line', 'area'] as const)('renders the %s chart type', (type) => {
    const { container } = render(
      <TimeSeriesChart data={points} xKey="date" series={series} type={type} ariaLabel={type} />,
    );

    expect(container.querySelector('[data-chart-type]')).toHaveAttribute('data-chart-type', type);
  });

  it('marks the chart as stacked', () => {
    const { container } = render(
      <TimeSeriesChart
        data={points}
        xKey="date"
        series={series}
        stacked
        ariaLabel="Stacked chart"
      />,
    );

    expect(container.querySelector('[data-stacked]')).toHaveAttribute('data-stacked', 'true');
  });
});

describe('resolveHighlightedIndex', () => {
  it('returns the index of the largest value for max', () => {
    expect(resolveHighlightedIndex(points, 'total', 'max')).toBe(0);
  });

  it('returns the explicit index when it is in range', () => {
    expect(resolveHighlightedIndex(points, 'total', 2)).toBe(2);
  });

  it.each([-1, 3, 1.5, Number.NaN])('rejects the out-of-range index %j', (index) => {
    expect(resolveHighlightedIndex(points, 'total', index)).toBeNull();
  });

  it('returns null when there is nothing to highlight', () => {
    expect(resolveHighlightedIndex([], 'total', 'max')).toBeNull();
    expect(resolveHighlightedIndex(points, 'total', null)).toBeNull();
    expect(
      resolveHighlightedIndex(
        [
          { date: '2026-11-08', total: 0 },
          { date: '2026-11-09', total: 0 },
        ],
        'total',
        'max',
      ),
    ).toBeNull();
  });
});

describe('tooltipRow', () => {
  it('renders the series name and the formatted value', () => {
    render(tooltipRow(150_000, 'Sales', formatNaira));

    expect(screen.getByText('Sales')).toBeInTheDocument();
    expect(screen.getByText('₦1,500.00')).toBeInTheDocument();
  });

  it('coerces string values before formatting', () => {
    render(tooltipRow('250000', 'Sales', formatNaira));

    expect(screen.getByText('₦2,500.00')).toBeInTheDocument();
  });
});
