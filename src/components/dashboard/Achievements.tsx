import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Star, Award, Target, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Achievements = () => {
  const [achievements, setAchievements] = useState([]);
  const [availableAchievements, setAvailableAchievements] = useState([]);
  const [stats, setStats] = useState({
    totalAchievements: 0,
    unlockedAchievements: 0,
    totalPoints: 0
  });

  useEffect(() => {
    loadAchievements();
    generateAvailableAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false });

      if (error) throw error;
      setAchievements(data || []);
      
      setStats({
        totalAchievements: 15, // Total available achievements
        unlockedAchievements: data?.length || 0,
        totalPoints: (data?.length || 0) * 100 // 100 points per achievement
      });
    } catch (error) {
      console.error('Error loading achievements:', error);
    }
  };

  const generateAvailableAchievements = () => {
    const allAchievements = [
      {
        id: 'first_course',
        title: 'Langkah Pertama',
        description: 'Menyelesaikan kursus pertama Anda',
        badge_icon: '🎯',
        points: 100,
        category: 'learning',
        requirement: 'Selesaikan 1 kursus',
        unlocked: false
      },
      {
        id: 'consistent_learner',
        title: 'Pembelajar Konsisten',
        description: 'Belajar selama 7 hari berturut-turut',
        badge_icon: '🔥',
        points: 150,
        category: 'consistency',
        requirement: '7 hari streak',
        unlocked: true
      },
      {
        id: 'quick_learner',
        title: 'Pembelajar Cepat',
        description: 'Menyelesaikan kursus dalam waktu kurang dari target',
        badge_icon: '⚡',
        points: 200,
        category: 'speed',
        requirement: 'Selesai lebih cepat dari target',
        unlocked: false
      },
      {
        id: 'knowledge_seeker',
        title: 'Pencari Ilmu',
        description: 'Menyelesaikan 5 kursus dalam kategori berbeda',
        badge_icon: '📚',
        points: 250,
        category: 'exploration',
        requirement: '5 kategori berbeda',
        unlocked: false
      },
      {
        id: 'marathon_learner',
        title: 'Marathoner',
        description: 'Belajar selama 10 jam dalam seminggu',
        badge_icon: '🏃',
        points: 300,
        category: 'dedication',
        requirement: '10 jam per minggu',
        unlocked: false
      },
      {
        id: 'perfect_score',
        title: 'Nilai Sempurna',
        description: 'Mendapat nilai 100% dalam 3 quiz berturut-turut',
        badge_icon: '💯',
        points: 200,
        category: 'excellence',
        requirement: '3 quiz sempurna berturut',
        unlocked: false
      },
      {
        id: 'community_helper',
        title: 'Pembantu Komunitas',
        description: 'Membantu 10 siswa di forum diskusi',
        badge_icon: '🤝',
        points: 150,
        category: 'community',
        requirement: 'Bantu 10 siswa di forum',
        unlocked: false
      },
      {
        id: 'early_bird',
        title: 'Bangun Pagi',
        description: 'Belajar sebelum jam 7 pagi selama 5 hari',
        badge_icon: '🌅',
        points: 100,
        category: 'habits',
        requirement: 'Belajar sebelum jam 7 pagi',
        unlocked: false
      },
      {
        id: 'night_owl',
        title: 'Burung Hantu',
        description: 'Belajar setelah jam 10 malam selama 5 hari',
        badge_icon: '🦉',
        points: 100,
        category: 'habits',
        requirement: 'Belajar setelah jam 10 malam',
        unlocked: false
      },
      {
        id: 'completionist',
        title: 'Perfectionist',
        description: 'Menyelesaikan semua modul dalam kursus dengan 100%',
        badge_icon: '🏆',
        points: 500,
        category: 'mastery',
        requirement: '100% completion rate',
        unlocked: false
      }
    ];

    setAvailableAchievements(allAchievements);
  };

  const getAchievementsByCategory = (category: string) => {
    return availableAchievements.filter((achievement: any) => achievement.category === category);
  };

  const getCompletionPercentage = () => {
    return Math.round((stats.unlockedAchievements / stats.totalAchievements) * 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pencapaian & Badges</h1>
        <Badge variant="outline" className="text-lg px-3 py-1">
          Level 5 🌟
        </Badge>
      </div>

      {/* Achievement Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Trophy className="w-8 h-8 text-yellow-500" />
              <div>
                <p className="text-2xl font-bold">{stats.unlockedAchievements}/{stats.totalAchievements}</p>
                <p className="text-sm text-muted-foreground">Badges Unlocked</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Star className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{stats.totalPoints}</p>
                <p className="text-sm text-muted-foreground">Total Points</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Target className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{getCompletionPercentage()}%</p>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Progress Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Overall Achievement Progress</span>
                <span>{stats.unlockedAchievements}/{stats.totalAchievements}</span>
              </div>
              <Progress value={getCompletionPercentage()} className="h-3" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl mb-2">🥉</div>
                <p className="font-medium">Bronze Level</p>
                <p className="text-sm text-muted-foreground">1-5 Achievements</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl mb-2">🥈</div>
                <p className="font-medium">Silver Level</p>
                <p className="text-sm text-muted-foreground">6-10 Achievements</p>
              </div>
              <div className="text-center p-4 bg-amber-50 rounded-lg">
                <div className="text-2xl mb-2">🥇</div>
                <p className="font-medium">Gold Level</p>
                <p className="text-sm text-muted-foreground">11+ Achievements</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievements by Category */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">Semua</TabsTrigger>
          <TabsTrigger value="learning">Belajar</TabsTrigger>
          <TabsTrigger value="consistency">Konsistensi</TabsTrigger>
          <TabsTrigger value="excellence">Prestasi</TabsTrigger>
          <TabsTrigger value="community">Komunitas</TabsTrigger>
          <TabsTrigger value="mastery">Mastery</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableAchievements.map((achievement: any) => (
              <Card 
                key={achievement.id} 
                className={`overflow-hidden ${achievement.unlocked ? 'border-primary' : 'border-muted opacity-60'}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className={`text-4xl ${achievement.unlocked ? '' : 'grayscale'}`}>
                      {achievement.unlocked ? achievement.badge_icon : '🔒'}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{achievement.title}</h3>
                        {achievement.unlocked ? (
                          <Badge variant="default" className="bg-green-500">Unlocked</Badge>
                        ) : (
                          <Badge variant="secondary">
                            <Lock className="w-3 h-3 mr-1" />
                            Locked
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        {achievement.description}
                      </p>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{achievement.requirement}</span>
                        <span className="font-medium text-primary">+{achievement.points} pts</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {['learning', 'consistency', 'excellence', 'community', 'mastery'].map(category => (
          <TabsContent key={category} value={category} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {getAchievementsByCategory(category).map((achievement: any) => (
                <Card 
                  key={achievement.id} 
                  className={`overflow-hidden ${achievement.unlocked ? 'border-primary' : 'border-muted opacity-60'}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className={`text-4xl ${achievement.unlocked ? '' : 'grayscale'}`}>
                        {achievement.unlocked ? achievement.badge_icon : '🔒'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">{achievement.title}</h3>
                          {achievement.unlocked ? (
                            <Badge variant="default" className="bg-green-500">Unlocked</Badge>
                          ) : (
                            <Badge variant="secondary">
                              <Lock className="w-3 h-3 mr-1" />
                              Locked
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          {achievement.description}
                        </p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">{achievement.requirement}</span>
                          <span className="font-medium text-primary">+{achievement.points} pts</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Recent Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5" />
            Pencapaian Terbaru
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {achievements.slice(0, 5).map((achievement: any) => (
              <div key={achievement.id} className="flex items-center space-x-4 p-4 bg-primary/5 rounded-lg">
                <div className="text-3xl">{achievement.badge_icon}</div>
                <div className="flex-1">
                  <h3 className="font-semibold">{achievement.title}</h3>
                  <p className="text-sm text-muted-foreground">{achievement.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-primary">+100 pts</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(achievement.earned_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
            {achievements.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Belum ada pencapaian yang di-unlock.</p>
                <p className="text-sm">Mulai belajar untuk mendapatkan badge pertama Anda!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};