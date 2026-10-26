import { useState } from 'react';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { getStaffInitials } from '@/features/admin/staff/utils';

interface EntityLogoProps {
  firstName: string;
  lastName: string;
  className?: string;
  fallBackStyle?: string;
  src?: string;
  imageStyle?: string;
  isActive?: boolean;
}

const EntityLogo = ({
  firstName,
  lastName,
  className,
  src,
  fallBackStyle,
  imageStyle,
  isActive,
}: EntityLogoProps) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative flex items-center justify-center">
      <Avatar className={className}>
        {(!src || !loaded) && (
          <AvatarFallback className={fallBackStyle}>
            {getStaffInitials(firstName, lastName)}
          </AvatarFallback>
        )}
        {src && (
          <img
            src={src}
            alt="avatar image"
            className={`aspect-square size-8 rounded-full object-cover ${loaded ? 'opacity-100' : 'absolute opacity-0'} ${imageStyle ?? ''}`}
            onLoad={() => setLoaded(true)}
            onError={() => setLoaded(false)}
          />
        )}
      </Avatar>
      {isActive && <div className="absolute right-0 bottom-0 h-2 w-2 rounded-full bg-[#17B26A]" />}
    </div>
  );
};

export default EntityLogo;
