import { render, renderHook, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Can, useCan, useRoleEnabled } from '@/lib/rbac';
import { RoleProvider } from '../../../helpers/role';

describe('useCan', () => {
  it.each([
    ['cashier', false],
    ['manager', true],
    ['admin', true],
  ] as const)('returns %s -> %s for itemCreate', (role, expected) => {
    const { result } = renderHook(() => useCan('itemCreate'), {
      wrapper: ({ children }) => <RoleProvider role={role}>{children}</RoleProvider>,
    });

    expect(result.current).toBe(expected);
  });

  it('is false outside any auth provider instead of throwing', () => {
    const { result } = renderHook(() => useCan('dashboard'));

    expect(result.current).toBe(false);
  });
});

describe('useRoleEnabled', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <RoleProvider role="manager">{children}</RoleProvider>
  );

  it('combines the capability with the caller flag', () => {
    expect(renderHook(() => useRoleEnabled('itemCreate', true), { wrapper }).result.current).toBe(
      true,
    );
    expect(renderHook(() => useRoleEnabled('itemCreate', false), { wrapper }).result.current).toBe(
      false,
    );
  });

  it('is false for a capability the role lacks, even when the caller asks for it', () => {
    expect(renderHook(() => useRoleEnabled('auditView', true), { wrapper }).result.current).toBe(
      false,
    );
  });
});

describe('<Can>', () => {
  it('renders children for an allowed role and the fallback otherwise', () => {
    const { unmount } = render(
      <RoleProvider role="manager">
        <Can permission="itemCreate" fallback={<span>no add</span>}>
          <button>Add item</button>
        </Can>
      </RoleProvider>,
    );

    expect(screen.getByRole('button', { name: 'Add item' })).toBeInTheDocument();
    unmount();

    render(
      <RoleProvider role="cashier">
        <Can permission="itemCreate" fallback={<span>no add</span>}>
          <button>Add item</button>
        </Can>
      </RoleProvider>,
    );

    expect(screen.queryByRole('button', { name: 'Add item' })).not.toBeInTheDocument();
    expect(screen.getByText('no add')).toBeInTheDocument();
  });
});
