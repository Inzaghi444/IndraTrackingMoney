import { cn } from '@/lib/utils';
import { formatRupiah } from '@/lib/money';

/**
 * Menampilkan nominal dengan arah yang jelas:
 * income → +hijau, expense → -rose, transfer → netral.
 * Warna TIDAK pernah dipakai untuk hal lain di aplikasi ini.
 */
export function MoneyAmount({
  value,
  type,
  className,
  showSign = true,
}: {
  value: number;
  type?: 'income' | 'expense' | 'transfer';
  className?: string;
  showSign?: boolean;
}) {
  const sign = !showSign ? '' : type === 'income' ? '+' : type === 'expense' ? '−' : '';

  return (
    <span
      className={cn(
        'tabular font-medium',
        type === 'income' && 'text-income',
        type === 'expense' && 'text-expense',
        className,
      )}
    >
      {sign}
      {formatRupiah(value)}
    </span>
  );
}
