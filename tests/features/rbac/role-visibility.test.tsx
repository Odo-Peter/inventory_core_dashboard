import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { getVisibleNavGroups } from '@/components/layout/nav-items';
import { SidebarNav } from '@/components/layout/app-sidebar';
import { StaffAccessPage } from '@/features/admin/staff/pages/staff-access-page';
import { listStaff } from '@/features/admin/services/admin.service';
import { ItemDetailsDrawer } from '@/features/inventory/items/components/item-details-drawer';
import { ItemPage } from '@/features/inventory/items/pages/item-page';
import {
  getItemUnits,
  listCategories,
  listItems,
} from '@/features/inventory/category/services/category.service';
import { getStockStatus } from '@/features/inventory/stock/services/stock.service';
import { SalesHistoryPage } from '@/features/sales/pages/sales-history-page';
import { listSales } from '@/features/sales/services/sales.service';
import { staffFixtures } from '../../helpers/staff';
import {
  categoryFixtures,
  itemMeta,
  listItemsResponse,
  makeItem,
  openItemRowActions,
} from '../../helpers/items';
import { buildStockStatus } from '../../helpers/stock';
import { openStaffRowActions } from '../../helpers/staff';
import { RoleProvider } from '../../helpers/role';
import type { Role } from '@/lib/rbac/roles';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
}));

vi.mock('@/features/admin/services/admin.service', () => ({
  listStaff: vi.fn(),
  createStaff: vi.fn(),
  updateStaff: vi.fn(),
  deactivateStaff: vi.fn(),
  reactivateStaff: vi.fn(),
  resetStaffPin: vi.fn(),
  getCurrentStore: vi.fn().mockResolvedValue({ name: 'Main Store', id: 'store-1' }),
  getAudits: vi
    .fn()
    .mockResolvedValue({ data: [], meta: { page: 1, page_size: 25, total: 0, total_pages: 0 } }),
  getAuditActions: vi.fn().mockResolvedValue({ actions: [] }),
  getStaff: vi.fn(),
}));

vi.mock('@/features/inventory/category/services/category.service', () => ({
  listItems: vi.fn(),
  listCategories: vi.fn(),
  createCategory: vi.fn(),
  updateCategory: vi.fn(),
  createItem: vi.fn(),
  updateItem: vi.fn(),
  deactivateItem: vi.fn(),
  reactivateItem: vi.fn(),
  changeItemPrice: vi.fn(),
  getItemUnits: vi.fn(),
  listItemPriceHistory: vi.fn(),
  getItemByBarcode: vi.fn(),
}));

vi.mock('@/features/inventory/stock/services/stock.service', () => ({
  listStockMovements: vi.fn(),
  getStockStatus: vi.fn(),
  listReconciliation: vi.fn(),
  recordMovement: vi.fn(),
  initializeStock: vi.fn(),
  receiveStock: vi.fn(),
  adjustStock: vi.fn(),
  recordDamage: vi.fn(),
}));

vi.mock('@/features/sales/services/sales.service', () => ({
  listSales: vi.fn(),
  getSale: vi.fn(),
  createSale: vi.fn(),
  getPaymentOptions: vi.fn(),
  getSalesSummary: vi.fn(),
  printSaleReceipt: vi.fn(),
}));

const emptyPage = { data: [], meta: { page: 1, page_size: 25, total: 0, total_pages: 0 } };

function queryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
}

function visibleLabels(role: Role | null) {
  return getVisibleNavGroups(role).map((group) => ({
    group: group.label,
    items: group.items.map((item) => item.label),
  }));
}

describe('navigation per role', () => {
  it('cashier sees only the till, sales history, products, categories and POS accounts', () => {
    const groups = visibleLabels('cashier').map((group) => group.group);

    expect(groups).toEqual(['General', 'Inventory', 'Administration']);
    expect(visibleLabels('cashier')).toEqual([
      { group: 'General', items: ['Dashboard', 'New Sale', 'Sales History'] },
      { group: 'Inventory', items: ['Products', 'Categories'] },
      { group: 'Administration', items: ['Payment Accounts'] },
    ]);
  });

  it('manager gets stock movements, shift summary and staff, but not audits, reconciliation or settings', () => {
    const labels = visibleLabels('manager').flatMap((group) => group.items);

    expect(labels).toEqual(
      expect.arrayContaining(['Stock Movements', 'Shift Summary', 'Staff & Access']),
    );
    expect(labels).not.toEqual(
      expect.arrayContaining(['Stock Reconciliation', 'Audits', 'Settings']),
    );
  });

  it('admin sees every item', () => {
    const labels = visibleLabels('admin').flatMap((group) => group.items);

    expect(labels).toEqual(
      expect.arrayContaining([
        'Stock Reconciliation',
        'Audits',
        'Settings',
        'Staff & Access',
        'Shift Summary',
      ]),
    );
  });

  it('shows nothing for an unknown role', () => {
    expect(getVisibleNavGroups(null)).toEqual([]);
  });

  it('drops groups that end up empty instead of showing a heading with no links', () => {
    const cashierGroups = visibleLabels('cashier').map((group) => group.group);

    expect(cashierGroups).not.toContain('Operations');
  });

  it('renders the filtered sidebar links for a cashier', () => {
    render(
      <QueryClientProvider client={queryClient()}>
        <RoleProvider role="cashier">
          <MemoryRouter>
            <SidebarNav />
          </MemoryRouter>
        </RoleProvider>
      </QueryClientProvider>,
    );

    expect(screen.getByRole('link', { name: 'New Sale' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Audits' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Shift Summary' })).not.toBeInTheDocument();
    expect(screen.queryByText('Operations')).not.toBeInTheDocument();
  });
});

