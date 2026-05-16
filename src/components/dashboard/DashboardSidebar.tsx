import { useState } from "react";
import {
  BookOpen, Trophy, BarChart3, Home, User, LogOut,
  Users, Clock, Settings, Shield, Award, Briefcase,
  ChevronRight, ChevronLeft, Diamond, HelpCircle, Zap,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useNavigate as useNav } from "react-router-dom";
import { useUpgradeModal } from "@/contexts/UpgradeModalContext";

interface DashboardSidebarProps {
  activeSection: string;
  setActiveSection: (section: string) => void;
  onSignOut: () => void;
  userRole?: string | null;
  collapsed?: boolean;
  onCollapsedChange?: (v: boolean) => void;
}

const NAV_ITEMS = [
  { id: "overview",      label: "Dashboard",    icon: Home,     route: "/dashboard" },
  { id: "courses",       label: "Kursus Saya",  icon: BookOpen, route: "/learning" },
  { id: "opportunities", label: "Peluang",      icon: Briefcase,route: "/opportunities" },
  { id: "progress",      label: "Progress",     icon: BarChart3,route: "/dashboard" },
  { id: "achievements",  label: "Pencapaian",   icon: Award,    route: "/dashboard" },
  { id: "community",     label: "Community",    icon: Users,    route: "/community" },
  { id: "timeline",      label: "Timeline",     icon: Clock,    route: "/discovery" },
  { id: "profile",       label: "Profile",      icon: User,     route: "/profile" },
  { id: "settings",      label: "Pengaturan",   icon: Settings, route: "/settings" },
];

