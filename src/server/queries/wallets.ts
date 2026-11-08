import 'server-only';

import { db } from '@/lib/db';

export type WalletWithBalance = {
  id: string;
  name: string;
  type: string;
  color: string;
  icon: string;
  isDefault: boolean;
  initialBalance: number;
  balance: number;
};

/**
 * Saldo per wallet dihitung di SQL, bukan di JS.
 * Satu query untuk semua wallet.
 */
export async function listWalletsWithBalance(userId: string): Promise<WalletWithBalance[]> {
  const rows = await db.$queryRaw<
    {
      id: string;
      name: string;
      type: string;
      color: string;
      icon: string;
      is_default: boolean;
      initial_balance: bigint;
      balance: bigint;
    }[]
  >`
    SELECT
      w.id, w.name, w.type::text AS type, w.color, w.icon, w.is_default,
      w.initial_balance,
      w.initial_balance
        + COALESCE((
            SELECT SUM(t.amount) FROM transactions t
            WHERE t.wallet_id = w.id AND t.type = 'income' AND t.deleted_at IS NULL
          ), 0)
        - COALESCE((
            SELECT SUM(t.amount) FROM transactions t
            WHERE t.wallet_id = w.id AND t.type = 'expense' AND t.deleted_at IS NULL
          ), 0)
        - COALESCE((
            SELECT SUM(t.amount) FROM transactions t
            WHERE t.wallet_id = w.id AND t.type = 'transfer' AND t.deleted_at IS NULL
          ), 0)
        + COALESCE((
            SELECT SUM(t.amount) FROM transactions t
            WHERE t.transfer_wallet_id = w.id AND t.type = 'transfer' AND t.deleted_at IS NULL
          ), 0) AS balance
    FROM wallets w
    WHERE w.user_id = ${userId} AND w.is_archived = false
    ORDER BY w.is_default DESC, w.created_at ASC
  `;

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    type: r.type,
    color: r.color,
    icon: r.icon,
    isDefault: r.is_default,
    initialBalance: Number(r.initial_balance),
    balance: Number(r.balance),
  }));
}

/** Wallet default user (dipakai sebagai nilai awal form transaksi) */
export async function getDefaultWallet(userId: string) {
  const wallet =
    (await db.wallet.findFirst({
      where: { userId, isArchived: false, isDefault: true },
      select: { id: true, name: true },
    })) ??
    (await db.wallet.findFirst({
      where: { userId, isArchived: false },
      select: { id: true, name: true },
      orderBy: { createdAt: 'asc' },
    }));

  return wallet;
}
