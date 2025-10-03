import { MapProvider } from '@/providers/MapProvider';
import { UserProvider } from '@/providers/UserProvider';

export default function ClientLayout({ children }) {
  return (
    <UserProvider>
      <MapProvider>
        {children}
      </MapProvider>
    </UserProvider>
  );
}
