import { z } from 'zod';

export const budgetPeriodSchema = z.enum(['daily', 'weekly', 'monthly', 'yearly']);

export const upsertBudgetSchema = z.object({
  categoryId: z.string().min(1).nullable().optional(),
  period: budgetPeriodSchema.default('monthly'),
  amount: z
    .union([z.string(), z.number()])
    .transform((v) => (typeof v === 'number' ? v : Number(v.replace(/[^\d]/g, ''))))
    .refine((v) => Number.isFinite(v) && v > 0, 'Nominal anggaran harus lebih dari 0')
    .transform((v) => Math.round(v)),
  alertThreshold: z.coerce
    .number()
    .int()
    .min(1, 'Minimal 1%')
    .max(100, 'Maksimal 100%')
    .default(80),
});

export const deleteBudgetSchema = z.object({ id: z.string().min(1) });

export type UpsertBudgetInput = z.input<typeof upsertBudgetSchema>;
