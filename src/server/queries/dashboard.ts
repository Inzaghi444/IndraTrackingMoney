import 'server-only';

import { db } from '@/lib/db';
import { toDateString, getPeriodRange, getPreviousPeriodRange, type Period } from '@/lib/dates';

export type DashboardSummary = {
  totalIncome: number;
  totalExpense: number;
  net: number;
  balance: number;
  incomeDelta: number | null;
  expenseDelta: number | null;
  periodLabel: string;
};

/**
 * Ringkasan KPI. Dua query:
 *  1. agregasi income/expense periode ini + periode sebelumnya (satu round-trip)
 *  2. saldo total dari semua wallet
 *
 * PENTING: tanggal dikirim sebagai string "YYYY-MM-DD", BUKAN objek Date.
 * Prisma mengirim Date sebagai `timestamptz`, dan `::date` di Postgres
 * meng-cast memakai timezone session (biasanya UTC) — sehingga
 * 2026-11-01T00:00 lokal (WIB) menjadi 2026-10-31 di DB dan satu hari
 * transaksi bocor ke periode sebelumnya. String tanggal bebas dari masalah ini.
 */
export async function getDashboardSummary(
  userId: string,
  period: Period = 'monthly',
): Promise<DashboardSummary> {
  const current = getPeriodRange(period);
  const previous = getPreviousPeriodRange(period);

  const curStart = toDateString(current.start);
  const curEnd = toDateString(current.end);
  const prevStart = toDateString(previous.start);
  const prevEnd = toDateString(previous.end);

  const rows = await db.$queryRaw<
    {
      cur_income: bigint | null;
      cur_expense: bigint | null;
      prev_income: bigint | null;
      prev_expense: bigint | null;
    }[]
  >`
    SELECT
      COALESCE(SUM(amount) FILTER (
        WHERE type = 'income' AND occurred_on BETWEEN ${curStart}::date AND ${curEnd}::date
      ), 0) AS cur_income,
      COALESCE(SUM(amount) FILTER (
        WHERE type = 'expense' AND occurred_on BETWEEN ${curStart}::date AND ${curEnd}::date
      ), 0) AS cur_expense,
      COALESCE(SUM(amount) FILTER (
        WHERE type = 'income' AND occurred_on BETWEEN ${prevStart}::date AND ${prevEnd}::date
      ), 0) AS prev_income,
      COALESCE(SUM(amount) FILTER (
        WHERE type = 'expense' AND occurred_on BETWEEN ${prevStart}::date AND ${prevEnd}::date
      ), 0) AS prev_expense
    FROM transactions
    WHERE user_id = ${userId} AND deleted_at IS NULL
  `;

  const r = rows[0];
  const totalIncome = Number(r?.cur_income ?? 0);
  const totalExpense = Number(r?.cur_expense ?? 0);
  const prevIncome = Number(r?.prev_income ?? 0);
  const prevExpense = Number(r?.prev_expense ?? 0);

  const balance = await getTotalBalance(userId);

  return {
    totalIncome,
    totalExpense,
    net: totalIncome - totalExpense,
    balance,
    incomeDelta: percentDelta(totalIncome, prevIncome),
    expenseDelta: percentDelta(totalExpense, prevExpense),
    periodLabel: period,
  };
}

