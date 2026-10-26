import { buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import EntityLogo from './entity-logo';

interface AccountMenuProps {
  onSettings: () => void;
  onSignOut: () => void;
}

const account = {
  name: 'Ada Mensah',
  role: 'Cashier',
  initials: 'AM',
};

const AccountMenu = ({ onSettings, onSignOut }: AccountMenuProps) => {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        className={cn(buttonVariants({ variant: 'ghost' }), 'size-9 rounded-full px-0')}
        aria-label="Open account menu"
      >
        <EntityLogo firstName="Ada" lastName="Mensah" isActive />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-44">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center gap-x-2 px-2 py-1.5">
            <EntityLogo firstName="Ada" lastName="Mensah" isActive />
            <div className="flex flex-col">
              <span className="text-foreground text-sm font-medium">{account.name}</span>
              <span className="text-muted-foreground text-xs font-normal">{account.role}</span>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="mt-2" onClick={onSettings}>
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={onSignOut}>
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AccountMenu;
