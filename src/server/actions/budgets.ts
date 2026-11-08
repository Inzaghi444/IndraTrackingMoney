'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { db } from '@/lib/db';
import { requireUserAction } from '@/lib/session';
import { upsertBudgetSchema } from '@/lib/validators/budget';
import { actionError, type ActionResult } from '@/lib/action-result';

function fail(error: string, fieldErrors?: Record<string, string[]>): ActionResult<never> {
  return actionError(error, fieldErrors);
}

/**
 * Buat atau perbarui budget.
 *
 * Unik per (user, kategori, periode) — jadi kalau user mengatur ulang
 * budget untuk scope yang sama, kita update baris yang ada.
 */
export async function upsertBudget(input: unknown): Promise<ActionResult<{ id: string }>> {
  const user = await requireUserAction();

  const parsed = upsertBudgetSchema.safeParse(input);
  if (!parsed.success) {
    return fail('Data anggaran tidak valid', z.flattenError(parsed.error).fieldErrors);
  }

  const data = parsed.data;
  const categoryId = data.categoryId ?? null;

  if (categoryId) {
    const category = await db.category.findFirst({
      where: {
        id: categoryId,
        type: 'expense',
        OR: [{ userId: null }, { userId: user.id }],
        isArchived: false,
      },
      select: { id: true },
    });
    if (!category) return fail('Kategori tidak ditemukan atau bukan kategori pengeluaran');
  }

  const existing = await db.budget.findFirst({
    where: { userId: user.id, categoryId, period: data.period, isActive: true },
    select: { id: true },
  });

  const record = existing
    ? await db.budget.update({
        where: { id: existing.id },
        data: {
          amount: BigInt(data.amount),
          alertThreshold: data.alertThreshold,
        },
        select: { id: true },
      })
    : await db.budget.create({
        data: {
          userId: user.id,
          categoryId,
          period: data.period,
          amount: BigInt(data.amount),
          alertThreshold: data.alertThreshold,
        },
        select: { id: true },
      });

  revalidatePath('/budgets');
  revalidatePath('/dashboard');
  return { ok: true, data: { id: record.id } };
}

export async function deleteBudget(input: unknown): Promise<ActionResult> {
  const user = await requireUserAction();

  const parsed = z.object({ id: z.string().min(1) }).safeParse(input);
  if (!parsed.success) return fail('ID anggaran tidak valid');

  const existing = await db.budget.findFirst({
    where: { id: parsed.data.id, userId: user.id },
    select: { id: true },
  });
  if (!existing) return fail('Anggaran tidak ditemukan');

  await db.budget.delete({ where: { id: existing.id } });

  revalidatePath('/budgets');
  revalidatePath('/dashboard');
  return { ok: true, data: undefined };
}
