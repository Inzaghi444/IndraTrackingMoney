-- Constraint & index yang tidak dapat diekspresikan lewat schema Prisma.

-- ─── Wallets: hanya boleh satu wallet default per user ───────────────
CREATE UNIQUE INDEX IF NOT EXISTS uniq_wallet_default
  ON wallets (user_id)
  WHERE is_default = true;

-- ─── Categories: nama unik per (user, tipe) ──────────────────────────
-- NULL tidak unik di Postgres, jadi kategori sistem (user_id NULL) di-COALESCE
-- ke sentinel agar tetap terkena constraint. Kolom id bertipe TEXT (Prisma String).
CREATE UNIQUE INDEX IF NOT EXISTS uniq_category_name
  ON categories (
    COALESCE(user_id, '00000000-0000-0000-0000-000000000000'),
    lower(name),
    type
  );

-- kategori tidak boleh menjadi parent dirinya sendiri
ALTER TABLE categories
  DROP CONSTRAINT IF EXISTS chk_category_no_self_parent;
ALTER TABLE categories
  ADD CONSTRAINT chk_category_no_self_parent
  CHECK (parent_id IS NULL OR parent_id <> id);

-- ─── Transactions: validasi bentuk data ──────────────────────────────
ALTER TABLE transactions
  DROP CONSTRAINT IF EXISTS chk_transaction_amount_positive;
ALTER TABLE transactions
  ADD CONSTRAINT chk_transaction_amount_positive CHECK (amount > 0);

-- transfer wajib punya lawan & tanpa kategori; non-transfer wajib punya kategori
ALTER TABLE transactions
  DROP CONSTRAINT IF EXISTS chk_transaction_shape;
ALTER TABLE transactions
  ADD CONSTRAINT chk_transaction_shape CHECK (
    (type = 'transfer'
      AND transfer_wallet_id IS NOT NULL
      AND category_id IS NULL
      AND transfer_wallet_id <> wallet_id)
    OR
    (type <> 'transfer'
      AND transfer_wallet_id IS NULL
      AND category_id IS NOT NULL)
  );

-- ─── Transactions: index parsial (hanya baris aktif) ─────────────────
CREATE INDEX IF NOT EXISTS idx_tx_active_date
  ON transactions (user_id, occurred_on DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_tx_active_category
  ON transactions (user_id, category_id)
  WHERE deleted_at IS NULL;

-- ─── Transactions: pencarian teks pada deskripsi ─────────────────────
CREATE INDEX IF NOT EXISTS idx_tx_search
  ON transactions
  USING gin (to_tsvector('simple', description))
  WHERE deleted_at IS NULL;

-- ─── Budgets: satu budget aktif per (user, scope, periode) ───────────
CREATE UNIQUE INDEX IF NOT EXISTS uniq_budget_scope
  ON budgets (
    user_id,
    COALESCE(category_id, '00000000-0000-0000-0000-000000000000'),
    period
  )
  WHERE is_active = true;
