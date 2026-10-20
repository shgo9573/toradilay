import { getPreviewHtml } from "@/lib/server/drive";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const fileId = searchParams.get("fileId") ?? "";
  const mode = searchParams.get("mode") === "full" ? "full" : "thumb";

  if (!fileId) {
    return Response.json({ error: "fileId is required" }, { status: 400 });
  }

  try {
    const { html, fallback } = await getPreviewHtml(fileId, mode);
    return Response.json(
      { html, fallback },
      { headers: { "Cache-Control": "private, max-age=300" } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "שגיאה בטעינת המסמך";
    return Response.json({ error: message }, { status: 502 });
  }
}
