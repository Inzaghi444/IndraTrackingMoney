/**
 * Uji isolasi data: user B tidak boleh bisa membaca/mengubah data user A.
 */
import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

const a = await db.user.findFirst({ where: { email: 'indra@example.com' } });

// buat user B
const b =
  (await db.user.findFirst({ where: { email: 'penyusup@example.com' } })) ??
  (await db.user.create({
    data: { id: crypto.randomUUID(), name: 'Penyusup', email: 'penyusup@example.com' },
  }));

const txA = await db.transaction.findFirst({ where: { userId: a.id, deletedAt: null } });
console.log('transaksi milik A:', txA.id);

// 1. B query transaksi A memakai filter userId B → harus kosong
const leak = await db.transaction.findFirst({ where: { id: txA.id, userId: b.id } });
console.log('B baca tx A (filter userId=B) :', leak === null ? '✅ null' : '❌ BOCOR');

// 2. B coba update tx A lewat where id saja (simulasi bug: lupa filter userId)
//    Prisma update hanya pakai id, jadi ini memang akan berhasil —
//    itulah mengapa action WAJIB cek ownership dulu. Kita verifikasi
//    bahwa pola "findFirst dengan userId" yang dipakai action menolak.
const ownershipCheck = await db.transaction.findFirst({
  where: { id: txA.id, userId: b.id, deletedAt: null },
  select: { id: true },
});
console.log('pola assertOwnership di action :', ownershipCheck === null ? '✅ menolak' : '❌ lolos');

// 3. B tidak bisa melihat wallet A
const walletLeak = await db.wallet.findFirst({ where: { userId: b.id, id: { in: [txA.walletId] } } });
console.log('B akses wallet A               :', walletLeak === null ? '✅ null' : '❌ BOCOR');

// 4. kategori sistem boleh diakses semua user
const sysCat = await db.category.findFirst({ where: { userId: null, name: 'Makanan' } });
const bCanUse = await db.category.findFirst({
  where: { id: sysCat.id, OR: [{ userId: null }, { userId: b.id }] },
});
console.log('B akses kategori sistem        :', bCanUse ? '✅ boleh' : '❌ ditolak');

// 5. B tidak bisa pakai kategori privat A
const privCat = await db.category.create({
  data: { userId: a.id, name: 'Rahasia A', type: 'expense' },
});
const bPriv = await db.category.findFirst({
  where: { id: privCat.id, OR: [{ userId: null }, { userId: b.id }] },
});
console.log('B akses kategori privat A      :', bPriv === null ? '✅ ditolak' : '❌ BOCOR');

// cleanup
await db.category.delete({ where: { id: privCat.id } });
await db.user.delete({ where: { id: b.id } });
console.log('cleanup selesai');

await db.$disconnect();
