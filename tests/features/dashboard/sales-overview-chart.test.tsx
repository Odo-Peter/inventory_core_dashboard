import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SalesOverviewChart } from '@/features/dashboard/components/sales-overview-chart';
import { getSalesOverview } from '@/features/sales/services/sales.service';
import type { Role } from '@/lib/rbac/roles';
import { makeSalesOverview } from '../../helpers/dashboard';
import { RoleProvider } from '../../helpers/role';

vi.mock('@/features/sales/services/sales.service', () => ({
  getSalesOverview: vi.fn(),
}));

function renderChart(role: Role | null = 'admin') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <RoleProvider role={role}>
      <QueryClientProvider client={queryClient}>
        <SalesOverviewChart />
      </QueryClientProvider>
    </RoleProvider>,
  );
}

describe('SalesOverviewChart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSalesOverview).mockResolvedValue(makeSalesOverview());
  });

  it('renders the weekly total, best day, and average from the API', async () => {
    renderChart();

    expect(await screen.findByText('₦7,000.00')).toBeInTheDocument();
    expect(screen.getByText('Best day:')).toBeInTheDocument();
    expect(screen.getAllByText('Wed').length).toBeGreaterThan(0);
    expect(screen.getByText('Average day:')).toBeInTheDocument();
    expect(screen.getByText('₦1,000.00')).toBeInTheDocument();
  });

  it('summarises the same data for assistive technology', async () => {
    renderChart();

    expect(
      await screen.findByRole('img', {
        name: 'Sales over the last 7 days. Total ₦7,000.00. Best day Wed at ₦1,600.00.',
      }),
    ).toBeInTheDocument();
  });

  it('labels each day with a weekday tick', async () => {
    renderChart();

    await screen.findByRole('img');

    for (const day of ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']) {
      expect(screen.getAllByText(day).length).toBeGreaterThan(0);
    }
  });

  it('shows the empty state when the week has no sales', async () => {
    vi.mocked(getSalesOverview).mockResolvedValue(
      makeSalesOverview({
        today: { date: '2026-11-14', total: 0, count: 0, by_method: [] },
        daily: [
          { date: '2026-11-08', total: 0, count: 0 },
          { date: '2026-11-09', total: 0, count: 0 },
          { date: '2026-11-10', total: 0, count: 0 },
          { date: '2026-11-11', total: 0, count: 0 },
          { date: '2026-11-12', total: 0, count: 0 },
          { date: '2026-11-13', total: 0, count: 0 },
          { date: '2026-11-14', total: 0, count: 0 },
        ],
      }),
    );

    renderChart();

    expect(await screen.findByText('No sales in the last 7 days')).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: 'Sales over the last 7 days. No sales. Total ₦0.00.' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Best day:')).toBeInTheDocument();
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });

  it('shows an error with a retry action', async () => {
    const user = userEvent.setup();
    vi.mocked(getSalesOverview)
      .mockRejectedValueOnce(new Error('network'))
      .mockResolvedValue(makeSalesOverview());

    renderChart();

    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't load the sales overview");
    expect(screen.queryByRole('img')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Retry' }));

    await waitFor(() => expect(getSalesOverview).toHaveBeenCalledTimes(2));
    expect(await screen.findByRole('img')).toBeInTheDocument();
  });

  it.each(['cashier', 'manager', 'admin'] as const)('renders for %s', async (role) => {
    renderChart(role);

    expect(await screen.findByText('Sales overview')).toBeInTheDocument();
  });

  it('renders nothing for an unknown role', () => {
    renderChart(null);

    expect(screen.queryByText('Sales overview')).not.toBeInTheDocument();
    expect(getSalesOverview).not.toHaveBeenCalled();
  });
});
