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
      <div className="bg-gradient-primary rounded-2xl p-4 sm:p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 break-words">
                {getGreeting()}, {displayName}! 👋
              </h1>
              <p className="text-white/90 mb-4 text-sm sm:text-base lg:text-lg leading-relaxed">
                Mari lanjutkan perjalanan pembelajaran Anda hari ini
              </p>
              {userInterests.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {userInterests.slice(0, 3).map((interest) => (
                    <Badge key={interest.id} variant="secondary" className="text-xs bg-white/20 text-white border-white/30">
                      {interest.interest_categories?.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="hidden lg:block flex-shrink-0">
              <div className="w-24 h-24 xl:w-32 xl:h-32 bg-white/10 rounded-full flex items-center justify-center">
                <Target className="w-12 h-12 xl:w-16 xl:h-16 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Assessment Results */}
      <AssessmentResultsCard assessmentResults={assessmentResults} />


      {/* Quick Actions */}
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
        {/* Course Recommendations */}
        <Card className="shadow-card border-primary/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                <span className="truncate">Kursus Direkomendasikan</span>
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                className="text-primary hover:bg-primary/10 text-xs sm:text-sm flex-shrink-0"
                onClick={() => window.location.href = '/learning'}
              >
                Lihat Semua →
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            {recommendations.slice(0, 3).map((course: any) => (
              <div key={course.id} className="flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-gradient-to-r from-primary/5 to-transparent border hover:from-primary/10 transition-all">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm sm:text-base line-clamp-1">{course.title}</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground truncate">
                    {course.interest_categories?.name} • {course.duration_hours}h
                  </p>
                </div>
                <Button size="sm" className="bg-primary text-primary-foreground shadow-soft text-xs flex-shrink-0">
                  Mulai
                </Button>
              </div>
            ))}
            <Button 
              className="w-full mt-4 sm:mt-6 bg-gradient-primary text-white shadow-floating hover:shadow-card text-sm" 
              onClick={() => window.location.href = '/learning'}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              Jelajahi Semua Kursus
            </Button>
          </CardContent>
        </Card>

        {/* Opportunities */}
        <Card className="shadow-card border-accent/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Briefcase className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
                <span className="truncate">Peluang Terbaru</span>
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm"
                className="text-accent hover:bg-accent/10 text-xs sm:text-sm flex-shrink-0"
                onClick={() => window.location.href = '/opportunities'}
              >
                Lihat Semua →
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 sm:space-y-4">
            {opportunities.slice(0, 2).map((opportunity: any) => (
              <div key={opportunity.id} className="p-3 sm:p-4 rounded-xl bg-gradient-to-r from-accent/5 to-transparent border hover:from-accent/10 transition-all">
                <div className="flex items-start justify-between mb-3 gap-2">
                  <h4 className="font-semibold text-sm sm:text-base line-clamp-2 flex-1">{opportunity.title}</h4>
                  <Badge variant={opportunity.type === 'Scholarship' ? 'default' : 'secondary'} className="text-xs flex-shrink-0">
                    {opportunity.type}
                  </Badge>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-2 truncate">{opportunity.company}</p>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground truncate flex-1">
                    📍 {opportunity.location}
                  </span>
                  <Button size="sm" variant="outline" className="border-accent text-accent hover:bg-accent/10 text-xs flex-shrink-0">
                    Detail
                  </Button>
                </div>
              </div>
            ))}
            <Button 
              className="w-full mt-4 sm:mt-6 bg-gradient-accent text-white shadow-floating hover:shadow-card text-sm" 
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