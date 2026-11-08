import Link from 'next/link';
import { ArrowRight, Receipt } from 'lucide-react';
import { CategoryIcon } from '@/components/shared/category-icon';
import { MoneyAmount } from '@/components/shared/money-amount';
import { EmptyState } from '@/components/shared/empty-state';
import { formatFriendlyDate } from '@/lib/dates';

export type RecentItem = {
  id: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  description: string;
  occurredOn: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  walletName: string;
};

export function RecentTransactions({ items }: { items: RecentItem[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Receipt className="size-5" />}
        title="Belum ada transaksi"
        description="Catat pengeluaran pertamamu supaya ringkasan di halaman ini mulai terisi."
        className="border-0 py-8"
      />
    );
  }

  return (
    <div>
      <ul className="divide-y divide-border">
        {items.map((t) => (
          <li key={t.id}>
            <Link
              href={`/transactions/${t.id}/edit`}
              className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2.5 transition hover:bg-secondary/60"
            >
              <CategoryIcon icon={t.categoryIcon} color={t.categoryColor} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{t.description}</p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {t.categoryName} · {t.walletName} · {formatFriendlyDate(new Date(`${t.occurredOn}T00:00:00`))}
                </p>
              </div>
              <MoneyAmount value={t.amount} type={t.type} className="shrink-0 text-sm" />
            </Link>
          </li>
        ))}
      </ul>

      <Link
        href="/transactions"
        className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
      >
        Lihat semua transaksi
        <ArrowRight className="size-3" />
      </Link>
    </div>
  );
}
