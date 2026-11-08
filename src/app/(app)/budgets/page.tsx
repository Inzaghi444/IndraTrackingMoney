import { Target } from 'lucide-react';
import { requireUser } from '@/lib/session';
import { getBudgetStatuses } from '@/server/queries/budgets';
import { listCategoriesFlat } from '@/server/queries/categories';
import { EmptyState } from '@/components/shared/empty-state';
import { BudgetCard } from '@/components/budgets/budget-card';
import { BudgetFormDialog } from '@/components/budgets/budget-form-dialog';

export const metadata = { title: 'Anggaran' };

export default async function BudgetsPage() {
  const user = await requireUser();

  const [budgets, categories] = await Promise.all([
    getBudgetStatuses(user.id),
    listCategoriesFlat(user.id, 'expense'),
  ]);

  const critical = budgets.filter((b) => b.state !== 'safe');
  const safe = budgets.filter((b) => b.state === 'safe');

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight sm:text-xl">Anggaran</h1>
          <p className="text-xs text-muted-foreground sm:text-sm">
            Batasi pengeluaran dan dapatkan peringatan sebelum jebol.
          </p>
        </div>
        <BudgetFormDialog categories={categories} />
      </div>

      {budgets.length === 0 ? (
        <EmptyState
          icon={<Target className="size-5" />}
          title="Belum ada anggaran"
          description="Mulai dengan anggaran bulanan total, lalu tambahkan per kategori seperti Makanan atau Transportasi."
          action={<BudgetFormDialog categories={categories} />}
        />
      ) : (
        <div className="space-y-5">
          {critical.length > 0 && (
            <section>
              <h2 className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Perlu perhatian ({critical.length})
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {critical.map((b) => (
                  <BudgetCard key={b.id} budget={b} />
                ))}
              </div>
            </section>
          )}

          {safe.length > 0 && (
            <section>
              <h2 className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                Dalam batas ({safe.length})
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {safe.map((b) => (
                  <BudgetCard key={b.id} budget={b} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
