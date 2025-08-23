import { 
  BookOpen, 
  Trophy, 
  BarChart3, 
  Home, 
  User, 
  LogOut,
  Users,
  Clock,
  Settings,
  Shield,
  Award,
  Briefcase
} from "lucide-react";
import { Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";

interface DashboardSidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  onSignOut: () => void;
  userRole?: string | null;
}

export const DashboardSidebar = ({ activeSection, setActiveSection, onSignOut, userRole }: DashboardSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const menuItems = [
    { id: "overview", label: "Dashboard", icon: Home, route: "/dashboard" },
    { id: "courses", label: "Kursus Saya", icon: BookOpen, route: "/learning" },
    { id: "challenges", label: "Tantangan", icon: Trophy, route: "/dashboard-gamified" },
    { id: "opportunities", label: "Peluang", icon: Briefcase, route: "/opportunities" },
    { id: "progress", label: "Progress", icon: BarChart3, route: "/dashboard" },
    { id: "achievements", label: "Pencapaian", icon: Award, route: "/dashboard" },
    { id: "community", label: "Community", icon: Users, route: "/community" },
    { id: "timeline", label: "Timeline", icon: Clock, route: "/discovery" },
    { id: "settings", label: "Pengaturan", icon: Settings, route: "/dashboard" },
  ];

  const handleMenuClick = (item: typeof menuItems[0]) => {
    if (item.route === "/dashboard") {
      // For dashboard sections, use the section navigation
      setActiveSection(item.id);
      navigate(item.route);
    } else {
      // For other routes, navigate directly
      navigate(item.route);
    }
  };

  const isActiveItem = (item: typeof menuItems[0]) => {
    if (item.route === "/dashboard") {
      return location.pathname === "/dashboard" && activeSection === item.id;
    }
    return location.pathname === item.route;
  };

  return (
    <Sidebar className="border-r border-border bg-card">
      <SidebarHeader className="p-6 border-b border-border">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">V</span>
          </div>
          <span className="font-bold text-lg bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Talentika
          </span>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="flex flex-col justify-between h-full">
        <SidebarMenu className="px-3 py-4">
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.id}>
              <SidebarMenuButton 
                onClick={() => handleMenuClick(item)}
                isActive={isActiveItem(item)}
                className="w-full justify-start gap-3 mb-1"
              >
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
        
        <div className="p-3 border-t border-border space-y-2">
          {userRole === 'admin' && (
            <Button 
              variant="ghost" 
              onClick={() => navigate("/admin")}
              className="w-full justify-start gap-3 text-primary hover:text-primary hover:bg-primary/10"
            >
              <Shield className="h-4 w-4" />
              <span>Admin CMS</span>
            </Button>
          )}
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