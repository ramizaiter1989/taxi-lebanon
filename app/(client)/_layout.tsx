import React, { ReactNode } from 'react';
import { MapProvider } from '@/providers/MapProvider';
import { UserProvider } from '@/providers/UserProvider';

type ClientLayoutProps = {
  children: ReactNode;
};

export default function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <UserProvider>
      <MapProvider>
        {children}
      </MapProvider>
    </UserProvider>
  );
}