describe('staff actions per role', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listStaff).mockResolvedValue(staffFixtures);
  });

  it('manager can view and reset PINs but cannot add, edit or deactivate staff', async () => {
    const user = userEvent.setup();
    render(
      <QueryClientProvider client={queryClient()}>
        <RoleProvider role="manager">
          <StaffAccessPage />
        </RoleProvider>
      </QueryClientProvider>,
    );

    expect(await screen.findByText('Ada Okafor')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add Staff' })).not.toBeInTheDocument();

    const menu = await openStaffRowActions(user, 'Ada Okafor');
    expect(within(menu).getByRole('menuitem', { name: 'View details' })).toBeInTheDocument();
    expect(within(menu).getByRole('menuitem', { name: 'Reset PIN' })).toBeInTheDocument();
    expect(within(menu).queryByRole('menuitem', { name: 'Edit' })).not.toBeInTheDocument();
    expect(within(menu).queryByRole('menuitem', { name: 'Deactivate' })).not.toBeInTheDocument();
  });
});

describe('item actions per role', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listItems).mockResolvedValue(listItemsResponse());
    vi.mocked(listCategories).mockResolvedValue({ data: categoryFixtures, meta: itemMeta });
    vi.mocked(getItemUnits).mockResolvedValue({ units: ['bottle'] });
    vi.mocked(getStockStatus).mockResolvedValue(buildStockStatus());
  });

  function renderItems(role: Role) {
    return render(
      <QueryClientProvider client={queryClient()}>
        <RoleProvider role={role}>
          <MemoryRouter initialEntries={['/inventory']}>
            <ItemPage />
          </MemoryRouter>
        </RoleProvider>
      </QueryClientProvider>,
    );
  }

  it('cashier cannot add items and only sees view-level row actions', async () => {
    const user = userEvent.setup();
    renderItems('cashier');

    expect(await screen.findByText('Coca-Cola 50cl')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add New Item' })).not.toBeInTheDocument();

    const menu = await openItemRowActions(user, 'Coca-Cola 50cl');
    expect(within(menu).getByRole('menuitem', { name: 'View details' })).toBeInTheDocument();
    expect(within(menu).queryByRole('menuitem', { name: 'Edit details' })).not.toBeInTheDocument();
    expect(within(menu).queryByRole('menuitem', { name: 'Change price' })).not.toBeInTheDocument();
    expect(
      within(menu).queryByRole('menuitem', { name: 'Deactivate item' }),
    ).not.toBeInTheDocument();
  });

  it('manager can edit and change price but cannot deactivate', async () => {
    const user = userEvent.setup();
    renderItems('manager');

    expect(await screen.findByText('Coca-Cola 50cl')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add New Item' })).toBeInTheDocument();

    const menu = await openItemRowActions(user, 'Coca-Cola 50cl');
    expect(within(menu).getByRole('menuitem', { name: 'Edit details' })).toBeInTheDocument();
    expect(within(menu).getByRole('menuitem', { name: 'Change price' })).toBeInTheDocument();
    expect(
      within(menu).queryByRole('menuitem', { name: 'Deactivate item' }),
    ).not.toBeInTheDocument();
  });

  it('hides cost price from cashiers in the item details', () => {
    render(
      <QueryClientProvider client={queryClient()}>
        <RoleProvider role="cashier">
          <ItemDetailsDrawer
            open
            onOpenChange={() => {}}
            item={makeItem({ cost_price: 1000 })}
            categoryName="Beverages"
          />
        </RoleProvider>
      </QueryClientProvider>,
    );

    expect(screen.queryByText('Cost price')).not.toBeInTheDocument();
  });

  it('shows cost price to managers', () => {
    render(
      <QueryClientProvider client={queryClient()}>
        <RoleProvider role="manager">
          <ItemDetailsDrawer
            open
            onOpenChange={() => {}}
            item={makeItem({ cost_price: 1000 })}
            categoryName="Beverages"
          />
        </RoleProvider>
      </QueryClientProvider>,
    );

    expect(screen.getByText('Cost price')).toBeInTheDocument();
  });
});

describe('sales history per role', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listSales).mockResolvedValue(emptyPage as never);
  });

  function renderSales(role: Role) {
    return render(
      <QueryClientProvider client={queryClient()}>
        <RoleProvider role={role}>
          <MemoryRouter initialEntries={['/sales']}>
            <SalesHistoryPage />
          </MemoryRouter>
        </RoleProvider>
      </QueryClientProvider>,
    );
  }

  it('tells a cashier that only their own sales are listed', async () => {
    renderSales('cashier');

    expect(await screen.findByText(/Showing your sales only/)).toBeInTheDocument();
  });

  it('shows the whole store to managers without the own-sales note', async () => {
    renderSales('manager');

    expect(
      await screen.findByRole('heading', { name: 'Sales History', level: 1 }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Showing your sales only/)).not.toBeInTheDocument();
  });
});
