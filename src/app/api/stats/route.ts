import { checkAdmin } from "@/lib/server/guard";
import { getStats } from "@/lib/server/activity";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const check = await checkAdmin(req.headers.get("x-admin-pin"));
  if (!check.ok) {
    return Response.json({ error: check.error }, { status: check.status });
  }
  try {
    return Response.json(await getStats());
  } catch (err) {
    console.error("[stats] failed:", err);
    return Response.json({ error: "טעינת הסטטיסטיקה נכשלה" }, { status: 500 });
  }
}
