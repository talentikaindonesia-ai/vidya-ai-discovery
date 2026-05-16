import { Home, BookOpen, Rocket, User, Brain } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocation, useNavigate } from "react-router-dom";

interface BottomNavigationBarProps {
  activeSection?: string;
  onSectionChange?: (section: string) => void;
}

const navigationItems = [
  { id: "home",        label: "Beranda",    icon: Home,     route: "/dashboard",    isFab: false },
  { id: "courses",     label: "Kursus",     icon: BookOpen, route: "/learning",     isFab: false },
  { id: "assessment",  label: "Tes Bakat",  icon: Brain,    route: "/assessment",   isFab: true  },
  { id: "opportunities", label: "Peluang",  icon: Rocket,   route: "/opportunities",isFab: false },
  { id: "profile",     label: "Profil",     icon: User,     route: "/profile",      isFab: false },
];

export function BottomNavigationBar({ activeSection, onSectionChange }: BottomNavigationBarProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const getCurrentActiveSection = () => {
    if (activeSection) return activeSection;
    const path = location.pathname;
    if (path === "/dashboard")     return "home";
    if (path === "/learning")      return "courses";
    if (path === "/assessment")    return "assessment";
    if (path === "/opportunities") return "opportunities";
    if (path === "/profile")       return "profile";
    return "home";
  };

  const handleSectionChange = (sectionId: string, route: string) => {
    navigate(route);
    if (onSectionChange && route === "/dashboard") {
      onSectionChange(sectionId);
    }
  };

  const currentActive = getCurrentActiveSection();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border shadow-lg md:hidden">
      <div className="flex items-center justify-around px-1 py-1 safe-area-pb max-w-full">
        {navigationItems.map((item) => {
          const isActive = currentActive === item.id;
          const Icon = item.icon;

          /* ── Centre FAB: Assessment button ── */
          if (item.isFab) {
            return (
              <button
                key={item.id}
                onClick={() => handleSectionChange(item.id, item.route)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  flex: "0 0 64px",
                  marginTop: -20,
                  gap: 3,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: "50%",
                    background: isActive
                      ? "var(--tk-blue-700)"
                      : "linear-gradient(135deg, var(--tk-blue-600), #7C3AED)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 4px 16px rgba(37,99,235,.45)",
                    transition: "transform .2s, box-shadow .2s",
                    transform: isActive ? "scale(0.95)" : "scale(1)",
                  }}
                >
                  <Icon size={24} color="#fff" />
                </div>
                <span style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: isActive ? "var(--tk-blue-700)" : "var(--tk-gray-500)",
                  fontFamily: "var(--tk-font-display)",
                  lineHeight: 1,
                }}>
                  {item.label}
                </span>
              </button>
            );
          }

          /* ── Regular nav item ── */
          return (
            <button
              key={item.id}
              onClick={() => handleSectionChange(item.id, item.route)}
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