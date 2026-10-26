import { SearchIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { navGroups } from '../nav-items';

interface SearchProps {
  searchOpen: boolean;
  setSearchOpen: (val: boolean) => void;
  goTo: (to: string) => void;
}

const GlobalSearch = ({ goTo, searchOpen, setSearchOpen }: SearchProps) => {
  return (
    <Popover open={searchOpen} onOpenChange={setSearchOpen}>
      <PopoverTrigger
        className="lg:w-100"
        render={
          <Button
            variant="outline"
            size="sm"
            className="text-muted-foreground hover:text-foreground h-8 w-8 justify-center p-0 font-normal md:w-full md:justify-start md:gap-2 md:px-3"
            aria-label="Open search"
          >
            <SearchIcon className="size-3.5" />
            <span className="hidden flex-1 text-left md:inline">Search...</span>
            <kbd className="bg-muted text-muted-foreground pointer-events-none hidden rounded border px-1 font-sans text-[10px] md:inline">
              Ctrl K
            </kbd>
          </Button>
        }
      />

      <PopoverContent
        align="center"
        sideOffset={6}
        className="w-[min(28rem,calc(100vw-1.5rem))] p-0 md:w-(--radix-popover-trigger-width)"
      >
        <Command>
          <CommandInput placeholder="Search pages..." autoFocus />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            {navGroups.map((group) => (
              <CommandGroup key={group.label} heading={group.label} className="lg:w-100">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <CommandItem
                      key={item.to}
                      value={`${group.label} ${item.label}`}
                      onSelect={() => goTo(item.to)}
                    >
                      <Icon />
                      {item.label}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default GlobalSearch;
