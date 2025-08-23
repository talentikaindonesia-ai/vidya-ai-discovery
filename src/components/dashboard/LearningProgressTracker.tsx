import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, 
  Trophy, 
  Clock, 
  Target, 
  Star, 
  Award,
  TrendingUp,
  Calendar,
  Play,
  CheckCircle,
  Users,
  BarChart3
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface LearningProgress {
  id: string;
  user_id: string;
  content_id: string;
  progress_percentage: number;
  time_spent_minutes: number;
  status: string;
  last_accessed_at: string;
  completed_at?: string;
  rating?: number;
  learning_content: {
    title: string;
    content_type: string;
    duration_minutes: number;
    difficulty_level: string;
    learning_categories?: {
      name: string;
      color: string;
    };
  };
}

interface WeeklyProgress {
  week: string;
  minutes: number;
  contents_completed: number;
}

interface LearningProgressTrackerProps {
  user: any;
}

export const LearningProgressTracker = ({ user }: LearningProgressTrackerProps) => {
  const [allProgress, setAllProgress] = useState<LearningProgress[]>([]);
  const [weeklyData, setWeeklyData] = useState<WeeklyProgress[]>([]);
  const [totalStats, setTotalStats] = useState({
    totalMinutes: 0,
    completedContents: 0,
    inProgressContents: 0,
    averageRating: 0,
    currentStreak: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadProgressData();
    }
  }, [user]);

  const loadProgressData = async () => {
    try {
      const { data: progressData, error } = await supabase
        .from('learning_progress')
        .select(`
          *,
          learning_content (
            title,
            content_type,
            duration_minutes,
            difficulty_level,
            learning_categories (
              name,
              color
            )
          )
        `)
        .eq('user_id', user.id)
        .order('last_accessed_at', { ascending: false });

      if (error) throw error;

      setAllProgress(progressData || []);
      calculateStats(progressData || []);
      generateWeeklyData(progressData || []);
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (progressData: LearningProgress[]) => {
    const totalMinutes = progressData.reduce((sum, p) => sum + p.time_spent_minutes, 0);
    const completedContents = progressData.filter(p => p.progress_percentage >= 100).length;
    const inProgressContents = progressData.filter(p => p.progress_percentage > 0 && p.progress_percentage < 100).length;
    const ratedContents = progressData.filter(p => p.rating && p.rating > 0);
    const averageRating = ratedContents.length > 0 
      ? ratedContents.reduce((sum, p) => sum + (p.rating || 0), 0) / ratedContents.length 
      : 0;

    // Calculate streak (consecutive days with learning activity)
    const currentStreak = calculateLearningStreak(progressData);

    setTotalStats({
      totalMinutes,
      completedContents,
      inProgressContents,
      averageRating,
      currentStreak
    });
  };

  const calculateLearningStreak = (progressData: LearningProgress[]) => {
    // Simple streak calculation based on last_accessed_at dates
    const uniqueDates = [...new Set(progressData.map(p => 
      new Date(p.last_accessed_at).toDateString()
    ))].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    let streak = 0;
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();

    if (uniqueDates.includes(today) || uniqueDates.includes(yesterday)) {
      streak = 1;
      let currentDate = new Date(uniqueDates[0]);
      
      for (let i = 1; i < uniqueDates.length; i++) {
        const prevDate = new Date(uniqueDates[i]);
        const daysDiff = Math.floor((currentDate.getTime() - prevDate.getTime()) / (24 * 60 * 60 * 1000));
        
        if (daysDiff === 1) {
          streak++;
          currentDate = prevDate;
        } else {
          break;
        }
      }
    }

    return streak;
  };

  const generateWeeklyData = (progressData: LearningProgress[]) => {
    const weeks = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const weekStart = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
      const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      const weekProgress = progressData.filter(p => {
        const accessDate = new Date(p.last_accessed_at);
        return accessDate >= weekStart && accessDate < weekEnd;
      });

      const weekMinutes = weekProgress.reduce((sum, p) => sum + p.time_spent_minutes, 0);
      const weekCompleted = weekProgress.filter(p => p.progress_percentage >= 100).length;

      weeks.push({
        week: `${weekStart.getDate()}/${weekStart.getMonth() + 1}`,
        minutes: weekMinutes,
        contents_completed: weekCompleted
      });
    }
    
    setWeeklyData(weeks);
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-secondary text-secondary-foreground';
      case 'intermediate': return 'bg-accent text-accent-foreground';
      case 'advanced': return 'bg-primary text-primary-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'course': return <BookOpen className="w-4 h-4" />;
      case 'video': return <Play className="w-4 h-4" />;
      case 'article': return <Star className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 rounded-full bg-primary/10">
              <Clock className="w-6 h-6 text-primary" />
            </div>
            <div className="text-2xl font-bold">{formatDuration(totalStats.totalMinutes)}</div>
            <div className="text-sm text-muted-foreground">Total Belajar</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 rounded-full bg-secondary/10">
              <CheckCircle className="w-6 h-6 text-secondary" />
            </div>
            <div className="text-2xl font-bold">{totalStats.completedContents}</div>
            <div className="text-sm text-muted-foreground">Selesai</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 rounded-full bg-accent/10">
              <TrendingUp className="w-6 h-6 text-accent" />
            </div>
            <div className="text-2xl font-bold">{totalStats.inProgressContents}</div>
            <div className="text-sm text-muted-foreground">Berlangsung</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 rounded-full bg-yellow-500/10">
              <Star className="w-6 h-6 text-yellow-500" />
            </div>
            <div className="text-2xl font-bold">{totalStats.averageRating.toFixed(1)}</div>
            <div className="text-sm text-muted-foreground">Rata-rata Rating</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-2 rounded-full bg-orange-500/10">
              <Calendar className="w-6 h-6 text-orange-500" />
            </div>
            <div className="text-2xl font-bold">{totalStats.currentStreak}</div>
            <div className="text-sm text-muted-foreground">Hari Berturut</div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Progress Mingguan
          </CardTitle>
          <CardDescription>
            Waktu belajar dan konten yang diselesaikan dalam 7 minggu terakhir
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'minutes' ? formatDuration(value as number) : value,
                    name === 'minutes' ? 'Waktu Belajar' : 'Konten Selesai'
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="minutes"
                  stackId="1"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.6}
                />
                <Area
                  type="monotone"
                  dataKey="contents_completed"
                  stackId="2"
                  stroke="#82ca9d"
                  fill="#82ca9d"
                  fillOpacity={0.6}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">Semua Progress</TabsTrigger>
          <TabsTrigger value="completed">Selesai</TabsTrigger>
          <TabsTrigger value="in-progress">Berlangsung</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="space-y-4">
            {allProgress.map((progress) => (
              <Card key={progress.id} className="hover:shadow-md transition-all">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        progress.progress_percentage >= 100 ? 'bg-secondary/10' : 'bg-primary/10'
                      }`}>
                        {progress.progress_percentage >= 100 ? 
                          <CheckCircle className="w-6 h-6 text-secondary" /> :
                          getContentIcon(progress.learning_content.content_type)
                        }
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium truncate">{progress.learning_content.title}</h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge 
                              variant="secondary" 
                              className={getDifficultyColor(progress.learning_content.difficulty_level)}
                            >
                              {progress.learning_content.difficulty_level}
                            </Badge>
                            <Badge 
                              variant="outline"
                              style={{ 
                                backgroundColor: progress.learning_content.learning_categories?.color + '20',
                                borderColor: progress.learning_content.learning_categories?.color
                              }}
                            >
                              {progress.learning_content.learning_categories?.name}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">{progress.progress_percentage}%</div>
                          <div className="text-xs text-muted-foreground">
                            {formatDuration(progress.time_spent_minutes)} / {formatDuration(progress.learning_content.duration_minutes)}
                          </div>
                        </div>
                      </div>
                      
                      <Progress value={progress.progress_percentage} className="h-2 mb-2" />
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Terakhir diakses: {new Date(progress.last_accessed_at).toLocaleDateString('id-ID')}</span>
                        {progress.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-500 fill-current" />
                            <span>{progress.rating}/5</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="mt-6">
          <div className="space-y-4">
            {allProgress.filter(p => p.progress_percentage >= 100).map((progress) => (
              <Card key={progress.id} className="hover:shadow-md transition-all">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center">
                      <Trophy className="w-6 h-6 text-secondary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{progress.learning_content.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary">Selesai</Badge>
                        <span className="text-sm text-muted-foreground">
                          {progress.completed_at && new Date(progress.completed_at).toLocaleDateString('id-ID')}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{formatDuration(progress.time_spent_minutes)}</div>
                      {progress.rating && (
                        <div className="flex items-center gap-1 justify-end">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="text-sm">{progress.rating}/5</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="in-progress" className="mt-6">
          <div className="space-y-4">
            {allProgress.filter(p => p.progress_percentage > 0 && p.progress_percentage < 100).map((progress) => (
              <Card key={progress.id} className="hover:shadow-md transition-all">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      {getContentIcon(progress.learning_content.content_type)}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">{progress.learning_content.title}</h4>
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span>Progress</span>
                          <span>{progress.progress_percentage}%</span>
                        </div>
                        <Progress value={progress.progress_percentage} className="h-2" />
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      <Play className="w-4 h-4 mr-2" />
                      Lanjutkan
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};