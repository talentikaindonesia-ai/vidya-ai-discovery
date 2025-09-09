import { Compass, BookOpen, Gamepad2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation, useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

const navigationItems = [
  {
    id: "home",
    label: "Home", 
    icon: BookOpen,
    description: "Dashboard Utama",
    route: "/talentika-junior"
  },
  {
    id: "discover",
    label: "Discover", 
    icon: Compass,
    description: "Find Your Talents",
    route: "/talentika-junior/discovery"
  },
  {
    id: "play", 
    label: "Play",
    icon: Gamepad2,
    description: "Educational Games",
    route: "/talentika-junior/games"
  },
  {
    id: "profile",
    label: "Profile", 
    icon: User,
    description: "Your Progress",
    route: "/talentika-junior/rewards"
  }
];

export function TalentikaJuniorBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();
  
  // Only show on mobile devices
  if (!isMobile) return null;
  
  // Determine current active section based on current route
  const getCurrentActiveSection = () => {
    const path = location.pathname;
    if (path === "/talentika-junior") return "home";
    if (path.includes("/discovery")) return "discover";
    if (path.includes("/games")) return "play";
    if (path.includes("/rewards")) return "profile";
    return "home";
  };

  const handleSectionChange = (route: string) => {
    navigate(route);
  };

  const currentActive = getCurrentActiveSection();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border shadow-lg">
      <div className="flex items-center justify-around px-1 py-1 safe-area-pb max-w-full">
        {navigationItems.map((item) => {
          const isActive = currentActive === item.id;
          const Icon = item.icon;
          
          return (
            <button
              key={item.id}
              onClick={() => handleSectionChange(item.route)}
              className={cn(
                "flex flex-col items-center justify-center px-1 py-2 min-w-0 flex-1 rounded-lg transition-all duration-200",
                "hover:bg-muted/50 active:scale-95 max-w-20",
                isActive 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon 
                className={cn(
                  "w-4 h-4 sm:w-5 sm:h-5 mb-0.5 sm:mb-1 transition-all duration-200 flex-shrink-0",
                  isActive ? "text-primary scale-110" : ""
                )} 
              />
              <span className={cn(
                "text-xs font-medium leading-tight text-center line-clamp-1 px-0.5",
                isActive ? "text-primary font-semibold" : ""
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}