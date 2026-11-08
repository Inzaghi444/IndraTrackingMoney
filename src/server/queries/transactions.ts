import 'server-only';

import { db } from '@/lib/db';
import { toDateString } from '@/lib/dates';

export type TransactionListItem = {
  id: string;
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  description: string;
  note: string | null;
  occurredOn: string;
  categoryId: string | null;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  walletId: string;
  walletName: string;
  transferWalletName: string | null;
};

export type TransactionFilters = {
  search?: string;
  type?: 'income' | 'expense' | 'transfer';
  categoryId?: string;
  walletId?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  pageSize?: number;
};

/**
 * Daftar transaksi dengan filter + pagination.
 * Pencarian memakai ILIKE pada deskripsi & catatan (cukup untuk skala personal,
 * dan tetap memanfaatkan index trigram bila nanti ditambahkan).
 */
export async function listTransactions(
  userId: string,
  filters: TransactionFilters = {},
): Promise<{ items: TransactionListItem[]; total: number; page: number; pageSize: number }> {
  const page = Math.max(filters.page ?? 1, 1);
  const pageSize = filters.pageSize ?? 30;

  const where = {
    userId,
    deletedAt: null,
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
    ...(filters.walletId ? { walletId: filters.walletId } : {}),
    ...(filters.startDate || filters.endDate
      ? {
          occurredOn: {
            ...(filters.startDate ? { gte: filters.startDate } : {}),
            ...(filters.endDate ? { lte: filters.endDate } : {}),
          },
        }
      : {}),
    ...(filters.search
      ? {
          OR: [
            { description: { contains: filters.search, mode: 'insensitive' as const } },
            { note: { contains: filters.search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    db.transaction.findMany({
      where,
      orderBy: [{ occurredOn: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        category: { select: { id: true, name: true, color: true, icon: true } },
        wallet: { select: { id: true, name: true } },
        transferWallet: { select: { name: true } },
      },
    }),
    db.transaction.count({ where }),
  ]);

  const items: TransactionListItem[] = rows.map((t) => ({
    id: t.id,
    type: t.type,
    amount: Number(t.amount),
    description: t.description,
    note: t.note,
    occurredOn: toDateString(t.occurredOn),
    categoryId: t.category?.id ?? null,
    categoryName: t.category?.name ?? 'Transfer',
    categoryColor: t.category?.color ?? '#64748B',
    categoryIcon: t.category?.icon ?? 'arrow-left-right',
    walletId: t.wallet.id,
    walletName: t.wallet.name,
    transferWalletName: t.transferWallet?.name ?? null,
  }));

  return { items, total, page, pageSize };
}

/** Satu transaksi untuk halaman edit */
export async function getTransaction(userId: string, id: string) {
  const t = await db.transaction.findFirst({
    where: { id, userId, deletedAt: null },
    include: { category: true, wallet: true },
  });

  if (!t) return null;

  return {
    id: t.id,
    type: t.type,
    amount: Number(t.amount),
    description: t.description,
    note: t.note,
    occurredOn: toDateString(t.occurredOn),
    categoryId: t.categoryId,
    walletId: t.walletId,
    transferWalletId: t.transferWalletId,
  };
}

/** Opsi filter: kategori yang benar-benar pernah dipakai + semua wallet */
export async function getFilterOptions(userId: string) {
  const [categories, wallets] = await Promise.all([
    db.category.findMany({
      where: {
        OR: [{ userId: null }, { userId }],
        isArchived: false,
      },
      select: { id: true, name: true, type: true, color: true, parentId: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    }),
    db.wallet.findMany({
      where: { userId, isArchived: false },
      select: { id: true, name: true, color: true, isDefault: true },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    }),
  ]);

  return { categories, wallets };
}

/** Total nominal untuk hasil filter aktif (bukan hanya halaman ini) */
export async function getFilteredTotals(userId: string, filters: TransactionFilters) {
  const base = {
    userId,
    deletedAt: null,
    ...(filters.type ? { type: filters.type } : {}),
    ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
    ...(filters.walletId ? { walletId: filters.walletId } : {}),
    ...(filters.startDate || filters.endDate
      ? {
          occurredOn: {
            ...(filters.startDate ? { gte: filters.startDate } : {}),
            ...(filters.endDate ? { lte: filters.endDate } : {}),
          },
        }
      : {}),
    ...(filters.search
      ? {
          OR: [
            { description: { contains: filters.search, mode: 'insensitive' as const } },
            { note: { contains: filters.search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  const [income, expense] = await Promise.all([
    db.transaction.aggregate({
      where: { ...base, type: 'income' },
      _sum: { amount: true },
    }),
    db.transaction.aggregate({
      where: { ...base, type: 'expense' },
      _sum: { amount: true },
    }),
  ]);

  return {
    income: Number(income._sum.amount ?? 0),
    expense: Number(expense._sum.amount ?? 0),
  };
}
