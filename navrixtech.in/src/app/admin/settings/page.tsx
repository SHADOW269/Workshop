import { prisma } from "@/lib/prisma";
import { SettingsForm } from "@/components/admin/settings-form";

export default async function AdminSettingsPage() {
  const settingsRecords = await prisma.settings.findMany();
  const settingsMap = settingsRecords.reduce(
    (acc, s) => ({ ...acc, [s.key]: s.value }),
    {} as Record<string, unknown>
  );

  const settings = {
    siteName: String(settingsMap.siteName ?? "Navrix"),
    siteDescription: String(settingsMap.siteDescription ?? ""),
    contactEmail: String(settingsMap.contactEmail ?? ""),
    contactPhone: String(settingsMap.contactPhone ?? ""),
    metaTitle: String(settingsMap.metaTitle ?? ""),
    metaDescription: String(settingsMap.metaDescription ?? ""),
    instagram: String(settingsMap.instagram ?? ""),
    twitter: String(settingsMap.twitter ?? ""),
    youtube: String(settingsMap.youtube ?? ""),
    discord: String(settingsMap.discord ?? ""),
  };

  return <SettingsForm settings={settings} />;
}
