import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Star, 
  Trophy, 
  Gamepad2, 
  BookOpen, 
  Palette, 
  Microscope,
  Music,
  Settings
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const TalentikaJuniorDashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [userLevel, setUserLevel] = useState(1);
  const [userXP, setUserXP] = useState(0);
  const [badges, setBadges] = useState<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Check authentication and load user data
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }
      setUser(user);
      
      // Load profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (profileData) {
        setProfile(profileData);
      }

      // Load XP data
      const { data: xpData } = await supabase
        .from('user_xp')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (xpData) {
        setUserLevel(xpData.current_level);
        setUserXP(xpData.current_xp);
      }

      // Load achievements/badges
      const { data: achievementData } = await supabase
        .from('achievements')
        .select('badge_icon')
        .eq('user_id', user.id);
      
      if (achievementData) {
        setBadges(achievementData.map(a => a.badge_icon).filter(Boolean));
      }
    };

    checkAuth();
  }, [navigate]);

  const menuItems = [
    {
      title: "Discover",
      subtitle: "Find Your Talents!",
      icon: Star,
      color: "from-yellow-400 to-orange-400",
      action: () => navigate('/talentika-junior/discovery')
    },
    {
      title: "Learn",
      subtitle: "Fun Videos & Games",
      icon: BookOpen,
      color: "from-blue-400 to-purple-400",
      action: () => navigate('/talentika-junior/learning')
    },
    {
      title: "Play",
      subtitle: "Educational Games",
      icon: Gamepad2,
      color: "from-green-400 to-teal-400",
      action: () => navigate('/talentika-junior/games')
    },
    {
      title: "Rewards",
      subtitle: "Collect Badges!",
      icon: Trophy,
      color: "from-pink-400 to-rose-400",
      action: () => navigate('/talentika-junior/rewards')
    }
  ];

  const recentActivities = [
    { title: "Math Adventure", type: "game", xp: 50, icon: "🔢" },
    { title: "Animal Stories", type: "video", xp: 30, icon: "🐾" },
    { title: "Art Creator", type: "activity", xp: 40, icon: "🎨" },
  ];

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-100 via-blue-100 to-orange-100">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-amber-100 via-blue-100 to-orange-100 p-4">
      {/* Enhanced background with vibrant gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-200/50 via-blue-200/40 to-orange-200/50" />
      
      {/* Additional overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-amber-50/80 via-transparent to-blue-50/60" />
      
      {/* Decorative elements */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-blue-400/30 rounded-full blur-xl animate-pulse" />
      <div className="absolute bottom-10 right-10 w-32 h-32 bg-amber-400/30 rounded-full blur-2xl animate-pulse delay-1000" />
      <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-orange-400/40 rounded-full blur-lg animate-bounce delay-500" />
      
      {/* Additional decorative circles */}
      <div className="absolute top-20 right-1/4 w-12 h-12 bg-blue-300/25 rounded-full blur-md animate-pulse delay-700" />
      <div className="absolute bottom-20 left-1/3 w-10 h-10 bg-amber-300/35 rounded-full blur-sm animate-bounce delay-200" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="text-muted-foreground hover:text-foreground"
          >
            ← Back to Home
          </Button>
          <Button variant="ghost" size="icon">
            <Settings className="w-5 h-5" />
          </Button>
        </div>

        {/* Welcome Section */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-4">
            <div className="w-24 h-24 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-4xl mb-2 mx-auto shadow-lg">
              👦
            </div>
            <Badge className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-primary to-accent text-primary-foreground">
              Level {userLevel}
            </Badge>
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-2">
            Hi, 
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent block">
              {profile.full_name?.split(' ')[0] || 'Explorer'}! 🌟
            </span>
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed mb-4">
            Ready for another fun adventure?
          </p>
        
        {/* XP Progress */}
        <div className="max-w-md mx-auto mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Level {userLevel}</span>
            <span className="text-sm text-muted-foreground">{userXP}/1000 XP</span>
          </div>
          <Progress value={(userXP % 1000) / 10} className="h-3" />
        </div>

        {/* Badges */}
        {badges.length > 0 && (
          <div className="flex justify-center gap-2 mb-6">
            {badges.slice(0, 5).map((badge, index) => (
              <div key={index} className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center text-lg shadow-md">
                {badge || '⭐'}
              </div>
            ))}
            {badges.length > 5 && (
              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium">
                +{badges.length - 5}
              </div>
            )}
          </div>
        )}
      </div>

        {/* Main Menu */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {menuItems.map((item, index) => (
            <Card 
              key={index}
              className="p-6 cursor-pointer hover:scale-105 transition-all duration-300 border-0 bg-card/50 backdrop-blur-sm hover:bg-card/80 shadow-lg group"
              onClick={item.action}
            >
              <div className={`w-16 h-16 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center mb-4 mx-auto shadow-md group-hover:scale-110 transition-transform duration-300`}>
                <item.icon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-center mb-1 text-foreground">{item.title}</h3>
              <p className="text-sm text-muted-foreground text-center">{item.subtitle}</p>
            </Card>
          ))}
        </div>

        {/* Recent Activities */}
        <Card className="p-6 shadow-lg border-0 bg-card/50 backdrop-blur-sm">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Recent Adventures
          </h3>
          <div className="space-y-3">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-background/50 rounded-lg hover:bg-background/80 transition-all duration-300">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{activity.icon}</span>
                  <div>
                    <h4 className="font-medium">{activity.title}</h4>
                    <p className="text-sm text-muted-foreground capitalize">{activity.type}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-700">
                  +{activity.xp} XP
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Quick Access Activities */}
        <Card className="mt-6 p-6 shadow-lg border-0 bg-card/50 backdrop-blur-sm">
          <h3 className="text-xl font-bold mb-4">Quick Activities</h3>
          <div className="grid grid-cols-4 gap-3">
            {[
              { icon: Palette, label: "Art", color: "bg-red-100 text-red-600 hover:bg-red-200" },
              { icon: Music, label: "Music", color: "bg-purple-100 text-purple-600 hover:bg-purple-200" },
              { icon: Microscope, label: "Science", color: "bg-blue-100 text-blue-600 hover:bg-blue-200" },
              { icon: BookOpen, label: "Stories", color: "bg-green-100 text-green-600 hover:bg-green-200" },
            ].map((item, index) => (
              <Button
                key={index}
                variant="ghost"
                className={`h-20 flex-col gap-2 ${item.color} hover:scale-105 transition-all duration-300`}
              >
                <item.icon className="w-6 h-6" />
                <span className="text-xs font-medium">{item.label}</span>
              </Button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TalentikaJuniorDashboard;