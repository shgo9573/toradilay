import { getFileBuffer, getKnownFileName } from "@/lib/server/drive";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const fileId = searchParams.get("fileId") ?? "";
  if (!fileId) {
    return Response.json({ error: "fileId is required" }, { status: 400 });
  }

  try {
    const buffer = await getFileBuffer(fileId);
    const name =
      getKnownFileName(fileId) || searchParams.get("name") || "document.docx";
    const safe = name.replace(/[\\/:*?"<>|\r\n]/g, "_");
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Length": String(buffer.length),
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(safe)}`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "שגיאה בהורדה";
    return Response.json({ error: message }, { status: 502 });
  }
}
