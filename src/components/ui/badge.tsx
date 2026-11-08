import { cn } from '@/lib/utils';

type Tone = 'neutral' | 'income' | 'expense' | 'warning' | 'primary';

const tones: Record<Tone, string> = {
  neutral: 'bg-muted text-muted-foreground',
  income: 'bg-income-soft text-income',
  expense: 'bg-expense-soft text-expense',
  warning: 'bg-warning-soft text-warning',
  primary: 'bg-accent text-accent-foreground',
};

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: React.ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
