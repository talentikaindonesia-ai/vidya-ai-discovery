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
      <div className="bg-primary rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              {getGreeting()}, {displayName}! 👋
            </h1>
            <p className="text-white/80 mb-2">
              Siap untuk melanjutkan perjalanan pembelajaran Anda hari ini?
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
            <Button variant="secondary" className="bg-white text-primary hover:bg-gray-100">
              <Play className="w-4 h-4 mr-2" />
              Lanjutkan Belajar
            </Button>
          </div>
          <div className="hidden md:block">
            <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center">
              <Target className="w-16 h-16 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <BookOpen className="w-8 h-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.coursesEnrolled}</p>
                <p className="text-sm text-muted-foreground">Kursus Diikuti</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Award className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{stats.coursesCompleted}</p>
                <p className="text-sm text-muted-foreground">Kursus Selesai</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{Math.round(stats.totalLearningTime / 60)}h</p>
                <p className="text-sm text-muted-foreground">Waktu Belajar</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{stats.achievements}</p>
                <p className="text-sm text-muted-foreground">Pencapaian</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Learning Progress and Assessment Results */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Assessment Results */}
        <AssessmentResultsCard assessmentResults={assessmentResults} />
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Target Mingguan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Kursus Diselesaikan</span>
                  <span>2/3</span>
                </div>
                <Progress value={67} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Waktu Belajar</span>
                  <span>8/12 jam</span>
                </div>
                <Progress value={67} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Jadwal Hari Ini
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                <div>
                  <p className="font-medium">Kelas Python Dasar</p>
                  <p className="text-sm text-muted-foreground">09:00 - 10:30</p>
                </div>
                <Badge variant="secondary">Live</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium">Quiz Matematika</p>
                  <p className="text-sm text-muted-foreground">14:00 - 14:30</p>
                </div>
                <Badge variant="outline">Upcoming</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Personalized Content Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Course Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Kursus untuk Anda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendations.slice(0, 3).map((course: any) => (
                <div key={course.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-sm line-clamp-1">{course.title}</h4>
                    <p className="text-xs text-muted-foreground">
                      {course.interest_categories?.name} • {course.duration_hours}h
                    </p>
                  </div>
                  <Button size="sm" variant="outline">
                    Mulai
                  </Button>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4" onClick={() => window.location.href = '/learning'}>
              Lihat Semua Kursus
            </Button>
          </CardContent>
        </Card>

        {/* Challenges */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Tantangan Terbaru
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {challenges.map((challenge: any) => (
                <div key={challenge.id} className="p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm">{challenge.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{challenge.description}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                        <span>{challenge.participants} peserta</span>
                        <span>Hadiah: {challenge.prize}</span>
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {new Date(challenge.deadline).toLocaleDateString('id-ID')}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              Lihat Semua Tantangan
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Opportunities */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Peluang untuk Anda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {opportunities.map((opportunity: any) => (
              <div key={opportunity.id} className="p-4 rounded-lg border hover:bg-accent/50 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-sm">{opportunity.title}</h4>
                  <Badge variant={opportunity.type === 'Scholarship' ? 'default' : 'secondary'} className="text-xs">
                    {opportunity.type}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{opportunity.company}</p>
                <p className="text-xs text-muted-foreground mt-1">{opportunity.location}</p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs text-muted-foreground">
                    Deadline: {new Date(opportunity.deadline).toLocaleDateString('id-ID')}
                  </span>
                  <Button size="sm" variant="outline">
                    Lamar
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <Button variant="outline" className="w-full mt-4" onClick={() => window.location.href = '/opportunities'}>
            Lihat Semua Peluang
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};