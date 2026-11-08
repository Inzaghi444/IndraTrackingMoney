/**
 * Registrasi & provisioning akun.
 *
 * Setelah user baru dibuat, kita WAJIB membuat wallet default ("Cash")
 * supaya user bisa langsung mencatat transaksi tanpa setup apa pun.
 */
import 'server-only';

import { db } from '@/lib/db';

export async function provisionNewUser(userId: string) {
  const existing = await db.wallet.count({ where: { userId } });
  if (existing > 0) return;

  await db.wallet.create({
    data: {
      userId,
      name: 'Cash',
      type: 'cash',
      initialBalance: BigInt(0),
      color: '#0F766E',
      icon: 'wallet',
      isDefault: true,
    },
  });
}
