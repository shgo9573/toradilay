import { getStoredConfig } from "@/lib/server/settings";
import {
  matchStudentFolder,
  scrapeFolder,
  toKioskFile,
} from "@/lib/server/drive";
import { searchLocalFolder } from "@/lib/server/drives";
import { logActivity } from "@/lib/server/activity";
import type { SearchResponse } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  let studentId = "";
  try {
    const body = (await req.json()) as { studentId?: string };
    studentId = String(body.studentId ?? "").replace(/\D/g, "");
  } catch {
    /* handled below */
  }

  if (studentId.length < 5 || studentId.length > 12) {
    return Response.json(
      { found: false, error: "BAD_ID", message: "מספר תעודת זהות לא תקין" } satisfies SearchResponse,
      { status: 400 },
    );
  }

  const cfg = await getStoredConfig();

  // 1. חיפוש בגוגל דרייב
  const root = await scrapeFolder(cfg.rootFolderId);
  const match = matchStudentFolder(root.folders, studentId);

  if (match) {
    const sub = await scrapeFolder(match.id);
    const files = sub.files.map(toKioskFile);
    await logActivity({
      type: "search",
      studentId,
      detail: `נמצאה תיקייה בדרייב · ${files.filter((f) => f.isWordDoc).length} מסמכי וורד`,
    });
    return Response.json({
      found: true,
      folder: { id: match.id, name: match.name },
      files,
      source: "drive",
    } satisfies SearchResponse);
  }

  // 2. גיבוי: כוננים מקומיים / דיסק און קי
  try {
    const local = await searchLocalFolder(studentId, cfg);
    if (local) {
      await logActivity({
        type: "search",
        studentId,
        detail: "נמצאה תיקייה בכונן מקומי",
      });
      return Response.json({
        found: true,
        folder: { id: local.folderName, name: local.folderName },
        files: local.files,
        source: "local",
      } satisfies SearchResponse);
    }
  } catch (err) {
    console.warn("[search] local fallback failed:", err);
  }

  if (!root.ok) {
    await logActivity({
      type: "miss",
      studentId,
      success: false,
      detail: root.authError || "גוגל דרייב לא זמין / תיקייה פרטית",
    });
    return Response.json({
      found: false,
      error: "DRIVE_UNREACHABLE",
      message:
        root.authError ||
        "תיקיית הדרייב פרטית או שאינה זמינה כרגע. יש לחבר חשבון Google מורשה באזור הניהול.",
    } satisfies SearchResponse);
  }

  await logActivity({
    type: "miss",
    studentId,
    success: false,
    detail: "לא נמצאה תיקייה",
  });
  return Response.json({
    found: false,
    error: "FOLDER_NOT_FOUND",
    message: `לא נמצאה תיקייה עבור תעודת זהות "${studentId}". ודא שהמספר נכון ושהתיקייה קיימת בדרייב.`,
  } satisfies SearchResponse);
}
