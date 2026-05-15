import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SubscriptionManager } from "@/components/payment/SubscriptionManager";
import { PaymentStatusChecker } from "@/components/payment/PaymentStatusChecker";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { BottomNavigationBar } from "@/components/dashboard/BottomNavigationBar";
import { ArrowLeft, Diamond, CreditCard, ShieldCheck, RotateCcw, Headphones } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const Subscription = () => {
  const [user, setUser]       = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("subscription");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  // URL params for pre-selected plan
  const preSelectedPlanId   = searchParams.get("planId");
  const preSelectedPlanName = searchParams.get("planName");

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: "Login Required",
        description: "Silakan login terlebih dahulu untuk mengakses halaman ini",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    setUser(session.user);

    // Load profile for header
    const { data: profileData } = await supabase.rpc("get_profile_secure");
    if (profileData && profileData.length > 0) setProfile(profileData[0]);

    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  const handleSubscriptionChange = () => {
    toast({
      title: "Berhasil!",
      description: "Status berlangganan telah diperbarui",
    });
  };

  // ── Loading spinner ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "var(--tk-gray-50)",
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: "50%",
            border: "3px solid var(--tk-gray-200)",
            borderTopColor: "var(--tk-blue-600)",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── Main layout ───────────────────────────────────────────────────────────
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "var(--tk-gray-50)",
        fontFamily: "var(--tk-font-sans)",
      }}
    >
      {/* Sidebar */}
      <DashboardSidebar
        activeSection={activeSection}
        setActiveSection={setActiveSection}
        onSignOut={handleSignOut}
        collapsed={sidebarCollapsed}
        onCollapsedChange={setSidebarCollapsed}
      />

      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <DashboardHeader
          user={user}
          profile={profile}
          onSignOut={handleSignOut}
        />

        {/* Page body */}
        <main
          style={{
            flex: 1,
            padding: "28px 32px 40px",
            maxWidth: 1080,
            width: "100%",
            margin: "0 auto",
            boxSizing: "border-box",
          }}
          className="w-full px-4 md:px-8"
        >
          {/* ── Page title bar ─────────────────────────────────────────── */}
          <div style={{ marginBottom: 28 }}>
            <button
              onClick={() => navigate("/dashboard")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                background: "transparent",
                border: "1px solid var(--tk-gray-200)",
                borderRadius: 10,
                padding: "6px 14px",
                fontSize: 13,
                color: "var(--tk-gray-600)",
                cursor: "pointer",
                fontFamily: "var(--tk-font-sans)",
                marginBottom: 20,
                transition: "background .15s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--tk-gray-100)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <ArrowLeft size={14} />
              Kembali ke Dashboard
            </button>

            {/* Hero header */}
            <div
              style={{
                borderRadius: 20,
                background: "linear-gradient(135deg, #E8F1FF 0%, #FFEDE2 100%)",
                padding: "28px 32px",
                display: "flex",
                alignItems: "center",
                gap: 20,
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Decorative circle */}
              <span
                style={{
                  position: "absolute",
                  right: -20,
                  top: -20,
                  fontSize: 120,
                  opacity: 0.12,
                  color: "var(--tk-blue-600)",
                  lineHeight: 1,
                  pointerEvents: "none",
                  userSelect: "none",
                }}
              >
                ✦
              </span>

              {/* Diamond icon */}
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 16,
                  background: "linear-gradient(135deg, var(--tk-blue-500), var(--tk-blue-700))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  boxShadow: "0 4px 16px rgba(59,130,246,.30)",
                }}
              >
                <Diamond size={26} color="#fff" />
              </div>

              <div>
                <h1
                  style={{
                    fontFamily: "var(--tk-font-display)",
                    fontWeight: 700,
                    fontSize: 22,
                    color: "var(--tk-ink)",
                    margin: 0,
                    letterSpacing: "-.02em",
                  }}
                >
                  {preSelectedPlanName
                    ? `Paket ${preSelectedPlanName}`
                    : "Kelola Berlangganan"}
                </h1>
                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: 14,
                    color: "var(--tk-gray-600)",
                  }}
                >
                  {preSelectedPlanName
                    ? `Lanjutkan dengan paket ${preSelectedPlanName} yang dipilih`
                    : "Pilih paket yang sesuai dengan kebutuhan Anda"}
                </p>
              </div>
            </div>
          </div>

          {/* ── Payment status checker ─────────────────────────────────── */}
          {user && <PaymentStatusChecker userId={user.id} />}

          {/* ── Subscription manager ───────────────────────────────────── */}
          {user && (
            <div style={{ marginTop: 8 }}>
              <SubscriptionManager
                userId={user.id}
                onSubscriptionChange={handleSubscriptionChange}
                preSelectedPlanId={preSelectedPlanId}
              />
            </div>
          )}

          {/* ── Payment security banner ────────────────────────────────── */}
          <div
            style={{
              marginTop: 32,
              borderRadius: 18,
              border: "1px solid var(--tk-gray-200)",
              background: "white",
              overflow: "hidden",
            }}
          >
            {/* Banner header */}
            <div
              style={{
                padding: "16px 24px",
                borderBottom: "1px solid var(--tk-gray-100)",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <ShieldCheck size={18} style={{ color: "var(--tk-blue-600)" }} />
              <span
                style={{
                  fontFamily: "var(--tk-font-display)",
                  fontWeight: 700,
                  fontSize: 14,
                  color: "var(--tk-ink)",
                }}
              >
                Keamanan Pembayaran
              </span>
            </div>

            {/* Three trust pillars */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 0,
              }}
            >
              {[
                {
                  icon: CreditCard,
                  color: "#16A34A",
                  bg: "#F0FDF4",
                  title: "Pembayaran Aman",
                  desc: "Transaksi dilindungi dengan Xendit — payment gateway terpercaya di Indonesia",
                },
                {
                  icon: RotateCcw,
                  color: "var(--tk-blue-600)",
                  bg: "#EFF6FF",
                  title: "Garansi 30 Hari",
                  desc: "Tidak puas? Dapatkan refund 100% tanpa pertanyaan dalam 30 hari pertama",
                },
                {
                  icon: Headphones,
                  color: "var(--tk-orange)",
                  bg: "#FFF7ED",
                  title: "Support 24/7",
                  desc: "Tim dukungan kami siap membantu Anda kapan saja, di mana saja",
                },
              ].map(({ icon: Icon, color, bg, title, desc }, i) => (
                <div
                  key={i}
                  style={{
                    padding: "20px 24px",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 14,
                    borderRight: i < 2 ? "1px solid var(--tk-gray-100)" : undefined,
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: bg,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={18} style={{ color }} />
                  </div>
                  <div>
                    <p
                      style={{
                        fontFamily: "var(--tk-font-display)",
                        fontWeight: 600,
                        fontSize: 13.5,
                        color: "var(--tk-ink)",
                        margin: "0 0 4px",
                      }}
                    >
                      {title}
                    </p>
                    <p style={{ fontSize: 12.5, color: "var(--tk-gray-500)", margin: 0, lineHeight: 1.5 }}>
                      {desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <BottomNavigationBar />
    </div>
  );
};

export default Subscription;
