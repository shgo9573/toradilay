import { checkAdmin } from "@/lib/server/guard";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { pin } = (await req.json()) as { pin?: string };
    const check = await checkAdmin(pin);
    if (!check.ok) {
      return Response.json({ ok: false, error: check.error }, { status: check.status });
    }
    return Response.json({ ok: true });
  } catch {
    return Response.json({ ok: false, error: "בקשה לא תקינה" }, { status: 400 });
  }
}
