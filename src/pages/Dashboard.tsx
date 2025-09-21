import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sidebar, SidebarContent, SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { NotificationDropdown } from "@/components/dashboard/NotificationDropdown";
import { WelcomeDashboard } from "@/components/dashboard/WelcomeDashboard";
import CoursesPreview from "@/components/CoursesPreview";
import CommunityPreview from "@/components/CommunityPreview";
import { BottomNavigationBar } from "@/components/dashboard/BottomNavigationBar";
import { ScrapedContent } from "@/components/dashboard/ScrapedContent";
import { CoursesSection } from "@/components/dashboard/CoursesSection";
import { ChallengesSection } from "@/components/dashboard/ChallengesSection";
import { OpportunitiesSection } from "@/components/dashboard/OpportunitiesSection";
import { ProgressTracker } from "@/components/dashboard/ProgressTracker";
import { Achievements } from "@/components/dashboard/Achievements";
import { User, Session } from "@supabase/supabase-js";
import { Crown, Check, X } from "lucide-react";
import { toast } from "sonner";

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
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (!session) {
          navigate("/auth");
        } else {
          // Defer profile loading to prevent potential deadlocks
          setTimeout(() => {
            loadUserData(session.user.id);
          }, 0);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session) {
        navigate("/auth");
      } else {
        loadUserData(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadUserData = async (userId: string) => {
    try {
      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error loading profile:', profileError);
        toast.error("Gagal memuat profil pengguna");
      } else {
        setProfile(profileData);
        
        // Check subscription status
        if (!profileData?.subscription_status || profileData.subscription_status === 'inactive') {
          setShowSubscription(true);
        }
      }

      // Load user role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (roleError && roleError.code !== 'PGRST116') {
        console.error('Error loading role:', roleError);
      } else {
        setUserRole(roleData?.role || 'individual');
      }

      // Load subscription plans
      const { data: plansData, error: plansError } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price_monthly');

      if (plansError) {
        console.error('Error loading plans:', plansError);
      } else {
        setSubscriptionPlans(plansData || []);
      }

      // Load user interests
      const { data: interestsData, error: interestsError } = await supabase
        .from('user_interests')
        .select('*, interest_categories(name)')
        .eq('user_id', userId)
        .limit(3);

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
      // Update user subscription status
      const { error } = await supabase
        .from('profiles')
        .update({
          subscription_status: 'active',
          subscription_type: userRole === 'school' ? 'school' : 'individual',
          subscription_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('user_id', user?.id);

      if (error) throw error;

      toast.success("Berlangganan berhasil!");
      setShowSubscription(false);
      
      // Reload profile
      if (user) {
        loadUserData(user.id);
      }
    } catch (error: any) {
      toast.error("Gagal berlangganan: " + error.message);
    }
  };

  const displayName = profile?.full_name || user?.email || 'Pengguna';

  const renderActiveSection = () => {
    switch (activeSection) {
      case "overview":
        return (
          <div className="space-y-6">
            <WelcomeDashboard user={user} profile={profile} />
            <CoursesPreview />
            <CommunityPreview userAssessment={profile} userInterests={userInterests} />
            <ScrapedContent category={userInterests[0]?.interest_categories?.name} />
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
      case "community":
        window.location.href = '/community';
        return null;
      case "timeline":
        window.location.href = '/discovery';
        return null;
      default:
        return (
          <div className="space-y-6">
            <WelcomeDashboard user={user} profile={profile} />
            <CoursesPreview />
            <CommunityPreview userAssessment={profile} userInterests={userInterests} />
            <ScrapedContent category={userInterests[0]?.interest_categories?.name} />
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
      userRole === 'school' ? plan.name.toLowerCase().includes('school') : 
      !plan.name.toLowerCase().includes('school')
    );

    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-4xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Crown className="w-12 h-12 text-primary" />
            </div>
            <CardTitle className="text-3xl">Pilih Paket Berlangganan</CardTitle>
            <CardDescription className="text-lg">
              Untuk mengakses dashboard pembelajaran, Anda perlu berlangganan terlebih dahulu
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              {relevantPlans.map((plan) => (
                <Card key={plan.id} className="relative border-2 hover:border-primary transition-colors">
                  {plan.name.toLowerCase().includes('premium') && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground">Terpopuler</Badge>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="text-3xl font-bold text-primary">
                      Rp {(plan.price_monthly / 1000).toLocaleString('id-ID')}K
                      <span className="text-sm font-normal text-muted-foreground">/bulan</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <ul className="space-y-2">
                      {Array.isArray(plan.features) && plan.features.map((feature: string, index: number) => (
                        <li key={index} className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-500" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      onClick={() => handleSubscribe(plan.id)} 
                      className="w-full"
                      variant={plan.name.toLowerCase().includes('premium') ? 'default' : 'outline'}
                    >
                      Pilih Paket Ini
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="text-center mt-6">
              <Button variant="ghost" onClick={() => navigate("/")}>
                Kembali ke Beranda
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <DashboardSidebar 
          activeSection={activeSection} 
          setActiveSection={setActiveSection}
          onSignOut={handleSignOut}
          userRole={userRole}
        />
        <div className="flex-1 flex flex-col w-full">
          <DashboardHeader user={user} profile={profile} />
          
          {/* Mobile Header - shown only on mobile */}
          <div className="md:hidden bg-background border-b border-border px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <img 
                  src="/lovable-uploads/eb8d335b-30bc-4402-af4d-de439c638a0b.png" 
                  alt="Talentika Logo" 
                  className="w-8 h-8 object-contain"
                />
                <span className="font-bold text-lg bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Talentika
                </span>
              </div>
              
              <div className="flex items-center space-x-3">
                <NotificationDropdown userId={user?.id} />
                <Avatar className="h-8 w-8">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                    {getInitials(displayName)}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>

          <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-auto pb-20 md:pb-6 mobile-container">
            <div className="max-w-full mx-auto">
              {renderActiveSection()}
            </div>
          </main>
          
          <BottomNavigationBar 
            activeSection={activeSection}
            onSectionChange={setActiveSection}
          />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;