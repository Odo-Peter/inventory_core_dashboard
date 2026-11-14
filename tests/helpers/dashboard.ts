import type { SalesOverviewResponse } from '@/features/sales/types';

/** Seven days ending 2026-11-14, with kobo totals. Sums to ₦7,000. */
export const overviewDaily = [
  { date: '2026-11-08', total: 120_000, count: 3 },
  { date: '2026-11-09', total: 80_000, count: 2 },
  { date: '2026-11-10', total: 0, count: 0 },
  { date: '2026-11-11', total: 160_000, count: 4 },
  { date: '2026-11-12', total: 40_000, count: 1 },
  { date: '2026-11-13', total: 150_000, count: 5 },
  { date: '2026-11-14', total: 150_000, count: 2 },
];

export function makeSalesOverview(
  overrides: Partial<SalesOverviewResponse> = {},
): SalesOverviewResponse {
  return {
    timezone: 'Africa/Lagos',
    scope: 'store',
    today: {
      date: '2026-11-14',
      total: 150_000,
      count: 2,
      by_method: [
        { method: 'cash', total: 60_000, count: 1 },
        { method: 'card', total: 90_000, count: 1 },
      ],
    },
    daily: overviewDaily,
    ...overrides,
  };
}
