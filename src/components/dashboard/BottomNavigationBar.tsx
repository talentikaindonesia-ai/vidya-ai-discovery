import { Home, BookOpen, Rocket, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation, useNavigate } from "react-router-dom";

interface BottomNavigationBarProps {
  activeSection?: string;
  onSectionChange?: (section: string) => void;
}

const navigationItems = [
  {
    id: "home",
    label: "Home", 
    icon: Home,
    description: "Feed & Challenges",
    route: "/dashboard"
  },
  {
    id: "courses",
    label: "Courses",
    icon: BookOpen,
    description: "Learning Progress",
    route: "/learning"
  },
  {
    id: "opportunities", 
    label: "Opportunity",
    icon: Rocket,
    description: "Jobs & Events",
    route: "/opportunities"
  },
  {
    id: "profile",
    label: "Profile", 
    icon: User,
    description: "Account Settings",
    route: "/profile"
  }
];

export function BottomNavigationBar({ activeSection, onSectionChange }: BottomNavigationBarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine current active section based on current route
  const getCurrentActiveSection = () => {
    if (activeSection) return activeSection;
    
    const path = location.pathname;
    if (path === "/dashboard") return "home";
    if (path === "/learning") return "courses";
    if (path === "/opportunities") return "opportunities";
    if (path === "/profile") return "profile";
    return "home";
  };

  const handleSectionChange = (sectionId: string, route: string) => {
    if (onSectionChange && route === "/dashboard") {
      // Only use section change for dashboard internal navigation
      onSectionChange(sectionId);
    } else {
      // Always navigate for external routes
      navigate(route);
    }
  };

  const currentActive = getCurrentActiveSection();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border shadow-lg md:hidden">
      <div className="flex items-center justify-around px-2 py-2 safe-area-pb">
        {navigationItems.map((item) => {
          const isActive = currentActive === item.id;
          const Icon = item.icon;
          
          return (
            <button
              key={item.id}
              onClick={() => handleSectionChange(item.id, item.route)}
              className={cn(
                "flex flex-col items-center justify-center px-2 py-2 min-w-0 flex-1 rounded-lg transition-all duration-200",
                "hover:bg-muted/50 active:scale-95",
                isActive 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon 
                className={cn(
                  "w-5 h-5 mb-1 transition-all duration-200",
                  isActive ? "text-primary scale-110" : ""
                )} 
              />
              <span className={cn(
                "text-xs font-medium leading-tight",
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