'use client';

import * as React from 'react';
import { formatNumber, parseRupiah } from '@/lib/money';
import { cn } from '@/lib/utils';

/**
 * Input nominal Rupiah.
 * - hanya menerima digit
 * - menampilkan pemisah ribuan saat mengetik
 * - inputMode numeric agar numpad muncul di HP
 */
export function MoneyInput({
  value,
  onChange,
  id,
  invalid,
  autoFocus,
  placeholder = '0',
  className,
}: {
  value: string;
  onChange: (raw: string) => void;
  id?: string;
  invalid?: boolean;
  autoFocus?: boolean;
  placeholder?: string;
  className?: string;
}) {
  const display = React.useMemo(() => {
    const n = parseRupiah(value);
    return n === 0 ? '' : formatNumber(n);
  }, [value]);

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-xl border border-input bg-card px-3.5 transition',
        'focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/25',
        invalid && 'border-destructive',
        className,
      )}
    >
      <span className="text-base font-medium text-muted-foreground">Rp</span>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        autoFocus={autoFocus}
        value={display}
        placeholder={placeholder}
        onChange={(e) => onChange(String(parseRupiah(e.target.value)))}
        className="tabular h-14 w-full bg-transparent text-2xl font-semibold tracking-tight outline-none placeholder:text-muted-foreground/50"
      />
    </div>
  );
}
