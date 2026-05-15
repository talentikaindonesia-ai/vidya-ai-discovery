import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUpgradeModal } from "@/contexts/UpgradeModalContext";
import { supabase } from "@/integrations/supabase/client";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { BottomNavigationBar } from "@/components/dashboard/BottomNavigationBar";
import { NotificationDropdown } from "@/components/dashboard/NotificationDropdown";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User } from "@supabase/supabase-js";
import { toast } from "sonner";
import {
  User as UserIcon,
  Lock,
  Bell,
  Sun,
  Globe,
  Diamond,
  Check,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

type SettingsSection =
  | "akun"
  | "keamanan"
  | "notifikasi"
  | "tampilan"
  | "bahasa"
  | "tagihan";

interface ProfileData {
  full_name: string | null;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  avatar_url: string | null;
}

// ── Toggle component ──────────────────────────────────────────────────────────

const Toggle = ({
  on,
  onChange,
}: {
  on: boolean;
  onChange: (v: boolean) => void;
}) => (
  <button
    onClick={() => onChange(!on)}
    style={{
      width: 42,
      height: 24,
      borderRadius: 99,
      background: on ? "var(--tk-blue-600)" : "var(--tk-gray-200)",
      border: "none",
      cursor: "pointer",
      position: "relative",
      flexShrink: 0,
      transition: "background 0.2s",
    }}
    aria-pressed={on}
  >
    <span
      style={{
        position: "absolute",
        top: 3,
        left: on ? 21 : 3,
        width: 18,
        height: 18,
        borderRadius: "50%",
        background: "white",
        transition: "left 0.2s",
        boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
      }}
    />
  </button>
);

// ── Toggle row component ──────────────────────────────────────────────────────

const ToggleRow = ({
  label,
  desc,
  on,
  onChange,
}: {
  label: string;
  desc?: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 16,
      padding: "14px 0",
      borderBottom: "1px solid var(--tk-gray-100)",
    }}
  >
    <div>
      <div
        style={{
          fontFamily: "var(--tk-font-display)",
          fontWeight: 600,
          fontSize: 14,
          color: "var(--tk-ink)",
        }}
      >
        {label}
      </div>
      {desc && (
        <div
          style={{
            fontSize: 13,
            color: "var(--tk-gray-500)",
            marginTop: 2,
          }}
        >
          {desc}
        </div>
      )}
    </div>
    <Toggle on={on} onChange={onChange} />
  </div>
);

// ── Field display component ───────────────────────────────────────────────────

const FieldDisplay = ({
  label,
  value,
  actionLabel,
  onAction,
}: {
  label: string;
  value: string;
  actionLabel?: string;
  onAction?: () => void;
}) => (
  <div style={{ marginBottom: 18 }}>
    <div
      style={{
        fontFamily: "var(--tk-font-display)",
        fontWeight: 600,
        fontSize: 12,
        color: "var(--tk-gray-600)",
        marginBottom: 6,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
      }}
    >
      {label}
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div
        style={{
          flex: 1,
          border: "1px solid var(--tk-gray-200)",
          borderRadius: 10,
          padding: "10px 14px",
          fontSize: 14,
          fontFamily: "var(--tk-font-sans)",
          color: "var(--tk-ink)",
          background: "white",
        }}
      >
        {value || "—"}
      </div>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          style={{
            flexShrink: 0,
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid var(--tk-gray-200)",
            background: "white",
            fontFamily: "var(--tk-font-display)",
            fontWeight: 600,
            fontSize: 13,
            color: "var(--tk-blue-600)",
            cursor: "pointer",
          }}
        >
          {actionLabel}
        </button>
      )}
    </div>
  </div>
);

// ── EditableField component ───────────────────────────────────────────────────

const EditableField = ({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) => (
  <div style={{ marginBottom: 18 }}>
    <div
      style={{
        fontFamily: "var(--tk-font-display)",
        fontWeight: 600,
        fontSize: 12,
        color: "var(--tk-gray-600)",
        marginBottom: 6,
        textTransform: "uppercase",
        letterSpacing: "0.04em",
      }}
    >
      {label}
    </div>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%",
        border: "1px solid var(--tk-gray-200)",
        borderRadius: 10,
        padding: "10px 14px",
        fontSize: 14,
        fontFamily: "var(--tk-font-sans)",
        color: "var(--tk-ink)",
        background: "white",
        outline: "none",
        boxSizing: "border-box",
      }}
    />
  </div>
);

// ── Section heading component ─────────────────────────────────────────────────

