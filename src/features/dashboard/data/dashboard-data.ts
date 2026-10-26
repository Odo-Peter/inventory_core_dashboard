import {
  BanknoteIcon,
  TriangleAlertIcon,
  ReceiptTextIcon,
  UsersIcon,
  type LucideIcon,
} from 'lucide-react';

export interface DashboardMetric {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
}

export interface SalesOverviewPoint {
  day: string;
  total: number;
}

export interface RecentSale {
  id: string;
  customer: string;
  initials: string;
  amount: string;
  method: string;
  time: string;
}

export const dashboardMetrics: DashboardMetric[] = [
  {
    label: "Today's sales",
    value: '$1,284.50',
    detail: '+12.4% from yesterday',
    icon: BanknoteIcon,
  },
  {
    label: 'Transactions',
    value: '86',
    detail: '42 this shift',
    icon: ReceiptTextIcon,
  },
  {
    label: 'Low-stock items',
    value: '7',
    detail: '3 need reordering',
    icon: TriangleAlertIcon,
  },
  {
    label: 'Staff on shift',
    value: '3',
    detail: 'Morning shift · 08:00–16:00',
    icon: UsersIcon,
  },
];

export const salesOverview: SalesOverviewPoint[] = [
  { day: 'Mon', total: 620 },
  { day: 'Tue', total: 840 },
  { day: 'Wed', total: 710 },
  { day: 'Thu', total: 980 },
  { day: 'Fri', total: 1240 },
  { day: 'Sat', total: 1580 },
  { day: 'Sun', total: 872 },
];

export const recentSales: RecentSale[] = [
  {
    id: 'sale-1042',
    customer: 'Walk-in customer',
    initials: 'WC',
    amount: '$96.00',
    method: 'Cash',
    time: '2 min ago',
  },
  {
    id: 'sale-1041',
    customer: 'Ama Boateng',
    initials: 'AB',
    amount: '$42.50',
    method: 'Card',
    time: '12 min ago',
  },
  {
    id: 'sale-1040',
    customer: 'Kofi Mensah',
    initials: 'KM',
    amount: '$128.75',
    method: 'Transfer',
    time: '24 min ago',
  },
  {
    id: 'sale-1039',
    customer: 'Walk-in customer',
    initials: 'WC',
    amount: '$18.00',
    method: 'Cash',
    time: '38 min ago',
  },
  {
    id: 'sale-1038',
    customer: 'Esi Adjei',
    initials: 'EA',
    amount: '$64.25',
    method: 'Card',
    time: '51 min ago',
  },
];
