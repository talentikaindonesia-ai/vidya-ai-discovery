import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Sidebar, SidebarContent, SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { WelcomeDashboard } from "@/components/dashboard/WelcomeDashboard";
import { CoursesSection } from "@/components/dashboard/CoursesSection";
import { ProgressTracker } from "@/components/dashboard/ProgressTracker";
import { Achievements } from "@/components/dashboard/Achievements";
import { User, Session } from "@supabase/supabase-js";
import { toast } from "sonner";

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [activeSection, setActiveSection] = useState("overview");
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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
            loadUserProfile(session.user.id);
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
        loadUserProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const loadUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading profile:', error);
        toast.error("Gagal memuat profil pengguna");
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error:', error);
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

  const renderActiveSection = () => {
    switch (activeSection) {
      case "overview":
        return <WelcomeDashboard user={user} profile={profile} />;
      case "courses":
        return <CoursesSection />;
      case "progress":
        return <ProgressTracker />;
      case "achievements":
        return <Achievements />;
      default:
        return <WelcomeDashboard user={user} profile={profile} />;
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

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <DashboardSidebar 
          activeSection={activeSection} 
          setActiveSection={setActiveSection}
          onSignOut={handleSignOut}
        />
        <div className="flex-1 flex flex-col">
          <DashboardHeader user={user} profile={profile} />
          <main className="flex-1 p-6 overflow-auto">
            {renderActiveSection()}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;