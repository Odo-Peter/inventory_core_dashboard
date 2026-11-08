import {
  ArrowLeftRightIcon,
  ClockIcon,
  CreditCardIcon,
  FileScan,
  LayoutDashboardIcon,
  PackageIcon,
  PlusIcon,
  ReceiptTextIcon,
  ScaleIcon,
  SettingsIcon,
  TagsIcon,
  UsersIcon,
  type LucideIcon,
} from 'lucide-react';

import { can, type Permission } from '@/lib/rbac';

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  end?: boolean;
  /** Capability required to see and open this page. */
  permission: Permission;
  /** Optional live badge key rendered by the sidebar. */
  badge?: 'reconciliationDrift';
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const newSaleItem: NavItem = {
  label: 'New Sale',
  to: '/sales/new',
  icon: PlusIcon,
  permission: 'salesCreate',
};

export const navGroups: NavGroup[] = [
  {
    label: 'General',
    items: [
      {
        label: 'Dashboard',
        to: '/dashboard',
        icon: LayoutDashboardIcon,
        end: true,
        permission: 'dashboard',
      },
      newSaleItem,
      {
        label: 'Sales History',
        to: '/sales',
        icon: ReceiptTextIcon,
        end: true,
        permission: 'salesHistory',
      },
    ],
  },
  {
    label: 'Inventory',
    items: [
      {
        label: 'Products',
        to: '/inventory',
        icon: PackageIcon,
        end: true,
        permission: 'inventoryView',
      },
      {
        label: 'Categories',
        to: '/inventory/categories',
        icon: TagsIcon,
        permission: 'categoriesView',
      },
      {
        label: 'Stock Movements',
        to: '/inventory/movements',
        icon: ArrowLeftRightIcon,
        permission: 'stockView',
      },
    ],
  },
  {
    label: 'Operations',
    items: [
      {
        label: 'Shift Summary',
        to: '/shifts/summary',
        icon: ClockIcon,
        permission: 'shiftsView',
      },
    ],
  },
  {
    label: 'Administration',
    items: [
      { label: 'Staff & Access', to: '/admin/staff', icon: UsersIcon, permission: 'staffView' },
      {
        label: 'Payment Accounts',
        to: '/admin/payment-accounts',
        icon: CreditCardIcon,
        permission: 'posAccountsView',
      },
      {
        label: 'Stock Reconciliation',
        to: '/admin/stock-reconciliation',
        icon: ScaleIcon,
        permission: 'stockReconcile',
        badge: 'reconciliationDrift',
      },
      { label: 'Audits', to: '/admin/audits', icon: FileScan, permission: 'auditView' },
      { label: 'Settings', to: '/settings', icon: SettingsIcon, permission: 'settingsView' },
    ],
  },
];

/**
 * Filter the single nav config through the capability map. Empty groups are
 * dropped so a cashier never sees an empty "Administration" heading.
 */
export function getVisibleNavGroups(role: string | null | undefined): NavGroup[] {
  return navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => can(role, item.permission)),
    }))
    .filter((group) => group.items.length > 0);
}

export const navItems = navGroups.flatMap((group) => group.items);
