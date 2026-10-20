import { logActivity } from "@/lib/server/activity";

export const dynamic = "force-dynamic";

/** רישום פעילות מצד הלקוח (הדפסה / יציאה) */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      type?: string;
      studentId?: string;
      fileName?: string;
      success?: boolean;
      detail?: string;
    };
    if (body.type !== "print" && body.type !== "exit") {
      return Response.json({ ok: false }, { status: 400 });
    }
    await logActivity({
      type: body.type,
      studentId: body.studentId,
      fileName: body.fileName,
      success: body.success !== false,
      detail: body.detail,
    });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }
}
