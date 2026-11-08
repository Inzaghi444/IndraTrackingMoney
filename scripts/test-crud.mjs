/**
 * Uji end-to-end lapisan server (tanpa browser):
 * create → verifikasi saldo → update → soft delete → restore.
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

const user = await db.user.findFirst({ where: { email: 'indra@example.com' } });
const wallet = await db.wallet.findFirst({ where: { userId: user.id } });
const cat = await db.category.findFirst({
  where: { userId: null, name: 'Makanan', parentId: null },
});

const balance = async () => {
  const r = await db.$queryRaw`
    SELECT (
      COALESCE((SELECT SUM(initial_balance) FROM wallets WHERE user_id = ${user.id} AND is_archived = false), 0)
      + COALESCE((SELECT SUM(amount) FROM transactions WHERE user_id = ${user.id} AND type = 'income' AND deleted_at IS NULL), 0)
      - COALESCE((SELECT SUM(amount) FROM transactions WHERE user_id = ${user.id} AND type = 'expense' AND deleted_at IS NULL), 0)
    )::text AS b
  `;
  return Number(r[0].b);
};

const before = await balance();
console.log('saldo awal            :', before);

// 1. CREATE
const tx = await db.transaction.create({
  data: {
    userId: user.id,
    walletId: wallet.id,
    categoryId: cat.id,
    type: 'expense',
    amount: 12345n,
    occurredOn: new Date('2026-11-05'),
    description: 'TEST e2e',
  },
});
const afterCreate = await balance();
console.log('setelah create        :', afterCreate, afterCreate === before - 12345 ? '✅' : '❌');

// 2. UPDATE (ubah nominal)
await db.transaction.update({ where: { id: tx.id }, data: { amount: 20000n } });
const afterUpdate = await balance();
console.log('setelah update 20000  :', afterUpdate, afterUpdate === before - 20000 ? '✅' : '❌');

// 3. SOFT DELETE
await db.transaction.update({ where: { id: tx.id }, data: { deletedAt: new Date() } });
const afterDelete = await balance();
console.log('setelah soft delete   :', afterDelete, afterDelete === before ? '✅ (kembali)' : '❌');

// 4. RESTORE
await db.transaction.update({ where: { id: tx.id }, data: { deletedAt: null } });
const afterRestore = await balance();
console.log('setelah restore       :', afterRestore, afterRestore === before - 20000 ? '✅' : '❌');

// 5. bersihkan
await db.transaction.delete({ where: { id: tx.id } });
const final = await balance();
console.log('setelah cleanup       :', final, final === before ? '✅ bersih' : '❌');

// 6. constraint: amount harus > 0
try {
  await db.transaction.create({
    data: {
      userId: user.id,
      walletId: wallet.id,
      categoryId: cat.id,
      type: 'expense',
      amount: 0n,
      occurredOn: new Date('2026-11-05'),
      description: 'harus gagal',
    },
  });
  console.log('CHECK amount>0        : ❌ seharusnya ditolak');
} catch {
  console.log('CHECK amount>0        : ✅ ditolak DB');
}

// 7. constraint: transfer wajib punya dompet tujuan
try {
  await db.transaction.create({
    data: {
      userId: user.id,
      walletId: wallet.id,
      type: 'transfer',
      amount: 1000n,
      occurredOn: new Date('2026-11-05'),
      description: 'transfer tanpa tujuan',
    },
  });
  console.log('CHECK transfer shape  : ❌ seharusnya ditolak');
} catch {
  console.log('CHECK transfer shape  : ✅ ditolak DB');
}

await db.$disconnect();
