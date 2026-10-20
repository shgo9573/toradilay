import { clearDriveCaches } from "@/lib/server/drive";
import { getPublicConfig, saveConfig } from "@/lib/server/settings";
import { checkAdmin } from "@/lib/server/guard";

export const dynamic = "force-dynamic";

export async function GET() {
  const config = await getPublicConfig();
  return Response.json({ config });
}

export async function PUT(req: Request) {
  try {
    const body = (await req.json()) as {
      pin?: string;
      config?: unknown;
      newPin?: string;
      sheetsWebhookUrl?: string;
    };
    const check = await checkAdmin(body.pin);
    if (!check.ok) {
      return Response.json({ error: check.error }, { status: check.status });
    }
    const config = await saveConfig(body.config, {
      newPin: body.newPin,
      sheetsWebhookUrl: body.sheetsWebhookUrl,
    });
    clearDriveCaches();
    return Response.json({ ok: true, config });
  } catch (err) {
    console.error("[settings] save failed:", err);
    return Response.json({ error: "שמירת ההגדרות נכשלה" }, { status: 500 });
  }
}
