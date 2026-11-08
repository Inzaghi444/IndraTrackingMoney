'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MoneyInput } from '@/components/shared/money-input';
import { upsertBudgetSchema } from '@/lib/validators/budget';
import { upsertBudget, deleteBudget } from '@/server/actions/budgets';

type FormValues = {
  categoryId: string | null;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  amount: string;
  alertThreshold: number;
};

export function BudgetFormDialog({
  categories,
  initial,
  trigger,
}: {
  categories: { id: string; name: string; parentName: string | null }[];
  initial?: { id: string } & Partial<FormValues>;
  trigger?: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues, unknown, FormValues>({
    resolver: zodResolver(upsertBudgetSchema) as never,
    defaultValues: {
      categoryId: initial?.categoryId ?? null,
      period: initial?.period ?? 'monthly',
      amount: initial?.amount ?? '',
      alertThreshold: initial?.alertThreshold ?? 80,
    },
  });

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const result = await upsertBudget(values);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success('Anggaran tersimpan.');
      setOpen(false);
      reset();
      router.refresh();
    });
  }

  return (
    <>
      <span onClick={() => setOpen(true)}>
        {trigger ?? (
          <Button size="sm">
            <Plus className="size-4" />
            Atur anggaran
          </Button>
        )}
      </span>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atur anggaran</DialogTitle>
            <DialogDescription>
              Tentukan batas pengeluaran. Kamu akan diberi peringatan saat mendekati batas.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label>Berlaku untuk</Label>
              <Controller
                control={control}
                name="categoryId"
                render={({ field }) => (
                  <Select
                    value={field.value ?? 'total'}
                    onValueChange={(v) => field.onChange(v === 'total' ? null : v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="total">Semua pengeluaran</SelectItem>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.parentName ? `${c.parentName} › ${c.name}` : c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Periode</Label>
              <Controller
                control={control}
                name="period"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Harian</SelectItem>
                      <SelectItem value="weekly">Mingguan</SelectItem>
                      <SelectItem value="monthly">Bulanan</SelectItem>
                      <SelectItem value="yearly">Tahunan</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="budget-amount">Batas pengeluaran</Label>
              <Controller
                control={control}
                name="amount"
                render={({ field }) => (
                  <MoneyInput
                    id="budget-amount"
                    value={field.value}
                    onChange={field.onChange}
                    invalid={!!errors.amount}
                  />
                )}
              />
              {errors.amount && (
                <p className="text-xs text-destructive">{errors.amount.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="alertThreshold">
                Peringatan saat mencapai{' '}
                <span className="text-muted-foreground">(%)</span>
              </Label>
              <Input
                id="alertThreshold"
                type="number"
                min={1}
                max={100}
                {...register('alertThreshold', { valueAsNumber: true })}
              />
              {errors.alertThreshold && (
                <p className="text-xs text-destructive">{errors.alertThreshold.message}</p>
              )}
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {pending ? 'Menyimpan...' : 'Simpan anggaran'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function DeleteBudgetButton({ id }: { id: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteBudget({ id });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success('Anggaran dihapus.');
      router.refresh();
    });
  }

  return (
    <button
      onClick={handleDelete}
      disabled={pending}
      className="rounded-md p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
      aria-label="Hapus anggaran"
    >
      {pending ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : (
        <Trash2 className="size-3.5" />
      )}
    </button>
  );
}
