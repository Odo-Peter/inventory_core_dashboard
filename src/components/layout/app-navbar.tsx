import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { MenuIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/features/auth/hooks/useAuth';

import NotificationsMenu from './common/notification-menu';
import AccountMenu from './common/account-menu';
import GlobalSearch from './common/global-search';

interface AppNavbarProps {
  onOpenMobileNav: () => void;
}

export function AppNavbar({ onOpenMobileNav }: AppNavbarProps) {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setSearchOpen((open) => !open);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const goTo = (to: string) => {
    setSearchOpen(false);
    navigate(to);
  };

  // const dashboardNavRoutes: {
  //   id: string;
  //   name: string;
  //   href: string;
  // }[] = [
  //   {
  //     id: '1',
  //     name: 'Overview',
  //     href: 'dashboard',
  //   },
  //   {
  //     id: '2',
  //     name: 'Customers',
  //     href: 'dashboard',
  //   },
  //   {
  //     id: '3',
  //     name: 'Products',
  //     href: 'dashboard',
  //   },
  // ];

  return (
    <header className="bg-background sticky top-0 z-40 w-full border-b">
      <div className="flex h-13.75 w-full items-center gap-2 px-3 sm:px-4 lg:px-6">
        {/* left */}
        <div className="flex flex-1 items-center gap-2">
          <Button
            variant="ghost"
            size="icon-sm"
            className="md:hidden"
            onClick={onOpenMobileNav}
            aria-label="Open navigation"
          >
            <MenuIcon />
          </Button>
        </div>

        {/* center */}
        <div className="md:w-full md:max-w-sm">
          <GlobalSearch goTo={goTo} searchOpen={searchOpen} setSearchOpen={setSearchOpen} />
        </div>

        {/* right */}
        <div className="flex flex-1 items-center justify-end gap-x-1">
          <NotificationsMenu />
          <AccountMenu
            onSettings={() => navigate('/settings')}
            onSignOut={() => logout(navigate)}
          />
        </div>
      </div>
    </header>
  );
}