function percentDelta(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

/**
 * Saldo = saldo awal semua wallet + income - expense + transfer masuk - transfer keluar.
 * Tidak pernah disimpan sebagai kolom — selalu dihitung.
 */
export async function getTotalBalance(userId: string): Promise<number> {
  const rows = await db.$queryRaw<{ balance: bigint | null }[]>`
    SELECT
      COALESCE((
        SELECT SUM(initial_balance) FROM wallets
        WHERE user_id = ${userId} AND is_archived = false
      ), 0)
      + COALESCE((
        SELECT SUM(amount) FROM transactions
        WHERE user_id = ${userId} AND type = 'income' AND deleted_at IS NULL
      ), 0)
      - COALESCE((
        SELECT SUM(amount) FROM transactions
        WHERE user_id = ${userId} AND type = 'expense' AND deleted_at IS NULL
      ), 0)
      AS balance
  `;
  return Number(rows[0]?.balance ?? 0);
}

/** Deret arus kas harian/bulanan untuk area chart */
export async function getCashflowSeries(
  userId: string,
  start: Date,
  end: Date,
  granularity: 'day' | 'month',
): Promise<{ key: string; income: number; expense: number }[]> {
  const trunc = granularity === 'month' ? 'month' : 'day';
  const fmt = granularity === 'month' ? 'YYYY-MM' : 'YYYY-MM-DD';
  const startStr = toDateString(start);
  const endStr = toDateString(end);

  const rows = await db.$queryRaw<{ bucket: string; income: bigint; expense: bigint }[]>`
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

  return rows.map((r) => ({
    key: r.bucket,
    income: Number(r.income),
    expense: Number(r.expense),
  }));
}

export type CategorySlice = {
  id: string;
  name: string;
  color: string;
  icon: string;
  total: number;
  percent: number;
};

/** Top kategori pengeluaran (atau pemasukan) dalam rentang tanggal */
export async function getCategoryBreakdown(
  userId: string,
  start: Date,
  end: Date,
  type: 'expense' | 'income' = 'expense',
  limit = 6,
): Promise<CategorySlice[]> {
  const startStr = toDateString(start);
  const endStr = toDateString(end);

  const rows = await db.$queryRaw<
    { id: string; name: string; color: string; icon: string; total: bigint }[]
  >`
    SELECT c.id, c.name, c.color, c.icon, SUM(t.amount) AS total
    FROM transactions t
    JOIN categories c ON c.id = t.category_id
    WHERE t.user_id = ${userId}
      AND t.deleted_at IS NULL
      AND t.type = ${type}::"TransactionType"
      AND t.occurred_on BETWEEN ${startStr}::date AND ${endStr}::date
    GROUP BY c.id, c.name, c.color, c.icon
    ORDER BY total DESC
  `;

  const grandTotal = rows.reduce((sum, r) => sum + Number(r.total), 0);

  // gabungkan sisanya jadi "Lainnya" agar donut tidak jadi 30 potongan
  const head = rows.slice(0, limit);
  const tail = rows.slice(limit);

  const slices: CategorySlice[] = head.map((r) => ({
    id: r.id,
    name: r.name,
    color: r.color,
    icon: r.icon,
    total: Number(r.total),
    percent: grandTotal > 0 ? (Number(r.total) / grandTotal) * 100 : 0,
  }));

  if (tail.length > 0) {
    const restTotal = tail.reduce((sum, r) => sum + Number(r.total), 0);
    slices.push({
      id: '__other__',
      name: `Lainnya (${tail.length})`,
      color: '#94A3B8',
      icon: 'ellipsis',
      total: restTotal,
      percent: grandTotal > 0 ? (restTotal / grandTotal) * 100 : 0,
    });
  }

  return slices;
}

/** Transaksi terbaru untuk dashboard */
export async function getRecentTransactions(userId: string, limit = 5) {
  const rows = await db.transaction.findMany({
    where: { userId, deletedAt: null },
    orderBy: [{ occurredOn: 'desc' }, { createdAt: 'desc' }],
    take: limit,
    include: {
      category: { select: { name: true, color: true, icon: true } },
      wallet: { select: { name: true } },
    },
  });

  return rows.map((t) => ({
    id: t.id,
    type: t.type,
    amount: Number(t.amount),
    description: t.description,
    occurredOn: toDateString(t.occurredOn),
    categoryName: t.category?.name ?? 'Transfer',
    categoryColor: t.category?.color ?? '#64748B',
    categoryIcon: t.category?.icon ?? 'arrow-left-right',
    walletName: t.wallet.name,
  }));
}
