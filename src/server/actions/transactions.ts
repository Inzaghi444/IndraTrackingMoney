'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { db } from '@/lib/db';
import { requireUserAction } from '@/lib/session';
import {
  createTransactionSchema,
  updateTransactionSchema,
  transactionIdSchema,
} from '@/lib/validators/transaction';
import { fromDateString } from '@/lib/dates';
import { actionError, type ActionResult } from '@/lib/action-result';

function fail(error: string, fieldErrors?: Record<string, string[]>): ActionResult<never> {
  return actionError(error, fieldErrors);
}

function revalidateFinance() {
  revalidatePath('/dashboard');
  revalidatePath('/transactions');
  revalidatePath('/reports');
  revalidatePath('/budgets');
}

/**
 * Pastikan wallet & kategori benar-benar milik user ini.
 * Ini pertahanan utama terhadap IDOR — jangan pernah percaya ID dari klien.
 */
async function assertOwnership(
  userId: string,
  walletId: string,
  categoryId: string | null,
  transferWalletId: string | null,
) {
  const wallets = await db.wallet.findMany({
    where: {
      userId,
      isArchived: false,
      id: { in: [walletId, ...(transferWalletId ? [transferWalletId] : [])] },
    },
    select: { id: true },
  });

  if (wallets.length !== (transferWalletId ? 2 : 1)) {
    return 'Dompet tidak ditemukan';
  }

  if (categoryId) {
    const category = await db.category.findFirst({
      where: {
        id: categoryId,
        OR: [{ userId: null }, { userId }],
        isArchived: false,
      },
      select: { id: true },
    });
    if (!category) return 'Kategori tidak ditemukan';
  }

  return null;
}

export async function createTransaction(
  input: unknown,
): Promise<ActionResult<{ id: string }>> {
  const user = await requireUserAction();

  const parsed = createTransactionSchema.safeParse(input);
  if (!parsed.success) {
    return fail('Data transaksi tidak valid', z.flattenError(parsed.error).fieldErrors);
  }

  const data = parsed.data;
  const ownershipError = await assertOwnership(
    user.id,
    data.walletId,
    data.type === 'transfer' ? null : data.categoryId ?? null,
    data.type === 'transfer' ? data.transferWalletId ?? null : null,
  );
  if (ownershipError) return fail(ownershipError);

  const created = await db.transaction.create({
    data: {
      userId: user.id,
      walletId: data.walletId,
      categoryId: data.type === 'transfer' ? null : data.categoryId,
      transferWalletId: data.type === 'transfer' ? data.transferWalletId : null,
      type: data.type,
      amount: BigInt(data.amount),
      occurredOn: fromDateString(data.occurredOn),
      description: data.description,
      note: data.note,
    },
    select: { id: true },
  });

  revalidateFinance();
  return { ok: true, data: { id: created.id } };
}

export async function updateTransaction(input: unknown): Promise<ActionResult> {
  const user = await requireUserAction();

  const parsed = updateTransactionSchema.safeParse(input);
  if (!parsed.success) {
    return fail('Data transaksi tidak valid', z.flattenError(parsed.error).fieldErrors);
  }

  const data = parsed.data;

  // pastikan transaksi milik user (bukan hanya ada)
  const existing = await db.transaction.findFirst({
    where: { id: data.id, userId: user.id, deletedAt: null },
    select: { id: true },
  });
  if (!existing) return fail('Transaksi tidak ditemukan');

  const ownershipError = await assertOwnership(
    user.id,
    data.walletId,
    data.type === 'transfer' ? null : data.categoryId ?? null,
    data.type === 'transfer' ? data.transferWalletId ?? null : null,
  );
  if (ownershipError) return fail(ownershipError);

  await db.transaction.update({
    where: { id: data.id },
    data: {
      walletId: data.walletId,
      categoryId: data.type === 'transfer' ? null : data.categoryId,
      transferWalletId: data.type === 'transfer' ? data.transferWalletId : null,
      type: data.type,
      amount: BigInt(data.amount),
      occurredOn: fromDateString(data.occurredOn),
      description: data.description,
      note: data.note,
    },
  });

  revalidateFinance();
  return { ok: true, data: undefined };
}

/** Soft delete — mengembalikan snapshot agar UI bisa menampilkan undo */
export async function deleteTransaction(
  input: unknown,
): Promise<ActionResult<{ id: string; description: string }>> {
  const user = await requireUserAction();

  const parsed = transactionIdSchema.safeParse(input);
  if (!parsed.success) return fail('ID transaksi tidak valid');

  const existing = await db.transaction.findFirst({
    where: { id: parsed.data.id, userId: user.id, deletedAt: null },
    select: { id: true, description: true },
  });
  if (!existing) return fail('Transaksi tidak ditemukan');

  await db.transaction.update({
    where: { id: existing.id },
    data: { deletedAt: new Date() },
  });

  revalidateFinance();
  return { ok: true, data: { id: existing.id, description: existing.description } };
}

export async function restoreTransaction(input: unknown): Promise<ActionResult> {
  const user = await requireUserAction();

  const parsed = transactionIdSchema.safeParse(input);
  if (!parsed.success) return fail('ID transaksi tidak valid');

  const existing = await db.transaction.findFirst({
    where: { id: parsed.data.id, userId: user.id },
    select: { id: true },
  });
  if (!existing) return fail('Transaksi tidak ditemukan');

  await db.transaction.update({
    where: { id: existing.id },
    data: { deletedAt: null },
  });

  revalidateFinance();
  return { ok: true, data: undefined };
}
