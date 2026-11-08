/**
 * Seed data demo untuk verifikasi manual.
 * Jalankan: node scripts/seed-demo.mjs
 */
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.ts';
import 'dotenv/config';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

const user = await db.user.findFirst({ where: { email: 'indra@example.com' } });
if (!user) throw new Error('user demo belum ada — register dulu');

const wallet = await db.wallet.findFirst({ where: { userId: user.id } });
if (!wallet) throw new Error('wallet tidak ditemukan');

const cats = await db.category.findMany({ where: { userId: null, parentId: null } });
const byName = (n) => cats.find((c) => c.name === n);

function d(offsetDays) {
  const x = new Date();
  x.setDate(x.getDate() - offsetDays);
  return x;
}

const rows = [
  // pemasukan bulan ini
  { type: 'income', amount: 12000000n, cat: 'Gaji', desc: 'Gaji bulan ini', day: 20 },
  { type: 'income', amount: 1500000n, cat: 'Bonus & THR', desc: 'Bonus proyek', day: 12 },
  // pengeluaran
  { type: 'expense', amount: 25000n, cat: 'Makanan', desc: 'Kopi & roti', day: 0 },
  { type: 'expense', amount: 45000n, cat: 'Makanan', desc: 'Makan siang', day: 0 },
  { type: 'expense', amount: 50000n, cat: 'Transportasi', desc: 'Bensin', day: 1 },
  { type: 'expense', amount: 32000n, cat: 'Transportasi', desc: 'Ojek online', day: 2 },
  { type: 'expense', amount: 850000n, cat: 'Belanja', desc: 'Belanja bulanan', day: 3 },
  { type: 'expense', amount: 89000n, cat: 'Hiburan', desc: 'Langganan streaming', day: 4 },
  { type: 'expense', amount: 350000n, cat: 'Tagihan', desc: 'Listrik & air', day: 5 },
  { type: 'expense', amount: 120000n, cat: 'Kesehatan', desc: 'Vitamin', day: 6 },
  { type: 'expense', amount: 275000n, cat: 'Hiburan', desc: 'Konser', day: 7 },
  { type: 'expense', amount: 60000n, cat: 'Makanan', desc: 'Makan malam', day: 8 },
  { type: 'expense', amount: 200000n, cat: 'Pendidikan', desc: 'Buku', day: 10 },
  // bulan lalu (untuk delta & grafik)
  { type: 'income', amount: 12000000n, cat: 'Gaji', desc: 'Gaji bulan lalu', day: 50 },
  { type: 'expense', amount: 2400000n, cat: 'Belanja', desc: 'Belanja bulan lalu', day: 45 },
  { type: 'expense', amount: 950000n, cat: 'Makanan', desc: 'Makan bulan lalu', day: 40 },
];

let inserted = 0;
for (const r of rows) {
  const category = byName(r.cat);
  if (!category) continue;
  await db.transaction.create({
    data: {
      userId: user.id,
      walletId: wallet.id,
      categoryId: category.id,
      type: r.type,
      amount: r.amount,
      occurredOn: d(r.day),
      description: r.desc,
    },
  });
  inserted++;
}

// budget: total bulanan + makanan
const totalBudget = await db.budget.create({
  data: {
    userId: user.id,
    categoryId: null,
    period: 'monthly',
    amount: 5000000n,
    alertThreshold: 80,
  },
});

await db.budget.create({
  data: {
    userId: user.id,
    categoryId: byName('Makanan').id,
    period: 'monthly',
    amount: 500000n,
    alertThreshold: 80,
  },
});

console.log(`[demo] ${inserted} transaksi + 2 anggaran dibuat`);
console.log('[demo] total budget id:', totalBudget.id);

await db.$disconnect();
