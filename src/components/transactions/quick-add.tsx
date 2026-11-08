'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TransactionForm } from '@/components/transactions/transaction-form';
import type { CategoryOption } from '@/components/shared/category-picker';

/**
 * Quick add: membuka form dalam dialog.
 * `?new=1` di URL membuat FAB di bottom nav bisa membuka dialog ini
 * dari halaman mana pun tanpa perlu state global.
 *
 * Status buka diturunkan dari URL (bukan effect), jadi tidak ada
 * render berantai: `open = dibuka manual || URL meminta`.
 */
export function QuickAdd({
  categories,
  wallets,
  defaultWalletId,
}: {
  categories: CategoryOption[];
  wallets: { id: string; name: string }[];
  defaultWalletId?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [manualOpen, setManualOpen] = useState(false);

  const open = manualOpen || searchParams.get('new') === '1';

  function handleOpenChange(next: boolean) {
    setManualOpen(next);
    if (!next && searchParams.get('new') === '1') {
      // bersihkan parameter agar tidak membuka ulang saat refresh
      const params = new URLSearchParams(searchParams.toString());
      params.delete('new');
      const qs = params.toString();
      router.replace(qs ? `?${qs}` : '?', { scroll: false });
    }
  }

  return (
    <>
      <Button size="sm" onClick={() => handleOpenChange(true)} className="hidden sm:inline-flex">
        <Plus className="size-4" />
        Transaksi baru
      </Button>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Catat transaksi</DialogTitle>
            <DialogDescription>
              Cukup nominal dan kategori. Sisanya sudah terisi otomatis.
            </DialogDescription>
          </DialogHeader>

          <TransactionForm
            mode="create"
            categories={categories}
            wallets={wallets}
            defaultWalletId={defaultWalletId}
            onSuccess={() => handleOpenChange(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
