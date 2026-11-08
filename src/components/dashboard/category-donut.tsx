'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { PieChart as PieIcon } from 'lucide-react';
import type { CategorySlice } from '@/server/queries/dashboard';
import { formatRupiah } from '@/lib/money';
import { EmptyState } from '@/components/shared/empty-state';

export function CategoryDonut({ slices }: { slices: CategorySlice[] }) {
  const total = slices.reduce((s, x) => s + x.total, 0);

  if (total === 0) {
    return (
      <EmptyState
        icon={<PieIcon className="size-5" />}
        title="Belum ada pengeluaran"
        description="Setelah kamu mencatat pengeluaran, komposisi kategorinya muncul di sini."
        className="border-0 py-8"
      />
    );
  }

  return (
    <div>
      <div className="relative mx-auto h-44 w-full max-w-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="total"
              nameKey="name"
              innerRadius="62%"
              outerRadius="100%"
              paddingAngle={2}
              strokeWidth={0}
            >
              {slices.map((s) => (
                <Cell key={s.id} fill={s.color} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0].payload as CategorySlice;
                return (
                  <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-lg">
                    <p className="text-xs font-medium">{p.name}</p>
                    <p className="tabular text-xs text-muted-foreground">
                      {formatRupiah(p.total)} · {p.percent.toFixed(1)}%
                    </p>
                  </div>
                );
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* angka total di tengah donut */}
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">Total</span>
          <span className="tabular text-sm font-semibold">{formatRupiah(total)}</span>
        </div>
      </div>

      <ul className="mt-4 space-y-2">
        {slices.slice(0, 5).map((s) => (
          <li key={s.id} className="flex items-center gap-2 text-xs">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: s.color }}
              aria-hidden
            />
            <span className="min-w-0 flex-1 truncate">{s.name}</span>
            <span className="tabular shrink-0 text-muted-foreground">
              {s.percent.toFixed(0)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
