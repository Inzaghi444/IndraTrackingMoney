import { Suspense } from 'react';
import Link from 'next/link';
import { Receipt } from 'lucide-react';

import { requireUser } from '@/lib/session';
import { listTransactions, getFilterOptions, getFilteredTotals } from '@/server/queries/transactions';
import { listCategoriesFlat } from '@/server/queries/categories';
import { getDefaultWallet } from '@/server/queries/wallets';
import { getPresetRange, type DatePreset } from '@/lib/dates';
import { formatRupiah } from '@/lib/money';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { TransactionFilters } from '@/components/transactions/transaction-filters';
import { TransactionList } from '@/components/transactions/transaction-list';
import { QuickAdd } from '@/components/transactions/quick-add';

export const metadata = { title: 'Transaksi' };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await requireUser();
  const params = await searchParams;

  const page = Number(typeof params.page === 'string' ? params.page : 1) || 1;
  const preset = (typeof params.preset === 'string' ? params.preset : 'this-month') as DatePreset;
  const range = getPresetRange(preset);

  const filters = {
    search: typeof params.q === 'string' ? params.q : undefined,
    type:
      typeof params.type === 'string'
        ? (params.type as 'income' | 'expense' | 'transfer')
        : undefined,
    categoryId: typeof params.category === 'string' ? params.category : undefined,
    walletId: typeof params.wallet === 'string' ? params.wallet : undefined,
    startDate: range.start,
    endDate: range.end,
    page,
    pageSize: 30,
  };

  const [data, totals, options, categories, defaultWallet] = await Promise.all([
    listTransactions(user.id, filters),
    getFilteredTotals(user.id, filters),
    getFilterOptions(user.id),
    listCategoriesFlat(user.id),
    getDefaultWallet(user.id),
  ]);

  const totalPages = Math.max(Math.ceil(data.total / data.pageSize), 1);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight sm:text-xl">Transaksi</h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            {data.total} transaksi ditemukan
          </p>
        </div>
        <QuickAdd
          categories={categories}
          wallets={options.wallets}
          defaultWalletId={defaultWallet?.id}
        />
      </div>

      {/* Ringkasan hasil filter */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="px-4 py-3">
          <p className="text-[11px] text-muted-foreground">Pemasukan (terfilter)</p>
          <p className="tabular mt-0.5 text-sm font-semibold text-income">
            {formatRupiah(totals.income)}
          </p>
        </Card>
        <Card className="px-4 py-3">
          <p className="text-[11px] text-muted-foreground">Pengeluaran (terfilter)</p>
          <p className="tabular mt-0.5 text-sm font-semibold text-expense">
            {formatRupiah(totals.expense)}
          </p>
        </Card>
      </div>

      <Suspense fallback={<Skeleton className="h-24 w-full" />}>
        <TransactionFilters categories={categories} wallets={options.wallets} />
      </Suspense>

      {data.items.length === 0 ? (
        <EmptyState
          icon={<Receipt className="size-5" />}
          title={
            filters.search || filters.categoryId || filters.type
              ? 'Tidak ada transaksi yang cocok'
              : 'Belum ada transaksi di periode ini'
          }
          description={
            filters.search || filters.categoryId || filters.type
              ? 'Coba ubah kata kunci atau hapus beberapa filter.'
              : 'Mulai catat pengeluaran pertamamu — hanya butuh beberapa detik.'
          }
          action={
            <QuickAdd
              categories={categories}
              wallets={options.wallets}
              defaultWalletId={defaultWallet?.id}
            />
          }
        />
      ) : (
        <TransactionList items={data.items} />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3 pt-1">
          <p className="text-xs text-muted-foreground">
            Halaman {data.page} dari {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              asChild={data.page > 1}
              disabled={data.page <= 1}
            >
              {data.page > 1 ? (
                <Link href={buildPageHref(params, data.page - 1)}>Sebelumnya</Link>
              ) : (
                <span>Sebelumnya</span>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              asChild={data.page < totalPages}
              disabled={data.page >= totalPages}
            >
              {data.page < totalPages ? (
                <Link href={buildPageHref(params, data.page + 1)}>Berikutnya</Link>
              ) : (
                <span>Berikutnya</span>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function buildPageHref(
  params: Record<string, string | string[] | undefined>,
  page: number,
): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (key === 'page' || typeof value !== 'string') continue;
    qs.set(key, value);
  }
  qs.set('page', String(page));
  return `?${qs.toString()}`;
}
