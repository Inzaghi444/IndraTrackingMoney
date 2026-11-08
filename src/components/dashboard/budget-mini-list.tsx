import Link from 'next/link';
import { ArrowRight, Target } from 'lucide-react';
import type { BudgetStatus } from '@/server/queries/budgets';
import { formatRupiah } from '@/lib/money';
import { Progress } from '@/components/ui/progress';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const stateStyles = {
  safe: { bar: 'bg-income', text: 'text-income', label: 'Aman' },
  warning: { bar: 'bg-warning', text: 'text-warning', label: 'Hampir habis' },
  over: { bar: 'bg-destructive', text: 'text-destructive', label: 'Terlampaui' },
} as const;

export function BudgetMiniList({ budgets }: { budgets: BudgetStatus[] }) {
  if (budgets.length === 0) {
    return (
      <EmptyState
        icon={<Target className="size-5" />}
        title="Belum ada anggaran"
        description="Tetapkan batas pengeluaran bulanan agar kamu dapat peringatan sebelum jebol."
        action={
          <Button asChild size="sm" variant="outline">
            <Link href="/budgets">Atur anggaran</Link>
          </Button>
        }
        className="border-0 py-8"
      />
    );
  }

  return (
    <div className="space-y-3.5">
      {budgets.map((b) => {
        const style = stateStyles[b.state];
        return (
          <div key={b.id}>
            <div className="mb-1.5 flex items-baseline justify-between gap-2">
              <span className="truncate text-xs font-medium">{b.categoryName}</span>
              <span className={cn('tabular text-[11px] font-medium', style.text)}>
                {b.percent.toFixed(0)}%
              </span>
            </div>

            <Progress
              value={Math.min(b.percent, 100)}
              className="h-1.5"
              indicatorClassName={style.bar}
            />

            <div className="mt-1 flex items-baseline justify-between gap-2">
              <span className="tabular text-[11px] text-muted-foreground">
                {formatRupiah(b.spent)} / {formatRupiah(b.amount)}
              </span>
              <span className={cn('text-[11px]', style.text)}>
                {b.state === 'over'
                  ? `lebih ${formatRupiah(Math.abs(b.remaining))}`
                  : `sisa ${formatRupiah(b.remaining)}`}
              </span>
            </div>
          </div>
        );
      })}

      <Link
        href="/budgets"
        className="inline-flex items-center gap-1 pt-1 text-[11px] font-medium text-primary hover:underline"
      >
        Kelola anggaran
        <ArrowRight className="size-3" />
      </Link>
    </div>
  );
}
