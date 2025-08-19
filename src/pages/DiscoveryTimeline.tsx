import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  Trophy, 
  Target, 
  Calendar, 
  TrendingUp, 
  Award,
  BookOpen,
  Users,
  Lightbulb,
  Share2
} from "lucide-react";
import { toast } from "sonner";

interface TimelineItem {
  id: string;
  type: 'assessment' | 'course' | 'achievement' | 'opportunity';
  title: string;
  description: string;
  date: string;
  badge?: string;
  progress?: number;
}

const DiscoveryTimeline = () => {
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setUserProfile(profile);

      // Load timeline data (achievements, assessments, etc.)
      const { data: achievements } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false });

      const { data: assessments } = await supabase
        .from('assessment_results')
        .select('*')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });

      // Format timeline items
      const items: TimelineItem[] = [
        ...(achievements || []).map(achievement => ({
          id: achievement.id,
          type: 'achievement' as const,
          title: achievement.title,
          description: achievement.description || '',
          date: achievement.earned_at,
          badge: achievement.badge_icon
        })),
        ...(assessments || []).map(assessment => ({
          id: assessment.id,
          type: 'assessment' as const,
          title: 'Tes Minat Bakat Diselesaikan',
          description: `Tipe kepribadian: ${assessment.personality_type || 'Tidak diketahui'}`,
          date: assessment.completed_at,
        }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setTimelineItems(items);
    } catch (error: any) {
      toast.error("Gagal memuat data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getTimelineIcon = (type: string) => {
    switch (type) {
      case 'achievement': return <Trophy className="w-5 h-5 text-secondary" />;
      case 'assessment': return <Target className="w-5 h-5 text-primary" />;
      case 'course': return <BookOpen className="w-5 h-5 text-accent" />;
      case 'opportunity': return <Lightbulb className="w-5 h-5 text-primary" />;
      default: return <Calendar className="w-5 h-5 text-muted-foreground" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Memuat timeline...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header Profile Card */}
        <Card className="shadow-card mb-8">
          <CardContent className="p-6">
            <div className="flex items-center gap-6">
              <Avatar className="w-20 h-20">
                <AvatarImage src={userProfile?.avatar_url} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {userProfile?.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  {userProfile?.full_name || 'Pengguna Vidya'}
                </h1>
                <p className="text-muted-foreground mb-4">
                  Jelajahi passion map dan perjalanan belajar Anda
                </p>
                
                <div className="flex items-center gap-4">
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Pelajar Aktif
                  </Badge>
                  <Badge variant="outline" className="bg-secondary/10 text-secondary-foreground border-secondary">
                    <Award className="w-3 h-3 mr-1" />
                    {timelineItems.filter(item => item.type === 'achievement').length} Pencapaian
                  </Badge>
                  <Button variant="outline" size="sm">
                    <Share2 className="w-4 h-4 mr-2" />
                    Bagikan Profil
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="timeline" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="timeline">
              <Calendar className="w-4 h-4 mr-2" />
              Timeline
            </TabsTrigger>
            <TabsTrigger value="passions">
              <Target className="w-4 h-4 mr-2" />
              Passion Map
            </TabsTrigger>
            <TabsTrigger value="achievements">
              <Trophy className="w-4 h-4 mr-2" />
              Pencapaian
            </TabsTrigger>
            <TabsTrigger value="connections">
              <Users className="w-4 h-4 mr-2" />
              Koneksi
            </TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="mt-6">
            <div className="space-y-6">
              {timelineItems.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Timeline Kosong</h3>
                    <p className="text-muted-foreground mb-4">
                      Mulai perjalanan belajar Anda untuk melihat aktivitas di timeline
                    </p>
                    <Button className="bg-primary text-primary-foreground">
                      Ikuti Tes Minat Bakat
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="relative">
                  <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-border"></div>
                  
                  {timelineItems.map((item, index) => (
                    <div key={item.id} className="relative flex items-start gap-6 pb-6">
                      <div className="relative z-10 flex items-center justify-center w-16 h-16 bg-card border-2 border-border rounded-full shadow-soft">
                        {getTimelineIcon(item.type)}
                      </div>
                      
                      <Card className="flex-1 shadow-card hover:shadow-floating transition-shadow">
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between mb-3">
                            <h3 className="font-semibold text-foreground">{item.title}</h3>
                            <span className="text-sm text-muted-foreground">
                              {new Date(item.date).toLocaleDateString('id-ID')}
                            </span>
                          </div>
                          
                          <p className="text-muted-foreground mb-3">{item.description}</p>
                          
                          {item.badge && (
                            <Badge className="bg-secondary/10 text-secondary-foreground border-secondary">
                              {item.badge}
                            </Badge>
                          )}
                          
                          {item.progress && (
                            <div className="mt-3">
                              <div className="flex items-center justify-between text-sm mb-1">
                                <span>Progress</span>
                                <span>{item.progress}%</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-2">
                                <div 
                                  className="bg-primary rounded-full h-2 transition-all"
                                  style={{ width: `${item.progress}%` }}
                                ></div>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="passions" className="mt-6">
            <Card className="text-center py-12">
              <CardContent>
                <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Passion Map</h3>
                <p className="text-muted-foreground mb-4">
                  Visualisasi minat dan bakat Anda berdasarkan hasil tes
                </p>
                <Button className="bg-primary text-primary-foreground">
                  Lihat Passion Map
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="achievements" className="mt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {timelineItems
                .filter(item => item.type === 'achievement')
                .map((achievement) => (
                <Card key={achievement.id} className="shadow-card hover:shadow-floating transition-shadow">
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Trophy className="w-8 h-8 text-secondary" />
                    </div>
                    <h3 className="font-semibold mb-2">{achievement.title}</h3>
                    <p className="text-sm text-muted-foreground">{achievement.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="connections" className="mt-6">
            <Card className="text-center py-12">
              <CardContent>
                <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Koneksi & Mentor</h3>
                <p className="text-muted-foreground mb-4">
                  Terhubung dengan teman, mentor, dan industry experts
                </p>
                <Button className="bg-primary text-primary-foreground">
                  Temukan Koneksi
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default DiscoveryTimeline;