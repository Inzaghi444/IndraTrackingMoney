import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatRupiah } from '@/lib/money';
import { Card } from '@/components/ui/card';

export function KpiCard({
  label,
  value,
  icon: Icon,
  tone = 'neutral',
  footer,
  className,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  tone?: 'neutral' | 'income' | 'expense' | 'primary';
  footer?: React.ReactNode;
  className?: string;
}) {
  const toneStyles = {
    neutral: 'bg-muted text-muted-foreground',
    income: 'bg-income-soft text-income',
    expense: 'bg-expense-soft text-expense',
    primary: 'bg-accent text-primary',
  }[tone];

  return (
    <Card className={cn('min-w-0 gap-0 overflow-hidden p-3.5 sm:p-5', className)}>
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 text-[11px] font-medium leading-snug text-muted-foreground sm:text-xs">
          {label}
        </p>
        <span
          className={cn(
            'flex size-7 shrink-0 items-center justify-center rounded-lg sm:size-8',
            toneStyles,
          )}
          aria-hidden
        >
          <Icon className="size-3.5 sm:size-4" />
        </span>
      </div>

      {/* clamp: nominal panjang turun ukuran di layar sempit, tidak meluber */}
      <p
        className={cn(
          'tabular mt-2 text-base font-semibold tracking-tight sm:text-2xl',
          'break-words [overflow-wrap:anywhere]',
          tone === 'income' && 'text-income',
          tone === 'expense' && 'text-expense',
        )}
      >
        {formatRupiah(value)}
      </p>

      {footer && <div className="mt-1.5 min-w-0">{footer}</div>}
    </Card>
  );
}
