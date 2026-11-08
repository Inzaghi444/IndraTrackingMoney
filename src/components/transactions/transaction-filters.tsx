'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback, useEffect, useState, useTransition } from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

const PRESETS = [
  { value: 'this-month', label: 'Bulan ini' },
  { value: 'last-month', label: 'Bulan lalu' },
  { value: '7d', label: '7 hari' },
  { value: '30d', label: '30 hari' },
  { value: 'all', label: 'Semua' },
] as const;

export function TransactionFilters({
  categories,
  wallets,
}: {
  categories: { id: string; name: string; type: string; parentName?: string | null }[];
  wallets: { id: string; name: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(searchParams.get('q') ?? '');

  const setParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === null || value === '') params.delete(key);
      else params.set(key, value);
      // setiap perubahan filter mengembalikan ke halaman 1
      params.delete('page');
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [pathname, router, searchParams],
  );

  // debounce pencarian 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      const current = searchParams.get('q') ?? '';
      if (search !== current) setParam('q', search || null);
    }, 300);
    return () => clearTimeout(timer);
  }, [search, searchParams, setParam]);

  const activeType = searchParams.get('type');
  const activeCategory = searchParams.get('category');
  const activeWallet = searchParams.get('wallet');
  const activePreset = searchParams.get('preset') ?? 'this-month';

  const hasFilters =
    !!searchParams.get('q') ||
    !!activeType ||
    !!activeCategory ||
    !!activeWallet ||
    activePreset !== 'this-month';

  function resetAll() {
    setSearch('');
    startTransition(() => router.push(pathname, { scroll: false }));
  }

  return (
    <div className="space-y-3">
      {/* Search + reset */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari deskripsi atau catatan..."
            className="pl-9"
            aria-label="Cari transaksi"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-accent"
              aria-label="Hapus pencarian"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>
        {hasFilters && (
          <Button variant="outline" size="icon" onClick={resetAll} aria-label="Reset filter">
            <X className="size-4" />
          </Button>
        )}
      </div>

      {/* Chips periode */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-thin pb-0.5">
        {PRESETS.map((p) => (
          <button
            key={p.value}
            onClick={() => setParam('preset', p.value === 'this-month' ? null : p.value)}
            className={cn(
              'shrink-0 rounded-full border px-3 py-2 text-xs font-medium transition',
              activePreset === p.value
                ? 'border-primary bg-accent text-accent-foreground'
                : 'border-border text-muted-foreground hover:text-foreground',
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Dropdown filter */}
      <div className="flex flex-wrap gap-2">
        <Select
          value={activeType ?? 'all'}
          onValueChange={(v) => setParam('type', v === 'all' ? null : v)}
        >
          <SelectTrigger size="sm" className="w-auto min-w-[120px] gap-1.5">
            <SlidersHorizontal className="size-3.5 opacity-60" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua tipe</SelectItem>
            <SelectItem value="expense">Pengeluaran</SelectItem>
            <SelectItem value="income">Pemasukan</SelectItem>
            <SelectItem value="transfer">Transfer</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={activeCategory ?? 'all'}
          onValueChange={(v) => setParam('category', v === 'all' ? null : v)}
        >
          <SelectTrigger size="sm" className="w-auto min-w-[130px]">
            <SelectValue placeholder="Kategori" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua kategori</SelectItem>
            {categories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.parentName ? `${c.parentName} › ${c.name}` : c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {wallets.length > 1 && (
          <Select
            value={activeWallet ?? 'all'}
            onValueChange={(v) => setParam('wallet', v === 'all' ? null : v)}
          >
            <SelectTrigger size="sm" className="w-auto min-w-[110px]">
              <SelectValue placeholder="Dompet" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua dompet</SelectItem>
              {wallets.map((w) => (
                <SelectItem key={w.id} value={w.id}>
                  {w.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {isPending && (
        <div className="h-0.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full w-1/3 animate-pulse rounded-full bg-primary" />
        </div>
      )}
    </div>
  );
}
