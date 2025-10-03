// app/(client)/_layout.tsx
import React, { ReactNode } from 'react';
import { UserProvider } from '@/providers/UserProvider';
import { MapProvider } from '@/providers/MapProvider';
import { Stack } from 'expo-router';

type ClientLayoutProps = {
  children: ReactNode;
};

export default function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <UserProvider>
      <MapProvider>
        {/* Stack wrapper allows nested navigation inside client */}
        <Stack>
          {children}
        </Stack>
      </MapProvider>
    </UserProvider>
  );
}
