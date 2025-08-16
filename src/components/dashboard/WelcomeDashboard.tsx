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
  Award
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

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

      // Load recommended courses
      const { data: coursesData } = await supabase
        .from('courses')
        .select('*, interest_categories(name, icon)')
        .eq('is_featured', true)
        .limit(4);

      setStats({
        coursesEnrolled: progressData?.length || 0,
        coursesCompleted: progressData?.filter(p => p.progress_percentage === 100).length || 0,
        totalLearningTime: progressData?.reduce((total, p) => total + (p.time_spent_minutes || 0), 0) || 0,
        achievements: achievementsData?.length || 0
      });

      setRecommendations(coursesData || []);
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
      <div className="bg-gradient-primary rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              {getGreeting()}, {displayName}! 👋
            </h1>
            <p className="text-primary-foreground/80 mb-4">
              Siap untuk melanjutkan perjalanan pembelajaran Anda hari ini?
            </p>
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

      {/* Learning Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

      {/* Recommended Courses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            Rekomendasi Untuk Anda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {recommendations.map((course: any) => (
              <div key={course.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{course.interest_categories?.icon || '📚'}</span>
                  <Badge variant="secondary" className="text-xs">
                    {course.difficulty_level}
                  </Badge>
                </div>
                <h3 className="font-medium mb-2 line-clamp-2">{course.title}</h3>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {course.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {course.duration_hours}h
                  </span>
                  <Button size="sm" variant="outline">
                    Mulai
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};