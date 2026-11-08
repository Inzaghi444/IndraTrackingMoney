/**
 * Tipe hasil standar untuk semua Server Action.
 * Dipisah dari file action agar `'use server'` hanya mengekspor async function.
 */
export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export function actionError(
  error: string,
  fieldErrors?: Record<string, string[]>,
): ActionResult<never> {
  return { ok: false, error, fieldErrors };
}
