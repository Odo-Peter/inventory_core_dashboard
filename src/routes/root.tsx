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
  const isLogin = location.pathname === '/';

  if (isLogin) {
    return <Outlet />;
  }

  return (
    <div className="bg-background text-foreground min-h-screen">
      <div className="flex min-h-screen flex-col">
        <header className="border-border bg-card sticky top-0 z-10 border-b">
          <div className="mx-auto flex h-12 w-full max-w-6xl items-center justify-between px-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Inventory Dashboard</span>
              <nav className="flex items-center gap-1">
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
            <span className="text-muted-foreground text-xs">Store: Main</span>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
