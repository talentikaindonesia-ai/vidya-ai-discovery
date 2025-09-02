import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Clock, Target, Calendar, TrendingUp, BookOpen } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ProfileProgressProps {
  user: User | null;
  stats: {
    coursesCompleted: number;
    totalCourses: number;
    certificates: number;
    achievements: number;
    totalPoints: number;
    currentStreak: number;
  };
}

export function ProfileProgress({ user, stats }: ProfileProgressProps) {
  const [detailedProgress, setDetailedProgress] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDetailedProgress();
    }
  }, [user]);

  const loadDetailedProgress = async () => {
    if (!user) return;

    try {
      const { data: progressData } = await supabase
        .from('learning_progress')
        .select(`
          *,
          learning_content (
            title,
            content_type,
            difficulty_level
          )
        `)
        .eq('user_id', user.id)
        .order('last_accessed_at', { ascending: false });

      setDetailedProgress(progressData || []);
    } catch (error) {
      console.error('Error loading detailed progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default">Selesai</Badge>;
      case 'in_progress':
        return <Badge variant="secondary">Berlangsung</Badge>;
      case 'not_started':
        return <Badge variant="outline">Belum Dimulai</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'text-green-600';
      case 'intermediate':
        return 'text-yellow-600';
      case 'advanced':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-2 bg-muted rounded w-full"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overall Statistics */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{stats.totalCourses}</div>
            <div className="text-sm text-muted-foreground">Total Kursus</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.coursesCompleted}</div>
            <div className="text-sm text-muted-foreground">Selesai</div>
          </CardContent>
        </Card>
      </div>

      {/* Learning Activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold">Aktivitas Belajar</CardTitle>
          <TrendingUp className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-medium">Streak Saat Ini</div>
                <div className="text-muted-foreground">{stats.currentStreak} hari</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              <div>
                <div className="font-medium">Total Poin</div>
                <div className="text-muted-foreground">{stats.totalPoints}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Course Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Progress Kursus Detail</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {detailedProgress.map((progress) => (
              <div key={progress.id} className="p-4 border rounded-lg space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium">{progress.learning_content?.title}</h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline" className={getDifficultyColor(progress.learning_content?.difficulty_level)}>
                        {progress.learning_content?.difficulty_level}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {progress.learning_content?.content_type}
                      </span>
                    </div>
                  </div>
                  {getStatusBadge(progress.status)}
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Progress</span>
                    <span>{progress.progress_percentage}%</span>
                  </div>
                  <Progress value={progress.progress_percentage} className="h-2" />
                </div>
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{progress.time_spent_minutes} menit</span>
                  </div>
                  <span>
                    {progress.last_accessed_at 
                      ? new Date(progress.last_accessed_at).toLocaleDateString('id-ID')
                      : 'Belum diakses'
                    }
                  </span>
                </div>
              </div>
            ))}
            
            {detailedProgress.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Belum ada kursus yang diikuti</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}