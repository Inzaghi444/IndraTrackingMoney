import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { Sidebar } from '@/components/layout/sidebar';
import { Topbar } from '@/components/layout/topbar';
import { BottomNav } from '@/components/layout/bottom-nav';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session?.user) redirect('/login');

  return (
    <div className="min-h-dvh">
      <Sidebar />

      <div className="lg:pl-60">
        <Topbar user={{ name: session.user.name, email: session.user.email }} />

        {/* pb-24 memberi ruang untuk bottom nav di mobile */}
        <main className="mx-auto w-full max-w-7xl px-4 pb-24 pt-5 sm:px-6 lg:pb-10">
          {children}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}
