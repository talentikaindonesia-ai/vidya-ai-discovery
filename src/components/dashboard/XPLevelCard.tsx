import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Trophy, Zap, Star } from "lucide-react";
import { useGameification } from "@/hooks/useGameification";

export const XPLevelCard = () => {
  const { userXP, getXPToNextLevel, getXPProgress, loading } = useGameification();

  if (loading) {
    return (
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="h-6 bg-muted rounded mb-4"></div>
            <div className="h-4 bg-muted rounded mb-2"></div>
            <div className="h-2 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 hover-scale">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <span className="flex items-center gap-2">
            <div className="p-2 bg-primary rounded-full">
              <Trophy className="h-4 w-4 text-primary-foreground" />
            </div>
            Level {userXP.current_level}
          </span>
          <Badge variant="secondary" className="bg-secondary/20 text-secondary-foreground">
            <Zap className="h-3 w-3 mr-1" />
            {userXP.current_xp.toLocaleString()} XP
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Progress to Level {userXP.current_level + 1}</span>
            <span className="font-medium">{getXPToNextLevel()} XP to go</span>
          </div>
          <Progress 
            value={getXPProgress()} 
            className="h-3"
          />
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1 text-accent">
            <Star className="h-4 w-4" />
            <span className="font-medium">{userXP.total_xp_earned.toLocaleString()}</span>
            <span className="text-muted-foreground">Total XP</span>
          </div>
          
          {userXP.current_level >= 5 && (
            <Badge variant="outline" className="border-accent text-accent">
              Elite Learner
            </Badge>
          )}
        </div>

        {userXP.current_level < 2 && (
          <div className="p-3 bg-secondary/10 rounded-lg border border-secondary/20">
            <p className="text-sm text-muted-foreground">
              💡 Complete quests, courses, and daily activities to earn XP and level up!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};