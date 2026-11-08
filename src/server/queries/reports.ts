import 'server-only';

import { db } from '@/lib/db';
import { getLastNMonthsRange, toDateString } from '@/lib/dates';
import { getCategoryBreakdown, type CategorySlice } from '@/server/queries/dashboard';

export type ReportBucket = {
  key: string;
  label: string;
  income: number;
  expense: number;
};

export type ReportData = {
  buckets: ReportBucket[];
  totalIncome: number;
  totalExpense: number;
  net: number;
  avgPerBucket: number;
  topCategories: CategorySlice[];
  prevTotalIncome: number;
  prevTotalExpense: number;
};

/**
 * Laporan perbandingan pemasukan vs pengeluaran per bucket waktu.
 * `trunc` menentukan granularitas: 'day' | 'week' | 'month'.
 */
export async function getReport(
  userId: string,
  start: Date,
  end: Date,
  trunc: 'day' | 'week' | 'month',
  prevStart: Date,
  prevEnd: Date,
): Promise<ReportData> {
  const fmt =
    trunc === 'month' ? 'YYYY-MM' : trunc === 'week' ? 'IYYY-"W"IW' : 'YYYY-MM-DD';

  // string tanggal, bukan Date — lihat catatan di dashboard.ts
  const startStr = toDateString(start);
  const endStr = toDateString(end);
  const prevStartStr = toDateString(prevStart);
  const prevEndStr = toDateString(prevEnd);

  const rows = await db.$queryRaw<
    { bucket: string; income: bigint; expense: bigint }[]
  >`
    SELECT
      to_char(date_trunc(${trunc}, occurred_on), ${fmt}) AS bucket,
      COALESCE(SUM(amount) FILTER (WHERE type = 'income'), 0)  AS income,
      COALESCE(SUM(amount) FILTER (WHERE type = 'expense'), 0) AS expense
    FROM transactions
    WHERE user_id = ${userId}
      AND deleted_at IS NULL
      AND occurred_on BETWEEN ${startStr}::date AND ${endStr}::date
      AND type IN ('income', 'expense')
    GROUP BY 1
    ORDER BY 1
  `;

  const prevRows = await db.$queryRaw<
    { income: bigint | null; expense: bigint | null }[]
  >`
    SELECT
      COALESCE(SUM(amount) FILTER (WHERE type = 'income'), 0)  AS income,
      COALESCE(SUM(amount) FILTER (WHERE type = 'expense'), 0) AS expense
    FROM transactions
    WHERE user_id = ${userId}
      AND deleted_at IS NULL
      AND occurred_on BETWEEN ${prevStartStr}::date AND ${prevEndStr}::date
      AND type IN ('income', 'expense')
  `;

  const buckets: ReportBucket[] = rows.map((r) => ({
    key: r.bucket,
    label: r.bucket,
    income: Number(r.income),
    expense: Number(r.expense),
  }));

  const totalIncome = buckets.reduce((s, b) => s + b.income, 0);
  const totalExpense = buckets.reduce((s, b) => s + b.expense, 0);

  const topCategories = await getCategoryBreakdown(userId, start, end, 'expense', 5);

  return {
    buckets,
    totalIncome,
    totalExpense,
    net: totalIncome - totalExpense,
    avgPerBucket: buckets.length > 0 ? totalExpense / buckets.length : 0,
    topCategories,
    prevTotalIncome: Number(prevRows[0]?.income ?? 0),
    prevTotalExpense: Number(prevRows[0]?.expense ?? 0),
  };
}

/** Perbandingan bulanan N bulan terakhir untuk grafik batang */
export async function getMonthlyComparison(userId: string, months: number) {
  const { start, end } = getLastNMonthsRange(months);
  const startStr = toDateString(start);
  const endStr = toDateString(end);

  const rows = await db.$queryRaw<
    { bucket: string; income: bigint; expense: bigint }[]
  >`
    SELECT
      to_char(date_trunc('month', occurred_on), 'YYYY-MM') AS bucket,
      COALESCE(SUM(amount) FILTER (WHERE type = 'income'), 0)  AS income,
      COALESCE(SUM(amount) FILTER (WHERE type = 'expense'), 0) AS expense
    FROM transactions
    WHERE user_id = ${userId}
      AND deleted_at IS NULL
      AND type IN ('income', 'expense')
      AND occurred_on BETWEEN ${startStr}::date AND ${endStr}::date
    GROUP BY 1
    ORDER BY 1
  `;

  return rows.map((r) => ({
    key: r.bucket,
    income: Number(r.income),
    expense: Number(r.expense),
  }));
}
