import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "@supabase/supabase-js";
import { NotificationDropdown } from "./NotificationDropdown";

interface DashboardHeaderProps {
  user: User | null;
  profile: any;
}

export const DashboardHeader = ({ user, profile }: DashboardHeaderProps) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const displayName = profile?.full_name || user?.email || 'Pengguna';

  return (
    <header className="bg-background border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 flex-1">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input 
              placeholder="Cari kursus, materi, atau topik..." 
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <NotificationDropdown userId={user?.id} />
          
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
            <div className="text-sm">
              <p className="font-medium">{displayName}</p>
              <p className="text-muted-foreground text-xs">
                {profile?.subscription_type === 'premium' ? 'Premium' : 
                 profile?.subscription_type === 'school' ? 'School' : 'Individual'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};