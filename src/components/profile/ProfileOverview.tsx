import { User } from "@supabase/supabase-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Award, TrendingUp, Download, Lock, Crown, User as UserIcon } from "lucide-react";
import { getSubscriptionLimits } from "@/lib/subscription";

interface ProfileOverviewProps {
  user: User | null;
  profile: any;
  stats: {
    coursesCompleted: number;
    totalCourses: number;
    certificates: number;
    achievements: number;
    totalPoints: number;
    currentStreak: number;
  };
}

export function ProfileOverview({ user, profile, stats }: ProfileOverviewProps) {
  // Get subscription limits
  const subscriptionLimits = getSubscriptionLimits(profile?.subscription_status, profile?.subscription_type);
  
  // Calculate available courses based on subscription
  const availableCourses = subscriptionLimits.maxCourses === -1 ? stats.totalCourses : Math.min(subscriptionLimits.maxCourses, stats.totalCourses);
  
  const progressPercentage = availableCourses > 0 
    ? Math.round((stats.coursesCompleted / availableCourses) * 100) 
    : 0;

  const recentAchievements = [
    { title: "First Course Completed", icon: "🎯", date: "2 hari lalu" },
    { title: "Quiz Master", icon: "🧠", date: "1 minggu lalu" },
    { title: "Weekly Streak", icon: "🔥", date: "2 minggu lalu" },
  ];

  const recentCertificates = [
    { title: "Introduction to Programming", date: "5 hari lalu" },
    { title: "Digital Marketing Basics", date: "2 minggu lalu" },
  ];

  return (
    <div className="space-y-6">
      {/* Learning Progress Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold">Progress Belajar</CardTitle>
          <BookOpen className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-3xl font-bold text-primary">{progressPercentage}%</span>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {stats.coursesCompleted}/{subscriptionLimits.maxCourses === -1 ? stats.totalCourses : subscriptionLimits.maxCourses} Kursus
                </Badge>
                {subscriptionLimits.maxCourses !== -1 && (
                  <Badge variant="outline" className="text-xs">
                    <Lock className="w-3 h-3 mr-1" />
                    Terbatas
                  </Badge>
                )}
              </div>
            </div>
            <Progress value={progressPercentage} className="w-full" />
            <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
              <div>
                <div className="font-medium text-foreground">{stats.currentStreak} Hari</div>
                <div>Streak Belajar</div>
              </div>
              <div>
                <div className="font-medium text-foreground">{stats.totalPoints}</div>
                <div>Total Poin</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Certificates */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold">Sertifikat Terbaru</CardTitle>
          <Award className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentCertificates.map((cert, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <div className="font-medium">{cert.title}</div>
                  <div className="text-sm text-muted-foreground">{cert.date}</div>
                </div>
                <Button variant="ghost" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            ))}
            {stats.certificates > 2 && (
              <Button variant="ghost" className="w-full">
                Lihat Semua ({stats.certificates})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Achievements */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-semibold">Achievement Terbaru</CardTitle>
          <TrendingUp className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentAchievements.map((achievement, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl">{achievement.icon}</div>
                <div className="flex-1">
                  <div className="font-medium">{achievement.title}</div>
                  <div className="text-sm text-muted-foreground">{achievement.date}</div>
                </div>
              </div>
            ))}
            {stats.achievements > 3 && (
              <Button variant="ghost" className="w-full">
                Lihat Semua ({stats.achievements})
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}