'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatCompactRupiah, formatRupiah } from '@/lib/money';

export type ComparisonPoint = { label: string; income: number; expense: number };

export function ComparisonChart({ data }: { data: ComparisonPoint[] }) {
  return (
    <div className="h-64 w-full sm:h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, left: -18, bottom: 0 }} barGap={4}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
            minTickGap={8}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
            tickFormatter={(v: number) => formatCompactRupiah(v)}
            width={56}
          />
          <Tooltip
            cursor={{ fill: 'var(--muted)', opacity: 0.4 }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              return (
                <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-lg">
                  <p className="mb-1 text-xs font-medium">{label}</p>
                  {payload.map((p) => (
                    <p key={p.dataKey as string} className="tabular text-xs">
                      <span
                        className="mr-1.5 inline-block size-2 rounded-sm"
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
          <Legend
            verticalAlign="top"
            height={28}
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span className="text-xs text-muted-foreground">
                {value === 'income' ? 'Pemasukan' : 'Pengeluaran'}
              </span>
            )}
          />
          <Bar dataKey="income" fill="var(--income)" radius={[4, 4, 0, 0]} maxBarSize={28} />
          <Bar dataKey="expense" fill="var(--expense)" radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
