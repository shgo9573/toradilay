import { getFileBuffer, getKnownFileName } from "@/lib/server/drive";
import { copyToTarget } from "@/lib/server/drives";
import { getStoredConfig } from "@/lib/server/settings";
import { logActivity } from "@/lib/server/activity";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  let fileId = "";
  let fileName = "";
  let studentId = "";
  try {
    const body = (await req.json()) as {
      fileId?: string;
      fileName?: string;
      studentId?: string;
    };
    fileId = String(body.fileId ?? "");
    fileName = String(body.fileName ?? "");
    studentId = String(body.studentId ?? "");
  } catch {
    return Response.json({ success: false, message: "בקשה לא תקינה" }, { status: 400 });
  }

  if (!fileId) {
    return Response.json({ success: false, message: "חסר מזהה קובץ" }, { status: 400 });
  }

  const name = getKnownFileName(fileId) || fileName || "document.docx";

  try {
    const buffer = await getFileBuffer(fileId);
    const cfg = await getStoredConfig();
    const outcome = copyToTarget(buffer, name, cfg);

    await logActivity({
      type: "copy",
      studentId,
      fileName: name,
      success: outcome.success,
      detail:
        outcome.mode === "download"
          ? "הורדה בדפדפן"
          : outcome.path ?? outcome.message,
    });

    return Response.json(outcome);
  } catch (err) {
    const message = err instanceof Error ? err.message : "ההעתקה נכשלה";
    await logActivity({
      type: "copy",
      studentId,
      fileName: name,
      success: false,
      detail: message,
    });
    return Response.json({ success: false, mode: "server", message }, { status: 502 });
  }
}
