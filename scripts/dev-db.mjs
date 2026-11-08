/**
 * Dev database runner.
 *
 * Lingkungan pengembangan ini tidak punya PostgreSQL sistem & tidak punya akses
 * sudo, jadi kita jalankan cluster PostgreSQL asli (binary dari paket
 * `embedded-postgres`) sebagai proses milik user. Untuk produksi, cukup ganti
 * DATABASE_URL ke Neon / Postgres mana pun — tidak ada yang khusus di skema.
 */
import EmbeddedPostgres from 'embedded-postgres';
import { existsSync } from 'node:fs';
import path from 'node:path';

const DATA_DIR = path.resolve(process.cwd(), '.pgdata');
const PORT = Number(process.env.PGPORT ?? 55432);
const USER = 'duitrack';
const PASSWORD = 'duitrack';
const DATABASE = 'duitrack';

const pg = new EmbeddedPostgres({
  databaseDir: DATA_DIR,
  port: PORT,
  user: USER,
  password: PASSWORD,
  persistent: true,
  initdbFlags: ['--encoding=UTF8', '--locale=C'],
  onLog: () => {},
  onError: (e) => console.error('[pg]', e),
});

const firstRun = !existsSync(path.join(DATA_DIR, 'PG_VERSION'));

if (firstRun) {
  console.log('[dev-db] inisialisasi cluster baru di', DATA_DIR);
  await pg.initialise();
}

await pg.start();
console.log(`[dev-db] PostgreSQL siap di localhost:${PORT} (user=${USER}, db=${DATABASE})`);

if (firstRun) {
  await pg.createDatabase(DATABASE);
  console.log(`[dev-db] database "${DATABASE}" dibuat`);
}

const shutdown = async () => {
  console.log('\n[dev-db] menghentikan cluster...');
  try {
    await pg.stop();
  } catch {
    /* ignore */
  }
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// jaga proses tetap hidup
await new Promise(() => {});
