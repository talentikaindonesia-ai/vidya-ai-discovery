import { Home, BookOpen, Rocket, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavigationBarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const navigationItems = [
  {
    id: "overview",
    label: "Home", 
    icon: Home,
    description: "Feed & Challenges"
  },
  {
    id: "courses",
    label: "Courses",
    icon: BookOpen,
    description: "Learning Progress"
  },
  {
    id: "opportunities", 
    label: "Opportunity",
    icon: Rocket,
    description: "Jobs & Events"
  },
  {
    id: "profile",
    label: "Profile", 
    icon: User,
    description: "Account Settings"
  }
];

export function BottomNavigationBar({ activeSection, onSectionChange }: BottomNavigationBarProps) {
  const handleSectionChange = (sectionId: string) => {
    if (sectionId === "profile") {
      // For now, just show a placeholder for profile
      // In the future, this could navigate to a profile page
      return;
    }
    onSectionChange(sectionId);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-lg md:hidden">
      <div className="flex items-center justify-around px-2 py-2 safe-area-pb">
        {navigationItems.map((item) => {
          const isActive = activeSection === item.id;
          const Icon = item.icon;
          
          return (
            <button
              key={item.id}
              onClick={() => handleSectionChange(item.id)}
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