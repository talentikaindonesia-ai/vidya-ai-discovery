import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { NotificationDropdown } from "@/components/dashboard/NotificationDropdown";
import { WelcomeDashboard } from "@/components/dashboard/WelcomeDashboard";
import CoursesPreview from "@/components/CoursesPreview";
import OpportunitiesPreview from "@/components/OpportunitiesPreview";
import CommunityPreview from "@/components/CommunityPreview";
import { BottomNavigationBar } from "@/components/dashboard/BottomNavigationBar";
import { CoursesSection } from "@/components/dashboard/CoursesSection";
import { ChallengesSection } from "@/components/dashboard/ChallengesSection";
import { OpportunitiesSection } from "@/components/dashboard/OpportunitiesSection";
import { ProgressTracker } from "@/components/dashboard/ProgressTracker";
import { Achievements } from "@/components/dashboard/Achievements";
import { User, Session } from "@supabase/supabase-js";
import { Crown, Check, X } from "lucide-react";
import { toast } from "sonner";
import WelcomeNudge from "@/components/WelcomeNudge";
import { OnboardingChecklist } from "@/components/dashboard/OnboardingChecklist";
import { ReferralWidget } from "@/components/dashboard/ReferralWidget";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [activeSection, setActiveSection] = useState("overview");
  const [profile, setProfile] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [subscriptionPlans, setSubscriptionPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSubscription, setShowSubscription] = useState(false);
  const [userInterests, setUserInterests] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Load initial session once — no duplicate fetch
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      } else {
        loadUserData(session.user.id);
      }
    });

    // Watch for logout / token refresh only — don't re-fetch data on every event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) navigate("/auth");
      // Only re-load data on explicit sign-in (e.g. login from another tab)
      if (event === 'SIGNED_IN' && session) {
        loadUserData(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadUserData = async (userId: string) => {
    try {
      // Run all 4 queries in parallel — no waterfall
      const [
        { data: profileData,   error: profileError },
        { data: roleData,      error: roleError },
        { data: plansData,     error: plansError },
        { data: interestsData, error: interestsError },
      ] = await Promise.all([
        supabase.rpc('get_profile_secure', { profile_user_id: userId }).maybeSingle(),
        supabase.from('user_roles').select('role').eq('user_id', userId).maybeSingle(),
        supabase.from('subscription_packages').select('*').eq('is_active', true).order('price_monthly'),
        supabase.from('user_interests').select('*, interest_categories(name)').eq('user_id', userId).limit(3),
      ]);

      // Profile
      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error loading profile:', profileError);
        toast.error("Gagal memuat profil pengguna");
      } else {
        setProfile(profileData);
        if (!profileData?.subscription_status ||
            (profileData.subscription_status === 'inactive' && !profileData.subscription_type)) {
          setShowSubscription(true);
        } else if (profileData.subscription_status === 'active' || profileData.subscription_type === 'free') {
          setShowSubscription(false);
        }
      }

      // Role
      if (roleError && roleError.code !== 'PGRST116') {
        console.error('Error loading role:', roleError);
      } else {
        setUserRole(roleData?.role || 'individual');
      }

      // Plans
      if (plansError) {
        console.error('Error loading plans:', plansError);
      } else {
        setSubscriptionPlans(plansData || []);
      }

      // Interests
      if (interestsError) {
        console.error('Error loading interests:', interestsError);
      } else {
        setUserInterests(interestsData || []);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
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

  const handleSubscribe = async (planId: string) => {
    try {
      if (!user) return;
      
      const selectedPlan = subscriptionPlans.find(p => p.id === planId);
      if (!selectedPlan) return;

      // Check if it's a free plan
      if (selectedPlan.type === 'free') {
        // Activate free plan directly
        const { error } = await supabase
          .from('profiles')
          .update({
            subscription_status: 'active',
            subscription_type: 'free',
            subscription_end_date: null // Free plans don't expire
          })
          .eq('user_id', user.id);

        if (error) throw error;

        toast.success("Paket Free berhasil diaktifkan!");
        setShowSubscription(false);
        
        // Reload profile
        if (user) {
          loadUserData(user.id);
        }
        return;
      }

      // For paid plans, navigate to subscription page with selected plan
      navigate(`/subscription?planId=${planId}&planName=${encodeURIComponent(selectedPlan.name)}`);
      
    } catch (error: any) {
      console.error('Error subscribing:', error);
      toast.error("Terjadi kesalahan: " + error.message);
    }
  };

  const displayName = profile?.full_name || user?.email || 'Pengguna';

  const renderActiveSection = () => {
    switch (activeSection) {
      case "overview":
        return (
          <div className="space-y-6">
            {user?.id && <WelcomeNudge userId={user.id} />}
            {/* Onboarding checklist — only for new users */}
            {user?.id && <OnboardingChecklist userId={user.id} profile={profile} />}
            <WelcomeDashboard user={user} profile={profile} />
            <CoursesPreview profile={profile} />
            <OpportunitiesPreview profile={profile} />
            <CommunityPreview userAssessment={profile} userInterests={userInterests} profile={profile} />
            {/* Referral Widget */}
            {user?.id && <ReferralWidget userId={user.id} />}
          </div>
        );
      case "courses":
        return <CoursesSection />;
      case "challenges":
        return <ChallengesSection />;
      case "opportunities":
        return <OpportunitiesSection />;
      case "progress":
        return <ProgressTracker />;
      case "achievements":
        return <Achievements />;
      case "gamified":
        return (
          <div className="min-h-screen">
            {/* Import and use GamifiedDashboard here */}
            <div className="text-center py-12">
              <h2 className="text-3xl font-bold mb-4">🎮 Gamified Dashboard</h2>
              <p className="text-muted-foreground mb-6">
                Experience learning like never before with XP, levels, quests, and rewards!
              </p>
              <button 
                onClick={() => navigate('/dashboard-gamified')}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all hover-scale"
              >
                Enter Gamified Mode
              </button>
            </div>
          </div>
        );
      // "community" and "timeline" navigate to their own pages (handled in handleSectionChange)
      case "community":
      case "timeline":
        return null;
      default:
        return (
          <div className="space-y-6">
            {user?.id && <WelcomeNudge userId={user.id} />}
            {user?.id && <OnboardingChecklist userId={user.id} profile={profile} />}
            <WelcomeDashboard user={user} profile={profile} />
            <CoursesPreview profile={profile} />
            <OpportunitiesPreview profile={profile} />
            <CommunityPreview userAssessment={profile} userInterests={userInterests} profile={profile} />
            {user?.id && <ReferralWidget userId={user.id} />}
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Show subscription modal if user needs to subscribe
  if (showSubscription) {
    const relevantPlans = subscriptionPlans.filter(plan => 
      userRole === 'school' ? plan.type === 'school' : 
      plan.type !== 'school'
    );

    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent-light/30 to-secondary-light/20 flex items-center justify-center p-4">
        <Card className="w-full max-w-4xl shadow-lg">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Crown className="w-12 h-12 text-primary" />
            </div>
            <CardTitle className="text-3xl bg-gradient-primary bg-clip-text text-transparent">
              Pilih Paket Berlangganan
            </CardTitle>
            <CardDescription className="text-lg">
              Untuk mengakses dashboard pembelajaran, Anda perlu berlangganan terlebih dahulu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              {relevantPlans.map((plan) => (
                <Card key={plan.id} className="relative border-2 hover:border-primary transition-all hover:shadow-lg">
                  {plan.name.toLowerCase().includes('premium') && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground px-3 py-1">Terpopuler</Badge>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription className="text-muted-foreground">{plan.description}</CardDescription>
                    <div className="text-3xl font-bold text-primary">
                      Rp {(plan.price_monthly / 1000).toLocaleString('id-ID')}K
                      <span className="text-sm font-normal text-muted-foreground">/bulan</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-2">
                      {Array.isArray(plan.features) && plan.features.map((feature: string, index: number) => (
                        <li key={index} className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-success flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      onClick={() => handleSubscribe(plan.id)} 
                      className="w-full h-12"
                      variant={plan.name.toLowerCase().includes('premium') ? 'default' : 'outline'}
                    >
                      Pilih Paket Ini
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="text-center mt-6">
              <Button variant="ghost" onClick={() => navigate("/")} className="text-muted-foreground hover:text-foreground">
                Kembali ke Beranda
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Navigation-like sections should call navigate() in an event handler, NOT during render
  const handleSectionChange = (section: string) => {
    if (section === 'community') { navigate('/community'); return; }
    if (section === 'timeline')  { navigate('/discovery');  return; }
    setActiveSection(section);
  };

  return (
    <div
      className="min-h-screen flex w-full"
      style={{ background: "var(--tk-gray-50)" }}
    >
      {/* ── Sidebar ───────────────────────────────────────────── */}
      <DashboardSidebar
        activeSection={activeSection}
        setActiveSection={handleSectionChange}
        onSignOut={handleSignOut}
        userRole={userRole}
      />

      {/* ── Main area ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Desktop header */}
        <DashboardHeader user={user} profile={profile} onSignOut={handleSignOut} />

        {/* Mobile header */}
        <div
          className="md:hidden flex items-center justify-between px-4 py-3 border-b"
          style={{ background: "var(--tk-gray-0)", borderColor: "var(--tk-gray-200)" }}
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
          style={{ padding: "0 28px 60px" }}
        >
          <div className="max-w-full mx-auto pt-2">
            {renderActiveSection()}
          </div>
        </main>

        <BottomNavigationBar
          activeSection={activeSection}
          onSectionChange={handleSectionChange}
        />
      </div>
    </div>
  );
};

export default Dashboard;