import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Clock, 
  Target, 
  TrendingUp, 
  Play,
  Star,
  Calendar,
  Award,
  Trophy,
  Briefcase
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { AssessmentResultsCard } from "./AssessmentResultsCard";

interface WelcomeDashboardProps {
  user: User | null;
  profile: any;
}

export const WelcomeDashboard = ({ user, profile }: WelcomeDashboardProps) => {
  const [stats, setStats] = useState({
    coursesEnrolled: 0,
    coursesCompleted: 0,
    totalLearningTime: 0,
    achievements: 0
  });
  const [recentCourses, setRecentCourses] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [userInterests, setUserInterests] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [assessmentResults, setAssessmentResults] = useState(null);

  useEffect(() => {
    if (user?.id) {
      loadDashboardData();
    }
  }, [user?.id]);

  const loadDashboardData = async () => {
    try {
      // Load user progress stats
      const { data: progressData } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user?.id);

      // Load achievements
      const { data: achievementsData } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', user?.id);

      // Load user interests
      const { data: interestsData } = await supabase
        .from('user_interests')
        .select('*, interest_categories(*)')
        .eq('user_id', user?.id);

      // Load personalized course recommendations based on interests
      const categoryIds = interestsData?.map(i => i.category_id) || [];
      const { data: coursesData } = await supabase
        .from('courses')
        .select('*, interest_categories(*)')
        .in('category_id', categoryIds.length > 0 ? categoryIds : [])
        .limit(6);

      // Mock challenges (would come from challenges table)
      const mockChallenges = [
        {
          id: '1',
          title: 'Data Science Challenge',
          description: 'Analisis dataset e-commerce',
          deadline: '2024-12-31',
          participants: 156,
          prize: 'Rp 5,000,000'
        },
        {
          id: '2', 
          title: 'UI/UX Design Contest',
          description: 'Redesign aplikasi mobile',
          deadline: '2024-12-25',
          participants: 89,
          prize: 'Rp 3,000,000'
        }
      ];

      // Mock opportunities (would come from opportunities table)
      const mockOpportunities = [
        {
          id: '1',
          title: 'Internship at Tech Startup',
          company: 'InnovateTech',
          type: 'Internship',
          location: 'Jakarta',
          deadline: '2024-12-20'
        },
        {
          id: '2',
          title: 'LPDP Scholarship 2025',
          company: 'LPDP',
          type: 'Scholarship',
          location: 'Global',
          deadline: '2024-12-15'
        }
      ];

      // Load assessment results
      const { data: assessmentData } = await supabase
        .from('assessment_results')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      setStats({
        coursesEnrolled: progressData?.length || 0,
        coursesCompleted: progressData?.filter(p => p.progress_percentage === 100).length || 0,
        totalLearningTime: progressData?.reduce((total, p) => total + (p.time_spent_minutes || 0), 0) || 0,
        achievements: achievementsData?.length || 0
      });

      setUserInterests(interestsData || []);
      setRecommendations(coursesData || []);
      setChallenges(mockChallenges);
      setOpportunities(mockOpportunities);
      setAssessmentResults(assessmentData || null);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Selamat Pagi';
    if (hour < 17) return 'Selamat Siang';
    return 'Selamat Malam';
  };

  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Pembelajar';

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-primary rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {getGreeting()}, {displayName}! 👋
            </h1>
            <p className="text-white/90 mb-4 text-lg">
              Mari lanjutkan perjalanan pembelajaran Anda hari ini
            </p>
            {userInterests.length > 0 && (
              <div className="flex gap-2 mb-4">
                {userInterests.slice(0, 3).map((interest) => (
                  <Badge key={interest.id} variant="secondary" className="text-xs bg-white/20 text-white border-white/30">
                    {interest.interest_categories?.name}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div className="hidden md:block">
            <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center">
              <Target className="w-16 h-16 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Assessment Results */}
      <AssessmentResultsCard assessmentResults={assessmentResults} />

      {/* Learning Progress Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Target className="w-6 h-6 text-primary" />
              Target Mingguan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">Kursus Diselesaikan</span>
                  <span className="text-primary font-bold">2/3</span>
                </div>
                <Progress value={67} className="h-3" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">Waktu Belajar Mingguan</span>
                  <span className="text-primary font-bold">8/12 jam</span>
                </div>
                <Progress value={67} className="h-3" />
              </div>
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground">
                  Anda sudah mencapai <span className="font-semibold text-primary">67%</span> dari target mingguan!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Calendar className="w-6 h-6 text-primary" />
              Jadwal Hari Ini
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-primary/5 rounded-xl border-l-4 border-primary">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Play className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">Kelas Python Dasar</p>
                  <p className="text-sm text-muted-foreground">09:00 - 10:30 WIB</p>
                </div>
                <Badge className="bg-primary text-primary-foreground">Live</Badge>
              </div>
              <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-xl border-l-4 border-muted">
                <div className="w-12 h-12 bg-muted/50 rounded-full flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">Quiz Matematika</p>
                  <p className="text-sm text-muted-foreground">14:00 - 14:30 WIB</p>
                </div>
                <Badge variant="outline">Upcoming</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Course Recommendations */}
        <Card className="shadow-card border-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-xl">
                <BookOpen className="w-6 h-6 text-primary" />
                Kursus Direkomendasikan
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                className="text-primary hover:bg-primary/10"
                onClick={() => window.location.href = '/learning'}
              >
                Lihat Semua →
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recommendations.slice(0, 3).map((course: any) => (
                <div key={course.id} className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-primary/5 to-transparent border hover:from-primary/10 transition-all">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold line-clamp-1">{course.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {course.interest_categories?.name} • {course.duration_hours}h
                    </p>
                  </div>
                  <Button size="sm" className="bg-primary text-primary-foreground shadow-soft">
                    Mulai
                  </Button>
                </div>
              ))}
            </div>
            <Button 
              className="w-full mt-6 bg-gradient-primary text-white shadow-floating hover:shadow-card" 
              onClick={() => window.location.href = '/learning'}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Jelajahi Semua Kursus
            </Button>
          </CardContent>
        </Card>

        {/* Opportunities */}
        <Card className="shadow-card border-accent/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Briefcase className="w-6 h-6 text-accent" />
                Peluang Terbaru
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                className="text-accent hover:bg-accent/10"
                onClick={() => window.location.href = '/opportunities'}
              >
                Lihat Semua →
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {opportunities.slice(0, 2).map((opportunity: any) => (
                <div key={opportunity.id} className="p-4 rounded-xl bg-gradient-to-r from-accent/5 to-transparent border hover:from-accent/10 transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-semibold line-clamp-1">{opportunity.title}</h4>
                    <Badge variant={opportunity.type === 'Scholarship' ? 'default' : 'secondary'} className="text-xs">
                      {opportunity.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{opportunity.company}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      📍 {opportunity.location}
                    </span>
                    <Button size="sm" variant="outline" className="border-accent text-accent hover:bg-accent/10">
                      Lihat Detail
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <Button 
              className="w-full mt-6 bg-gradient-accent text-white shadow-floating hover:shadow-card" 
              onClick={() => window.location.href = '/opportunities'}
            >
              <Briefcase className="w-4 h-4 mr-2" />
              Jelajahi Semua Peluang
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};