import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router';

import { AppNavbar } from '@/components/layout/app-navbar';
import { AppSidebar, SidebarNav } from '@/components/layout/app-sidebar';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ChangePinDialog } from '@/features/auth/components/change-pin-dialog';
import { useAuth } from '@/features/auth/hooks/useAuth';

export function AppShell() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [mobileNavOpen, setMobileNavOpen] = useState<boolean>(false);

  const { mustChangePin, completePinChange } = useAuth();
  const navigate = useNavigate();

  const handlePinChanged = () => {
    completePinChange();
    navigate('/dashboard');
  };

  return (
    <div className="bg-background text-foreground flex min-h-svh w-full">
      <ChangePinDialog open={mustChangePin} onSuccess={handlePinChanged} />
      <AppSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((collapsed) => !collapsed)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <AppNavbar onOpenMobileNav={() => setMobileNavOpen(true)} />
        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="w-72 max-w-[85vw] gap-0 p-0">
          <SheetHeader className="border-b px-4 py-3">
            <SheetTitle className="flex items-center gap-2">
              <img src="/logo.svg" alt="" aria-hidden="true" className="size-6 shrink-0" />
              <span className="truncate text-sm font-medium">Stocktake Dashboard</span>
            </SheetTitle>
            <SheetDescription className="sr-only">Main navigation</SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <SidebarNav onNavigate={() => setMobileNavOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
