'use client';

import { useRouter } from 'next/navigation';
import { clearSession } from '@/lib/auth/session';
import { Button } from '@/components/ui/button';

export function LogoutButton() {
  const router = useRouter();
  return (
    <Button
      variant="outline"
      size="sm"
      className="w-full"
      onClick={() => {
        clearSession();
        router.push('/login');
      }}
    >
      Sign out
    </Button>
  );
}
