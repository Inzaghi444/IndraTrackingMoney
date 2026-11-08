# Menjalankan Duitrack di Windows

Proyek ini sudah dipindahkan ke Windows dan siap dijalankan. Ikuti urutan berikut.

## Prasyarat

- **Node.js 20+** (disarankan 22 LTS) — https://nodejs.org
  Cek dengan: `node -v`
- Tidak perlu install PostgreSQL — database dijalankan otomatis oleh proyek
  (paket `embedded-postgres` menyertakan binary Windows).

## Langkah menjalankan

Buka **PowerShell** atau **Command Prompt**:

```powershell
cd C:\Users\Asus\duitrack
npm install
```

Lalu butuh **dua terminal**:

**Terminal 1 — database:**
```powershell
npm run dev:db
```
Tunggu sampai muncul:
```
[dev-db] PostgreSQL siap di localhost:55432
```

**Terminal 2 — siapkan skema + jalankan aplikasi:**
```powershell
npm run db:deploy   # WAJIB: buat tabel (user, session, wallets, dst.)
npm run db:seed     # opsional tapi disarankan: 35 kategori sistem
npm run dev
```

> **Penting:** `npm run dev:db` hanya menyalakan PostgreSQL dan membuat database
> kosong — **tidak** membuat tabel. Kalau `db:deploy` dilewati, login/daftar akan
> gagal dengan error `P2021: The table public.user does not exist`.
> `db:deploy` aman dijalankan berulang kali (idempoten).

Buka http://localhost:3000

## Login

Data demo dari mesin sebelumnya **tidak ikut** (database dibuat baru di Windows).
Jadi: klik **Daftar**, buat akun, lalu aplikasi langsung bisa dipakai.

Kalau ingin data contoh (16 transaksi + 2 anggaran):

```powershell
# setelah register, lalu di terminal baru:
npx tsx scripts/seed-demo.mjs
```

## Kalau muncul "table public.user does not exist"

Artinya migrasi belum jalan ke database. Perbaiki dengan:

```powershell
npm run db:deploy
npm run db:seed
```

Cek isi database (opsional, butuh psql atau DBeaver):

```sql
select table_name from information_schema.tables where table_schema = 'public';
```

Harusnya ada 9 tabel: `user`, `session`, `account`, `verification`,
`wallets`, `categories`, `transactions`, `budgets`, `_prisma_migrations`.

## Kalau database gagal start

`npm run dev:db` membuat folder `.pgdata` baru. Kalau pernah gagal di tengah jalan,
hapus dulu lalu ulangi:

```powershell
Remove-Item -Recurse -Force .pgdata
npm run dev:db
```

## Perintah lain

| Perintah | Fungsi |
|---|---|
| `npm run dev` | Aplikasi (port 3000) |
| `npm run dev:db` | PostgreSQL lokal (port 55432) |
| `npm run build` | Build produksi |
| `npm run typecheck` | Cek tipe |
| `npm run lint` | Lint |
| `npm run db:seed` | Seed 35 kategori sistem |
| `npm run audit:responsive` | Audit layout mobile (butuh Chromium) |

## Catatan

- File `.env` sudah berisi `DATABASE_URL` yang menunjuk ke database lokal.
  Untuk produksi, ganti dengan connection string Postgres/Neon Anda.
- `node_modules` tidak ikut dipindahkan — `npm install` akan membuatnya.
- Screenshot audit tidak ikut; hasilkan ulang dengan `npm run audit:shots`
  (perlu `npx playwright install chromium` sekali).

## Penting: jalankan dari Windows, bukan dari WSL

Kalau Anda membuka folder ini lewat WSL (`/mnt/c/...`), `npm install` akan
**sangat lambat** (bisa 5–10 menit) karena akses lintas filesystem.

Jalankan langsung dari **PowerShell/CMD di Windows** — jauh lebih cepat:

```powershell
cd C:\Users\Asus\duitrack
npm install
```

Folder `node_modules` yang terlanjur dibuat dari WSL sebaiknya dihapus dulu:

```powershell
Remove-Item -Recurse -Force node_modules
npm install
```

### Jangan jalankan `next dev` / `next build` dari WSL

Selain lambat, Turbopack membuat **junction** di `.next/dev/node_modules/`
(untuk `@prisma/client` dan `pg`). Kalau dibuat dari WSL, junction-nya memakai
format symlink Linux dan **tidak bisa dihapus oleh Windows**, sehingga build
berikutnya gagal:

```
Error: EPERM: operation not permitted, unlink
  ...\.next\dev\node_modules\@prisma\client-2c3a283f134fdcb6
```

Perbaikannya — hapus `.next` **dari Windows**:

```powershell
cd C:\Users\Asus\duitrack
cmd /c rmdir /s /q .next
npm run dev
```

> Gunakan `rmdir` (bukan `Remove-Item -Recurse`). `rmdir` hanya membuang
> junction-nya; `Remove-Item` bisa ikut menelusuri ke dalam `node_modules`
> dan menghapus isi paket aslinya.

Tanda `.next` dibuat dari WSL: `dir /AL` menampilkan junction dengan target
kosong (`[...]` tanpa path), bukan `[\??\C:\...]`.

