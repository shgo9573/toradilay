import { checkAdmin } from "@/lib/server/guard";
import { clearDriveCaches } from "@/lib/server/drive";
import { buildGoogleAuthStatus } from "@/lib/server/google-oauth";
import { saveGoogleAccount } from "@/lib/server/settings";
import { loadServiceAccount } from "@/lib/server/sheets";

export const dynamic = "force-dynamic";

/** ניתוק החשבון המחובר מהגדרות העמדה */
export async function DELETE(req: Request) {
  const check = await checkAdmin(req.headers.get("x-admin-pin"));
  if (!check.ok) {
    return Response.json({ error: check.error }, { status: check.status });
  }
  await saveGoogleAccount(null);
  clearDriveCaches();
  const sa = loadServiceAccount();
  return Response.json({
    ok: true,
    status: await buildGoogleAuthStatus(sa?.client_email ?? null),
  });
}
