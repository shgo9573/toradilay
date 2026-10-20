import { getStoredConfig } from "@/lib/server/settings";
import {
  checkExistingRegistration,
  NOT_CONFIGURED_MESSAGE,
  resolveTarget,
} from "@/lib/server/sheets";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** בדיקת כפילות לפני רישום */
export async function POST(req: Request) {
  let idNumber = "";
  try {
    const body = (await req.json()) as { idNumber?: string };
    idNumber = String(body.idNumber ?? "").replace(/\D/g, "");
  } catch {
    /* handled below */
  }
  if (!/^\d{5,9}$/.test(idNumber)) {
    return Response.json({ error: "מספר תעודת זהות לא תקין" }, { status: 400 });
  }

  const cfg = await getStoredConfig();
  if (!cfg.registrationEnabled) {
    return Response.json({ error: "הרישום מהעמדה כבוי בהגדרות" }, { status: 403 });
  }
  const target = await resolveTarget();
  if (!target) {
    return Response.json({ error: NOT_CONFIGURED_MESSAGE, code: "NOT_CONFIGURED" }, { status: 409 });
  }

  const result = await checkExistingRegistration(target, idNumber);
  return Response.json(result);
}
