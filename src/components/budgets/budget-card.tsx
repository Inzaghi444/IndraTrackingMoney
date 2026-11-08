import { AlertTriangle, CheckCircle2, Flame } from 'lucide-react';
import type { BudgetStatus } from '@/server/queries/budgets';
import { formatRupiah } from '@/lib/money';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DeleteBudgetButton } from '@/components/budgets/budget-form-dialog';
import { cn } from '@/lib/utils';

const STATE = {
  safe: {
    bar: 'bg-income',
    tone: 'income' as const,
    label: 'Aman',
    icon: CheckCircle2,
  },
  warning: {
    bar: 'bg-warning',
    tone: 'warning' as const,
    label: 'Hampir habis',
    icon: AlertTriangle,
  },
  over: {
    bar: 'bg-destructive',
    tone: 'expense' as const,
    label: 'Terlampaui',
    icon: Flame,
  },
};

const PERIOD_LABEL: Record<string, string> = {
  daily: 'harian',
  weekly: 'mingguan',
  monthly: 'bulanan',
  yearly: 'tahunan',
};

export function BudgetCard({ budget }: { budget: BudgetStatus }) {
  const state = STATE[budget.state];
  const Icon = state.icon;
  const overspent = budget.remaining < 0;

  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="size-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: budget.categoryColor }}
              aria-hidden
            />
            <p className="truncate text-sm font-semibold">{budget.categoryName}</p>
          </div>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Anggaran {PERIOD_LABEL[budget.period]}
          </p>
        </div>

        <div className="flex items-center gap-1">
          <Badge tone={state.tone}>
            <Icon className="size-3" />
            {state.label}
          </Badge>
          <DeleteBudgetButton id={budget.id} />
        </div>
      </div>

      <div className="mt-4">
        <div className="mb-1.5 flex items-baseline justify-between gap-2">
          <span className="tabular text-sm font-semibold">{formatRupiah(budget.spent)}</span>
          <span className="tabular text-[11px] text-muted-foreground">
            dari {formatRupiah(budget.amount)}
          </span>
        </div>

        <Progress
          value={Math.min(budget.percent, 100)}
          className="h-2"
          indicatorClassName={state.bar}
        />

        <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <span
            className={cn(
              'tabular text-[11px] font-medium',
              overspent ? 'text-destructive' : 'text-muted-foreground',
            )}
          >
            {overspent
              ? `Lewat ${formatRupiah(Math.abs(budget.remaining))}`
              : `Sisa ${formatRupiah(budget.remaining)}`}
            <span className="ml-1 font-normal text-muted-foreground">
              ({budget.percent.toFixed(0)}%)
            </span>
          </span>

          {budget.daysLeft > 0 && !overspent && (
            <span className="text-[11px] text-muted-foreground">
              {budget.daysLeft} hari lagi
            </span>
          )}
        </div>
      </div>

      {/* Proyeksi: fitur kecil, dampak besar */}
      {!overspent && budget.daysLeft > 0 && budget.projectedTotal > budget.amount && (
        <p className="mt-3 rounded-lg bg-warning-soft px-2.5 py-1.5 text-[11px] leading-relaxed text-warning">
          Dengan laju ini, pengeluaranmu akan mencapai{' '}
          <span className="tabular font-semibold">{formatRupiah(budget.projectedTotal)}</span> —
          melebihi anggaran sebelum periode berakhir.
        </p>
      )}
    </Card>
  );
}
