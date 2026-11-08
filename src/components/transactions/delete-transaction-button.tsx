'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { deleteTransaction, restoreTransaction } from '@/server/actions/transactions';

export function DeleteTransactionButton({
  id,
  description,
}: {
  id: string;
  description: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteTransaction({ id });
      setOpen(false);

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success('Transaksi dihapus', {
        description,
        action: {
          label: 'Urungkan',
          onClick: async () => {
            const restore = await restoreTransaction({ id });
            if (restore.ok) {
              toast.success('Transaksi dikembalikan');
              router.refresh();
            }
          },
        },
        duration: 6000,
      });

      router.push('/transactions');
      router.refresh();
    });
  }

  return (
    <>
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)} className="text-destructive">
        <Trash2 className="size-4" />
        Hapus
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Hapus transaksi ini?</DialogTitle>
            <DialogDescription>
              &ldquo;{description}&rdquo; akan dihapus dari daftar dan laporan. Kamu masih bisa
              membatalkannya lewat tombol Urungkan setelah dihapus.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Batal
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
