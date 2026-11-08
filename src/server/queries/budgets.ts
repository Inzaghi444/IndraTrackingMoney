import 'server-only';

import { db } from '@/lib/db';
import { getPeriodRange, daysInPeriod, daysElapsedInPeriod, toDateString, type Period } from '@/lib/dates';

export type BudgetStatus = {
  id: string;
  categoryId: string | null;
  categoryName: string;
  categoryColor: string;
  period: Period;
  amount: number;
  spent: number;
  remaining: number;
  percent: number;
  state: 'safe' | 'warning' | 'over';
  alertThreshold: number;
  projectedTotal: number;
  daysLeft: number;
  periodStart: string;
  periodEnd: string;
};

/**
 * Status semua budget aktif.
 *
 * Evaluasi dilakukan saat dibaca (bukan disimpan) supaya selalu akurat
 * tanpa perlu job sinkronisasi. Satu query untuk semua budget.
 */
export async function getBudgetStatuses(userId: string): Promise<BudgetStatus[]> {
  const budgets = await db.budget.findMany({
    where: { userId, isActive: true },
    include: {
      category: { select: { id: true, name: true, color: true } },
    },
    orderBy: [{ categoryId: 'asc' }, { period: 'asc' }],
  });

  if (budgets.length === 0) return [];

  // Hitung agregasi per budget di satu query menggunakan lateral join
  const results = await Promise.all(
    budgets.map(async (budget) => {
      const { start, end } = getPeriodRange(budget.period as Period);
      const startStr = toDateString(start);
      const endStr = toDateString(end);

      const rows = await db.$queryRaw<{ spent: bigint | null }[]>`
        SELECT COALESCE(SUM(amount), 0) AS spent
        FROM transactions
        WHERE user_id = ${userId}
          AND type = 'expense'
          AND deleted_at IS NULL
          AND occurred_on BETWEEN ${startStr}::date AND ${endStr}::date
          AND (${budget.categoryId}::text IS NULL OR category_id = ${budget.categoryId})
      `;

      const spent = Number(rows[0]?.spent ?? 0);
      const amount = Number(budget.amount);
      const percent = amount > 0 ? (spent / amount) * 100 : 0;

      const totalDays = daysInPeriod(budget.period as Period);
      const elapsed = Math.max(daysElapsedInPeriod(budget.period as Period), 1);
      const projectedTotal = (spent / elapsed) * totalDays;

      return {
        id: budget.id,
        categoryId: budget.categoryId,
        categoryName: budget.category?.name ?? 'Total pengeluaran',
        categoryColor: budget.category?.color ?? '#0F766E',
        period: budget.period as Period,
        amount,
        spent,
        remaining: amount - spent,
        percent,
        state:
          percent >= 100 ? 'over' : percent >= budget.alertThreshold ? 'warning' : 'safe',
        alertThreshold: budget.alertThreshold,
        projectedTotal: Math.round(projectedTotal),
        daysLeft: Math.max(totalDays - elapsed, 0),
        periodStart: start.toISOString(),
        periodEnd: end.toISOString(),
      } satisfies BudgetStatus;
    }),
  );

  return results;
}

/** Ringkas: budget paling kritis untuk widget dashboard */
export async function getCriticalBudgets(userId: string, limit = 3) {
  const all = await getBudgetStatuses(userId);
  return all.sort((a, b) => b.percent - a.percent).slice(0, limit);
}

/** Budget mentah untuk form edit */
export async function listBudgets(userId: string) {
  const budgets = await db.budget.findMany({
    where: { userId, isActive: true },
    include: { category: { select: { id: true, name: true, color: true } } },
    orderBy: { createdAt: 'asc' },
  });

  return budgets.map((b) => ({
    id: b.id,
    categoryId: b.categoryId,
    categoryName: b.category?.name ?? 'Total pengeluaran',
    categoryColor: b.category?.color ?? '#0F766E',
    period: b.period as Period,
    amount: Number(b.amount),
    alertThreshold: b.alertThreshold,
  }));
}
