import { Suspense } from 'react';
import { TrendingUp, TrendingDown, Scale, Lightbulb } from 'lucide-react';

import { requireUser } from '@/lib/session';
import { getReport } from '@/server/queries/reports';
import {
  getPeriodRange,
  getPreviousPeriodRange,
  formatPeriodLabel,
  addMonths,
  startOfMonth,
  type Period,
} from '@/lib/dates';
import { formatRupiah } from '@/lib/money';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ComparisonChart } from '@/components/reports/comparison-chart';
import { TopCategories } from '@/components/reports/top-categories';
import { PeriodTabs } from '@/components/reports/period-tabs';

export const metadata = { title: 'Laporan' };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ReportsPage({ searchParams }: { searchParams: SearchParams }) {
  const user = await requireUser();
  const params = await searchParams;

  const period = (
    ['daily', 'weekly', 'monthly'].includes(String(params.period))
      ? params.period
      : 'monthly'
  ) as Period;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold tracking-tight sm:text-xl">Laporan</h1>
        <p className="text-xs text-muted-foreground sm:text-sm">
          Bandingkan pemasukan dan pengeluaran per periode.
        </p>
      </div>

      <Suspense fallback={<Skeleton className="h-10 w-64" />}>
        <PeriodTabs />
      </Suspense>

      <Suspense key={period} fallback={<ReportSkeleton />}>
        <ReportContent userId={user.id} period={period} />
      </Suspense>
    </div>
  );
}

async function ReportContent({ userId, period }: { userId: string; period: Period }) {
  const range = getPeriodRange(period);
  const prevRange = getPreviousPeriodRange(period);

  // Grafik: untuk bulanan tampilkan 6 bulan terakhir agar tren terlihat.
  // KPI & kategori tetap dihitung HANYA untuk periode aktif — kalau tidak,
  // angka "Total pengeluaran" akan mencampur 6 bulan dan menyesatkan.
  const trunc = period === 'monthly' ? 'month' : 'day';
  const chartStart =
    period === 'monthly' ? startOfMonth(addMonths(range.start, -5)) : range.start;

  const [report, summary] = await Promise.all([
    // data grafik (rentang panjang)
    getReport(userId, chartStart, range.end, trunc, prevRange.start, prevRange.end),
    // data KPI (rentang periode aktif saja)
    getReport(userId, range.start, range.end, trunc, prevRange.start, prevRange.end),
  ]);

  const incomeDelta = delta(summary.totalIncome, summary.prevTotalIncome);
  const expenseDelta = delta(summary.totalExpense, summary.prevTotalExpense);

  const buckets = report.buckets.map((b) => ({
    label:
      trunc === 'month'
        ? new Date(`${b.key}-01T00:00:00`).toLocaleDateString('id-ID', {
            month: 'short',
            year: '2-digit',
          })
        : new Date(`${b.key}T00:00:00`).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
          }),
    income: b.income,
    expense: b.expense,
  }));

  return (
    <>
      <p className="-mt-1 text-xs text-muted-foreground">
        Periode: <span className="font-medium text-foreground">{formatPeriodLabel(period)}</span>
      </p>

      {/* Ringkasan */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryCard
          label="Total pemasukan"
          value={summary.totalIncome}
          delta={incomeDelta}
          icon={TrendingUp}
          tone="income"
        />
        <SummaryCard
          label="Total pengeluaran"
          value={summary.totalExpense}
          delta={expenseDelta}
          icon={TrendingDown}
          tone="expense"
          invertDelta
        />
        <SummaryCard
          label="Selisih (net)"
          value={summary.net}
          icon={Scale}
          tone={summary.net >= 0 ? 'income' : 'expense'}
        />
      </div>

      {/* Insight otomatis */}
      {summary.prevTotalExpense > 0 && (
        <Card className="border-primary/20 bg-accent/40">
          <CardContent className="flex gap-2.5 py-3.5">
            <Lightbulb className="mt-0.5 size-4 shrink-0 text-primary" />
            <p className="text-xs leading-relaxed">
              {expenseDelta !== null && expenseDelta > 0 ? (
                <>
                  Pengeluaran periode ini <strong>naik {expenseDelta.toFixed(0)}%</strong> (
                  {formatRupiah(summary.totalExpense - summary.prevTotalExpense)}) dibanding
                  periode sebelumnya
                  {summary.topCategories[0] && (
                    <>
                      , terbesar di kategori{' '}
                      <strong>{summary.topCategories[0].name}</strong>
                    </>
                  )}
                  .
                </>
              ) : expenseDelta !== null && expenseDelta < 0 ? (
                <>
                  Bagus! Pengeluaran periode ini{' '}
                  <strong>turun {Math.abs(expenseDelta).toFixed(0)}%</strong> (
                  {formatRupiah(summary.prevTotalExpense - summary.totalExpense)}) dibanding
                  periode sebelumnya.
                </>
              ) : (
                <>Pengeluaran periode ini sama dengan periode sebelumnya.</>
              )}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Grafik perbandingan */}
      <Card>
        <CardHeader>
          <CardTitle>Perbandingan pemasukan & pengeluaran</CardTitle>
          <CardDescription>
            {period === 'monthly'
              ? '6 bulan terakhir'
              : formatPeriodLabel(period)}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {buckets.length === 0 ? (
            <p className="py-12 text-center text-xs text-muted-foreground">
              Belum ada transaksi pada periode ini.
            </p>
          ) : (
            <ComparisonChart data={buckets} />
          )}
        </CardContent>
      </Card>

      {/* Kategori terbesar */}
      <Card>
        <CardHeader>
          <CardTitle>Kategori pengeluaran terbesar</CardTitle>
          <CardDescription>{formatPeriodLabel(period)}</CardDescription>
        </CardHeader>
        <CardContent>
          <TopCategories slices={summary.topCategories} />
        </CardContent>
      </Card>
    </>
  );
}

function SummaryCard({
  label,
  value,
  delta,
  icon: Icon,
  tone,
  invertDelta,
}: {
  label: string;
  value: number;
  delta?: number | null;
  icon: typeof TrendingUp;
  tone: 'income' | 'expense';
  invertDelta?: boolean;
}) {
  const positive = delta !== null && delta !== undefined ? delta > 0 : null;
  const good = positive === null ? null : invertDelta ? !positive : positive;

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">{label}</p>
        <Icon
          className={tone === 'income' ? 'size-4 text-income' : 'size-4 text-expense'}
        />
      </div>
      <p
        className={`tabular mt-1.5 text-lg font-semibold ${tone === 'income' ? 'text-income' : 'text-expense'}`}
      >
        {formatRupiah(value)}
      </p>
      {delta !== undefined && delta !== null && (
        <p
          className={`mt-0.5 text-[11px] ${
            good === null ? 'text-muted-foreground' : good ? 'text-income' : 'text-expense'
          }`}
        >
          {delta > 0 ? '+' : ''}
          {delta.toFixed(1)}% vs periode lalu
        </p>
      )}
    </Card>
  );
}

function delta(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
}

function ReportSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="p-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="mt-2 h-5 w-32" />
          </Card>
        ))}
      </div>
      <Card className="p-5">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="mt-4 h-64 w-full rounded-lg" />
      </Card>
    </div>
  );
}
