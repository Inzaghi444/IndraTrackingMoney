import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Delta vs periode sebelumnya.
 * `invert` dipakai untuk pengeluaran: naik = buruk (rose), turun = baik (income).
 */
export function DeltaBadge({
  value,
  invert = false,
  className,
}: {
  value: number | null;
  invert?: boolean;
  className?: string;
}) {
  if (value === null) {
    return (
      <span className={cn('text-[11px] text-muted-foreground', className)}>
        belum ada pembanding
      </span>
    );
  }

  const rounded = Math.round(value * 10) / 10;
  const isFlat = Math.abs(rounded) < 0.05;
  const isUp = rounded > 0;

  // arah "baik" tergantung konteks
  const good = invert ? !isUp : isUp;

  const Icon = isFlat ? Minus : isUp ? TrendingUp : TrendingDown;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-[11px] font-medium',
        isFlat ? 'text-muted-foreground' : good ? 'text-income' : 'text-expense',
        className,
      )}
    >
      <Icon className="size-3" />
      {isFlat ? 'sama' : `${isUp ? '+' : ''}${rounded.toLocaleString('id-ID')}%`}
      <span className="font-normal text-muted-foreground">vs periode lalu</span>
    </span>
  );
}
