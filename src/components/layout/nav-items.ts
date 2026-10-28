import {
  ArrowLeftRightIcon,
  ClockIcon,
  CreditCardIcon,
  FileScan,
  LayoutDashboardIcon,
  PackageIcon,
  PlusIcon,
  ReceiptTextIcon,
  SettingsIcon,
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
      { label: 'Inventory', to: '/inventory', icon: PackageIcon },
      { label: 'Sales History', to: '/sales', icon: ReceiptTextIcon, end: true },
    ],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Stock Movements', to: '/stock-movements', icon: ArrowLeftRightIcon },
      { label: 'Shift Summary', to: '/shifts/summary', icon: ClockIcon },
    ],
  },
  {
    label: 'Administration',
    items: [
      { label: 'Staff & Access', to: '/admin/staff', icon: UsersIcon },
      { label: 'Payment Accounts', to: '/admin/payment-accounts', icon: CreditCardIcon },
      { label: 'Audits', to: '/admin/audits', icon: FileScan },
      { label: 'Settings', to: '/settings', icon: SettingsIcon },
    ],
  },
];

export const navItems = navGroups.flatMap((group) => group.items);