export const DashboardSidebar = ({
  activeSection,
  setActiveSection,
  onSignOut,
  userRole,
  collapsed: collapsedProp,
  onCollapsedChange,
}: DashboardSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { openUpgradeModal } = useUpgradeModal();
  const [internalCollapsed, setInternalCollapsed] = useState(false);

  const collapsed = collapsedProp ?? internalCollapsed;
  const setCollapsed = onCollapsedChange ?? setInternalCollapsed;

  const handleMenuClick = (item: typeof NAV_ITEMS[0]) => {
    if (item.route === "/dashboard") {
      setActiveSection(item.id);
    } else {
      navigate(item.route);
    }
  };

  const isActive = (item: typeof NAV_ITEMS[0]) => {
    if (item.route === "/dashboard") {
      return location.pathname === "/dashboard" && activeSection === item.id;
    }
    return location.pathname === item.route;
  };

  return (
    <aside
      className="hidden md:flex flex-col flex-shrink-0 sticky top-0 h-screen transition-all duration-250 bg-white border-r"
      style={{
        width: collapsed ? 78 : 248,
        borderColor: "var(--tk-gray-200)",
        transition: "width .25s var(--tk-ease-soft)",
        zIndex: 20,
      }}
    >
      {/* ── Logo + collapse toggle ─────────────────────────────── */}
      <div
        className="flex items-center px-5 border-b"
        style={{
          height: 68,
          justifyContent: collapsed ? "center" : "space-between",
          borderColor: "var(--tk-gray-200)",
        }}
      >
        {!collapsed && (
          <div className="flex items-center gap-2">
            <img
              src="/lovable-uploads/9e67a8cf-6f81-4abc-898b-bc665dee2b57.png"
              alt="Talentika"
              className="w-8 h-8 object-contain"
            />
            <span
              style={{
                fontFamily: "var(--tk-font-display)",
                fontWeight: 700,
                fontSize: 20,
                color: "var(--tk-blue-600)",
                letterSpacing: "-.02em",
              }}
            >
              Talentika
              <span style={{ color: "var(--tk-yellow)", fontSize: 12, marginLeft: 2 }}>✦</span>
            </span>
          </div>
        )}
        {collapsed && (
          <img
            src="/lovable-uploads/9e67a8cf-6f81-4abc-898b-bc665dee2b57.png"
            alt="Talentika"
            className="w-8 h-8 object-contain"
          />
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors"
          style={{
            color: "var(--tk-gray-500)",
            background: "transparent",
            border: "none",
            cursor: "pointer",
            display: collapsed ? "none" : "flex",
          }}
          aria-label="Toggle sidebar"
        >
          <ChevronLeft size={16} />
        </button>
      </div>

      {/* Expand button when collapsed */}
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="mx-auto mt-2 flex items-center justify-center w-8 h-8 rounded-lg transition-colors hover:bg-gray-100"
          style={{ color: "var(--tk-gray-500)", border: "none", cursor: "pointer", background: "transparent" }}
        >
          <ChevronRight size={16} />
        </button>
      )}

      {/* ── Nav items ─────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto px-3 py-3">
        {NAV_ITEMS.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => handleMenuClick(item)}
              title={collapsed ? item.label : ""}
              className="w-full flex items-center mb-0.5 rounded-xl transition-colors relative"
              style={{
                gap: 14,
                padding: collapsed ? "12px" : "10px 14px",
                justifyContent: collapsed ? "center" : "flex-start",
                background: active ? "var(--tk-blue-50)" : "transparent",
                color: active ? "var(--tk-blue-700)" : "var(--tk-gray-700)",
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--tk-font-display)",
                fontWeight: active ? 600 : 500,
                fontSize: 13.5,
              }}
              onMouseEnter={(e) => {
                if (!active) (e.currentTarget as HTMLElement).style.background = "var(--tk-gray-100)";
              }}
              onMouseLeave={(e) => {
                if (!active) (e.currentTarget as HTMLElement).style.background = "transparent";
              }}
            >
              {/* Active left bar indicator */}
              {active && (
                <span
                  className="absolute left-0 rounded-r"
                  style={{
                    top: 8,
                    bottom: 8,
                    width: 3,
                    background: "var(--tk-blue-600)",
                    borderRadius: "0 3px 3px 0",
                  }}
                />
              )}
              <Icon size={18} />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}

        {/* Admin CMS */}
        {userRole === "admin" && (
          <button
            onClick={() => navigate("/admin")}
            className="w-full flex items-center mb-0.5 rounded-xl transition-colors"
            style={{
              gap: 14,
              padding: collapsed ? "12px" : "10px 14px",
              justifyContent: collapsed ? "center" : "flex-start",
              background: "transparent",
              color: "var(--tk-orange)",
              border: "none",
              cursor: "pointer",
              fontFamily: "var(--tk-font-display)",
              fontWeight: 600,
              fontSize: 13.5,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "var(--tk-orange-soft)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
          >
            <Shield size={18} />
            {!collapsed && <span>Admin CMS</span>}
          </button>
        )}
      </nav>

      {/* ── Bottom: Upgrade CTA + Help ─────────────────────────── */}
      {!collapsed && (
        <div className="px-3 pb-4 pt-2 border-t" style={{ borderColor: "var(--tk-gray-200)" }}>
          {/* Upgrade card */}
          <div
            className="rounded-2xl p-3 mb-2 relative overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #E8F1FF, #FFEDE2)",
            }}
          >
            <Diamond size={18} style={{ color: "var(--tk-blue-600)" }} />
            <div
              style={{
                fontFamily: "var(--tk-font-display)",
                fontWeight: 700,
                fontSize: 13,
                color: "var(--tk-ink)",
                marginTop: 6,
              }}
            >
              Upgrade ke Pro
            </div>
            <div style={{ fontSize: 11.5, color: "var(--tk-gray-600)", margin: "4px 0 10px" }}>
              Akses fitur premium &amp; materi eksklusif.
            </div>
            <button
              onClick={() => openUpgradeModal()}
              className="w-full py-1.5 rounded-lg text-white text-xs font-semibold transition-colors"
              style={{
                background: "var(--tk-blue-600)",
                border: "none",
                cursor: "pointer",
                fontFamily: "var(--tk-font-display)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "var(--tk-blue-700)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "var(--tk-blue-600)";
              }}
            >
              Upgrade Sekarang
            </button>
            <span
              style={{
                position: "absolute",
                right: -10,
                top: -10,
                opacity: 0.4,
                fontSize: 48,
                color: "var(--tk-blue-600)",
                lineHeight: 1,
              }}
            >
              ✦
            </span>
          </div>

          {/* Help button */}
          <button
            className="w-full flex items-center gap-2.5 rounded-xl p-2.5 transition-colors"
            style={{
              background: "transparent",
              border: "1px solid var(--tk-gray-200)",
              cursor: "pointer",
              color: "var(--tk-gray-700)",
              fontFamily: "var(--tk-font-sans)",
              fontSize: 12.5,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "var(--tk-gray-50)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
          >
            <span
              className="flex items-center justify-center rounded-lg flex-shrink-0"
              style={{
                width: 28,
                height: 28,
                background: "var(--tk-gray-100)",
                color: "var(--tk-blue-600)",
              }}
            >
              <HelpCircle size={14} />
            </span>
            <div className="flex-1 text-left">
              <div style={{ fontWeight: 600, color: "var(--tk-ink)", fontSize: 12.5 }}>
                Butuh Bantuan?
              </div>
              <div style={{ fontSize: 10.5, color: "var(--tk-gray-500)" }}>Kunjungi Pusat Bantuan</div>
            </div>
            <ChevronRight size={13} style={{ color: "var(--tk-gray-400)" }} />
          </button>

          {/* Sign out */}
          <button
            onClick={onSignOut}
            className="w-full flex items-center gap-3 rounded-xl px-3 py-2.5 mt-1.5 transition-colors"
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "#DC2626",
              fontFamily: "var(--tk-font-sans)",
              fontSize: 13,
              fontWeight: 500,
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = "#FEF2F2";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
          >
            <LogOut size={16} />
            <span>Keluar</span>
          </button>
        </div>
      )}

      {/* Collapsed: just show logout icon */}
      {collapsed && (
        <div className="pb-4 flex flex-col items-center gap-2">
          <button
            onClick={onSignOut}
            title="Keluar"
            className="flex items-center justify-center w-10 h-10 rounded-xl transition-colors"
            style={{ background: "transparent", border: "none", cursor: "pointer", color: "#DC2626" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#FEF2F2"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <LogOut size={18} />
          </button>
        </div>
      )}
    </aside>
  );
};
