'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ArrowLeftRight, PieChart, Target, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/transactions', label: 'Transaksi', icon: ArrowLeftRight },
  { href: '/reports', label: 'Laporan', icon: PieChart },
  { href: '/budgets', label: 'Anggaran', icon: Target },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm lg:hidden">
      <div className="relative flex items-stretch justify-around">
        {/* dua item kiri */}
        {ITEMS.slice(0, 2).map((item) => (
          <NavLink key={item.href} {...item} active={pathname.startsWith(item.href)} />
        ))}

        {/* slot FAB */}
        <div className="w-16" aria-hidden />

        {/* dua item kanan */}
        {ITEMS.slice(2).map((item) => (
          <NavLink key={item.href} {...item} active={pathname.startsWith(item.href)} />
        ))}

        {/* FAB tengah — aksi utama harus selalu dalam jangkauan jempol */}
        <Link
          href="/transactions?new=1"
          aria-label="Catat transaksi baru"
          className="absolute left-1/2 top-0 flex size-14 -translate-x-1/2 -translate-y-1/3 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition active:scale-95"
        >
          <Plus className="size-6" strokeWidth={2.5} />
        </Link>
      </div>
    </nav>
  );
}

function NavLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors',
        active ? 'text-primary' : 'text-muted-foreground',
      )}
    >
      <Icon className="size-5" strokeWidth={active ? 2.4 : 1.9} />
      {label}
    </Link>
  );
}
