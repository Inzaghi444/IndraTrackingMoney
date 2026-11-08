'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import Link from 'next/link';
import { LogOut, Moon, Sun, User, Wallet } from 'lucide-react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { signOut } from '@/lib/auth-client';

export function Topbar({ user }: { user: { name: string; email: string } }) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [isPending, startTransition] = useTransition();
  const [menuOpen, setMenuOpen] = useState(false);

  const greeting = (() => {
    const hour = new Date().getHours();
    if (hour < 11) return 'Selamat pagi';
    if (hour < 15) return 'Selamat siang';
    if (hour < 19) return 'Selamat sore';
    return 'Selamat malam';
  })();

  const firstName = user.name.split(' ')[0];

  function handleLogout() {
    startTransition(async () => {
      await signOut();
      toast.success('Kamu sudah keluar.');
      router.push('/login');
      router.refresh();
    });
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/85 px-4 backdrop-blur-sm sm:px-6">
      {/* Mobile: brand */}
      <Link href="/dashboard" className="flex items-center gap-2 lg:hidden">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Wallet className="size-4" />
        </span>
        <span className="text-sm font-semibold tracking-tight">Duitrack</span>
      </Link>

      {/* Desktop: sapaan */}
      <div className="hidden min-w-0 lg:block">
        <p className="truncate text-sm font-medium">
          {greeting}, {firstName} 👋
        </p>
        <p className="truncate text-xs text-muted-foreground">
          Ini ringkasan keuanganmu hari ini.
        </p>
      </div>

      <div className="flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          aria-label="Ganti tema"
        >
          <Sun className="size-4.5 dark:hidden" />
          <Moon className="hidden size-4.5 dark:block" />
        </Button>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex size-10 items-center justify-center rounded-full bg-secondary text-sm font-semibold uppercase text-secondary-foreground transition hover:ring-2 hover:ring-ring/30"
            aria-label="Menu akun"
            aria-expanded={menuOpen}
          >
            {firstName.slice(0, 1) || <User className="size-4" />}
          </button>

          {menuOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setMenuOpen(false)}
                aria-hidden
              />
              <div className="absolute right-0 top-12 z-40 w-56 animate-slide-up rounded-xl border border-border bg-popover p-1.5 shadow-lg">
                <div className="border-b border-border px-2.5 py-2">
                  <p className="truncate text-sm font-medium">{user.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                </div>
                <Link
                  href="/settings"
                  onClick={() => setMenuOpen(false)}
                  className="mt-1 flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm text-muted-foreground transition hover:bg-accent hover:text-accent-foreground"
                >
                  <User className="size-4" />
                  Pengaturan akun
                </Link>
                <button
                  onClick={handleLogout}
                  disabled={isPending}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-2 text-sm text-destructive transition hover:bg-destructive/10 disabled:opacity-50"
                >
                  <LogOut className="size-4" />
                  {isPending ? 'Keluar...' : 'Keluar'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
