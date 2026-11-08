'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Loader2, Plus, Lock, Trash2 } from 'lucide-react';

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
import { CategoryIcon, getCategoryIcon } from '@/components/shared/category-icon';
import { createCategorySchema } from '@/lib/validators/category';
import { createCategory, deleteCategory } from '@/server/actions/categories';
import { cn } from '@/lib/utils';

const ICON_CHOICES = [
  'utensils',
  'car',
  'shopping-bag',
  'clapperboard',
  'receipt',
  'heart-pulse',
  'graduation-cap',
  'briefcase',
  'gift',
  'trending-up',
  'hand-coins',
  'wallet',
  'ellipsis',
];

const COLOR_CHOICES = [
  '#F97316',
  '#EF4444',
  '#EC4899',
  '#8B5CF6',
  '#3B82F6',
  '#0EA5E9',
  '#14B8A6',
  '#10B981',
  '#84CC16',
  '#F59E0B',
  '#64748B',
];

type FormValues = {
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  parentId: string | null;
};

export function CategoryFormDialog({
  parents,
  defaultType = 'expense',
}: {
  parents: { id: string; name: string; type: 'income' | 'expense' }[];
  defaultType?: 'income' | 'expense';
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const {
    control,
    register,
    handleSubmit,
    watch,
    reset,
    setError,
    formState: { errors },
  } = useForm<FormValues, unknown, FormValues>({
    resolver: zodResolver(createCategorySchema) as never,
    defaultValues: {
      name: '',
      type: defaultType,
      icon: 'circle',
      color: '#64748B',
      parentId: null,
    },
  });

  const type = watch('type');
  const selectedIcon = watch('icon');
  const selectedColor = watch('color');

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      const result = await createCategory(values);
      if (!result.ok) {
        if (result.fieldErrors?.name?.[0]) {
          setError('name', { message: result.fieldErrors.name[0] });
        }
        toast.error(result.error);
        return;
      }
      toast.success('Kategori ditambahkan.');
      setOpen(false);
      reset();
      router.refresh();
    });
  }

  const availableParents = parents.filter((p) => p.type === type);

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus className="size-4" />
        Kategori baru
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah kategori</DialogTitle>
            <DialogDescription>
              Buat kategori sendiri agar laporanmu lebih sesuai kebiasaan.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label>Tipe</Label>
              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="expense">Pengeluaran</SelectItem>
                      <SelectItem value="income">Pemasukan</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cat-name">Nama kategori</Label>
              <Input
                id="cat-name"
                placeholder="mis. Kopi & jajan"
                aria-invalid={!!errors.name}
                {...register('name')}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>
                Sub dari <span className="font-normal text-muted-foreground">(opsional)</span>
              </Label>
              <Controller
                control={control}
                name="parentId"
                render={({ field }) => (
                  <Select
                    value={field.value ?? 'none'}
                    onValueChange={(v) => field.onChange(v === 'none' ? null : v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Jadikan kategori utama</SelectItem>
                      {availableParents.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Ikon</Label>
              <Controller
                control={control}
                name="icon"
                render={({ field }) => (
                  <div className="flex flex-wrap gap-1.5">
                    {ICON_CHOICES.map((iconName) => {
                      const Icon = getCategoryIcon(iconName);
                      return (
                        <button
                          key={iconName}
                          type="button"
                          onClick={() => field.onChange(iconName)}
                          className={cn(
                            'flex size-9 items-center justify-center rounded-lg border transition',
                            field.value === iconName
                              ? 'border-primary bg-accent text-primary'
                              : 'border-border text-muted-foreground hover:text-foreground',
                          )}
                          aria-label={iconName}
                          aria-pressed={field.value === iconName}
                        >
                          <Icon className="size-4" />
                        </button>
                      );
                    })}
                  </div>
                )}
              />
            </div>

            <div className="space-y-1.5">
              <Label>Warna</Label>
              <Controller
                control={control}
                name="color"
                render={({ field }) => (
                  <div className="flex flex-wrap gap-1.5">
                    {COLOR_CHOICES.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => field.onChange(color)}
                        className={cn(
                          'size-7 rounded-full border-2 transition',
                          field.value === color
                            ? 'scale-110 border-foreground'
                            : 'border-transparent',
                        )}
                        style={{ backgroundColor: color }}
                        aria-label={`Warna ${color}`}
                        aria-pressed={field.value === color}
                      />
                    ))}
                  </div>
                )}
              />
            </div>

            {/* pratinjau */}
            <div className="flex items-center gap-2.5 rounded-lg bg-muted px-3 py-2">
              <CategoryIcon icon={selectedIcon} color={selectedColor} size="sm" />
              <span className="truncate text-xs text-muted-foreground">
                Pratinjau kategori
              </span>
            </div>

            <Button type="submit" size="lg" className="w-full" disabled={pending}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {pending ? 'Menyimpan...' : 'Tambah kategori'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function DeleteCategoryButton({
  id,
  name,
  usageCount,
  isSystem,
}: {
  id: string;
  name: string;
  usageCount: number;
  isSystem: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (isSystem) {
    return (
      <span
        className="rounded-md p-1.5 text-muted-foreground/50"
        title="Kategori sistem tidak bisa dihapus"
      >
        <Lock className="size-3.5" />
      </span>
    );
  }

  function handleDelete() {
    startTransition(async () => {
      const result = await deleteCategory({ id });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`Kategori "${name}" dihapus.`);
      router.refresh();
    });
  }

  return (
    <button
      onClick={handleDelete}
      disabled={pending}
      className="rounded-md p-1.5 text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
      aria-label={`Hapus kategori ${name}`}
      title={usageCount > 0 ? `Dipakai ${usageCount} transaksi` : 'Hapus kategori'}
    >
      {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
    </button>
  );
}
