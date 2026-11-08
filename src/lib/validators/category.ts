import { z } from 'zod';

export const categoryTypeSchema = z.enum(['income', 'expense']);

export const createCategorySchema = z.object({
  name: z
    .string()
    .min(1, 'Nama kategori wajib diisi')
    .max(80, 'Nama maksimal 80 karakter')
    .transform((v) => v.trim()),
  type: categoryTypeSchema,
  icon: z.string().max(50).default('circle'),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Warna harus format hex (#RRGGBB)')
    .default('#64748B'),
  parentId: z.string().min(1).nullable().optional(),
});

export const updateCategorySchema = createCategorySchema.partial().and(
  z.object({ id: z.string().min(1) }),
);

export type CreateCategoryInput = z.input<typeof createCategorySchema>;
