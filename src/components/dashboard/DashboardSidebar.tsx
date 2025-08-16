import { 
  BookOpen, 
  Trophy, 
  BarChart3, 
  Home, 
  User, 
  LogOut,
  Calendar,
  Settings
} from "lucide-react";
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

interface DashboardSidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  onSignOut: () => void;
}

export const DashboardSidebar = ({ activeSection, setActiveSection, onSignOut }: DashboardSidebarProps) => {
  const menuItems = [
    { id: "overview", label: "Dashboard", icon: Home },
    { id: "courses", label: "Kursus Saya", icon: BookOpen },
    { id: "progress", label: "Progress", icon: BarChart3 },
    { id: "achievements", label: "Pencapaian", icon: Trophy },
    { id: "calendar", label: "Jadwal", icon: Calendar },
    { id: "profile", label: "Profil", icon: User },
    { id: "settings", label: "Pengaturan", icon: Settings },
  ];

  return (
    <Sidebar className="border-r border-border bg-card">
      <SidebarHeader className="p-6 border-b border-border">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">V</span>
          </div>
          <span className="font-bold text-lg bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Vidya
          </span>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="flex flex-col justify-between h-full">
        <SidebarMenu className="px-3 py-4">
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton 
                onClick={() => setActiveSection(item.id)}
                isActive={activeSection === item.id}
                className="w-full justify-start gap-3 mb-1"
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        
        <div className="p-3 border-t border-border">
          <Button 
            variant="ghost" 
            onClick={onSignOut}
            className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" />
            <span>Keluar</span>
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
};