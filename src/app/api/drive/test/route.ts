import { checkAdmin } from "@/lib/server/guard";
import { scrapeFolder } from "@/lib/server/drive";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** בדיקת חיבור לתיקיית השורש בדרייב (למנהל בלבד) */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { pin?: string; rootFolderId?: string };
    const check = await checkAdmin(body.pin);
    if (!check.ok) {
      return Response.json({ error: check.error }, { status: check.status });
    }

    const rootId = String(body.rootFolderId ?? "").trim();
    if (!/^[A-Za-z0-9_-]{5,120}$/.test(rootId)) {
      return Response.json({ ok: false, error: "מזהה תיקייה לא תקין" });
    }

    const started = Date.now();
    const res = await scrapeFolder(rootId, { fresh: true });
    return Response.json({
      ok: res.ok,
      authMode: res.authMode,
      ms: Date.now() - started,
      folderCount: res.folders.length,
      fileCount: res.files.length,
      sample: res.folders.slice(0, 6).map((f) => f.name),
      error: res.ok
        ? undefined
        : res.authError ||
          "התיקייה פרטית או שאינה נגישה. חבר חשבון Google מורשה למעלה (או שתף את התיקייה בקישור).",
    });
  } catch {
    return Response.json({ ok: false, error: "בקשה לא תקינה" }, { status: 400 });
  }
}
