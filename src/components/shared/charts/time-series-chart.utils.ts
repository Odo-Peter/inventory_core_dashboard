import type { TimeSeriesPoint } from './time-series-chart';

/** Index of the bar to highlight, or null when nothing should be highlighted. */
export function resolveHighlightedIndex(
  data: TimeSeriesPoint[],
  seriesKey: string,
  highlight: 'max' | number | null | undefined,
): number | null {
  if (highlight == null || data.length === 0) return null;
  if (typeof highlight === 'number') {
    return Number.isInteger(highlight) && highlight >= 0 && highlight < data.length
      ? highlight
      : null;
  }

  let bestIndex: number | null = null;
  let bestValue = 0;

  data.forEach((point, index) => {
    const value = Number(point[seriesKey] ?? 0);
    if (bestIndex === null || value > bestValue) {
      bestIndex = index;
      bestValue = value;
    }
  });

  return bestValue > 0 ? bestIndex : null;
}
