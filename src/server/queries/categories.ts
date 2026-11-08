import 'server-only';

import { db } from '@/lib/db';

export type CategoryNode = {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  isSystem: boolean;
  parentId: string | null;
  usageCount: number;
  children: CategoryNode[];
};

/**
 * Semua kategori (sistem + milik user) dalam bentuk pohon 2 level,
 * lengkap dengan jumlah pemakaian agar UI bisa memperingatkan
 * sebelum kategori dihapus.
 */
export async function listCategoryTree(userId: string): Promise<CategoryNode[]> {
  const rows = await db.category.findMany({
    where: {
      OR: [{ userId: null }, { userId }],
      isArchived: false,
    },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: {
      _count: { select: { transactions: true } },
    },
  });

  const nodes: CategoryNode[] = rows.map((c) => ({
    id: c.id,
    name: c.name,
    type: c.type,
    icon: c.icon,
    color: c.color,
    isSystem: c.userId === null,
    parentId: c.parentId,
    usageCount: c._count.transactions,
    children: [],
  }));

  const byId = new Map(nodes.map((n) => [n.id, n]));
  const roots: CategoryNode[] = [];

  for (const node of nodes) {
    if (node.parentId && byId.has(node.parentId)) {
      byId.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

/** Daftar rata (flat) untuk dropdown, dengan label "Parent › Child" */
export async function listCategoriesFlat(userId: string, type?: 'income' | 'expense') {
  const rows = await db.category.findMany({
    where: {
      OR: [{ userId: null }, { userId }],
      isArchived: false,
      ...(type ? { type } : {}),
    },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: { parent: { select: { name: true } } },
  });

  return rows.map((c) => ({
    id: c.id,
    name: c.name,
    type: c.type,
    color: c.color,
    icon: c.icon,
    parentName: c.parent?.name ?? null,
    label: c.parent ? `${c.parent.name} › ${c.name}` : c.name,
    isSystem: c.userId === null,
  }));
}

/** Verifikasi kategori milik user (atau sistem) — pertahanan IDOR */
export async function assertCategoryAccessible(userId: string, categoryId: string) {
  const category = await db.category.findFirst({
    where: {
      id: categoryId,
      OR: [{ userId: null }, { userId }],
      isArchived: false,
    },
    select: { id: true, type: true, parentId: true },
  });
  return category;
}
