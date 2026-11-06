import { Link, NavLink } from 'react-router';
import { PanelLeftCloseIcon, PanelLeftOpenIcon } from 'lucide-react';
import { cn } from 'cn';

import { Button } from '@/components/ui/button';
import { navGroups } from '@/components/layout/nav-items';

interface SidebarNavProps {
  collapsed?: boolean;
  onNavigate?: () => void;
}

export function SidebarNav({ collapsed = false, onNavigate }: SidebarNavProps) {
  return (
    <nav
      aria-label={collapsed ? 'Main navigation' : 'Main'}
      className={cn('flex flex-col gap-3 p-2', collapsed && 'items-stretch')}
    >
      {navGroups.map((group) => (
        <div key={group.label} className="flex flex-col gap-1">
          {collapsed ? (
            <span className="border-sidebar-border mx-2 mb-1 border-t" aria-hidden="true" />
          ) : (
            <p className="px-2.5 pt-1 pb-1 text-[11px] font-semibold tracking-wide uppercase">
              {group.label}
            </p>
          )}
          {group.items.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={onNavigate}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) =>
                  cn(
                    'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-sidebar-ring/50 flex h-8 items-center rounded text-sm transition-colors outline-none focus-visible:ring-2',
                    collapsed ? 'mx-auto w-9 justify-center' : 'gap-2.5 px-2.5',
                    isActive && 'bg-sidebar-accent text-sidebar-accent-foreground font-medium',
                  )
                }
              >
                <Icon className="size-4 shrink-0" />
                {collapsed ? <span className="sr-only">{item.label}</span> : item.label}
              </NavLink>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  return (
    <aside
      className={cn(
        'border-sidebar-border bg-sidebar text-sidebar-foreground sticky top-0 hidden h-svh shrink-0 flex-col border-r transition-[width] md:flex',
        collapsed ? 'w-14' : 'w-60',
      )}
    >
      <div
        className={cn(
          'border-sidebar-border flex h-14 shrink-0 items-center border-b',
          collapsed ? 'justify-center' : 'px-4',
        )}
      >
        <Link
          to="/dashboard"
          aria-label="Stocktake Dashboard"
          className="focus-visible:ring-ring/50 flex min-w-0 items-center gap-2 rounded-md outline-none focus-visible:ring-2"
        >
          <img src="/logo.svg" alt="" aria-hidden="true" className="size-6 shrink-0" />
          {!collapsed && (
            <span className="truncate text-sm font-medium tracking-tight">Stocktake Dashboard</span>
          )}
        </Link>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <SidebarNav collapsed={collapsed} />
      </div>

      <div
        className={cn(
          'border-sidebar-border flex shrink-0 border-t p-2',
          collapsed ? 'justify-center' : 'justify-end',
        )}
      >
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeftOpenIcon /> : <PanelLeftCloseIcon />}
        </Button>
      </div>
    </aside>
  );
}
