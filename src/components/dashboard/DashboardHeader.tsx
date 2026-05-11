import { useState } from "react";
import { Search, Sun, Moon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { User } from "@supabase/supabase-js";
import { NotificationDropdown } from "./NotificationDropdown";
import { GlobalSearch } from "@/components/GlobalSearch";
import { useTheme } from "@/contexts/ThemeContext";
import { useNavigate } from "react-router-dom";

interface DashboardHeaderProps {
  user: User | null;
  profile: any;
}

export const DashboardHeader = ({ user, profile }: DashboardHeaderProps) => {
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

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
    <>
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />

      <header className="bg-background border-b border-border px-3 sm:px-6 py-3 sm:py-4 md:block hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            {/* Search trigger — opens GlobalSearch command palette */}
            <button
              onClick={() => setSearchOpen(true)}
              className="relative w-full max-w-md lg:max-w-lg xl:max-w-xl flex items-center gap-3 px-4 py-2 rounded-md border border-input bg-background text-muted-foreground text-sm hover:bg-accent hover:text-accent-foreground transition-colors text-left"
            >
              <Search className="h-4 w-4 shrink-0" />
              <span className="flex-1">Cari kursus, materi, atau topik...</span>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded border border-border bg-muted font-mono text-[10px] text-muted-foreground">
                Ctrl K
              </kbd>
            </button>
          </div>
        
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Dark mode toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="h-9 w-9"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>

            <NotificationDropdown userId={user?.id} />

            <div
              className="flex items-center space-x-2 sm:space-x-3 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate('/profile')}
            >
              <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                <AvatarImage src={profile?.avatar_url} />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs sm:text-sm">
                  {getInitials(displayName)}
                </AvatarFallback>
              </Avatar>
              <div className="text-sm hidden sm:block">
                <p className="font-medium text-sm">{displayName}</p>
                <p className="text-muted-foreground text-xs">
                  {profile?.subscription_type === 'premium' ? 'Premium' :
                   profile?.subscription_type === 'school' ? 'School' : 'Individual'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};