# IndraTrackingMoney

Aplikasi dashboard keuangan pribadi: catat pengeluaran/pemasukan harian, pantau saldo,
lihat laporan, dan atur anggaran dengan peringatan.

## Stack

| Layer | Teknologi |
|---|---|
| Framework | Next.js 16 (App Router, Server Components, Server Actions) |
| Bahasa | TypeScript (strict) |
| UI | Tailwind CSS v4 + komponen bergaya shadcn/ui |
| Grafik | Recharts |
| Form & validasi | React Hook Form + Zod (schema dipakai client & server) |
| ORM | Prisma 7 + `@prisma/adapter-pg` |
| Database | PostgreSQL 16 |
| Auth | Better Auth (email + password, cookie session) |

## Menjalankan

Butuh **dua terminal**.

```bash
# terminal 1 — database (Postgres lokal, port 55432)
npm run dev:db

# terminal 2 — siapkan skema lalu jalankan aplikasi
npm run db:deploy   # WAJIB sekali di awal: buat tabel
npm run db:seed     # seed 35 kategori sistem
npm run dev
```

Buka http://localhost:3000, lalu daftar akun baru.

> `npm run dev:db` hanya menyalakan Postgres dan membuat database kosong — tabel
> dibuat oleh `db:deploy`. Tanpa langkah itu, login/daftar gagal dengan
> `P2021: The table public.user does not exist`. Perintah ini idempoten, aman
> diulang setiap kali ada migrasi baru.

Data demo (opsional, butuh akun yang sudah terdaftar):

```bash
npx tsx scripts/seed-demo.mjs
```

## Perintah

| Perintah | Fungsi |
|---|---|
| `npm run dev:db` | Jalankan PostgreSQL lokal (binary dari `embedded-postgres`) |
| `npm run dev` | Dev server |
| `npm run build` | Build produksi |
| `npm run typecheck` | Cek tipe tanpa emit |
| `npm run db:migrate` | Buat & terapkan migrasi baru |
| `npm run db:deploy` | Terapkan migrasi yang ada (produksi) |
| `npm run db:seed` | Seed kategori sistem |
| `npm run db:studio` | Prisma Studio |

## Struktur

```
src/
├── app/
│   ├── (auth)/            # login, register — layout split-screen
│   ├── (app)/             # area terproteksi (sidebar + topbar + bottom nav)
│   │   ├── dashboard/
│   │   ├── transactions/  # list, filter via URL, [id]/edit
│   │   ├── reports/       # harian / mingguan / bulanan
│   │   ├── budgets/
│   │   ├── categories/
│   │   └── settings/
│   └── api/auth/[...all]/ # handler Better Auth
├── components/
│   ├── ui/                # primitif (button, card, dialog, select, ...)
│   ├── layout/            # sidebar, topbar, bottom-nav + FAB
│   ├── dashboard/         # kpi-card, cashflow-chart, category-donut, ...
│   ├── transactions/      # form, list, filters, quick-add
│   ├── reports/           # comparison-chart, top-categories, period-tabs
│   ├── budgets/           # budget-card, form-dialog
│   └── shared/            # money-input, category-picker, empty-state, ...
├── lib/
│   ├── db.ts              # Prisma singleton (server-only)
│   ├── auth.ts            # konfigurasi Better Auth
│   ├── session.ts         # getSession / requireUser
│   ├── dates.ts           # SEMUA logika tanggal & periode
│   ├── money.ts           # format & parse Rupiah
│   └── validators/        # Zod schema (client + server)
└── server/
    ├── queries/           # read-only, agregasi dilakukan di SQL
    └── actions/           # mutasi ('use server')
```

## Keputusan desain penting

**1. Nominal disimpan sebagai `BIGINT` rupiah penuh.**
Bukan float, bukan sen. Menghindari error pembulatan.

**2. Pemasukan & pengeluaran di satu tabel `transactions` dengan kolom `type`.**
Riwayat campuran jadi satu query, grafik perbandingan jadi `GROUP BY type`.

**3. Saldo tidak pernah disimpan.**
Selalu dihitung: `initial_balance + income − expense ± transfer`.
Menyimpan saldo adalah sumber inkonsistensi klasik.

**4. `occurred_on` bertipe `DATE`, bukan timestamp.**
Pengguna berpikir "tanggal 14 belanja", bukan "14 Feb 13:47:22".

**5. Tanggal dikirim ke SQL sebagai string `"YYYY-MM-DD"`, bukan objek `Date`.**
⚠️ Ini pernah jadi bug nyata. Prisma mengirim `Date` sebagai `timestamptz`;
`::date` di Postgres meng-cast memakai timezone session (UTC), sehingga
`2026-11-01T00:00 WIB` menjadi `2026-10-31` di DB dan **satu hari transaksi
bocor ke periode sebelumnya** (selisih Rp60.000 pada data uji).
Lihat `src/server/queries/dashboard.ts`.

**6. Semua perhitungan periode berangkat dari `nowInAppTz()`.**
Jangan pakai `new Date()` langsung — server bisa berjalan di timezone berbeda
dari pengguna.

**7. `user_id` selalu diambil dari session, tidak pernah dari body request.**
Setiap action memverifikasi kepemilikan wallet/kategori/transaksi sebelum
menulis. Diuji di `scripts/test-isolation.mjs`.

**8. Hapus transaksi = soft delete + undo toast.**
Bukan modal konfirmasi — menghapus transaksi adalah aksi sering dan mudah dibatalkan.

**9. Filter riwayat disimpan di URL `searchParams`.**
Bisa di-bookmark, tombol back bekerja.

**10. Semua agregasi di SQL, bukan JavaScript.**
Database yang menjumlahkan. Ini yang membuat aplikasi tetap cepat di 10.000 transaksi.

## Verifikasi

```bash
npx tsx scripts/verify-tz.mjs    # konsistensi batas periode
npx tsx scripts/test-crud.mjs    # create/update/delete/restore + constraint
npx tsx scripts/test-isolation.mjs # isolasi data antar user
```

## Cakupan saat ini

Sudah: auth, CRUD transaksi (+soft delete/undo), kategori sistem & kustom
dengan sub-kategori, dashboard (KPI, arus kas, donut, budget, transaksi terbaru),
riwayat + pencarian + filter + pagination, laporan harian/mingguan/bulanan,
anggaran total & per kategori dengan indikator 80%/100% dan proyeksi,
dark mode, responsive mobile-first.

Belum (fase berikutnya): multi-dompet penuh & transfer (tabel sudah ada,
UI belum), transaksi berulang, PWA/offline, target tabungan, ekspor CSV,
impor mutasi bank, notifikasi push.

## Deploy

Ganti `DATABASE_URL` ke Postgres produksi (mis. Neon), lalu:

```bash
npm run db:deploy
npm run build
```

Tidak ada yang terikat ke Postgres lokal — skema sepenuhnya portabel.
