"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save } from "lucide-react";

interface Settings {
  siteName?: string;
  siteDescription?: string;
  contactEmail?: string;
  contactPhone?: string;
  metaTitle?: string;
  metaDescription?: string;
  instagram?: string;
  twitter?: string;
  youtube?: string;
  discord?: string;
}

interface Props {
  settings: Settings;
}

export function SettingsForm({ settings }: Props) {
  const [isPending, startTransition] = useTransition();
  const [form, setForm] = useState<Settings>(settings);

  const update = (key: keyof Settings, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    startTransition(async () => {
      try {
        const res = await fetch("/api/admin/settings", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error("Failed to save");
        toast.success("Settings saved");
      } catch {
        toast.error("Failed to save settings");
      }
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Settings</h1>
        <Button onClick={handleSave} disabled={isPending}>
          <Save className="h-4 w-4" />
          {isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Site Name</Label>
                <Input
                  value={form.siteName ?? ""}
                  onChange={(e) => update("siteName", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Site Description</Label>
                <Textarea
                  rows={3}
                  value={form.siteDescription ?? ""}
                  onChange={(e) => update("siteDescription", e.target.value)}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Contact Email</Label>
                  <Input
                    type="email"
                    value={form.contactEmail ?? ""}
                    onChange={(e) => update("contactEmail", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contact Phone</Label>
                  <Input
                    value={form.contactPhone ?? ""}
                    onChange={(e) => update("contactPhone", e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>SEO</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Meta Title</Label>
                <Input
                  value={form.metaTitle ?? ""}
                  onChange={(e) => update("metaTitle", e.target.value)}
                  placeholder="Title for search engines"
                />
              </div>
              <div className="space-y-2">
                <Label>Meta Description</Label>
                <Textarea
                  rows={3}
                  value={form.metaDescription ?? ""}
                  onChange={(e) => update("metaDescription", e.target.value)}
                  placeholder="Description for search engines"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Social Media</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Instagram</Label>
                  <Input
                    value={form.instagram ?? ""}
                    onChange={(e) => update("instagram", e.target.value)}
                    placeholder="https://instagram.com/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Twitter / X</Label>
                  <Input
                    value={form.twitter ?? ""}
                    onChange={(e) => update("twitter", e.target.value)}
                    placeholder="https://x.com/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>YouTube</Label>
                  <Input
                    value={form.youtube ?? ""}
                    onChange={(e) => update("youtube", e.target.value)}
                    placeholder="https://youtube.com/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Discord</Label>
                  <Input
                    value={form.discord ?? ""}
                    onChange={(e) => update("discord", e.target.value)}
                    placeholder="https://discord.gg/..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
