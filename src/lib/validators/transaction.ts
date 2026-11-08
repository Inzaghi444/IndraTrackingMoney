import { z } from 'zod';

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal harus YYYY-MM-DD');

/** Nominal dalam rupiah penuh, dikirim sebagai string agar aman dari float */
const amount = z
  .union([z.string(), z.number()])
  .transform((v) => (typeof v === 'number' ? v : Number(v.replace(/[^\d]/g, ''))))
  .refine((v) => Number.isFinite(v) && v > 0, 'Nominal harus lebih dari 0')
  .refine((v) => v <= 999_999_999_999, 'Nominal terlalu besar')
  .transform((v) => Math.round(v));

export const transactionTypeSchema = z.enum(['income', 'expense', 'transfer']);

export const createTransactionSchema = z
  .object({
    type: transactionTypeSchema,
    amount,
    walletId: z.string().min(1, 'Dompet wajib dipilih'),
    categoryId: z.string().min(1).nullable().optional(),
    transferWalletId: z.string().min(1).nullable().optional(),
    occurredOn: dateString,
    description: z
      .string()
      .min(1, 'Deskripsi wajib diisi')
      .max(255, 'Deskripsi maksimal 255 karakter')
      .transform((v) => v.trim()),
    note: z
      .string()
      .max(1000, 'Catatan maksimal 1000 karakter')
      .optional()
      .transform((v) => (v?.trim() ? v.trim() : null)),
  })
  .superRefine((data, ctx) => {
    if (data.type === 'transfer') {
      if (!data.transferWalletId) {
        ctx.addIssue({
          code: 'custom',
          path: ['transferWalletId'],
          message: 'Dompet tujuan wajib dipilih',
        });
      } else if (data.transferWalletId === data.walletId) {
        ctx.addIssue({
          code: 'custom',
          path: ['transferWalletId'],
          message: 'Dompet tujuan harus berbeda',
        });
      }
    } else if (!data.categoryId) {
      ctx.addIssue({
        code: 'custom',
        path: ['categoryId'],
        message: 'Kategori wajib dipilih',
      });
    }
  });

export const updateTransactionSchema = createTransactionSchema.and(
  z.object({ id: z.string().min(1) }),
);

export const transactionIdSchema = z.object({ id: z.string().min(1) });

export type CreateTransactionInput = z.input<typeof createTransactionSchema>;
export type CreateTransactionData = z.output<typeof createTransactionSchema>;
