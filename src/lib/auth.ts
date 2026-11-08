import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { nextCookies } from 'better-auth/next-js';
import { db } from '@/lib/db';

export const auth = betterAuth({
  database: prismaAdapter(db, {
    provider: 'postgresql',
  }),

  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    autoSignIn: true,
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 hari
    updateAge: 60 * 60 * 24, // refresh sekali sehari
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,
    },
  },

  user: {
    additionalFields: {
      currency: {
        type: 'string',
        required: false,
        defaultValue: 'IDR',
        input: false,
      },
      timezone: {
        type: 'string',
        required: false,
        defaultValue: 'Asia/Jakarta',
        input: false,
      },
      locale: {
        type: 'string',
        required: false,
        defaultValue: 'id-ID',
        input: false,
      },
      theme: {
        type: 'string',
        required: false,
        defaultValue: 'system',
        input: false,
      },
    },
  },

  advanced: {
    database: {
      generateId: () => crypto.randomUUID(),
    },
  },

  databaseHooks: {
    user: {
      create: {
        // Setiap user baru langsung dapat wallet "Cash" default
        // supaya bisa mencatat transaksi tanpa setup apa pun.
        after: async (user) => {
          try {
            await db.wallet.create({
              data: {
                userId: user.id,
                name: 'Cash',
                type: 'cash',
                initialBalance: BigInt(0),
                color: '#0F766E',
                icon: 'wallet',
                isDefault: true,
              },
            });
          } catch (error) {
            console.error('[auth] gagal membuat wallet default', error);
          }
        },
      },
    },
  },

  // nextCookies harus plugin terakhir
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
