/**
 * Util tanggal.
 *
 * Prinsip: transaksi disimpan sebagai DATE (tanggal lokal), jadi semua
 * perhitungan periode memakai string "YYYY-MM-DD", bukan timestamp.
 * Ini menghindari bug klasik "transaksi tanggal 1 masuk ke bulan lalu"
 * akibat konversi timezone.
 *
 * PENTING: "hari ini" ditentukan oleh timezone pengguna (default
 * Asia/Jakarta), BUKAN timezone server. Tanpa ini, server yang berjalan
 * di UTC/Bangkok akan menggeser batas bulan dan membuat laporan salah.
 */
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  addDays,
  addMonths,
  subMonths,
  subDays,
  eachDayOfInterval,
  eachMonthOfInterval,
  format,
  isToday,
  isYesterday,
  parseISO,
  differenceInCalendarDays,
  isValid,
} from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { id as localeId } from 'date-fns/locale';

export const APP_TIMEZONE = 'Asia/Jakarta';

/**
 * "Sekarang" dalam timezone pengguna, dikembalikan sebagai Date
 * yang komponen lokalnya sudah benar. Semua perhitungan periode
 * harus berangkat dari sini — jangan pakai `new Date()` langsung.
 */
export function nowInAppTz(timezone: string = APP_TIMEZONE): Date {
  return toZonedTime(new Date(), timezone);
}

export type Period = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type Granularity = 'day' | 'week' | 'month';

/** Date → "YYYY-MM-DD" (format yang dipakai kolom DATE) */
export function toDateString(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/** "YYYY-MM-DD" → Date lokal (bukan UTC) */
export function fromDateString(value: string): Date {
  return parseISO(value);
}

/** Rentang periode untuk query laporan */
export function getPeriodRange(
  period: Period,
  anchor: Date = nowInAppTz(),
): { start: Date; end: Date } {
  switch (period) {
    case 'daily':
      return { start: startOfDay(anchor), end: endOfDay(anchor) };
    case 'weekly':
      return {
        start: startOfWeek(anchor, { weekStartsOn: 1 }),
        end: endOfWeek(anchor, { weekStartsOn: 1 }),
      };
    case 'monthly':
      return { start: startOfMonth(anchor), end: endOfMonth(anchor) };
    case 'yearly':
      return { start: startOfYear(anchor), end: endOfYear(anchor) };
  }
}

/** Rentang periode sebelumnya, untuk menghitung delta */
export function getPreviousPeriodRange(
  period: Period,
  anchor: Date = nowInAppTz(),
): { start: Date; end: Date } {
  const { start } = getPeriodRange(period, anchor);
  switch (period) {
    case 'daily':
      return getPeriodRange('daily', subDays(start, 1));
    case 'weekly':
      return getPeriodRange('weekly', subDays(start, 7));
    case 'monthly':
      return getPeriodRange('monthly', subMonths(start, 1));
    case 'yearly':
      return getPeriodRange('yearly', subDays(start, 365));
  }
}

/**
 * Rentang "N bulan terakhir" untuk grafik arus kas.
 * Selalu dihitung dari awal bulan agar label rapi.
 */
export function getLastNMonthsRange(months: number, anchor: Date = nowInAppTz()) {
  const start = startOfMonth(subMonths(anchor, months - 1));
  const end = endOfMonth(anchor);
  return { start, end };
}

/** Label tanggal yang ramah: "Hari ini", "Kemarin", "14 Feb 2026" */
export function formatFriendlyDate(date: Date): string {
  if (isToday(date)) return 'Hari ini';
  if (isYesterday(date)) return 'Kemarin';
  return format(date, 'd MMM yyyy', { locale: localeId });
}

/** "14 Feb" untuk label grafik */
export function formatShortDate(date: Date): string {
  return format(date, 'd MMM', { locale: localeId });
}

/** "Feb 2026" */
export function formatMonthLabel(date: Date): string {
  return format(date, 'MMM yyyy', { locale: localeId });
}

/** "Februari 2026" */
export function formatMonthLong(date: Date): string {
  return format(date, 'MMMM yyyy', { locale: localeId });
}

/** Label periode aktif, mis. "1 – 28 Feb 2026" */
export function formatPeriodLabel(period: Period, anchor: Date = nowInAppTz()): string {
  const { start, end } = getPeriodRange(period, anchor);
  switch (period) {
    case 'daily':
      return format(start, 'd MMMM yyyy', { locale: localeId });
    case 'weekly':
      return `${format(start, 'd MMM', { locale: localeId })} – ${format(end, 'd MMM yyyy', { locale: localeId })}`;
    case 'monthly':
      return formatMonthLong(start);
    case 'yearly':
      return format(start, 'yyyy');
  }
}

/** Jumlah hari dalam periode (untuk proyeksi budget) */
export function daysInPeriod(period: Period, anchor: Date = nowInAppTz()): number {
  const { start, end } = getPeriodRange(period, anchor);
  return differenceInCalendarDays(end, start) + 1;
}

/** Hari yang sudah berjalan dalam periode (minimal 1) */
export function daysElapsedInPeriod(period: Period, anchor: Date = nowInAppTz()): number {
  const { start, end } = getPeriodRange(period, anchor);
  const today = nowInAppTz();
  if (today < start) return 0;
  if (today > end) return differenceInCalendarDays(end, start) + 1;
  return differenceInCalendarDays(today, start) + 1;
}

/**
 * Buat deret tanggal lengkap untuk grafik, termasuk hari tanpa transaksi
 * (supaya grafik tidak "bolong"). Nilai diisi 0 oleh pemanggil.
 */
export function buildDateSeries(
  start: Date,
  end: Date,
  granularity: Granularity,
): { key: string; label: string }[] {
  if (granularity === 'month') {
    return eachMonthOfInterval({ start, end }).map((d) => ({
      key: format(d, 'yyyy-MM'),
      label: formatShortDate(d).replace(/\s\d+$/, '') || formatMonthLabel(d),
    }));
  }

  if (granularity === 'week') {
    const weeks: { key: string; label: string }[] = [];
    let cursor = startOfWeek(start, { weekStartsOn: 1 });
    while (cursor <= end) {
      weeks.push({
        key: toDateString(cursor),
        label: formatShortDate(cursor),
      });
      cursor = addDays(cursor, 7);
    }
    return weeks;
  }

  return eachDayOfInterval({ start, end }).map((d) => ({
    key: toDateString(d),
    label: formatShortDate(d),
  }));
}

/** Rentang tanggal berdasarkan preset filter riwayat */
export type DatePreset = 'today' | '7d' | '30d' | 'this-month' | 'last-month' | 'all';

export function getPresetRange(preset: DatePreset): { start?: Date; end?: Date } {
  const now = nowInAppTz();
  switch (preset) {
    case 'today':
      return { start: startOfDay(now), end: endOfDay(now) };
    case '7d':
      return { start: startOfDay(subDays(now, 6)), end: endOfDay(now) };
    case '30d':
      return { start: startOfDay(subDays(now, 29)), end: endOfDay(now) };
    case 'this-month':
      return { start: startOfMonth(now), end: endOfMonth(now) };
    case 'last-month': {
      const prev = subMonths(now, 1);
      return { start: startOfMonth(prev), end: endOfMonth(prev) };
    }
    case 'all':
      return {};
  }
}

export { addMonths, subMonths, addDays, subDays, startOfMonth, endOfMonth, isValid, differenceInCalendarDays };
