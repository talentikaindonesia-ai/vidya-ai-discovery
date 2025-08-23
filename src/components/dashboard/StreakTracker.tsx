import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flame, Calendar, BookOpen, Award } from "lucide-react";
import { useGameification } from "@/hooks/useGameification";

export const StreakTracker = () => {
  const { streaks, loading } = useGameification();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-muted rounded"></div>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStreakIcon = (type: string) => {
    switch (type) {
      case 'login':
        return Calendar;
      case 'learning':
        return BookOpen;
      case 'achievement':
        return Award;
      default:
        return Flame;
    }
  };

  const getStreakColor = (streak: number) => {
    if (streak >= 30) return "text-red-500";
    if (streak >= 14) return "text-orange-500";
    if (streak >= 7) return "text-yellow-500";
    return "text-blue-500";
  };

  const getStreakBadge = (streak: number) => {
    if (streak >= 30) return { text: "Master", variant: "destructive" as const };
    if (streak >= 14) return { text: "Expert", variant: "secondary" as const };
    if (streak >= 7) return { text: "Committed", variant: "outline" as const };
    return null;
  };

  return (
    <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-accent" />
          Daily Streaks
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {streaks.map((streak) => {
          const Icon = getStreakIcon(streak.streak_type);
          const badge = getStreakBadge(streak.current_streak);
          
          return (
            <div key={streak.streak_type} className="flex items-center justify-between p-3 bg-card/50 rounded-lg border">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full bg-muted ${getStreakColor(streak.current_streak)}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-medium capitalize">
                    {streak.streak_type.replace('_', ' ')}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Best: {streak.longest_streak} days
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="text-right">
                  <p className={`text-lg font-bold ${getStreakColor(streak.current_streak)}`}>
                    {streak.current_streak}
                  </p>
                  <p className="text-xs text-muted-foreground">days</p>
                </div>
                {badge && (
                  <Badge variant={badge.variant} className="ml-2">
                    {badge.text}
                  </Badge>
                )}
              </div>
            </div>
          );
        })}

        {streaks.length === 0 && (
          <div className="text-center py-6">
            <Flame className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              Start your first streak today!
            </p>
          </div>
        )}

        <div className="p-3 bg-secondary/10 rounded-lg border border-secondary/20">
          <p className="text-sm text-muted-foreground">
            🔥 Keep your streaks alive! Log in daily and complete learning activities to earn bonus XP.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};