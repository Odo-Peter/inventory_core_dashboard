import { useEffect, useRef, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';

import { PermissionDeniedState } from '@/components/states';
import { buttonVariants } from '@/components/ui/button';
import { getRoleHome, useCan, useRole, type Permission } from '@/lib/rbac';

interface AccessDeniedProps {
  home: string;
}

export function AccessDenied({ home }: AccessDeniedProps) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-4">
      <PermissionDeniedState
        title="You don't have access"
        description="Your role doesn't allow this page. Ask a manager or admin if you need access."
        primaryAction={
          <Link to={home} className={buttonVariants()}>
            Go to my home page
          </Link>
        }
      />
    </div>
  );
}

interface RequireRoleProps {
  permission: Permission;
  children: ReactNode;
  /** Optional override for the denied-state home link. */
  home?: string;
}

/**
 * Gates a route with a capability from `PERMISSIONS`.
 *
 * A direct visit to a forbidden route shows a clear "You don't have access"
 * state. If access is lost while the page is already open (for example a role
 * change detected by a background `/auth/me` refetch), the user is moved to
 * their new role's home instead of being left on a dead page.
 */
export function RequireRole({ permission, children, home }: RequireRoleProps) {
  const allowed = useCan(permission);
  const role = useRole();
  const navigate = useNavigate();
  const wasAllowed = useRef(allowed);

  useEffect(() => {
    if (wasAllowed.current && !allowed) {
      navigate(home ?? getRoleHome(role), { replace: true });
    }
    wasAllowed.current = allowed;
  }, [allowed, home, navigate, role]);

  if (!allowed) {
    return <AccessDenied home={home ?? getRoleHome(role)} />;
  }

  return <>{children}</>;
}
