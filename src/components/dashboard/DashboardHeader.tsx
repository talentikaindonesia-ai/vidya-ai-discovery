import { useState } from "react";
import { Search, Sun, Moon, Bell, ChevronDown, User, Settings, Diamond, LogOut } from "lucide-react";
import { User as SupaUser } from "@supabase/supabase-js";
import { NotificationDropdown } from "./NotificationDropdown";
import { GlobalSearch } from "@/components/GlobalSearch";
import { useTheme } from "@/contexts/ThemeContext";
import { useNavigate } from "react-router-dom";
import { useUpgradeModal } from "@/contexts/UpgradeModalContext";

interface DashboardHeaderProps {
  user: SupaUser | null;
  profile: any;
  onSignOut?: () => void;
}

export const DashboardHeader = ({ user, profile, onSignOut }: DashboardHeaderProps) => {
  const navigate = useNavigate();
  const { openUpgradeModal } = useUpgradeModal();
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const getInitials = (name: string) =>
    name.split(" ").map((w) => w.charAt(0)).join("").toUpperCase().slice(0, 2);

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "Pengguna";
  const planLabel =
    profile?.subscription_type === "premium" ? "Premium" :
    profile?.subscription_type === "school"  ? "School"  : "Individual";

  const iconBtn: React.CSSProperties = {
    display: "flex", alignItems: "center", justifyContent: "center",
    width: 36, height: 36, borderRadius: 10, border: "none",
    background: "transparent", cursor: "pointer",
    color: "var(--tk-gray-600)", transition: "background .15s",
    position: "relative",
  };

  return (
    <>
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />

      <header
        className="hidden md:flex items-center gap-4 sticky top-0 z-10 border-b"
        style={{
          padding: "0 28px",
          height: 68,
          background: "var(--tk-gray-50)",
          borderColor: "var(--tk-gray-200)",
        }}
      >
        {/* ── Search bar ─────────────────────────────────────── */}
        <button
          onClick={() => setSearchOpen(true)}
          className="flex items-center gap-2.5 rounded-xl border transition-all"
          style={{
            flex: 1,
            maxWidth: 520,
            padding: "10px 14px",
            background: "white",
            borderColor: "var(--tk-gray-200)",
            cursor: "text",
            color: "var(--tk-gray-400)",
            fontFamily: "var(--tk-font-sans)",
            fontSize: 14,
            textAlign: "left",
          }}
        >
          <Search size={17} style={{ flexShrink: 0, color: "var(--tk-gray-400)" }} />
          <span className="flex-1" style={{ color: "var(--tk-gray-400)" }}>
            Cari kursus, materi, atau topik…
          </span>
          <span
            style={{
              fontFamily: "var(--tk-font-mono)",
              fontSize: 10.5,
              color: "var(--tk-gray-500)",
              background: "var(--tk-gray-100)",
              padding: "2px 6px",
              borderRadius: 5,
              flexShrink: 0,
            }}
          >
            Ctrl K
          </span>
        </button>

        <div style={{ flex: 1 }} />

        {/* ── Dark mode toggle ───────────────────────────────── */}
        <button
          onClick={toggleTheme}
          style={iconBtn}
          aria-label="Toggle theme"
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--tk-gray-100)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
        >
          {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* ── Notification bell ─────────────────────────────── */}
        <NotificationDropdown userId={user?.id} />

        {/* ── User menu ─────────────────────────────────────── */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2.5 rounded-xl transition-colors"
            style={{
              padding: "6px 10px",
              background: "transparent",
              border: "none",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--tk-gray-100)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            {/* Avatar */}
            <div
              className="tk-avatar flex-shrink-0"
              style={{
                width: 36, height: 36,
                fontSize: 13,
                background: profile?.avatar_url
                  ? undefined
                  : "linear-gradient(135deg, var(--tk-blue-500), var(--tk-blue-700))",
              }}
            >
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={displayName}
                  style={{ width: 36, height: 36, borderRadius: "50%", objectFit: "cover" }}
                />
              ) : (
                <span style={{ fontFamily: "var(--tk-font-display)", fontWeight: 700, fontSize: 13 }}>
                  {getInitials(displayName)}
                </span>
              )}
            </div>

            <div style={{ textAlign: "left" }}>
              <div style={{
                fontFamily: "var(--tk-font-display)",
                fontWeight: 600,
                fontSize: 13.5,
                color: "var(--tk-ink)",
                whiteSpace: "nowrap",
              }}>
                {displayName.split(" ")[0]}
              </div>
              <div style={{ fontSize: 11, color: "var(--tk-gray-500)" }}>{planLabel}</div>
            </div>
            <ChevronDown size={14} style={{ color: "var(--tk-gray-500)", flexShrink: 0 }} />
          </button>

          {/* Dropdown menu */}
          {menuOpen && (
            <div
              className="tk-page-in"
              style={{
                position: "absolute",
                right: 0,
                top: 54,
                background: "white",
                borderRadius: 14,
                boxShadow: "var(--tk-shadow-lg)",
                border: "1px solid var(--tk-gray-200)",
                padding: 8,
                minWidth: 200,
                zIndex: 30,
              }}
              onMouseLeave={() => setMenuOpen(false)}
            >
              {[
                { icon: User,     label: "Profil saya",    action: () => { navigate("/profile"); setMenuOpen(false); } },
                { icon: Settings, label: "Pengaturan",     action: () => { navigate("/settings"); setMenuOpen(false); } },
                { icon: Diamond,  label: "Upgrade ke Pro", action: () => { openUpgradeModal(); setMenuOpen(false); }, accent: true },
              ].map(({ icon: Icon, label, action, accent }) => (
                <button
                  key={label}
                  onClick={action}
                  className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors"
                  style={{
                    border: "none",
                    background: "transparent",
                    cursor: "pointer",
                    color: accent ? "var(--tk-orange)" : "var(--tk-gray-700)",
                    fontFamily: "var(--tk-font-sans)",
                    fontSize: 13.5,
                    textAlign: "left",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--tk-gray-100)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <Icon size={15} /> {label}
                </button>
              ))}
              <div style={{ height: 1, background: "var(--tk-gray-150)", margin: "6px 4px" }} />
              <button
                onClick={() => { onSignOut?.(); setMenuOpen(false); }}
                className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors"
                style={{
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  color: "#DC2626",
                  fontFamily: "var(--tk-font-sans)",
                  fontSize: 13.5,
                  textAlign: "left",
                }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#FEF2F2"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                <LogOut size={15} /> Keluar
              </button>
            </div>
          )}
        </div>
      </header>
    </>
  );
};
