import { KioskApp } from "@/components/KioskApp";
import { getPublicConfig } from "@/lib/server/settings";

export const dynamic = "force-dynamic";

export default async function Home() {
  const config = await getPublicConfig();
  return <KioskApp initialConfig={config} />;
}
