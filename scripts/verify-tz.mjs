import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client.js';
import { getPeriodRange, toDateString } from '../src/lib/dates.js';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

const user = await db.user.findFirst({ where: { email: 'indra@example.com' } });
const current = getPeriodRange('monthly');

const curStart = toDateString(current.start);
const curEnd = toDateString(current.end);

console.log('start (string):', curStart);
console.log('end   (string):', curEnd);

const rows = await db.$queryRaw`
  SELECT
    COALESCE(SUM(amount) FILTER (
      WHERE type = 'expense' AND occurred_on BETWEEN ${curStart}::date AND ${curEnd}::date
    ), 0)::text AS cur_expense
  FROM transactions
  WHERE user_id = ${user.id} AND deleted_at IS NULL
`;

const literal = await db.$queryRaw`
  SELECT COALESCE(SUM(amount) FILTER (
    WHERE type = 'expense' AND occurred_on BETWEEN '2026-11-01'::date AND '2026-11-30'::date
  ), 0)::text AS cur_expense
  FROM transactions
  WHERE user_id = ${user.id} AND deleted_at IS NULL
`;

console.log('SETELAH FIX  :', rows[0].cur_expense);
console.log('TRUTH literal:', literal[0].cur_expense);
console.log(
  rows[0].cur_expense === literal[0].cur_expense ? '✅ COCOK' : '❌ MASIH BEDA',
);

await db.$disconnect();
