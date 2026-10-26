import { BellIcon } from 'lucide-react';

import { buttonVariants } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

import { cn } from '@/lib/utils';

const NotificationsMenu = () => {
  const notifications = [
    { id: 'notification-1', title: 'Low stock: Espresso beans', time: '8 min ago' },
    { id: 'notification-2', title: 'Shift started by Kojo A.', time: '32 min ago' },
  ];
  return (
    <Popover>
      <PopoverTrigger
        className={cn(buttonVariants({ variant: 'ghost', size: 'icon-lg' }), 'relative')}
        aria-label="Notifications"
        title="Notifications"
      >
        <BellIcon />
        <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-red-600" />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="border-b px-3 py-2.5">
          <p className="text-sm font-medium">Notifications</p>
          <p className="text-muted-foreground text-xs">Recent store activity</p>
        </div>
        <ul className="divide-border divide-y">
          {notifications.map((notification) => (
            <li key={notification.id} className="flex flex-col gap-0.5 px-3 py-2.5">
              <p className="text-sm">{notification.title}</p>
              <p className="text-muted-foreground text-xs">{notification.time}</p>
            </li>
          ))}
        </ul>
        <div className="border-t px-3 py-2">
          <p className="text-muted-foreground text-center text-[11px]">
            Notification center placeholder
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationsMenu;
