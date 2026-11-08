import { Suspense } from 'react';
import Link from 'next/link';
import { Wallet, ArrowDownLeft, ArrowUpRight, PiggyBank, Plus } from 'lucide-react';

import { requireUser } from '@/lib/session';
import {
  getDashboardSummary,
  getCashflowSeries,
  getCategoryBreakdown,
  getRecentTransactions,
} from '@/server/queries/dashboard';
import { getCriticalBudgets } from '@/server/queries/budgets';
import { getPeriodRange, getLastNMonthsRange, formatPeriodLabel, buildDateSeries } from '@/lib/dates';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { DeltaBadge } from '@/components/shared/delta-badge';
import { CashflowChart } from '@/components/dashboard/cashflow-chart';
import { CategoryDonut } from '@/components/dashboard/category-donut';
import { BudgetMiniList } from '@/components/dashboard/budget-mini-list';
import { RecentTransactions } from '@/components/dashboard/recent-transactions';
import { DashboardSkeleton } from '@/components/dashboard/dashboard-skeleton';

export const metadata = { title: 'Dashboard' };

export default async function DashboardPage() {
  const user = await requireUser();

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight sm:text-xl">Dashboard</h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Ringkasan keuanganmu · {formatPeriodLabel('monthly')}
          </p>
        </div>
        <Button asChild size="sm" className="hidden sm:inline-flex">
          <Link href="/transactions?new=1">
            <Plus className="size-4" />
            Catat
          </Link>
        </Button>
      </div>

      <Suspense fallback={<DashboardSkeleton />}>
        <DashboardContent userId={user.id} />
      </Suspense>
    </div>
  );
}

async function DashboardContent({ userId }: { userId: string }) {
  const monthRange = getPeriodRange('monthly');
  const cashflowRange = getLastNMonthsRange(6);

  // Semua query dijalankan paralel — tidak ada waterfall.
  const [summary, cashflow, categories, recent, budgets] = await Promise.all([
    getDashboardSummary(userId, 'monthly'),
    getCashflowSeries(userId, cashflowRange.start, cashflowRange.end, 'month'),
    getCategoryBreakdown(userId, monthRange.start, monthRange.end, 'expense', 5),
    getRecentTransactions(userId, 5),
    getCriticalBudgets(userId, 3),
  ]);

  // isi bulan yang kosong supaya grafik tidak bolong
  const series = buildDateSeries(cashflowRange.start, cashflowRange.end, 'month').map((b) => {
    const found = cashflow.find((c) => c.key === b.key);
    return { key: b.key, income: found?.income ?? 0, expense: found?.expense ?? 0 };
  });

  const savingRate =
    summary.totalIncome > 0
      ? ((summary.totalIncome - summary.totalExpense) / summary.totalIncome) * 100
      : null;

  return (
    <>
      {/* KPI */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
        <KpiCard
          label="Sisa saldo"
          value={summary.balance}
          icon={Wallet}
          tone="primary"
          footer={
            <span className="text-[11px] text-muted-foreground">dari semua dompet</span>
          }
        />
        <KpiCard
          label="Pemasukan bulan ini"
          value={summary.totalIncome}
          icon={ArrowDownLeft}
          tone="income"
          footer={<DeltaBadge value={summary.incomeDelta} />}
        />
        <KpiCard
          label="Pengeluaran bulan ini"
          value={summary.totalExpense}
          icon={ArrowUpRight}
          tone="expense"
          footer={<DeltaBadge value={summary.expenseDelta} invert />}
        />
        <KpiCard
          label="Rasio tabungan"
          value={Math.max(summary.totalIncome - summary.totalExpense, 0)}
          icon={PiggyBank}
          footer={
            <span className="text-[11px] text-muted-foreground">
              {savingRate === null
                ? 'belum ada pemasukan'
                : `${savingRate.toFixed(0)}% dari pemasukan`}
            </span>
          }
        />
      </div>

      {/* Grafik + donut */}
      <div className="grid min-w-0 gap-4 lg:grid-cols-3">
        <Card className="min-w-0 overflow-hidden lg:col-span-2">
          <CardContent className="min-w-0 pt-5">
            <CashflowChart data={series} />
          </CardContent>
        </Card>

        <Card className="min-w-0 overflow-hidden">
          <CardHeader>
            <CardTitle>Pengeluaran per kategori</CardTitle>
          </CardHeader>
          <CardContent className="min-w-0">
            <CategoryDonut slices={categories} />
          </CardContent>
        </Card>
      </div>

      {/* Budget + transaksi terbaru */}
      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <Card className="min-w-0 overflow-hidden">
          <CardHeader>
            <CardTitle>Anggaran bulan ini</CardTitle>
          </CardHeader>
          <CardContent className="min-w-0">
            <BudgetMiniList budgets={budgets} />
          </CardContent>
        </Card>

        <Card className="min-w-0 overflow-hidden">
          <CardHeader>
            <CardTitle>Transaksi terbaru</CardTitle>
          </CardHeader>
          <CardContent className="min-w-0">
            <RecentTransactions items={recent} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
