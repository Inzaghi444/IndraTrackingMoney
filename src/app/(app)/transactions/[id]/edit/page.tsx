import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { requireUser } from '@/lib/session';
import { getTransaction } from '@/server/queries/transactions';
import { listCategoriesFlat } from '@/server/queries/categories';
import { getFilterOptions } from '@/server/queries/transactions';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { TransactionForm } from '@/components/transactions/transaction-form';
import { DeleteTransactionButton } from '@/components/transactions/delete-transaction-button';

export const metadata = { title: 'Edit transaksi' };

export default async function EditTransactionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const [transaction, categories, options] = await Promise.all([
    getTransaction(user.id, id),
    listCategoriesFlat(user.id),
    getFilterOptions(user.id),
  ]);

  if (!transaction) notFound();

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/transactions">
            <ArrowLeft className="size-4" />
            Kembali
          </Link>
        </Button>
        <DeleteTransactionButton
          id={transaction.id}
          description={transaction.description}
        />
      </div>

      <div>
        <h1 className="text-lg font-semibold tracking-tight">Edit transaksi</h1>
        <p className="text-xs text-muted-foreground">
          Perubahan langsung memengaruhi saldo dan laporan.
        </p>
      </div>

      <Card>
        <CardContent className="pt-5">
          <TransactionForm
            mode="edit"
            categories={categories}
            wallets={options.wallets}
            initial={{
              id: transaction.id,
              type: transaction.type,
              amount: String(transaction.amount),
              walletId: transaction.walletId,
              categoryId: transaction.categoryId,
              transferWalletId: transaction.transferWalletId,
              occurredOn: transaction.occurredOn,
              description: transaction.description,
              note: transaction.note ?? '',
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
