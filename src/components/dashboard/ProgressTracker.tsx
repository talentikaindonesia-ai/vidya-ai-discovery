import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Clock, 
  Target, 
  Calendar,
  BarChart3,
  Book
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const ProgressTracker = () => {
  const [progressData, setProgressData] = useState({
    totalCourses: 0,
    completedCourses: 0,
    totalLearningTime: 0,
    weeklyGoal: 12, // hours
    weeklyProgress: 0,
    monthlyProgress: 0
  });
  const [courseProgress, setCourseProgress] = useState([]);
  const [learningStreak, setLearningStreak] = useState(7);

  useEffect(() => {
    loadProgressData();
  }, []);

  const loadProgressData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load user progress
      const { data: progressData } = await supabase
        .from('user_progress')
        .select(`
          *,
          courses(title, duration_hours, interest_categories(name, icon))
        `)
        .eq('user_id', user.id);

      if (progressData) {
        const totalCourses = progressData.length;
        const completedCourses = progressData.filter(p => p.progress_percentage === 100).length;
        const totalLearningTime = progressData.reduce((total, p) => total + (p.time_spent_minutes || 0), 0);

        setProgressData(prev => ({
          ...prev,
          totalCourses,
          completedCourses,
          totalLearningTime: Math.round(totalLearningTime / 60), // Convert to hours
          weeklyProgress: Math.min((totalLearningTime / 60) / prev.weeklyGoal * 100, 100)
        }));

        setCourseProgress(progressData);
      }
    } catch (error) {
      console.error('Error loading progress data:', error);
    }
  };

  const getCompletionRate = () => {
    if (progressData.totalCourses === 0) return 0;
    return Math.round((progressData.completedCourses / progressData.totalCourses) * 100);
  };

  const getAverageProgress = () => {
    if (courseProgress.length === 0) return 0;
    const totalProgress = courseProgress.reduce((sum: number, course: any) => sum + course.progress_percentage, 0);
    return Math.round(totalProgress / courseProgress.length);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Progress Pembelajaran</h1>
        <Badge variant="outline" className="text-lg px-3 py-1">
          🔥 {learningStreak} hari streak
        </Badge>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Target className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{getCompletionRate()}%</p>
                <p className="text-sm text-muted-foreground">Tingkat Penyelesaian</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Book className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{progressData.completedCourses}/{progressData.totalCourses}</p>
                <p className="text-sm text-muted-foreground">Kursus Selesai</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{progressData.totalLearningTime}h</p>
                <p className="text-sm text-muted-foreground">Total Belajar</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{getAverageProgress()}%</p>
                <p className="text-sm text-muted-foreground">Rata-rata Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Goal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Target Mingguan
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Waktu Belajar Mingguan</span>
                <span>{Math.round(progressData.weeklyProgress * progressData.weeklyGoal / 100)}h / {progressData.weeklyGoal}h</span>
              </div>
              <Progress value={progressData.weeklyProgress} className="h-3" />
            </div>
            <div className="grid grid-cols-7 gap-2 mt-4">
              {['Sn', 'Sl', 'Rb', 'Km', 'Jm', 'Sb', 'Mg'].map((day, index) => (
                <div key={day} className="text-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                    index < learningStreak ? 'bg-primary text-primary-foreground' : 'bg-muted'
                  }`}>
                    {day}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Course Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Progress Kursus
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {courseProgress.map((course: any) => (
              <div key={course.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                <div className="text-2xl">
                  {course.courses?.interest_categories?.icon || '📚'}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{course.courses?.title}</h3>
                  <div className="flex items-center justify-between mt-2">
                    <Progress value={course.progress_percentage} className="flex-1 mr-4" />
                    <span className="text-sm font-medium">{course.progress_percentage}%</span>
                  </div>
                  <div className="flex items-center justify-between mt-1 text-sm text-muted-foreground">
                    <span>{Math.round((course.time_spent_minutes || 0) / 60)}h belajar</span>
                    <span>{course.courses?.duration_hours}h total</span>
                  </div>
                </div>
                <Badge 
                  variant={course.progress_percentage === 100 ? "default" : "secondary"}
                  className={course.progress_percentage === 100 ? "bg-green-500" : ""}
                >
                  {course.progress_percentage === 100 ? "Selesai" : "Berlangsung"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Learning Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Statistik Pembelajaran</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Hari belajar berturut-turut</span>
                <span className="font-bold">{learningStreak} hari</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Rata-rata belajar per hari</span>
                <span className="font-bold">2.3 jam</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Topik favorit</span>
                <span className="font-bold">Teknologi 💻</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Waktu belajar terbaik</span>
                <span className="font-bold">19:00 - 21:00</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pencapaian Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-yellow-50 rounded-lg">
                <span className="text-2xl">🏆</span>
                <div>
                  <p className="font-medium">Konsisten Belajar</p>
                  <p className="text-sm text-muted-foreground">Belajar 7 hari berturut-turut</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                <span className="text-2xl">🎯</span>
                <div>
                  <p className="font-medium">Target Tercapai</p>
                  <p className="text-sm text-muted-foreground">Menyelesaikan target mingguan</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                <span className="text-2xl">📚</span>
                <div>
                  <p className="font-medium">Kursus Pertama</p>
                  <p className="text-sm text-muted-foreground">Menyelesaikan kursus pertama</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};