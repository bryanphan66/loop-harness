import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { LogoutButton } from '@/components/layout/logout-button';

/** Server-side route gate: every (app) page requires the access-token cookie. */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  if (!cookieStore.get('access_token')?.value) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 flex-col border-r border-border bg-white p-4">
        <span className="mb-6 text-lg font-semibold">__PROJECT_SLUG__</span>
        <nav className="flex flex-col gap-1 text-sm">
          <Link href="/dashboard" className="rounded-md px-3 py-2 hover:bg-primary/5">
            Dashboard
          </Link>
          <Link href="/users" className="rounded-md px-3 py-2 hover:bg-primary/5">
            Users
          </Link>
        </nav>
        <div className="mt-auto">
          <LogoutButton />
        </div>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
