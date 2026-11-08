'use client';

import { CategoryIcon } from '@/components/shared/category-icon';
import { cn } from '@/lib/utils';

export type CategoryOption = {
  id: string;
  name: string;
  label: string;
  color: string;
  icon: string;
  type: 'income' | 'expense';
  parentName: string | null;
};

/**
 * Pemilih kategori berbentuk chips.
 * Hanya kategori level-atas yang ditampilkan sebagai chip; sub-kategori
 * muncul di bawahnya agar tidak memenuhi layar.
 */
export function CategoryPicker({
  options,
  value,
  onChange,
  invalid,
}: {
  options: CategoryOption[];
  value: string | null;
  onChange: (id: string) => void;
  invalid?: boolean;
}) {
  const parents = options.filter((o) => !o.parentName);

  if (parents.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        Belum ada kategori. Tambahkan dulu di halaman Kategori.
      </p>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-wrap gap-2 rounded-xl',
        invalid && 'rounded-lg ring-2 ring-destructive/40',
      )}
    >
      {parents.map((parent) => {
        const children = options.filter((o) => o.parentName === parent.name);
        const active = value === parent.id;
        const childActive = children.some((c) => c.id === value);

        return (
          <div key={parent.id} className="contents">
            <button
              type="button"
              onClick={() => onChange(parent.id)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-[13px] font-medium transition',
                active || childActive
                  ? 'border-primary bg-accent text-accent-foreground'
                  : 'border-border bg-card text-muted-foreground hover:border-muted-foreground/40 hover:text-foreground',
              )}
            >
              <CategoryIcon icon={parent.icon} color={parent.color} size="sm" />
              {parent.name}
            </button>

            {childActive &&
              children.map((child) => (
                <button
                  key={child.id}
                  type="button"
                  onClick={() => onChange(child.id)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-xs font-medium transition',
                    value === child.id
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-dashed border-border text-muted-foreground hover:text-foreground',
                  )}
                >
                  {child.name}
                </button>
              ))}
          </div>
        );
      })}
    </div>
  );
}
