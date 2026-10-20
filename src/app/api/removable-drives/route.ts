import { detectRemovableDrives, isWindows } from "@/lib/server/drives";

export const dynamic = "force-dynamic";

export async function GET() {
  const drives = detectRemovableDrives();
  return Response.json({ drives, count: drives.length, isWindows });
}
