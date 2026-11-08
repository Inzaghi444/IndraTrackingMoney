'use client';

import { useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatCompactRupiah, formatRupiah } from '@/lib/money';
import { formatShortDate, formatMonthLabel } from '@/lib/dates';
import { EmptyState } from '@/components/shared/empty-state';
import { BarChart3 } from 'lucide-react';

export type CashflowPoint = {
  key: string;
  income: number;
  expense: number;
};

export function CashflowChart({ data }: { data: CashflowPoint[] }) {
  const [view, setView] = useState<'expense' | 'both'>('both');

  const hasData = data.some((d) => d.income > 0 || d.expense > 0);

  const chartData = data.map((d) => ({
    ...d,
    label: d.key.length === 7 ? formatMonthLabel(new Date(`${d.key}-01T00:00:00`)) : formatShortDate(new Date(`${d.key}T00:00:00`)),
  }));

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold tracking-tight">Arus kas</p>
          <p className="text-xs text-muted-foreground">
            {view === 'both' ? 'Pemasukan vs pengeluaran' : 'Pengeluaran'}
          </p>
        </div>
        <Tabs value={view} onValueChange={(v) => setView(v as 'expense' | 'both')}>
          <TabsList>
            <TabsTrigger value="both">Keduanya</TabsTrigger>
            <TabsTrigger value="expense">Pengeluaran</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {!hasData ? (
        <EmptyState
          icon={<BarChart3 className="size-5" />}
          title="Belum ada data untuk digrafikkan"
          description="Grafik akan muncul setelah kamu mencatat transaksi pertama."
          className="py-10"
        />
      ) : (
        <div className="h-56 w-full sm:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="fillIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--income)" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="var(--income)" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="fillExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--expense)" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="var(--expense)" stopOpacity={0.02} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                minTickGap={16}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                tickFormatter={(v: number) => formatCompactRupiah(v)}
                width={56}
              />
              <Tooltip
                cursor={{ stroke: 'var(--border)' }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-lg">
                      <p className="mb-1 text-xs font-medium">{label}</p>
                      {payload.map((p) => (
                        <p key={p.dataKey as string} className="tabular text-xs">
                          <span
                            className="mr-1.5 inline-block size-2 rounded-full"
                            style={{ backgroundColor: p.color }}
                          />
                          {p.dataKey === 'income' ? 'Masuk' : 'Keluar'}:{' '}
                          <span className="font-medium">{formatRupiah(Number(p.value))}</span>
                        </p>
                      ))}
                    </div>
                  );
                }}
              />

              {view === 'both' && (
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="var(--income)"
                  strokeWidth={2}
                  fill="url(#fillIncome)"
                  dot={false}
                  activeDot={{ r: 3 }}
                />
              )}
              <Area
                type="monotone"
                dataKey="expense"
                stroke="var(--expense)"
                strokeWidth={2}
                fill="url(#fillExpense)"
                dot={false}
                activeDot={{ r: 3 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
