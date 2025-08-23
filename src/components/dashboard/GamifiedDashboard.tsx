import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Home, 
  BookOpen, 
  MapPin, 
  Trophy, 
  Users, 
  Gift,
  TrendingUp,
  Flame
} from "lucide-react";
import { XPLevelCard } from "./XPLevelCard";
import { StreakTracker } from "./StreakTracker";
import { QuestBoard } from "./QuestBoard";
import { CommunityHub } from "./CommunityHub";
import { RewardStore } from "./RewardStore";
import { Achievements } from "./Achievements";
import { ProgressTracker } from "./ProgressTracker";
import { CoursesSection } from "./CoursesSection";
import { OpportunitiesSection } from "./OpportunitiesSection";
import { useGameification } from "@/hooks/useGameification";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface GamifiedDashboardProps {
  user: any;
  profile: any;
}

export const GamifiedDashboard = ({ user, profile }: GamifiedDashboardProps) => {
  const [activeTab, setActiveTab] = useState("overview");
  const { userXP, streaks, updateStreak, awardXP } = useGameification();
  const navigate = useNavigate();

  useEffect(() => {
    // Update login streak when dashboard loads
    if (user) {
      updateStreak('login');
    }
  }, [user]);

  const handleLearningActivity = async () => {
    await updateStreak('learning');
    await awardXP(50, "Daily learning activity completed!");
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-br from-primary/10 to-secondary/10 p-6 rounded-xl border border-primary/20">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-primary mb-2">
              Welcome back, {profile?.full_name || user?.email?.split('@')[0]}! 🎉
            </h1>
            <p className="text-muted-foreground">
              Ready to level up your skills today? Let's achieve something amazing!
            </p>
          </div>
          <div className="text-right">
            <Badge variant="secondary" className="mb-2">
              Level {userXP.current_level}
            </Badge>
            <p className="text-2xl font-bold text-primary">{userXP.current_xp} XP</p>
          </div>
        </div>
      </div>

      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <XPLevelCard />
        <StreakTracker />
      </div>

      {/* Quick Actions */}
      <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-accent" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              variant="outline"
              className="h-16 flex-col gap-2 hover-scale"
              onClick={() => setActiveTab("learning")}
            >
              <BookOpen className="h-5 w-5" />
              <span className="text-sm">Learning Hub</span>
            </Button>
            <Button
              variant="outline"
              className="h-16 flex-col gap-2 hover-scale"
              onClick={() => setActiveTab("quests")}
            >
              <MapPin className="h-5 w-5" />
              <span className="text-sm">Active Quests</span>
            </Button>
            <Button
              variant="outline"
              className="h-16 flex-col gap-2 hover-scale"
              onClick={() => setActiveTab("community")}
            >
              <Users className="h-5 w-5" />
              <span className="text-sm">Challenges</span>
            </Button>
            <Button
              variant="outline"
              className="h-16 flex-col gap-2 hover-scale"
              onClick={() => setActiveTab("rewards")}
            >
              <Gift className="h-5 w-5" />
              <span className="text-sm">Reward Store</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity & Progress Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-secondary" />
              Recent Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-secondary/10 rounded-lg">
                <div className="p-2 bg-secondary rounded-full">
                  <Flame className="h-4 w-4 text-secondary-foreground" />
                </div>
                <div>
                  <p className="font-medium">7-Day Streak!</p>
                  <p className="text-sm text-muted-foreground">Keep the momentum going</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setActiveTab("achievements")}
                className="w-full hover-scale"
              >
                View All Achievements
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Learning Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>This Week's Goal</span>
                <span>3/5 activities</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full w-3/5"></div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setActiveTab("progress")}
                className="w-full hover-scale"
              >
                View Full Progress
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto p-6 space-y-6">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            Back to Home
          </Button>
          <Badge variant="outline" className="bg-card">
            Gamified Dashboard
          </Badge>
        </div>

        {/* Main Gamified Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 md:grid-cols-7 lg:grid-cols-8">
            <TabsTrigger value="overview" className="flex items-center gap-1">
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="learning" className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Learning</span>
            </TabsTrigger>
            <TabsTrigger value="quests" className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Quests</span>
            </TabsTrigger>
            <TabsTrigger value="opportunities" className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              <span className="hidden sm:inline">Opportunities</span>
            </TabsTrigger>
            <TabsTrigger value="community" className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Community</span>
            </TabsTrigger>
            <TabsTrigger value="achievements" className="flex items-center gap-1">
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline">Achievements</span>
            </TabsTrigger>
            <TabsTrigger value="progress" className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Progress</span>
            </TabsTrigger>
            <TabsTrigger value="rewards" className="flex items-center gap-1">
              <Gift className="h-4 w-4" />
              <span className="hidden sm:inline">Rewards</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {renderOverview()}
          </TabsContent>

          <TabsContent value="learning">
            <CoursesSection />
          </TabsContent>

          <TabsContent value="quests">
            <QuestBoard />
          </TabsContent>

          <TabsContent value="opportunities">
            <OpportunitiesSection />
          </TabsContent>

          <TabsContent value="community">
            <CommunityHub />
          </TabsContent>

          <TabsContent value="achievements">
            <Achievements />
          </TabsContent>

          <TabsContent value="progress">
            <ProgressTracker />
          </TabsContent>

          <TabsContent value="rewards">
            <RewardStore />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};