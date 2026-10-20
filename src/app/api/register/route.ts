import { getStoredConfig } from "@/lib/server/settings";
import {
  NOT_CONFIGURED_MESSAGE,
  registerStudent,
  resolveTarget,
  validateRegistration,
} from "@/lib/server/sheets";
import { logActivity } from "@/lib/server/activity";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** רישום תלמיד חדש לגיליון Google Sheets */
export async function POST(req: Request) {
  let raw: unknown = null;
  try {
    raw = await req.json();
  } catch {
    return Response.json({ success: false, error: "בקשה לא תקינה" }, { status: 400 });
  }

  const v = validateRegistration(raw);
  if (!v.ok) {
    return Response.json({ success: false, error: v.error }, { status: 400 });
  }

  const cfg = await getStoredConfig();
  if (!cfg.registrationEnabled) {
    return Response.json({ success: false, error: "הרישום מהעמדה כבוי בהגדרות" }, { status: 403 });
  }
  const target = await resolveTarget();
  if (!target) {
    return Response.json(
      { success: false, error: NOT_CONFIGURED_MESSAGE, code: "NOT_CONFIGURED" },
      { status: 409 },
    );
  }

  const fullName = `${v.payload.firstName} ${v.payload.lastName}`;
  try {
    const result = await registerStudent(target, v.payload);
    await logActivity({
      type: "register",
      studentId: v.payload.idNumber,
      fileName: fullName,
      detail: `ועד ${v.payload.vaad} · ${result.updatedRange ?? target.method}`,
    });
    return Response.json({ success: true, message: result.message, updatedRange: result.updatedRange });
  } catch (err) {
    const message = err instanceof Error ? err.message : "אירעה שגיאה בעת שמירת הנתונים בגיליון";
    await logActivity({
      type: "register",
      studentId: v.payload.idNumber,
      fileName: fullName,
      success: false,
      detail: message,
    });
    return Response.json({ success: false, error: message }, { status: 502 });
  }
}
