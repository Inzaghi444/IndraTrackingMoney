'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MoneyInput } from '@/components/shared/money-input';
import { CategoryPicker, type CategoryOption } from '@/components/shared/category-picker';
import { createTransactionSchema } from '@/lib/validators/transaction';
import { createTransaction, updateTransaction } from '@/server/actions/transactions';
import { toDateString, nowInAppTz } from '@/lib/dates';
import { cn } from '@/lib/utils';

type FormValues = {
  type: 'income' | 'expense' | 'transfer';
  amount: string;
  walletId: string;
  categoryId: string | null;
  transferWalletId: string | null;
  occurredOn: string;
  description: string;
  note?: string;
};

/**
 * Skema form memakai string untuk `amount` (dari MoneyInput),
 * sedangkan skema server menerima string|number. Dipakai versi
 * yang sama agar validasi konsisten di kedua sisi.
 */
const formSchema = createTransactionSchema;

export type TransactionFormProps = {
  mode: 'create' | 'edit';
  categories: CategoryOption[];
  wallets: { id: string; name: string }[];
  defaultWalletId?: string;
  initial?: Partial<FormValues> & { id?: string };
  onSuccess?: () => void;
};

export function TransactionForm({
  mode,
  categories,
  wallets,
  defaultWalletId,
  initial,
  onSuccess,
}: TransactionFormProps) {
  const router = useRouter();
  const [pending, setPending] = React.useState(false);

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<FormValues, unknown, FormValues>({
    // skema punya transformasi input→output, jadi tipe input & output dibedakan
    resolver: zodResolver(formSchema) as never,
    defaultValues: {
      type: initial?.type ?? 'expense',
      amount: initial?.amount ?? '',
      walletId: initial?.walletId ?? defaultWalletId ?? wallets[0]?.id ?? '',
      categoryId: initial?.categoryId ?? null,
      transferWalletId: initial?.transferWalletId ?? null,
      occurredOn: initial?.occurredOn ?? toDateString(nowInAppTz()),
      description: initial?.description ?? '',
      note: initial?.note ?? '',
    },
  });

  const type = watch('type');
  const walletId = watch('walletId');

  const filteredCategories = React.useMemo(
    () => categories.filter((c) => (type === 'income' ? c.type !== 'expense' : c.type !== 'income')),
    [categories, type],
  );

  // saat tipe berubah, kategori lama tidak valid lagi
  React.useEffect(() => {
    const current = control._formValues.categoryId as string | null;
    if (current && !filteredCategories.some((c) => c.id === current)) {
      setValue('categoryId', null);
    }
  }, [type, filteredCategories, setValue, control]);

  async function onSubmit(values: FormValues) {
    setPending(true);
    try {
      const payload = {
        ...values,
        ...(mode === 'edit' && initial?.id ? { id: initial.id } : {}),
      };

      const result =
        mode === 'create'
          ? await createTransaction(payload)
          : await updateTransaction(payload);

      if (!result.ok) {
        if (result.fieldErrors) {
          for (const [field, messages] of Object.entries(result.fieldErrors)) {
            if (messages?.[0]) {
              setError(field as keyof FormValues, { message: messages[0] });
            }
          }
        }
        toast.error(result.error);
        return;
      }

      toast.success(
        mode === 'create' ? 'Transaksi tersimpan.' : 'Perubahan tersimpan.',
      );

      if (mode === 'create') {
        // reset untuk input cepat berikutnya
        setValue('amount', '');
        setValue('description', '');
        setValue('note', '');
      }

      router.refresh();
      onSuccess?.();
    } catch {
      toast.error('Gagal menyimpan. Cek koneksi lalu coba lagi.');
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {/* Tipe transaksi */}
      <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1">
        {(
          [
            { value: 'expense', label: 'Pengeluaran' },
            { value: 'income', label: 'Pemasukan' },
            { value: 'transfer', label: 'Transfer' },
          ] as const
        ).map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setValue('type', opt.value)}
            className={cn(
              'rounded-md py-1.5 text-[13px] font-medium transition',
              type === opt.value
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Nominal */}
      <div className="space-y-1.5">
        <Label htmlFor="amount">Nominal</Label>
        <Controller
          control={control}
          name="amount"
          render={({ field }) => (
            <MoneyInput
              id="amount"
              value={field.value}
              onChange={field.onChange}
              invalid={!!errors.amount}
              autoFocus
            />
          )}
        />
        {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
      </div>

      {/* Dompet */}
      <div className="space-y-1.5">
        <Label>{type === 'transfer' ? 'Dari dompet' : 'Dompet'}</Label>
        <Controller
          control={control}
          name="walletId"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih dompet" />
              </SelectTrigger>
              <SelectContent>
                {wallets.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.walletId && (
          <p className="text-xs text-destructive">{errors.walletId.message}</p>
        )}
      </div>

      {/* Dompet tujuan (transfer) */}
      {type === 'transfer' && (
        <div className="space-y-1.5">
          <Label>Ke dompet</Label>
          <Controller
            control={control}
            name="transferWalletId"
            render={({ field }) => (
              <Select value={field.value ?? ''} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih dompet tujuan" />
                </SelectTrigger>
                <SelectContent>
                  {wallets
                    .filter((w) => w.id !== walletId)
                    .map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.transferWalletId && (
            <p className="text-xs text-destructive">{errors.transferWalletId.message}</p>
          )}
        </div>
      )}

      {/* Kategori */}
      {type !== 'transfer' && (
        <div className="space-y-2">
          <Label>Kategori</Label>
          <Controller
            control={control}
            name="categoryId"
            render={({ field }) => (
              <CategoryPicker
                options={filteredCategories}
                value={field.value}
                onChange={field.onChange}
                invalid={!!errors.categoryId}
              />
            )}
          />
          {errors.categoryId && (
            <p className="text-xs text-destructive">{errors.categoryId.message}</p>
          )}
        </div>
      )}

      {/* Tanggal */}
      <div className="space-y-1.5">
        <Label htmlFor="occurredOn">Tanggal</Label>
        <Input id="occurredOn" type="date" {...register('occurredOn')} />
        {errors.occurredOn && (
          <p className="text-xs text-destructive">{errors.occurredOn.message}</p>
        )}
      </div>

      {/* Deskripsi */}
      <div className="space-y-1.5">
        <Label htmlFor="description">Deskripsi</Label>
        <Input
          id="description"
          placeholder="mis. Kopi di kafe dekat kantor"
          aria-invalid={!!errors.description}
          {...register('description')}
        />
        {errors.description && (
          <p className="text-xs text-destructive">{errors.description.message}</p>
        )}
      </div>

      {/* Catatan */}
      <div className="space-y-1.5">
        <Label htmlFor="note">
          Catatan <span className="font-normal text-muted-foreground">(opsional)</span>
        </Label>
        <Input id="note" placeholder="Detail tambahan..." {...register('note')} />
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending && <Loader2 className="size-4 animate-spin" />}
        {pending ? 'Menyimpan...' : mode === 'create' ? 'Simpan transaksi' : 'Simpan perubahan'}
      </Button>
    </form>
  );
}

export { Trash2 };
