import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { BarChart3, Trophy, Settings, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  {
    id: "overview",
    label: "Overview",
    icon: User,
    description: "Ringkasan profil"
  },
  {
    id: "progress", 
    label: "Progress",
    icon: BarChart3,
    description: "Statistik belajar"
  },
  {
    id: "achievements",
    label: "Achievements", 
    icon: Trophy,
    description: "Sertifikat & badge"
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    description: "Pengaturan akun"
  }
];

export function ProfileTabs({ activeTab, onTabChange }: ProfileTabsProps) {
  return (
    <ScrollArea className="w-full whitespace-nowrap">
      <div className="flex space-x-2 pb-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <Button
              key={tab.id}
              variant={isActive ? "default" : "ghost"}
              size="sm"
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex items-center space-x-2 min-w-fit transition-all duration-200",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-md" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="font-medium">{tab.label}</span>
            </Button>
          );
        })}
      </div>
      <ScrollBar orientation="horizontal" />
    </ScrollArea>
  );
}