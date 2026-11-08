/**
 * Seed kategori sistem (user_id = NULL).
 * Kategori sistem bersifat read-only untuk user: tidak bisa diedit/dihapus,
 * tapi bisa dipakai semua user tanpa menduplikasi baris.
 *
 * Jalankan: npm run db:seed
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

type Seed = {
  name: string;
  icon: string;
  color: string;
  children?: string[];
};

const EXPENSE: Seed[] = [
  {
    name: 'Makanan',
    icon: 'utensils',
    color: '#F97316',
    children: ['Makan di luar', 'Belanja bulanan', 'Kopi & jajan'],
  },
  {
    name: 'Transportasi',
    icon: 'car',
    color: '#3B82F6',
    children: ['Bensin', 'Transport online', 'Parkir & tol'],
  },
  {
    name: 'Belanja',
    icon: 'shopping-bag',
    color: '#EC4899',
    children: ['Pakaian', 'Elektronik', 'Rumah tangga'],
  },
  {
    name: 'Hiburan',
    icon: 'clapperboard',
    color: '#8B5CF6',
    children: ['Langganan', 'Nonton', 'Hobi'],
  },
  {
    name: 'Tagihan',
    icon: 'receipt',
    color: '#EF4444',
    children: ['Listrik & air', 'Internet', 'Pulsa'],
  },
  {
    name: 'Kesehatan',
    icon: 'heart-pulse',
    color: '#14B8A6',
    children: ['Obat', 'Dokter', 'Olahraga'],
  },
  {
    name: 'Pendidikan',
    icon: 'graduation-cap',
    color: '#0EA5E9',
    children: ['Kursus', 'Buku'],
  },
  { name: 'Lainnya', icon: 'ellipsis', color: '#64748B' },
];

const INCOME: Seed[] = [
  { name: 'Gaji', icon: 'briefcase', color: '#10B981' },
  { name: 'Bonus & THR', icon: 'gift', color: '#22C55E' },
  {
    name: 'Investasi',
    icon: 'trending-up',
    color: '#059669',
    children: ['Dividen', 'Bunga'],
  },
  { name: 'Pemberian', icon: 'hand-coins', color: '#84CC16' },
  { name: 'Lainnya', icon: 'ellipsis', color: '#64748B' },
];

async function upsertCategory(
  seed: Seed,
  type: 'income' | 'expense',
  sortOrder: number,
  parentId: string | null = null,
) {
  const existing = await db.category.findFirst({
    where: { userId: null, name: seed.name, type, parentId },
  });

  if (existing) return existing;

  return db.category.create({
    data: {
      userId: null,
      parentId,
      name: seed.name,
      type,
      icon: seed.icon,
      color: seed.color,
      sortOrder,
    },
  });
}

async function main() {
  let order = 0;

  for (const seed of EXPENSE) {
    const parent = await upsertCategory(seed, 'expense', order++);
    let childOrder = 0;
    for (const child of seed.children ?? []) {
      await upsertCategory(
        { name: child, icon: seed.icon, color: seed.color },
        'expense',
        childOrder++,
        parent.id,
      );
    }
  }

  for (const seed of INCOME) {
    const parent = await upsertCategory(seed, 'income', order++);
    let childOrder = 0;
    for (const child of seed.children ?? []) {
      await upsertCategory(
        { name: child, icon: seed.icon, color: seed.color },
        'income',
        childOrder++,
        parent.id,
      );
    }
  }

  const total = await db.category.count({ where: { userId: null } });
  console.log(`[seed] kategori sistem siap: ${total} baris`);
}

main()
  .catch((e) => {
    console.error('[seed] gagal:', e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
