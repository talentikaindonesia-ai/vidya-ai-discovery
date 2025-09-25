import { User } from "@supabase/supabase-js";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit3, GraduationCap, Crown, User as UserIcon } from "lucide-react";

interface ProfileHeaderProps {
  user: User | null;
  profile: any;
  stats: {
    coursesCompleted: number;
    totalCourses: number;
    certificates: number;
    achievements: number;
    totalPoints: number;
    currentStreak: number;
  };
}

export function ProfileHeader({ user, profile, stats }: ProfileHeaderProps) {
  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Pengguna';
  const educationLevel = getEducationLevel(profile);
  const membershipInfo = getMembershipInfo(profile);
  
  const badges = [];
  if (stats.achievements >= 5) badges.push({ icon: "🏅", label: "Top Learner" });
  if (stats.coursesCompleted >= 3) badges.push({ icon: "⭐", label: "STEM Explorer" });
  if (stats.currentStreak >= 7) badges.push({ icon: "🔥", label: "Streak Master" });

  return (
    <div className="bg-gradient-to-br from-primary to-primary-glow text-primary-foreground">
      <div className="px-4 py-8">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Avatar className="w-20 h-20 border-4 border-white/20">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className="bg-white/20 text-primary-foreground text-xl font-bold">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold mb-1">{displayName}</h1>
              <div className="flex items-center space-x-3 mb-2">
                <div className="flex items-center space-x-1">
                  <GraduationCap className="w-4 h-4" />
                  <span className="text-primary-foreground/80">{educationLevel}</span>
                </div>
                <div className="flex items-center space-x-1">
                  {membershipInfo.isPremium ? (
                    <Crown className="w-4 h-4" />
                  ) : (
                    <UserIcon className="w-4 h-4" />
                  )}
                  <span className="text-primary-foreground/80">{membershipInfo.label}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className={`text-xs ${membershipInfo.isPremium ? 'bg-yellow-500/20 text-yellow-100' : 'bg-blue-500/20 text-blue-100'}`}>
                  {membershipInfo.status}
                </Badge>
                {badges.map((badge, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    <span className="mr-1">{badge.icon}</span>
                    {badge.label}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="text-primary-foreground hover:bg-white/20">
            <Edit3 className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 bg-white/10 rounded-lg p-4 backdrop-blur-sm">
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.coursesCompleted}</div>
            <div className="text-sm text-primary-foreground/80">Kursus Selesai</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.certificates}</div>
            <div className="text-sm text-primary-foreground/80">Sertifikat</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{stats.totalPoints}</div>
            <div className="text-sm text-primary-foreground/80">Total Poin</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function getEducationLevel(profile: any): string {
  if (!profile) return "Tingkat Pendidikan";
  
  // This could be enhanced based on your profile structure
  // For now, we'll use a simple mapping
  const organizationType = profile.organization_type;
  
  if (organizationType === 'school') {
    return "Siswa";
  } else if (organizationType === 'university') {
    return "Mahasiswa";
  } else {
    return "Pembelajar";
  }
}

function getMembershipInfo(profile: any): { label: string; status: string; isPremium: boolean } {
  if (!profile) return { label: "Individual", status: "Tidak Aktif", isPremium: false };
  
  const subscriptionStatus = profile.subscription_status;
  const subscriptionType = profile.subscription_type;
  
  if (subscriptionStatus === 'active') {
    if (subscriptionType === 'premium') {
      return { label: "Premium", status: "Aktif", isPremium: true };
    } else {
      return { label: "Individual", status: "Aktif", isPremium: false };
    }
  } else {
    return { label: "Individual", status: "Tidak Aktif", isPremium: false };
  }
}