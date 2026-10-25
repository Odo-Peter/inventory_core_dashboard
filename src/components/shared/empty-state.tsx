import * as React from 'react';

import { Empty } from '@/components/ui/empty';

interface EmptyStateProps {
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState(props: EmptyStateProps) {
  return <Empty {...props} />;
}

export { EmptyState as default };
