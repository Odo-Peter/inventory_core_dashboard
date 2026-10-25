import { NavLink, Outlet, useLocation } from 'react-router';
import { cn } from 'cn';

const navItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/inventory', label: 'Inventory' },
  { to: '/pos', label: 'POS' },
  { to: '/settings', label: 'Settings' },
];

export function Root() {
  const location = useLocation();
  const isLogin = location.pathname === '/' || location.pathname === '/auth/login';

  if (isLogin) {
    return <Outlet />;
  }

  return (
    <div className="bg-background text-foreground min-h-screen">
      <div className="flex min-h-screen flex-col">
        <header className="border-border bg-card sticky top-0 z-10 border-b">
          <div className="flex w-full flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-2 sm:px-6 lg:h-12 lg:flex-nowrap lg:px-12 lg:py-0 2xl:px-16">
            <div className="flex min-w-0 items-center gap-4">
              <div className="flex shrink-0 items-center gap-2">
                <img src="/logo.svg" alt="" aria-hidden="true" className="size-5" />
                <span className="text-sm font-medium">Inventory Dashboard</span>
              </div>
              <nav className="flex items-center gap-1 overflow-x-auto">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      cn(
                        'text-muted-foreground hover:text-foreground rounded-md px-2 py-1 text-sm',
                        isActive && 'text-foreground bg-muted',
                      )
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>
            </div>
            <span className="text-muted-foreground shrink-0 text-xs">Store: Main</span>
          </div>
        </header>
        <main className="w-full flex-1 px-4 py-6 sm:px-6 lg:px-12 2xl:px-16">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
