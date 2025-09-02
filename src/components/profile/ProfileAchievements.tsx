import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Award, Download, Star, Medal, Trophy } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ProfileAchievementsProps {
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

export function ProfileAchievements({ user, stats }: ProfileAchievementsProps) {
  const [achievements, setAchievements] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadAchievementsAndCertificates();
    }
  }, [user]);

  const loadAchievementsAndCertificates = async () => {
    if (!user) return;

    try {
      // Load achievements
      const { data: achievementsData } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false });

      setAchievements(achievementsData || []);

      // Load certificates (from completed learning progress)
      const { data: certificatesData } = await supabase
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
        .eq('status', 'completed')
        .order('completed_at', { ascending: false });

      setCertificates(certificatesData || []);
    } catch (error) {
      console.error('Error loading achievements and certificates:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAchievementIcon = (type: string) => {
    switch (type) {
      case 'course_completion':
        return <Award className="h-6 w-6 text-yellow-500" />;
      case 'streak':
        return <Medal className="h-6 w-6 text-orange-500" />;
      case 'quiz_master':
        return <Trophy className="h-6 w-6 text-purple-500" />;
      case 'points':
        return <Star className="h-6 w-6 text-blue-500" />;
      default:
        return <Award className="h-6 w-6 text-gray-500" />;
    }
  };

  const getBadgeIcon = (badgeIcon: string) => {
    if (badgeIcon) {
      return <span className="text-2xl">{badgeIcon}</span>;
    }
    return <Award className="h-6 w-6 text-primary" />;
  };

  const generateCertificateData = (progress: any) => ({
    title: progress.learning_content?.title,
    type: progress.learning_content?.content_type,
    difficulty: progress.learning_content?.difficulty_level,
    completedAt: progress.completed_at,
    progress: progress.progress_percentage
  });

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-8 bg-muted rounded w-full"></div>
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
      {/* Achievement Statistics */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-primary">{stats.achievements}</div>
            <div className="text-sm text-muted-foreground">Badge</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.certificates}</div>
            <div className="text-sm text-muted-foreground">Sertifikat</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600">{stats.totalPoints}</div>
            <div className="text-sm text-muted-foreground">Total Poin</div>
          </CardContent>
        </Card>
      </div>

      {/* Achievements/Badges */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center space-x-2">
            <Trophy className="h-5 w-5" />
            <span>Badge & Achievement</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {achievements.map((achievement) => (
              <div key={achievement.id} className="flex items-center space-x-4 p-4 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border">
                <div className="flex-shrink-0">
                  {achievement.badge_icon ? (
                    getBadgeIcon(achievement.badge_icon)
                  ) : (
                    getAchievementIcon(achievement.type)
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">{achievement.title}</h4>
                  <p className="text-sm text-muted-foreground">{achievement.description}</p>
                  <div className="flex items-center space-x-2 mt-2">
                    <Badge variant="secondary">{achievement.type}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(achievement.earned_at).toLocaleDateString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            
            {achievements.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Belum ada achievement yang diperoleh</p>
                <p className="text-sm">Selesaikan kursus untuk mendapatkan badge pertama!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Certificates */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold flex items-center space-x-2">
            <Award className="h-5 w-5" />
            <span>Sertifikat Digital</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {certificates.map((cert) => {
              const certData = generateCertificateData(cert);
              return (
                <div key={cert.id} className="flex items-center justify-between p-4 border rounded-lg bg-gradient-to-r from-green-50 to-blue-50">
                  <div className="flex-1">
                    <h4 className="font-semibold">{certData.title}</h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline">{certData.difficulty}</Badge>
                      <Badge variant="secondary">{certData.type}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Diselesaikan pada {new Date(certData.completedAt).toLocaleDateString('id-ID')}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="ml-4">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              );
            })}
            
            {certificates.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Belum ada sertifikat yang diperoleh</p>
                <p className="text-sm">Selesaikan kursus untuk mendapatkan sertifikat digital!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}