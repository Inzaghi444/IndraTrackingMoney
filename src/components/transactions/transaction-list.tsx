'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Trash2, Loader2 } from 'lucide-react';

import { CategoryIcon } from '@/components/shared/category-icon';
import { MoneyAmount } from '@/components/shared/money-amount';
import { formatFriendlyDate } from '@/lib/dates';
import { deleteTransaction, restoreTransaction } from '@/server/actions/transactions';
import type { TransactionListItem } from '@/server/queries/transactions';

/**
 * Daftar transaksi dikelompokkan per tanggal.
 * Hapus memakai soft delete + undo toast (bukan modal konfirmasi),
 * karena menghapus transaksi adalah aksi yang sering & mudah dibatalkan.
 */
export function TransactionList({ items }: { items: TransactionListItem[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const groups = groupByDate(items);

  function handleDelete(item: TransactionListItem) {
    setDeletingId(item.id);

    startTransition(async () => {
      const result = await deleteTransaction({ id: item.id });
      setDeletingId(null);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success('Transaksi dihapus', {
        description: item.description,
        action: {
          label: 'Urungkan',
          onClick: async () => {
            const restore = await restoreTransaction({ id: item.id });
            if (restore.ok) {
              toast.success('Transaksi dikembalikan');
              router.refresh();
            } else {
              toast.error('Gagal mengembalikan transaksi');
            }
          },
        },
        duration: 6000,
      });

      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      {groups.map((group) => {
        const dayTotal = group.items.reduce(
          (sum, t) =>
            t.type === 'income' ? sum + t.amount : t.type === 'expense' ? sum - t.amount : sum,
          0,
        );

        return (
          <section key={group.date}>
            <div className="mb-1.5 flex items-baseline justify-between px-1">
              <h3 className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                {formatFriendlyDate(new Date(`${group.date}T00:00:00`))}
              </h3>
              <span className="tabular text-[11px] text-muted-foreground">
                {dayTotal >= 0 ? '+' : '−'}
                {new Intl.NumberFormat('id-ID', {
                  style: 'currency',
                  currency: 'IDR',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(Math.abs(dayTotal))}
              </span>
            </div>

            <ul className="overflow-hidden rounded-xl border border-border bg-card">
              {group.items.map((t, idx) => (
                <li
                  key={t.id}
                  className={idx > 0 ? 'border-t border-border' : undefined}
                >
                  <div className="group flex items-center gap-3 px-3.5 py-3 transition hover:bg-secondary/40">
                    <Link
                      href={`/transactions/${t.id}/edit`}
                      className="flex min-w-0 flex-1 items-center gap-3"
                    >
                      <CategoryIcon icon={t.categoryIcon} color={t.categoryColor} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{t.description}</p>
                        <p className="truncate text-[11px] text-muted-foreground">
                          {t.type === 'transfer'
                            ? `${t.walletName} → ${t.transferWalletName ?? '—'}`
                            : `${t.categoryName} · ${t.walletName}`}
                        </p>
                      </div>
                      <MoneyAmount
                        value={t.amount}
                        type={t.type}
                        className="shrink-0 text-sm"
                      />
                    </Link>

                    <button
                      onClick={() => handleDelete(t)}
                      disabled={deletingId === t.id}
                      className="rounded-md p-1.5 text-muted-foreground opacity-0 transition hover:bg-destructive/10 hover:text-destructive focus:opacity-100 group-hover:opacity-100 disabled:opacity-50"
                      aria-label={`Hapus ${t.description}`}
                    >
                      {deletingId === t.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="size-3.5" />
                      )}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

function groupByDate(items: TransactionListItem[]) {
  const map = new Map<string, TransactionListItem[]>();
  for (const item of items) {
    const list = map.get(item.occurredOn) ?? [];
    list.push(item);
    map.set(item.occurredOn, list);
  }
  return Array.from(map.entries())
    .map(([date, list]) => ({ date, items: list }))
    .sort((a, b) => b.date.localeCompare(a.date));
}
