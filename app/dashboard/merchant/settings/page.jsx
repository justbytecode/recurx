"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";
import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { prisma } from "@/lib/prisma";
import { toast } from "@/components/ui/use-toast";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  const [session, setSession] = useState(null);
  const [settings, setSettings] = useState({
    businessName: "",
    logoUrl: "",
    emailNotifications: true,
    twoFactorAuth: false,
  });

  useEffect(() => {
    async function fetchSession() {
      const sess = await auth();
      if (!sess || sess.user.role !== "merchant") {
        redirect("/auth/signin");
      }
      setSession(sess);
      const user = await prisma.user.findUnique({
        where: { id: sess.user.id },
        select: { name: true, image: true },
      });
      setSettings({
        businessName: user.name || "",
        logoUrl: user.image || "",
        emailNotifications: true,
        twoFactorAuth: false,
      });
    }
    fetchSession();
  }, []);

  const handleSaveSettings = async () => {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: settings.businessName,
        image: settings.logoUrl,
      },
    });
    toast({
      title: "Settings Saved",
      description: "Your settings have been updated successfully.",
    });
  };

  if (!session) return null;

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar role={session.user.role} />
      <div className="flex-1 p-4 sm:p-6 md:p-8 lg:p-10 max-w-[100vw] overflow-x-hidden">
        <header className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Settings</h1>
        </header>
        <Card className="shadow-lg bg-white rounded-xl">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Account Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <Label className="text-sm font-medium text-gray-700">Business Name</Label>
                <Input
                  value={settings.businessName}
                  onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                  className="mt-1 border-gray-300 focus:ring-primary-merchant"
                  placeholder="Enter your business name"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Logo URL</Label>
                <Input
                  value={settings.logoUrl}
                  onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                  className="mt-1 border-gray-300 focus:ring-primary-merchant"
                  placeholder="Enter logo URL"
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Email Notifications</Label>
                  <p className="text-sm text-gray-500">Receive email updates for transactions and account activity.</p>
                </div>
                <Switch
                  checked={settings.emailNotifications}
                  onCheckedChange={(checked) => setSettings({ ...settings, emailNotifications: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Two-Factor Authentication</Label>
                  <p className="text-sm text-gray-500">Enable 2FA for enhanced account security.</p>
                </div>
                <Switch
                  checked={settings.twoFactorAuth}
                  onCheckedChange={(checked) => setSettings({ ...settings, twoFactorAuth: checked })}
                />
              </div>
              <Button
                onClick={handleSaveSettings}
                className="bg-primary-merchant hover:bg-emerald-600"
              >
                Save Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}