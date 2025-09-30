import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  User as UserIcon, 
  Bell, 
  Shield, 
  Palette, 
  Camera,
  Save,
  LogOut
} from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface ProfileSettingsProps {
  user: User | null;
  profile: any;
  onProfileUpdate: (userId: string) => void;
}

export function ProfileSettings({ user, profile, onProfileUpdate }: ProfileSettingsProps) {
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    email: profile?.email || user?.email || '',
    phone: profile?.phone || '',
    address: profile?.address || '',
    organization_name: profile?.organization_name || '',
    organization_type: profile?.organization_type || 'individual'
  });
  
  const [notifications, setNotifications] = useState({
    course_updates: true,
    quiz_reminders: true,
    achievement_alerts: true,
    marketing_emails: false
  });
  
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleNotificationChange = (field: string, value: boolean) => {
    setNotifications(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Validate and sanitize input before saving
      const sanitizedData = {
        user_id: user.id,
        full_name: formData.full_name?.trim() || null,
        email: formData.email?.trim() || user.email,
        phone: formData.phone?.trim() || null,
        address: formData.address?.trim() || null,
        organization_name: formData.organization_name?.trim() || null,
        organization_type: formData.organization_type || 'individual',
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(sanitizedData);

      if (error) throw error;
      
      toast.success("Profil berhasil diperbarui");
      onProfileUpdate(user.id);
    } catch (error: any) {
      toast.error("Gagal memperbarui profil: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Berhasil logout");
      navigate("/");
    } catch (error: any) {
      toast.error("Gagal logout: " + error.message);
    }
  };

  const displayName = formData.full_name || user?.email?.split('@')[0] || 'Pengguna';

  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <Card>
        <CardHeader className="flex flex-row items-center space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold flex items-center space-x-2">
            <UserIcon className="h-5 w-5" />
            <span>Informasi Profil</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Picture */}
          <div className="flex items-center space-x-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className="text-xl font-bold">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <Button variant="outline" size="sm">
              <Camera className="h-4 w-4 mr-2" />
              Ganti Foto
            </Button>
          </div>

          {/* Form Fields */}
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="full_name">Nama Lengkap</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => handleInputChange('full_name', e.target.value)}
                placeholder="Masukkan nama lengkap"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Masukkan email"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="phone">Nomor Telepon</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Masukkan nomor telepon"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="organization_type">Jenis Pengguna</Label>
              <Select
                value={formData.organization_type}
                onValueChange={(value) => handleInputChange('organization_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih jenis pengguna" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Individu</SelectItem>
                  <SelectItem value="school">Sekolah</SelectItem>
                  <SelectItem value="university">Universitas</SelectItem>
                  <SelectItem value="company">Perusahaan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="address">Alamat</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Masukkan alamat lengkap"
              />
            </div>
          </div>

          <Button onClick={handleSaveProfile} disabled={loading} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <span>Pengaturan Notifikasi</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Update Kursus</div>
              <div className="text-sm text-muted-foreground">
                Notifikasi ketika ada kursus baru atau update
              </div>
            </div>
            <Switch
              checked={notifications.course_updates}
              onCheckedChange={(checked) => handleNotificationChange('course_updates', checked)}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Pengingat Quiz</div>
              <div className="text-sm text-muted-foreground">
                Pengingat untuk mengerjakan quiz yang tersedia
              </div>
            </div>
            <Switch
              checked={notifications.quiz_reminders}
              onCheckedChange={(checked) => handleNotificationChange('quiz_reminders', checked)}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Alert Achievement</div>
              <div className="text-sm text-muted-foreground">
                Notifikasi ketika mendapat badge atau sertifikat
              </div>
            </div>
            <Switch
              checked={notifications.achievement_alerts}
              onCheckedChange={(checked) => handleNotificationChange('achievement_alerts', checked)}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Email Marketing</div>
              <div className="text-sm text-muted-foreground">
                Tips belajar dan promosi produk via email
              </div>
            </div>
            <Switch
              checked={notifications.marketing_emails}
              onCheckedChange={(checked) => handleNotificationChange('marketing_emails', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Privacy & Security */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Privacy & Keamanan</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" className="w-full justify-start">
            Ganti Password
          </Button>
          <Button variant="outline" className="w-full justify-start">
            Riwayat Login
          </Button>
          <Button variant="outline" className="w-full justify-start">
            Download Data Pribadi
          </Button>
        </CardContent>
      </Card>

      {/* Account Actions */}
      <Card>
        <CardContent className="pt-6">
          <Button
            variant="destructive"
            onClick={handleSignOut}
            className="w-full"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}