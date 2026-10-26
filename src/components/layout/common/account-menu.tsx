import { useState } from 'react';
import { LogOut, Settings } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import EntityLogo from './entity-logo';
import { clearSessionAvatarColor, getSessionAvatarColor } from '@/components/lib/avatar-color';

interface AccountMenuProps {
  onSettings: () => void;
  onSignOut: () => void;
  profile: {
    firstName: string;
    lastName: string;
    role: string;
  };
}

const AccountMenu = ({ onSettings, onSignOut, profile }: AccountMenuProps) => {
  const [color] = useState(getSessionAvatarColor);

  const avatarSrc =
    `https://ui-avatars.com/api/?name=${encodeURIComponent(`${profile.firstName} ${profile.lastName}`)}` +
    `&background=${color.bg}&color=${color.fg}&bold=true`;

  const handleSignOut = () => {
    clearSessionAvatarColor();
    onSignOut();
  };

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        className="size-9 rounded-full bg-transparent px-0"
        aria-label="Open account menu"
      >
        <EntityLogo
          firstName={profile.firstName}
          lastName={profile.lastName}
          isActive
          src={avatarSrc}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-44">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center gap-x-2 px-2 py-1.5">
            <EntityLogo
              firstName={profile.firstName}
              lastName={profile.lastName}
              isActive
              src={avatarSrc}
            />
            <div className="flex flex-col">
              <span className="text-foreground text-sm font-medium">
                {profile.firstName} {profile.lastName}
              </span>
              <span className="text-muted-foreground text-xs font-semibold uppercase">
                {profile.role}
              </span>
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="mt-2" onClick={onSettings}>
          <Settings />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem variant="destructive" onClick={handleSignOut}>
          <LogOut />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default AccountMenu;
