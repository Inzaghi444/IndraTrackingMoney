import type { CategorySlice } from '@/server/queries/dashboard';
import { formatRupiah } from '@/lib/money';
import { CategoryIcon } from '@/components/shared/category-icon';
import { EmptyState } from '@/components/shared/empty-state';
import { PieChart } from 'lucide-react';

export function TopCategories({ slices }: { slices: CategorySlice[] }) {
  if (slices.length === 0) {
    return (
      <EmptyState
        icon={<PieChart className="size-5" />}
        title="Belum ada pengeluaran"
        description="Tidak ada data kategori untuk periode ini."
        className="border-0 py-8"
      />
    );
  }

  const max = Math.max(...slices.map((s) => s.total));

  return (
    <ul className="space-y-3">
      {slices.map((s) => (
        <li key={s.id}>
          <div className="flex items-center gap-2.5">
            <CategoryIcon icon={s.icon} color={s.color} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-xs font-medium">{s.name}</span>
                <span className="tabular shrink-0 text-xs font-medium">
                  {formatRupiah(s.total)}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${max > 0 ? (s.total / max) * 100 : 0}%`,
                    backgroundColor: s.color,
                  }}
                />
              </div>
            </div>
            <span className="tabular w-9 shrink-0 text-right text-[11px] text-muted-foreground">
              {s.percent.toFixed(0)}%
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