const SectionHeading = ({ children }: { children: React.ReactNode }) => (
  <h2
    style={{
      fontFamily: "var(--tk-font-display)",
      fontWeight: 700,
      fontSize: 20,
      color: "var(--tk-ink)",
      marginBottom: 24,
      marginTop: 0,
    }}
  >
    {children}
  </h2>
);

// ── Main Settings component ───────────────────────────────────────────────────

const Settings = () => {
  const navigate = useNavigate();
  const { openUpgradeModal } = useUpgradeModal();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<SettingsSection>("akun");

  // Akun form state
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState<ProfileData>({
    full_name: "",
    email: "",
    phone: "",
    date_of_birth: "",
    avatar_url: null,
  });
  const [saving, setSaving] = useState(false);

  // Notifikasi toggles
  const [notifKursus, setNotifKursus] = useState(true);
  const [notifKomunitas, setNotifKomunitas] = useState(true);
  const [notifMarketing, setNotifMarketing] = useState(false);
  const [channelEmail, setChannelEmail] = useState(true);
  const [channelPush, setChannelPush] = useState(false);

  // Keamanan toggles
  const [twoFA, setTwoFA] = useState(false);
  const [loginAlert, setLoginAlert] = useState(true);

  // Tampilan
  const [theme, setTheme] = useState<"terang" | "gelap" | "sistem">("sistem");

  // Bahasa
  const [bahasa, setBahasa] = useState("Bahasa Indonesia");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
        return;
      }
      setUser(session.user);
      loadData(session.user.id);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session) navigate("/auth");
      if (event === "SIGNED_IN" && session) loadData(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadData = async (userId: string) => {
    try {
      const [{ data: profileData }, { data: roleData }] = await Promise.all([
        supabase
          .rpc("get_profile_secure", { profile_user_id: userId })
          .maybeSingle(),
        supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId)
          .maybeSingle(),
      ]);

      setProfile(profileData);
      setUserRole(roleData?.role || "individual");
      setForm({
        full_name: profileData?.full_name || "",
        email: profileData?.email || "",
        phone: profileData?.phone || "",
        date_of_birth: profileData?.date_of_birth || "",
        avatar_url: profileData?.avatar_url || null,
      });
    } catch (err) {
      console.error("Error loading settings data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Berhasil logout");
      navigate("/");
    } catch (error: any) {
      toast.error("Gagal logout: " + error.message);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: form.full_name,
          phone: form.phone,
          date_of_birth: form.date_of_birth || null,
        })
        .eq("user_id", user.id);

      if (error) throw error;
      toast.success("Profil berhasil disimpan!");
      setEditMode(false);
      setProfile((prev: any) => ({ ...prev, ...form }));
    } catch (err: any) {
      toast.error("Gagal menyimpan: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setForm({
      full_name: profile?.full_name || "",
      email: profile?.email || "",
      phone: profile?.phone || "",
      date_of_birth: profile?.date_of_birth || "",
      avatar_url: profile?.avatar_url || null,
    });
    setEditMode(false);
  };

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((w) => w.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const displayName = profile?.full_name || user?.email || "Pengguna";

  // ── Sidebar nav items ───────────────────────────────────────────────────────

  const navItems: {
    key: SettingsSection;
    label: string;
    icon: React.ReactNode;
  }[] = [
    { key: "akun", label: "Akun", icon: <UserIcon size={18} /> },
    { key: "keamanan", label: "Keamanan", icon: <Lock size={18} /> },
    { key: "notifikasi", label: "Notifikasi", icon: <Bell size={18} /> },
    { key: "tampilan", label: "Tampilan", icon: <Sun size={18} /> },
    { key: "bahasa", label: "Bahasa", icon: <Globe size={18} /> },
    { key: "tagihan", label: "Tagihan", icon: <Diamond size={18} /> },
  ];

  // ── Section renderers ───────────────────────────────────────────────────────

  const renderAkun = () => (
    <div>
      <SectionHeading>Akun</SectionHeading>
      {editMode ? (
        <>
          <EditableField
            label="Nama Lengkap"
            value={form.full_name || ""}
            onChange={(v) => setForm((f) => ({ ...f, full_name: v }))}
            placeholder="Nama lengkap kamu"
          />
          <div style={{ marginBottom: 18 }}>
            <div
              style={{
                fontFamily: "var(--tk-font-display)",
                fontWeight: 600,
                fontSize: 12,
                color: "var(--tk-gray-600)",
                marginBottom: 6,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              Email
            </div>
            <div
              style={{
                border: "1px solid var(--tk-gray-100)",
                borderRadius: 10,
                padding: "10px 14px",
                fontSize: 14,
                fontFamily: "var(--tk-font-sans)",
                color: "var(--tk-gray-400)",
                background: "var(--tk-gray-50)",
              }}
            >
              {form.email || "—"}
            </div>
            <div
              style={{ fontSize: 12, color: "var(--tk-gray-400)", marginTop: 4 }}
            >
              Email tidak dapat diubah
            </div>
          </div>
          <EditableField
            label="Nomor Handphone"
            value={form.phone || ""}
            onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
            type="tel"
            placeholder="+62 xxx xxxx xxxx"
          />
          <EditableField
            label="Tanggal Lahir"
            value={form.date_of_birth || ""}
            onChange={(v) => setForm((f) => ({ ...f, date_of_birth: v }))}
            type="date"
          />
          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              style={{
                padding: "10px 22px",
                borderRadius: 10,
                border: "none",
                background: "var(--tk-blue-600)",
                color: "white",
                fontFamily: "var(--tk-font-display)",
                fontWeight: 600,
                fontSize: 14,
                cursor: saving ? "not-allowed" : "pointer",
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
            <button
              onClick={handleCancelEdit}
              style={{
                padding: "10px 22px",
                borderRadius: 10,
                border: "1px solid var(--tk-gray-200)",
                background: "white",
                fontFamily: "var(--tk-font-display)",
                fontWeight: 600,
                fontSize: 14,
                color: "var(--tk-gray-700)",
                cursor: "pointer",
              }}
            >
              Batalkan
            </button>
          </div>
        </>
      ) : (
        <>
          <FieldDisplay
            label="Nama Lengkap"
            value={profile?.full_name || ""}
            actionLabel="Ubah"
            onAction={() => setEditMode(true)}
          />
          <FieldDisplay label="Email" value={profile?.email || user?.email || ""} />
          <FieldDisplay
            label="Nomor Handphone"
            value={profile?.phone || ""}
            actionLabel={profile?.phone ? "Ubah" : "Tambah"}
            onAction={() => setEditMode(true)}
          />
          <FieldDisplay
            label="Tanggal Lahir"
            value={profile?.date_of_birth || ""}
            actionLabel={profile?.date_of_birth ? "Ubah" : "Tambah"}
            onAction={() => setEditMode(true)}
          />
          <button
            onClick={() => setEditMode(true)}
            style={{
              marginTop: 8,
              padding: "10px 22px",
              borderRadius: 10,
              border: "none",
              background: "var(--tk-blue-600)",
              color: "white",
              fontFamily: "var(--tk-font-display)",
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Edit Profil
          </button>
        </>
      )}
    </div>
  );

  const renderKeamanan = () => (
    <div>
      <SectionHeading>Keamanan</SectionHeading>

      {/* Password */}
      <FieldDisplay
        label="Password"
        value="••••••••••••"
        actionLabel="Ubah"
        onAction={() => toast.info("Fitur ubah password segera hadir!")}
      />

      <div style={{ marginTop: 8 }}>
        <ToggleRow
          label="Autentikasi 2 Faktor"
          desc="Tambah lapisan keamanan dengan verifikasi tambahan"
          on={twoFA}
          onChange={setTwoFA}
        />
        <ToggleRow
          label="Login Alert"
          desc="Dapatkan notifikasi saat ada login dari perangkat baru"
          on={loginAlert}
          onChange={setLoginAlert}
        />
      </div>
    </div>
  );

  const renderNotifikasi = () => (
    <div>
      <SectionHeading>Notifikasi</SectionHeading>
      <ToggleRow
        label="Pengingat Kursus"
        desc="Reminder harian agar konsisten belajar"
        on={notifKursus}
        onChange={setNotifKursus}
      />
      <ToggleRow
        label="Aktivitas Komunitas"
        desc="Diskusi & balasan dari komunitas yang kamu ikuti"
        on={notifKomunitas}
        onChange={setNotifKomunitas}
      />
      <ToggleRow
        label="Email Marketing"
        desc="Tips, peluang, dan promosi terkurasi"
        on={notifMarketing}
        onChange={setNotifMarketing}
      />

      <div
        style={{
          marginTop: 28,
          marginBottom: 12,
          fontFamily: "var(--tk-font-mono)",
          fontSize: 11,
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: "var(--tk-gray-400)",
        }}
      >
        Channel
      </div>
      <ToggleRow label="Email" on={channelEmail} onChange={setChannelEmail} />
      <ToggleRow
        label="Push Notification"
        on={channelPush}
        onChange={setChannelPush}
      />
    </div>
  );

  const renderTampilan = () => {
    const themeOptions: { key: "terang" | "gelap" | "sistem"; label: string }[] =
      [
        { key: "terang", label: "Terang" },
        { key: "gelap", label: "Gelap" },
        { key: "sistem", label: "Sistem" },
      ];

    return (
      <div>
        <SectionHeading>Tampilan</SectionHeading>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 12,
            maxWidth: 420,
          }}
        >
          {themeOptions.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setTheme(opt.key)}
              style={{
                padding: "18px 12px",
                borderRadius: 12,
                border:
                  theme === opt.key
                    ? "2px solid var(--tk-blue-600)"
                    : "2px solid var(--tk-gray-200)",
                background: theme === opt.key ? "var(--tk-blue-50)" : "white",
                fontFamily: "var(--tk-font-display)",
                fontWeight: theme === opt.key ? 700 : 500,
                fontSize: 14,
                color:
                  theme === opt.key ? "var(--tk-blue-700)" : "var(--tk-gray-700)",
                cursor: "pointer",
                transition: "all 0.15s",
                textAlign: "center",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div
          style={{
            marginTop: 16,
            fontSize: 13,
            color: "var(--tk-gray-500)",
            fontFamily: "var(--tk-font-sans)",
          }}
        >
          Pilih tema tampilan yang nyaman untukmu.
        </div>
      </div>
    );
  };

  const renderBahasa = () => {
    const bahasaOptions = ["Bahasa Indonesia", "English", "日本語"];

    return (
      <div>
        <SectionHeading>Bahasa</SectionHeading>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: 360 }}>
          {bahasaOptions.map((lang) => (
            <button
              key={lang}
              onClick={() => setBahasa(lang)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "14px 16px",
                borderRadius: 12,
                border:
                  bahasa === lang
                    ? "2px solid var(--tk-blue-600)"
                    : "2px solid var(--tk-gray-200)",
                background: bahasa === lang ? "var(--tk-blue-50)" : "white",
                cursor: "pointer",
                fontFamily: "var(--tk-font-display)",
                fontWeight: bahasa === lang ? 700 : 500,
                fontSize: 14,
                color:
                  bahasa === lang ? "var(--tk-blue-700)" : "var(--tk-gray-700)",
                transition: "all 0.15s",
              }}
            >
              <span>{lang}</span>
              {bahasa === lang && (
                <Check size={16} style={{ color: "var(--tk-blue-600)" }} />
              )}
            </button>
          ))}
        </div>
      </div>
    );
  };

  const renderTagihan = () => (
    <div>
      <SectionHeading>Tagihan</SectionHeading>

      {/* Membership card */}
      <div
        style={{
          background: "linear-gradient(135deg, #E8F1FF 0%, #FFEDE2 100%)",
          borderRadius: 16,
          padding: "24px 24px",
          marginBottom: 32,
          maxWidth: 480,
        }}
      >
        <div
          style={{
            fontFamily: "var(--tk-font-mono)",
            fontSize: 11,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "var(--tk-gray-500)",
            marginBottom: 8,
          }}
        >
          Paket Saat Ini
        </div>
        <div
          style={{
            fontFamily: "var(--tk-font-display)",
            fontWeight: 800,
            fontSize: 22,
            color: "var(--tk-ink)",
            marginBottom: 16,
          }}
        >
          Talentika Free
        </div>
        <button
          onClick={() => openUpgradeModal()}
          style={{
            padding: "10px 22px",
            borderRadius: 10,
            border: "none",
            background: "var(--tk-blue-600)",
            color: "white",
            fontFamily: "var(--tk-font-display)",
            fontWeight: 700,
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          Upgrade ke Pro
        </button>
      </div>

      {/* Payment history */}
      <div
        style={{
          fontFamily: "var(--tk-font-display)",
          fontWeight: 700,
          fontSize: 16,
          color: "var(--tk-ink)",
          marginBottom: 16,
        }}
      >
        Riwayat Pembayaran
      </div>
      <div
        style={{
          border: "1px solid var(--tk-gray-200)",
          borderRadius: 12,
          padding: "32px 24px",
          textAlign: "center",
          background: "white",
          maxWidth: 480,
        }}
      >
        <div
          style={{
            fontSize: 36,
            marginBottom: 12,
          }}
        >
          📄
        </div>
        <div
          style={{
            fontFamily: "var(--tk-font-display)",
            fontWeight: 600,
            fontSize: 15,
            color: "var(--tk-gray-600)",
            marginBottom: 4,
          }}
        >
          Belum ada riwayat pembayaran
        </div>
        <div
          style={{
            fontSize: 13,
            color: "var(--tk-gray-400)",
            fontFamily: "var(--tk-font-sans)",
          }}
        >
          Riwayat transaksi akan muncul di sini setelah kamu berlangganan.
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case "akun":
        return renderAkun();
      case "keamanan":
        return renderKeamanan();
      case "notifikasi":
        return renderNotifikasi();
      case "tampilan":
        return renderTampilan();
      case "bahasa":
        return renderBahasa();
      case "tagihan":
        return renderTagihan();
      default:
        return renderAkun();
    }
  };

  // ── Loading / guard ─────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div
        className="min-h-screen bg-background flex items-center justify-center"
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Memuat pengaturan...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div
      className="min-h-screen flex w-full"
      style={{ background: "var(--tk-gray-50)" }}
    >
      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <DashboardSidebar
        activeSection="overview"
        setActiveSection={(section: string) => {
          if (section === "community") { navigate("/community"); return; }
          if (section === "timeline") { navigate("/discovery"); return; }
          navigate("/dashboard");
        }}
        onSignOut={handleSignOut}
        userRole={userRole}
      />

      {/* ── Main area ────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop header */}
        <DashboardHeader
          user={user}
          profile={profile}
          onSignOut={handleSignOut}
        />

        {/* Mobile header */}
        <div
          className="md:hidden flex items-center justify-between px-4 py-3 border-b"
          style={{
            background: "var(--tk-gray-0)",
            borderColor: "var(--tk-gray-200)",
          }}
        >
          <div className="flex items-center gap-2.5">
            <img
              src="/lovable-uploads/9e67a8cf-6f81-4abc-898b-bc665dee2b57.png"
              alt="Talentika"
              className="w-8 h-8 object-contain"
            />
            <span
              style={{
                fontFamily: "var(--tk-font-display)",
                fontWeight: 700,
                fontSize: 18,
                color: "var(--tk-blue-600)",
              }}
            >
              Talentika
            </span>
          </div>
          <div className="flex items-center gap-2">
            <NotificationDropdown userId={user?.id} />
            <Avatar className="h-8 w-8">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                {getInitials(displayName)}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* Page content */}
        <main
          className="flex-1 overflow-auto pb-20 md:pb-6 tk-page-in"
          style={{ padding: "28px 28px 60px" }}
        >
          {/* Page title */}
          <div style={{ marginBottom: 24 }}>
            <h1
              style={{
                fontFamily: "var(--tk-font-display)",
                fontWeight: 800,
                fontSize: 26,
                color: "var(--tk-ink)",
                margin: 0,
                marginBottom: 4,
              }}
            >
              Pengaturan
            </h1>
            <p
              style={{
                fontSize: 14,
                color: "var(--tk-gray-500)",
                margin: 0,
                fontFamily: "var(--tk-font-sans)",
              }}
            >
              Kelola akun dan preferensi kamu
            </p>
          </div>

          {/* Two-column layout */}
          <div
            style={{
              display: "flex",
              gap: 0,
              background: "white",
              borderRadius: 16,
              border: "1px solid var(--tk-gray-200)",
              overflow: "hidden",
              minHeight: 520,
            }}
          >
            {/* Settings sidebar nav */}
            <nav
              style={{
                width: 240,
                flexShrink: 0,
                borderRight: "1px solid var(--tk-gray-200)",
                padding: "16px 12px",
                background: "white",
              }}
            >
              {navItems.map((item) => {
                const isActive = activeSection === item.key;
                return (
                  <button
                    key={item.key}
                    onClick={() => setActiveSection(item.key)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 10,
                      border: "none",
                      background: isActive ? "var(--tk-blue-50)" : "transparent",
                      color: isActive
                        ? "var(--tk-blue-700)"
                        : "var(--tk-gray-700)",
                      fontFamily: "var(--tk-font-display)",
                      fontWeight: isActive ? 600 : 500,
                      fontSize: 14,
                      cursor: "pointer",
                      marginBottom: 4,
                      textAlign: "left",
                      transition: "all 0.15s",
                    }}
                  >
                    <span
                      style={{
                        color: isActive ? "var(--tk-blue-600)" : "var(--tk-gray-400)",
                        display: "flex",
                        alignItems: "center",
                      }}
                    >
                      {item.icon}
                    </span>
                    {item.label}
                  </button>
                );
              })}
            </nav>

            {/* Right content panel */}
            <div
              style={{
                flex: 1,
                padding: "28px 32px",
                overflowY: "auto",
              }}
            >
              {renderContent()}
            </div>
          </div>
        </main>

        <BottomNavigationBar
          activeSection="overview"
          onSectionChange={(section: string) => {
            if (section === "community") { navigate("/community"); return; }
            if (section === "timeline") { navigate("/discovery"); return; }
            navigate("/dashboard");
          }}
        />
      </div>
    </div>
  );
};

export default Settings;
