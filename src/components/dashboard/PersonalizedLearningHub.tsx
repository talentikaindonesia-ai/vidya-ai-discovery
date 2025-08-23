import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, 
  Play, 
  Clock, 
  Target, 
  Trophy, 
  Users,
  Star,
  ChevronRight,
  Award,
  Zap,
  Brain,
  TrendingUp
} from "lucide-react";
import { toast } from "sonner";
import { useGameification } from "@/hooks/useGameification";

interface LearningPath {
  id: string;
  name: string;
  description: string;
  difficulty_level: string;
  target_persona: string;
  estimated_duration_hours: number;
  progress?: number;
  completed_contents?: number;
  total_contents?: number;
}

interface PersonalizedContent {
  id: string;
  title: string;
  description: string;
  content_type: string;
  difficulty_level: string;
  duration_minutes: number;
  tags: string[];
  learning_categories?: {
    name: string;
    color: string;
  };
}

interface PersonalizedLearningHubProps {
  user: any;
  userAssessment: any;
  userInterests: string[];
  subscriptionInfo: any;
}

export const PersonalizedLearningHub = ({ 
  user, 
  userAssessment, 
  userInterests, 
  subscriptionInfo 
}: PersonalizedLearningHubProps) => {
  const [recommendedPaths, setRecommendedPaths] = useState<LearningPath[]>([]);
  const [personalizedContent, setPersonalizedContent] = useState<PersonalizedContent[]>([]);
  const [currentPath, setCurrentPath] = useState<LearningPath | null>(null);
  const [pathProgress, setPathProgress] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const { userXP, awardXP, updateStreak } = useGameification();

  useEffect(() => {
    if (user) {
      loadPersonalizedData();
    }
  }, [user, userAssessment, userInterests]);

  const loadPersonalizedData = async () => {
    try {
      await Promise.all([
        loadRecommendedPaths(),
        loadPersonalizedContent(),
        loadUserPathProgress()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendedPaths = async () => {
    try {
      // Get learning paths based on assessment results and interests
      const targetPersonas = getTargetPersonas();
      
      const { data, error } = await supabase
        .from('learning_paths')
        .select('*')
        .in('target_persona', targetPersonas)
        .eq('is_active', true)
        .limit(6);

      if (error) throw error;

      // Calculate progress for each path
      const pathsWithProgress = await Promise.all(
        (data || []).map(async (path) => {
          const progress = await calculatePathProgress(path.id);
          return {
            ...path,
            ...progress
          };
        })
      );

      setRecommendedPaths(pathsWithProgress);
    } catch (error: any) {
      console.error('Error loading paths:', error);
    }
  };

  const loadPersonalizedContent = async () => {
    try {
      // Get content based on interests and assessment
      const { data, error } = await supabase
        .from('learning_content')
        .select(`
          *,
          learning_categories (
            name,
            color
          )
        `)
        .eq('is_active', true)
        .overlaps('tags', userInterests)
        .limit(8);

      if (error) throw error;

      setPersonalizedContent(data || []);
    } catch (error: any) {
      console.error('Error loading content:', error);
    }
  };

  const loadUserPathProgress = async () => {
    try {
      const { data, error } = await supabase
        .from('learning_progress')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setPathProgress(data || []);
    } catch (error: any) {
      console.error('Error loading progress:', error);
    }
  };

  const calculatePathProgress = async (pathId: string) => {
    try {
      // Get all contents in the path
      const { data: pathContents, error: contentsError } = await supabase
        .from('learning_path_contents')
        .select('content_id')
        .eq('path_id', pathId);

      if (contentsError) throw contentsError;

      const totalContents = pathContents?.length || 0;
      
      if (totalContents === 0) {
        return { progress: 0, completed_contents: 0, total_contents: 0 };
      }

      // Get user progress for these contents
      const contentIds = pathContents?.map(pc => pc.content_id) || [];
      
      const { data: userProgress, error: progressError } = await supabase
        .from('learning_progress')
        .select('progress_percentage')
        .eq('user_id', user.id)
        .in('content_id', contentIds);

      if (progressError) throw progressError;

      const completedContents = userProgress?.filter(up => up.progress_percentage >= 100).length || 0;
      const overallProgress = totalContents > 0 ? Math.round((completedContents / totalContents) * 100) : 0;

      return {
        progress: overallProgress,
        completed_contents: completedContents,
        total_contents: totalContents
      };
    } catch (error) {
      console.error('Error calculating progress:', error);
      return { progress: 0, completed_contents: 0, total_contents: 0 };
    }
  };

  const getTargetPersonas = () => {
    const personas = [];
    
    // Based on assessment results
    if (userAssessment?.personality_type) {
      const personalityType = userAssessment.personality_type.toLowerCase();
      
      if (personalityType.includes('r') || personalityType.includes('i')) {
        personas.push('SMP - STEM Explorer', 'SMA - Technology & Engineering', 'SMA - Science & Research');
      }
      if (personalityType.includes('a')) {
        personas.push('SMP - Creative Arts', 'SMA - Arts & Design');
      }
      if (personalityType.includes('s') || personalityType.includes('e')) {
        personas.push('SMP - Social Sciences', 'SMA - Business & Economics', 'SMA - Humanities');
      }
    }
    
    // Based on interests
    userInterests.forEach(interest => {
      if (interest.toLowerCase().includes('teknologi') || interest.toLowerCase().includes('sains')) {
        personas.push('SMP - STEM Explorer', 'SMA - Technology & Engineering');
      }
      if (interest.toLowerCase().includes('seni') || interest.toLowerCase().includes('kreatif')) {
        personas.push('SMP - Creative Arts', 'SMA - Arts & Design');
      }
    });

    // Add general persona
    personas.push('Umum - Career Starter');

    return [...new Set(personas)];
  };

  const startLearningPath = async (path: LearningPath) => {
    try {
      // Get first content in the path
      const { data: firstContent, error } = await supabase
        .from('learning_path_contents')
        .select(`
          content_id,
          learning_content (
            id, title, content_url
          )
        `)
        .eq('path_id', path.id)
        .order('order_index')
        .limit(1);

      if (error) throw error;

      if (firstContent && firstContent.length > 0) {
        const content = firstContent[0];
        
        // Create or update learning progress
        const { error: progressError } = await supabase
          .from('learning_progress')
          .upsert({
            user_id: user.id,
            content_id: content.content_id,
            progress_percentage: 0,
            status: 'in_progress',
            time_spent_minutes: 0
          });

        if (progressError) throw progressError;

        // Award XP for starting new path
        await awardXP(50, `Memulai learning path: ${path.name}`);
        await updateStreak('learning');

        setCurrentPath(path);
        toast.success(`Learning path "${path.name}" dimulai!`);
        
        // Redirect to content if it has URL
        const learningContent = content.learning_content as any;
        if (learningContent?.content_url) {
          window.open(learningContent.content_url, '_blank');
        }
      }
    } catch (error: any) {
      toast.error("Gagal memulai learning path: " + error.message);
    }
  };

  const startContent = async (content: PersonalizedContent) => {
    try {
      const { error } = await supabase
        .from('learning_progress')
        .upsert({
          user_id: user.id,
          content_id: content.id,
          progress_percentage: 0,
          status: 'in_progress',
          time_spent_minutes: 0
        });

      if (error) throw error;

      await awardXP(25, `Memulai konten: ${content.title}`);
      await updateStreak('learning');
      
      toast.success(`Konten "${content.title}" dimulai!`);
    } catch (error: any) {
      toast.error("Gagal memulai konten: " + error.message);
    }
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-secondary text-secondary-foreground';
      case 'intermediate': return 'bg-accent text-accent-foreground';
      case 'advanced': return 'bg-primary text-primary-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'course': return <BookOpen className="w-4 h-4" />;
      case 'video': return <Play className="w-4 h-4" />;
      case 'article': return <Brain className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Personalized Header */}
      <Card className="bg-gradient-primary text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-6 h-6" />
            Learning Hub Personal untuk {user?.email?.split('@')[0] || 'Anda'}
          </CardTitle>
          <CardDescription className="text-white/80">
            Berdasarkan hasil assessment: {userAssessment?.personality_type || 'Belum ada assessment'} | 
            Minat: {userInterests.slice(0, 3).join(', ') || 'Belum diatur'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">{userXP?.current_level || 1}</div>
              <div className="text-sm text-white/80">Level</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{userXP?.current_xp || 0}</div>
              <div className="text-sm text-white/80">XP</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{recommendedPaths.filter(p => p.progress > 0).length}</div>
              <div className="text-sm text-white/80">Paths Aktif</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{recommendedPaths.filter(p => p.progress >= 100).length}</div>
              <div className="text-sm text-white/80">Completed</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="paths" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="paths" className="gap-2">
            <Target className="w-4 h-4" />
            Learning Paths
          </TabsTrigger>
          <TabsTrigger value="content" className="gap-2">
            <Zap className="w-4 h-4" />
            Konten Rekomendasi
          </TabsTrigger>
        </TabsList>

        <TabsContent value="paths" className="mt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">Learning Paths yang Direkomendasikan</h3>
              <Badge variant="secondary" className="gap-1">
                <TrendingUp className="w-3 h-3" />
                {recommendedPaths.length} paths tersedia
              </Badge>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendedPaths.map((path) => (
                <Card key={path.id} className="hover:shadow-lg transition-all group">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <Badge className={getDifficultyColor(path.difficulty_level)}>
                        {path.difficulty_level}
                      </Badge>
                      {path.progress > 0 && (
                        <Badge variant="outline" className="gap-1">
                          <Trophy className="w-3 h-3" />
                          {path.progress}%
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      {path.name}
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {path.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {path.target_persona}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {path.estimated_duration_hours}h
                        </div>
                      </div>

                      {path.progress > 0 && (
                        <div>
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span>Progress</span>
                            <span>{path.completed_contents}/{path.total_contents} selesai</span>
                          </div>
                          <Progress value={path.progress} className="h-2" />
                        </div>
                      )}

                      <Button 
                        className="w-full gap-2" 
                        onClick={() => startLearningPath(path)}
                      >
                        <Play className="w-4 h-4" />
                        {path.progress > 0 ? 'Lanjutkan' : 'Mulai'} Path
                        <ChevronRight className="w-4 h-4 ml-auto" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="content" className="mt-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold">Konten yang Direkomendasikan untuk Anda</h3>
              <Badge variant="secondary" className="gap-1">
                <Star className="w-3 h-3" />
                Dipersonalisasi
              </Badge>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {personalizedContent.map((content) => (
                <Card key={content.id} className="hover:shadow-lg transition-all group">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="secondary" className="gap-1">
                        {getContentIcon(content.content_type)}
                        {content.content_type}
                      </Badge>
                      <Badge 
                        style={{ backgroundColor: content.learning_categories?.color }}
                        className="text-white text-xs"
                      >
                        {content.learning_categories?.name}
                      </Badge>
                    </div>
                    <CardTitle className="text-base line-clamp-2 group-hover:text-primary transition-colors">
                      {content.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-2 text-sm">
                      {content.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <Badge className={getDifficultyColor(content.difficulty_level)} variant="outline">
                          {content.difficulty_level}
                        </Badge>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {content.duration_minutes}m
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        {content.tags.slice(0, 2).map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      <Button 
                        size="sm" 
                        className="w-full gap-2" 
                        onClick={() => startContent(content)}
                      >
                        <Play className="w-3 h-3" />
                        Mulai
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};