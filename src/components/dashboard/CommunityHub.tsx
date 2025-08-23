import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Zap, 
  Trophy, 
  Clock, 
  Star,
  Medal,
  Target
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useGameification } from "@/hooks/useGameification";
import { useToast } from "@/hooks/use-toast";

interface Challenge {
  id: string;
  title: string;
  description: string;
  challenge_type: string;
  difficulty: string;
  xp_reward: number;
  max_participants?: number;
  start_date: string;
  end_date?: string;
  is_active: boolean;
}

interface UserChallenge {
  id: string;
  challenge_id: string;
  status: string;
  score: number;
  rank?: number;
}

export const CommunityHub = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [userChallenges, setUserChallenges] = useState<UserChallenge[]>([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const { awardXP } = useGameification();
  const { toast } = useToast();

  useEffect(() => {
    loadCommunityData();
  }, []);

  const loadCommunityData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load active challenges
      const { data: challengesData } = await supabase
        .from('community_challenges')
        .select('*')
        .eq('is_active', true)
        .order('start_date', { ascending: false });

      // Load user challenge participation
      const { data: userChallengesData } = await supabase
        .from('user_challenges')
        .select('*')
        .eq('user_id', user.id);

      setChallenges(challengesData || []);
      setUserChallenges(userChallengesData || []);

      // Mock leaderboard data (in real app, this would be calculated)
      setLeaderboard([
        { rank: 1, name: "Alex Chen", xp: 15420, level: 15 },
        { rank: 2, name: "Sarah Kim", xp: 14280, level: 14 },
        { rank: 3, name: "David Park", xp: 13150, level: 13 },
        { rank: 4, name: "You", xp: 2500, level: 3 },
        { rank: 5, name: "Maya Singh", xp: 2100, level: 2 }
      ]);
    } catch (error) {
      console.error('Error loading community data:', error);
    } finally {
      setLoading(false);
    }
  };

  const joinChallenge = async (challengeId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_challenges')
        .insert([{
          user_id: user.id,
          challenge_id: challengeId,
          status: 'joined'
        }]);

      if (error) throw error;

      toast({
        title: "Challenge Joined!",
        description: "You've joined the challenge. Good luck!",
      });

      loadCommunityData();
    } catch (error) {
      console.error('Error joining challenge:', error);
      toast({
        title: "Error",
        description: "Failed to join challenge. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'hard': return 'text-red-600';
      default: return 'text-blue-600';
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return { icon: Trophy, color: 'text-yellow-500', bg: 'bg-yellow-100' };
    if (rank === 2) return { icon: Medal, color: 'text-gray-500', bg: 'bg-gray-100' };
    if (rank === 3) return { icon: Medal, color: 'text-orange-500', bg: 'bg-orange-100' };
    return { icon: Target, color: 'text-blue-500', bg: 'bg-blue-100' };
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Community Hub</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-accent/10 to-accent/5 border-accent/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-accent" />
          Community Hub
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="challenges" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="challenges">Active Challenges</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          </TabsList>
          
          <TabsContent value="challenges" className="space-y-4">
            {challenges.map((challenge) => {
              const userChallenge = userChallenges.find(uc => uc.challenge_id === challenge.id);
              const hasJoined = !!userChallenge;
              const isCompleted = userChallenge?.status === 'completed';

              return (
                <div key={challenge.id} className="p-4 bg-card rounded-lg border hover:shadow-md transition-all hover-scale">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{challenge.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {challenge.description}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {challenge.challenge_type.replace('_', ' ')}
                        </Badge>
                        <Badge 
                          variant="secondary" 
                          className={getDifficultyColor(challenge.difficulty)}
                        >
                          {challenge.difficulty}
                        </Badge>
                        <Badge variant="secondary">
                          <Zap className="h-3 w-3 mr-1" />
                          {challenge.xp_reward} XP
                        </Badge>
                      </div>
                    </div>

                    {!hasJoined ? (
                      <Button 
                        size="sm" 
                        onClick={() => joinChallenge(challenge.id)}
                        className="hover-scale"
                      >
                        Join
                      </Button>
                    ) : (
                      <Badge 
                        variant={isCompleted ? "default" : "secondary"}
                        className={isCompleted ? "bg-green-100 text-green-700" : ""}
                      >
                        {isCompleted ? "Completed" : "Joined"}
                      </Badge>
                    )}
                  </div>

                  {challenge.end_date && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      Ends: {new Date(challenge.end_date).toLocaleDateString()}
                    </div>
                  )}
                </div>
              );
            })}

            {challenges.length === 0 && (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">
                  No active challenges at the moment. Check back soon!
                </p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="leaderboard" className="space-y-4">
            {leaderboard.map((user, index) => {
              const { icon: RankIcon, color, bg } = getRankBadge(user.rank);
              
              return (
                <div 
                  key={user.rank} 
                  className={`p-4 rounded-lg border flex items-center justify-between ${
                    user.name === "You" ? "bg-primary/10 border-primary/20" : "bg-card"
                  } hover-scale`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-full ${bg}`}>
                      <RankIcon className={`h-4 w-4 ${color}`} />
                    </div>
                    <div>
                      <p className={`font-semibold ${user.name === "You" ? "text-primary" : ""}`}>
                        #{user.rank} {user.name}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Star className="h-3 w-3" />
                        Level {user.level}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className="font-bold text-lg">{user.xp.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">XP</p>
                  </div>
                </div>
              );
            })}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};