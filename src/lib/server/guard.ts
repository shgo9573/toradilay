import { verifyPin } from "./settings";

const g = globalThis as typeof globalThis & {
  __kioskPinFails?: { count: number; first: number };
};

const WINDOW_MS = 5 * 60 * 1000;
const MAX_FAILS = 10;

export type AdminCheck =
  | { ok: true }
  | { ok: false; status: number; error: string };

/** בדיקת קוד מנהל עם הגבלת ניסיונות (הגנה מפני ניחוש) */
export async function checkAdmin(pin: unknown): Promise<AdminCheck> {
  const now = Date.now();
  let rec = g.__kioskPinFails;
  if (rec && now - rec.first > WINDOW_MS) rec = g.__kioskPinFails = undefined;

  if (rec && rec.count >= MAX_FAILS) {
    return {
      ok: false,
      status: 429,
      error: "יותר מדי ניסיונות שגויים. נסה שוב בעוד כמה דקות.",
    };
  }

  if (await verifyPin(pin)) {
    g.__kioskPinFails = undefined;
    return { ok: true };
  }

  if (!rec) rec = g.__kioskPinFails = { count: 0, first: now };
  rec.count += 1;
  return { ok: false, status: 401, error: "קוד שגוי" };
}
