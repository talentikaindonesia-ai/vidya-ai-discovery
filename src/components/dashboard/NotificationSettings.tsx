import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface NotificationPreferences {
  learning_content: boolean;
  opportunities: boolean;
  challenges: boolean;
  achievements: boolean;
  email_notifications: boolean;
}

export const NotificationSettings = () => {
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    learning_content: true,
    opportunities: true,
    challenges: true,
    achievements: true,
    email_notifications: false,
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Load preferences from localStorage
    const saved = localStorage.getItem('notification_preferences');
    if (saved) {
      setPreferences(JSON.parse(saved));
    }
  }, []);

  const handleToggle = (key: keyof NotificationPreferences) => {
    setPreferences(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      localStorage.setItem('notification_preferences', JSON.stringify(preferences));
      toast({
        title: "Pengaturan Disimpan",
        description: "Preferensi notifikasi Anda telah diperbarui.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal menyimpan pengaturan notifikasi.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pengaturan Notifikasi</CardTitle>
        <CardDescription>
          Kelola jenis notifikasi yang ingin Anda terima dari Talentika
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="learning">Konten Pembelajaran Baru</Label>
              <p className="text-sm text-muted-foreground">
                Dapatkan notifikasi saat ada kursus atau materi baru
              </p>
            </div>
            <Switch
              id="learning"
              checked={preferences.learning_content}
              onCheckedChange={() => handleToggle('learning_content')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="opportunities">Peluang Baru</Label>
              <p className="text-sm text-muted-foreground">
                Beasiswa, kompetisi, dan lowongan kerja terbaru
              </p>
            </div>
            <Switch
              id="opportunities"
              checked={preferences.opportunities}
              onCheckedChange={() => handleToggle('opportunities')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="challenges">Tantangan & Event</Label>
              <p className="text-sm text-muted-foreground">
                Tantangan komunitas dan event yang tersedia
              </p>
            </div>
            <Switch
              id="challenges"
              checked={preferences.challenges}
              onCheckedChange={() => handleToggle('challenges')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="achievements">Pencapaian & XP</Label>
              <p className="text-sm text-muted-foreground">
                Pemberitahuan tentang pencapaian dan level baru
              </p>
            </div>
            <Switch
              id="achievements"
              checked={preferences.achievements}
              onCheckedChange={() => handleToggle('achievements')}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="email">Notifikasi Email</Label>
              <p className="text-sm text-muted-foreground">
                Terima notifikasi penting melalui email
              </p>
            </div>
            <Switch
              id="email"
              checked={preferences.email_notifications}
              onCheckedChange={() => handleToggle('email_notifications')}
            />
          </div>
        </div>

        <Button onClick={savePreferences} disabled={saving} className="w-full">
          {saving ? "Menyimpan..." : "Simpan Pengaturan"}
        </Button>
      </CardContent>
    </Card>
  );
};