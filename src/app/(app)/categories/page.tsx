import { requireUser } from '@/lib/session';
import { listCategoryTree } from '@/server/queries/categories';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CategoryIcon } from '@/components/shared/category-icon';
import {
  CategoryFormDialog,
  DeleteCategoryButton,
} from '@/components/categories/category-form-dialog';

export const metadata = { title: 'Kategori' };

export default async function CategoriesPage() {
  const user = await requireUser();
  const tree = await listCategoryTree(user.id);

  const expense = tree.filter((c) => c.type === 'expense');
  const income = tree.filter((c) => c.type === 'income');

  const parentsForDialog = tree.map((c) => ({ id: c.id, name: c.name, type: c.type }));

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold tracking-tight sm:text-xl">Kategori</h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Kelompokkan transaksi agar laporan lebih mudah dibaca.
          </p>
        </div>
        <div className="shrink-0">
          <CategoryFormDialog parents={parentsForDialog} />
        </div>
      </div>

      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <CategorySection
          title="Pengeluaran"
          categories={expense}
          tone="expense"
        />
        <CategorySection
          title="Pemasukan"
          categories={income}
          tone="income"
        />
      </div>
    </div>
  );
}

function CategorySection({
  title,
  categories,
  tone,
}: {
  title: string;
  categories: Awaited<ReturnType<typeof listCategoryTree>>;
  tone: 'income' | 'expense';
}) {
  return (
    <Card className="min-w-0 overflow-hidden">
      <CardContent className="min-w-0 pt-5">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="min-w-0 truncate text-sm font-semibold">{title}</h2>
          <Badge tone={tone} className="shrink-0">
            {categories.length} kategori
          </Badge>
        </div>

        <ul className="min-w-0 space-y-1">
          {categories.map((cat) => (
            <li key={cat.id} className="min-w-0">
              <div className="flex min-w-0 items-center gap-2 rounded-lg px-1.5 py-2 transition hover:bg-secondary/50 sm:gap-2.5 sm:px-2">
                <CategoryIcon icon={cat.icon} color={cat.color} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <span className="truncate text-sm font-medium">{cat.name}</span>
                    {cat.isSystem && (
                      <span className="shrink-0 text-[10px] text-muted-foreground">
                        sistem
                      </span>
                    )}
                  </div>
                  {cat.children.length > 0 && (
                    <p className="truncate text-[11px] text-muted-foreground">
                      {cat.children.map((c) => c.name).join(' · ')}
                    </p>
                  )}
                </div>
                <span className="tabular hidden shrink-0 text-[11px] text-muted-foreground sm:inline">
                  {cat.usageCount > 0 ? `${cat.usageCount}×` : '—'}
                </span>
                <DeleteCategoryButton
                  id={cat.id}
                  name={cat.name}
                  usageCount={cat.usageCount}
                  isSystem={cat.isSystem}
                />
              </div>
            </li>
          ))}
        </ul>

        {categories.length === 0 && (
          <p className="py-6 text-center text-xs text-muted-foreground">
            Belum ada kategori {title.toLowerCase()}.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
