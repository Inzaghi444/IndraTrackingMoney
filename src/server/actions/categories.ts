'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { db } from '@/lib/db';
import { requireUserAction } from '@/lib/session';
import { createCategorySchema, updateCategorySchema } from '@/lib/validators/category';
import { actionError, type ActionResult } from '@/lib/action-result';

function fail(error: string, fieldErrors?: Record<string, string[]>): ActionResult<never> {
  return actionError(error, fieldErrors);
}

export async function createCategory(input: unknown): Promise<ActionResult<{ id: string }>> {
  const user = await requireUserAction();

  const parsed = createCategorySchema.safeParse(input);
  if (!parsed.success) {
    return fail('Data kategori tidak valid', z.flattenError(parsed.error).fieldErrors);
  }

  const data = parsed.data;

  // kalau parent dipilih, pastikan parent bisa diakses & tipenya sama
  if (data.parentId) {
    const parent = await db.category.findFirst({
      where: {
        id: data.parentId,
        OR: [{ userId: null }, { userId: user.id }],
        isArchived: false,
      },
      select: { id: true, type: true, parentId: true },
    });
    if (!parent) return fail('Kategori induk tidak ditemukan');
    if (parent.type !== data.type) return fail('Tipe kategori induk tidak cocok');
    if (parent.parentId) return fail('Sub-kategori tidak bisa punya sub-kategori lagi');
  }

  // cegah duplikat nama pada level yang sama
  const duplicate = await db.category.findFirst({
    where: {
      userId: user.id,
      name: { equals: data.name, mode: 'insensitive' },
      type: data.type,
      parentId: data.parentId ?? null,
    },
    select: { id: true },
  });
  if (duplicate) return fail('Kategori dengan nama itu sudah ada');

  const created = await db.category.create({
    data: {
      userId: user.id,
      name: data.name,
      type: data.type,
      icon: data.icon,
      color: data.color,
      parentId: data.parentId ?? null,
    },
    select: { id: true },
  });

  revalidatePath('/categories');
  revalidatePath('/transactions');
  return { ok: true, data: { id: created.id } };
}

export async function updateCategory(input: unknown): Promise<ActionResult> {
  const user = await requireUserAction();

  const parsed = updateCategorySchema.safeParse(input);
  if (!parsed.success) {
    return fail('Data kategori tidak valid', z.flattenError(parsed.error).fieldErrors);
  }

  const { id, ...rest } = parsed.data;

  // kategori sistem (userId NULL) TIDAK boleh diubah
  const existing = await db.category.findFirst({
    where: { id, userId: user.id },
    select: { id: true, type: true },
  });
  if (!existing) return fail('Kategori tidak bisa diubah');

  await db.category.update({
    where: { id },
    data: {
      ...(rest.name !== undefined ? { name: rest.name } : {}),
      ...(rest.icon !== undefined ? { icon: rest.icon } : {}),
      ...(rest.color !== undefined ? { color: rest.color } : {}),
    },
  });

  revalidatePath('/categories');
  revalidatePath('/transactions');
  return { ok: true, data: undefined };
}

/**
 * Hapus kategori. Ditolak jika masih dipakai transaksi aktif,
 * agar data historis tidak kehilangan konteks.
 */
export async function deleteCategory(input: unknown): Promise<ActionResult> {
  const user = await requireUserAction();

  const parsed = z.object({ id: z.string().min(1) }).safeParse(input);
  if (!parsed.success) return fail('ID kategori tidak valid');

  const existing = await db.category.findFirst({
    where: { id: parsed.data.id, userId: user.id },
    select: { id: true, _count: { select: { transactions: true, children: true } } },
  });
  if (!existing) return fail('Kategori sistem tidak bisa dihapus');

  if (existing._count.transactions > 0) {
    return fail(
      `Kategori ini dipakai ${existing._count.transactions} transaksi. Pindahkan transaksinya dulu.`,
    );
  }
  if (existing._count.children > 0) {
    return fail('Hapus sub-kategori terlebih dahulu.');
  }

  await db.category.delete({ where: { id: existing.id } });

  revalidatePath('/categories');
  revalidatePath('/transactions');
  return { ok: true, data: undefined };
}
