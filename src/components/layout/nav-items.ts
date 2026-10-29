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

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
  end?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const newSaleItem: NavItem = {
  label: 'New Sale',
  to: '/sales/new',
  icon: PlusIcon,
};

export const navGroups: NavGroup[] = [
  {
    label: 'General',
    items: [
      { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboardIcon, end: true },
      newSaleItem,
      { label: 'Sales History', to: '/sales', icon: ReceiptTextIcon, end: true },
    ],
  },
  {
    label: 'Inventory',
    items: [
      { label: 'Products', to: '/inventory', icon: PackageIcon, end: true },
      { label: 'Categories', to: '/inventory/categories', icon: TagsIcon },
      // add once a store-wide movements endpoint exists, see below
      { label: 'Stock Movements', to: '/inventory/movements', icon: ArrowLeftRightIcon },
    ],
  },
  {
    label: 'Operations',
    items: [{ label: 'Shift Summary', to: '/shifts/summary', icon: ClockIcon }],
  },
  {
    label: 'Administration',
    items: [
      { label: 'Staff & Access', to: '/admin/staff', icon: UsersIcon },
      { label: 'Payment Accounts', to: '/admin/payment-accounts', icon: CreditCardIcon },
      { label: 'Stock Reconciliation', to: '/admin/stock-reconciliation', icon: ScaleIcon },
      { label: 'Audits', to: '/admin/audits', icon: FileScan },
      { label: 'Settings', to: '/settings', icon: SettingsIcon },
    ],
  },
];
export const navItems = navGroups.flatMap((group) => group.items);
