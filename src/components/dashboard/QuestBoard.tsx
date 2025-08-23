import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  MapPin, 
  Zap, 
  Trophy, 
  Clock, 
  Star,
  ExternalLink,
  CheckCircle2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useGameification } from "@/hooks/useGameification";
import { useToast } from "@/hooks/use-toast";

interface Quest {
  id: string;
  title: string;
  description: string;
  quest_type: string;
  difficulty: string;
  xp_reward: number;
  badge_reward?: string;
  requirements: any;
}

interface UserQuest {
  id: string;
  quest_id: string;
  status: string;
  progress_data: any;
  xp_earned: number;
  completed_at?: string;
}

export const QuestBoard = () => {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [userQuests, setUserQuests] = useState<UserQuest[]>([]);
  const [loading, setLoading] = useState(true);
  const { awardXP } = useGameification();
  const { toast } = useToast();

  useEffect(() => {
    loadQuests();
  }, []);

  const loadQuests = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load available quests
      const { data: questsData } = await supabase
        .from('quests')
        .select('*')
        .eq('is_active', true)
        .order('difficulty', { ascending: true });

      // Load user quest progress
      const { data: userQuestsData } = await supabase
        .from('user_quests')
        .select('*')
        .eq('user_id', user.id);

      setQuests(questsData || []);
      setUserQuests(userQuestsData || []);
    } catch (error) {
      console.error('Error loading quests:', error);
    } finally {
      setLoading(false);
    }
  };

  const startQuest = async (questId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_quests')
        .insert([{
          user_id: user.id,
          quest_id: questId,
          status: 'in_progress',
          progress_data: {}
        }]);

      if (error) throw error;

      toast({
        title: "Quest Started!",
        description: "You've started a new quest. Complete the requirements to earn rewards!",
      });

      loadQuests();
    } catch (error) {
      console.error('Error starting quest:', error);
      toast({
        title: "Error",
        description: "Failed to start quest. Please try again.",
        variant: "destructive"
      });
    }
  };

  const completeQuest = async (quest: Quest, userQuest: UserQuest) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Mark quest as completed
      const { error } = await supabase
        .from('user_quests')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          xp_earned: quest.xp_reward
        })
        .eq('id', userQuest.id);

      if (error) throw error;

      // Award XP
      await awardXP(quest.xp_reward, `Completed quest: ${quest.title}`);

      toast({
        title: "🎉 Quest Completed!",
        description: `You earned ${quest.xp_reward} XP! ${quest.badge_reward ? `Badge unlocked: ${quest.badge_reward}` : ''}`,
        duration: 5000,
      });

      loadQuests();
    } catch (error) {
      console.error('Error completing quest:', error);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'hard': return 'bg-red-500';
      default: return 'bg-blue-500';
    }
  };

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return { variant: 'secondary' as const, text: 'Easy' };
      case 'medium': return { variant: 'outline' as const, text: 'Medium' };
      case 'hard': return { variant: 'destructive' as const, text: 'Hard' };
      default: return { variant: 'default' as const, text: difficulty };
    }
  };

  const getQuestIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return MapPin;
      case 'learning': return Star;
      case 'community': return Trophy;
      default: return Zap;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Quest Board</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-secondary" />
          Quest Board
          <Badge variant="outline">{quests.length} Available</Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {quests.map((quest) => {
          const userQuest = userQuests.find(uq => uq.quest_id === quest.id);
          const isStarted = !!userQuest;
          const isCompleted = userQuest?.status === 'completed';
          const Icon = getQuestIcon(quest.quest_type);
          const difficultyBadge = getDifficultyBadge(quest.difficulty);

          return (
            <div
              key={quest.id}
              className={`p-4 rounded-lg border transition-all ${
                isCompleted 
                  ? 'bg-green-50 border-green-200 opacity-75' 
                  : 'bg-card hover:shadow-md hover-scale'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${getDifficultyColor(quest.difficulty)}/20`}>
                    <Icon className={`h-4 w-4 text-${quest.difficulty === 'easy' ? 'green' : quest.difficulty === 'medium' ? 'yellow' : 'red'}-600`} />
                  </div>
                  <div>
                    <h3 className="font-semibold flex items-center gap-2">
                      {quest.title}
                      {isCompleted && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {quest.description}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant={difficultyBadge.variant}>
                    {difficultyBadge.text}
                  </Badge>
                  <Badge variant="secondary">
                    <Zap className="h-3 w-3 mr-1" />
                    {quest.xp_reward} XP
                  </Badge>
                </div>
              </div>

              {quest.badge_reward && (
                <div className="mb-3">
                  <Badge variant="outline" className="border-accent text-accent">
                    <Trophy className="h-3 w-3 mr-1" />
                    Badge: {quest.badge_reward}
                  </Badge>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {quest.quest_type}
                  </span>
                </div>

                {!isCompleted && (
                  <div className="flex items-center gap-2">
                    {!isStarted ? (
                      <Button 
                        size="sm"
                        onClick={() => startQuest(quest.id)}
                        className="hover-scale"
                      >
                        Start Quest
                      </Button>
                    ) : userQuest?.status === 'in_progress' ? (
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => completeQuest(quest, userQuest)}
                        className="hover-scale"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Complete
                      </Button>
                    ) : null}
                  </div>
                )}

                {isCompleted && (
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Completed
                  </Badge>
                )}
              </div>
            </div>
          );
        })}

        {quests.length === 0 && (
          <div className="text-center py-8">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              No quests available at the moment. Check back later!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};