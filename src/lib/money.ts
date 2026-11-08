/**
 * Semua format uang terpusat di sini.
 *
 * Nominal disimpan sebagai BIGINT rupiah penuh (tanpa sen), jadi konversi
 * ke/dari number hanya terjadi di batas tampilan & input.
 */

const idr = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/** Rp1.250.000 */
export function formatRupiah(value: number | bigint): string {
  return idr.format(typeof value === 'bigint' ? Number(value) : value);
}

/** Rp1.250.000 → dipakai di sumbu grafik: "1,2 jt" */
export function formatCompactRupiah(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1).replace('.', ',')} M`;
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1).replace('.', ',')} jt`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(0)} rb`;
  return String(value);
}

/** 1250000 → "1.250.000" (untuk input, tanpa simbol) */
export function formatNumber(value: number | bigint): string {
  return new Intl.NumberFormat('id-ID').format(
    typeof value === 'bigint' ? Number(value) : value,
  );
}

/** "1.250.000" / "1250000" / "Rp 1.250.000" → 1250000 */
export function parseRupiah(input: string): number {
  const digits = input.replace(/[^\d]/g, '');
  return digits ? Number(digits) : 0;
}

/** Untuk konversi BigInt dari DB ke number di boundary UI */
export function toNumber(value: bigint | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  return typeof value === 'bigint' ? Number(value) : value;
}
