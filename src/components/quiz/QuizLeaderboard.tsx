import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';
import { useQuizSystem, QuizLeaderboard as LeaderboardType } from '@/hooks/useQuizSystem';

export const QuizLeaderboard: React.FC = () => {
  const { leaderboard, loadLeaderboard, getUserQuizStats } = useQuizSystem();
  const [userStats, setUserStats] = useState<any>(null);

  useEffect(() => {
    loadLeaderboard();
    loadUserStats();
  }, []);

  const loadUserStats = async () => {
    const stats = await getUserQuizStats();
    setUserStats(stats);
  };

  const getRankIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return (
          <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold">
            {position}
          </div>
        );
    }
  };

  const getRankBadgeVariant = (position: number) => {
    switch (position) {
      case 1: return 'default';
      case 2: return 'secondary';
      case 3: return 'outline';
      default: return 'outline';
    }
  };

  const getAccuracyPercentage = (correct: number, total: number) => {
    return total > 0 ? Math.round((correct / total) * 100) : 0;
  };

  return (
    <div className="space-y-6">
      {/* User Stats Card */}
      {userStats && (
        <Card className="bg-gradient-to-r from-primary/10 to-secondary/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Your Quiz Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{userStats.total_points}</div>
                <div className="text-sm text-muted-foreground">Total Points</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{userStats.total_quizzes_completed}</div>
                <div className="text-sm text-muted-foreground">Quizzes Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {getAccuracyPercentage(userStats.correct_answers, userStats.total_quizzes_completed)}%
                </div>
                <div className="text-sm text-muted-foreground">Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{userStats.current_streak}</div>
                <div className="text-sm text-muted-foreground">Current Streak</div>
              </div>
            </div>
            {userStats.rank_position && (
              <div className="mt-4 text-center">
                <Badge variant="secondary" className="text-sm">
                  Global Rank: #{userStats.rank_position}
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Quiz Masters Leaderboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {leaderboard.map((entry, index) => (
              <div
                key={entry.id}
                className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${
                  index < 3 ? 'bg-gradient-to-r from-primary/5 to-secondary/5' : 'hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center justify-center w-12">
                  {getRankIcon(entry.rank_position || index + 1)}
                </div>

                <Avatar className="h-10 w-10">
                  <AvatarImage src={entry.profiles?.avatar_url} />
                  <AvatarFallback>
                    {entry.profiles?.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <div className="font-semibold">
                    {entry.profiles?.full_name || 'Anonymous User'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {entry.total_quizzes_completed} quizzes • {getAccuracyPercentage(entry.correct_answers, entry.total_quizzes_completed)}% accuracy
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-lg font-bold text-primary">
                    {entry.total_points}
                  </div>
                  <div className="text-sm text-muted-foreground">points</div>
                </div>

                <div className="flex flex-col gap-1">
                  <Badge variant={getRankBadgeVariant(entry.rank_position || index + 1)}>
                    #{entry.rank_position || index + 1}
                  </Badge>
                  {entry.current_streak > 0 && (
                    <Badge variant="outline" className="text-xs">
                      🔥 {entry.current_streak}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>

          {leaderboard.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No quiz results yet. Be the first to start exploring!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};