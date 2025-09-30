import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { ProfileHeader } from "@/components/profile/ProfileHeader";
import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { ProfileOverview } from "@/components/profile/ProfileOverview";
import { ProfileProgress } from "@/components/profile/ProfileProgress";
import { ProfileAchievements } from "@/components/profile/ProfileAchievements";
import { ProfileSettings } from "@/components/profile/ProfileSettings";
import { BottomNavigationBar } from "@/components/dashboard/BottomNavigationBar";
import { toast } from "sonner";

const Profile = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    coursesCompleted: 0,
    totalCourses: 0,
    certificates: 0,
    achievements: 0,
    totalPoints: 0,
    currentStreak: 0
  });
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        
        if (!session) {
          navigate("/auth");
        } else {
          loadUserData(session.user.id);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
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
      // Load profile using secure function
      const { data: profileData, error: profileError } = await supabase
        .rpc('get_profile_secure', { profile_user_id: userId })
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error loading profile:', profileError);
      } else {
        setProfile(profileData);
      }

      // Load learning progress stats
      const { data: progressData } = await supabase
        .from('learning_progress')
        .select('*, learning_content(title)')
        .eq('user_id', userId);

      // Load achievements
      const { data: achievementsData } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', userId);

      // Load quiz leaderboard stats
      const { data: quizStats } = await supabase
        .from('quiz_leaderboard')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Calculate stats
      const completedCourses = progressData?.filter(p => p.status === 'completed').length || 0;
      const totalCourses = progressData?.length || 0;
      const certificates = completedCourses; // Assuming 1 certificate per completed course
      const achievements = achievementsData?.length || 0;
      const totalPoints = quizStats?.total_points || 0;
      const currentStreak = quizStats?.current_streak || 0;

      setStats({
        coursesCompleted: completedCourses,
        totalCourses,
        certificates,
        achievements,
        totalPoints,
        currentStreak
      });

    } catch (error) {
      console.error('Error loading user data:', error);
      toast.error("Gagal memuat data profil");
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const handleNavigation = (section: string) => {
    if (section === "overview") {
      navigate("/dashboard");
    } else if (section === "courses") {
      navigate("/dashboard");
    } else if (section === "opportunities") {
      navigate("/dashboard");
    }
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case "overview":
        return <ProfileOverview user={user} profile={profile} stats={stats} />;
      case "progress":
        return <ProfileProgress user={user} stats={stats} />;
      case "achievements":
        return <ProfileAchievements user={user} stats={stats} />;
      case "settings":
        return <ProfileSettings user={user} profile={profile} onProfileUpdate={loadUserData} />;
      default:
        return <ProfileOverview user={user} profile={profile} stats={stats} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Memuat profil...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-6">
      <ProfileHeader user={user} profile={profile} stats={stats} />
      <div className="px-4 pt-4">
        <ProfileTabs activeTab={activeTab} onTabChange={handleTabChange} />
        <div className="mt-6">
          {renderActiveTab()}
        </div>
      </div>
      <BottomNavigationBar 
        activeSection="profile"
        onSectionChange={handleNavigation}
      />
    </div>
  );
};

export default Profile;