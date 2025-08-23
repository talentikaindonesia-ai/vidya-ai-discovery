import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Play, 
  CheckCircle, 
  Clock, 
  BookOpen,
  Video,
  FileText,
  Brain,
  Star,
  Edit,
  Award
} from "lucide-react";
import { useGameification } from "@/hooks/useGameification";

interface LearningContent {
  id: string;
  title: string;
  description: string;
  content_type: string;
  content_url: string;
  thumbnail_url: string;
  duration_minutes: number;
  difficulty_level: string;
  tags: string[];
  is_premium: boolean;
  learning_categories?: {
    name: string;
    color: string;
  };
}

interface UserProgress {
  progress_percentage: number;
  time_spent_minutes: number;
  status: string;
  rating?: number;
}

export const ContentViewer = () => {
  const { contentId } = useParams();
  const navigate = useNavigate();
  const { awardXP } = useGameification();
  
  const [content, setContent] = useState<LearningContent | null>(null);
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStarted, setIsStarted] = useState(false);

  useEffect(() => {
    if (contentId) {
      loadContentAndProgress();
    }
  }, [contentId]);

  const loadContentAndProgress = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      // Load content
      const { data: contentData, error: contentError } = await supabase
        .from('learning_content')
        .select(`
          *,
          learning_categories (name, color)
        `)
        .eq('id', contentId)
        .eq('is_active', true)
        .single();

      if (contentError) throw contentError;

      // Load user progress
      const { data: progressData, error: progressError } = await supabase
        .from('learning_progress')
        .select('*')
        .eq('content_id', contentId)
        .eq('user_id', session.user.id)
        .single();

      if (progressError && progressError.code !== 'PGRST116') {
        throw progressError;
      }

      setContent(contentData);
      setProgress(progressData || null);
      setIsStarted(!!progressData);
    } catch (error: any) {
      toast.error("Gagal memuat konten: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const startLearning = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from('learning_progress')
        .upsert({
          user_id: session.user.id,
          content_id: contentId!,
          progress_percentage: 0,
          status: 'in_progress',
          time_spent_minutes: 0
        });

      if (error) throw error;

      setIsStarted(true);
      setProgress({
        progress_percentage: 0,
        time_spent_minutes: 0,
        status: 'in_progress'
      });

      toast.success("Pembelajaran dimulai!");
    } catch (error: any) {
      toast.error("Gagal memulai pembelajaran: " + error.message);
    }
  };

  const markAsCompleted = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { error } = await supabase
        .from('learning_progress')
        .update({
          progress_percentage: 100,
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('content_id', contentId!)
        .eq('user_id', session.user.id);

      if (error) throw error;

      // Award XP for completion
      const xpAmount = content?.difficulty_level === 'advanced' ? 50 : 
                     content?.difficulty_level === 'intermediate' ? 30 : 20;
      
      await awardXP(xpAmount, `Menyelesaikan: ${content?.title}`);

      setProgress(prev => prev ? {
        ...prev,
        progress_percentage: 100,
        status: 'completed'
      } : null);

      toast.success("Selamat! Pembelajaran selesai dan XP diberikan!");
    } catch (error: any) {
      toast.error("Gagal menyelesaikan pembelajaran: " + error.message);
    }
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'course': return <BookOpen className="w-5 h-5" />;
      case 'video': return <Video className="w-5 h-5" />;
      case 'article': return <FileText className="w-5 h-5" />;
      case 'module': return <Brain className="w-5 h-5" />;
      case 'pdf': return <FileText className="w-5 h-5" />;
      case 'quiz': return <Brain className="w-5 h-5" />;
      case 'assignment': return <Edit className="w-5 h-5" />;
      case 'audio': return <Video className="w-5 h-5" />;
      case 'animation': return <Star className="w-5 h-5" />;
      default: return <BookOpen className="w-5 h-5" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Konten Tidak Ditemukan</h2>
          <Button onClick={() => navigate("/learning-hub")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Learning Hub
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => navigate("/learning-hub")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Learning Hub
          </Button>
          
          {progress && (
            <div className="flex items-center gap-2">
              <Progress value={progress.progress_percentage} className="w-32" />
              <span className="text-sm font-medium">{progress.progress_percentage}%</span>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Content Header */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {getContentIcon(content.content_type)}
                    <Badge variant="secondary">
                      {content.content_type}
                    </Badge>
                    <Badge 
                      style={{ backgroundColor: content.learning_categories?.color }}
                      className="text-white"
                    >
                      {content.learning_categories?.name}
                    </Badge>
                  </div>
                  
                  {content.is_premium && (
                    <Badge variant="outline" className="border-primary text-primary">
                      <Star className="w-3 h-3 mr-1" />
                      Premium
                    </Badge>
                  )}
                </div>
                
                <CardTitle className="text-2xl">{content.title}</CardTitle>
                <CardDescription className="text-base">
                  {content.description}
                </CardDescription>
                
                <div className="flex items-center gap-4 pt-4">
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    {content.duration_minutes} menit
                  </div>
                  <Badge variant="outline">
                    {content.difficulty_level === 'beginner' ? 'Pemula' : 
                     content.difficulty_level === 'intermediate' ? 'Menengah' : 'Lanjutan'}
                  </Badge>
                </div>
              </CardHeader>
            </Card>

            {/* Content Player */}
            <Card>
              <CardContent className="p-6">
                {!isStarted ? (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                      <Play className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Siap untuk Mulai Belajar?</h3>
                    <p className="text-muted-foreground mb-6">
                      Klik tombol di bawah untuk memulai pembelajaran dan melacak progress Anda
                    </p>
                    <Button onClick={startLearning} size="lg" className="gap-2">
                      <Play className="w-5 h-5" />
                      Mulai Pembelajaran
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {content.content_url && (
                      <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                        {content.content_type === 'video' ? (
                          <iframe 
                            src={content.content_url}
                            className="w-full h-full rounded-lg"
                            allowFullScreen
                          />
                        ) : (
                          <div className="text-center">
                            <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                              {getContentIcon(content.content_type)}
                            </div>
                            <Button 
                              onClick={() => window.open(content.content_url, '_blank')}
                              variant="outline"
                            >
                              Buka Konten
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {progress?.status !== 'completed' && (
                      <div className="text-center pt-4">
                        <Button onClick={markAsCompleted} className="gap-2">
                          <CheckCircle className="w-5 h-5" />
                          Tandai Selesai
                        </Button>
                      </div>
                    )}
                    
                    {progress?.status === 'completed' && (
                      <div className="text-center py-8 bg-success/10 rounded-lg">
                        <Award className="w-16 h-16 mx-auto text-success mb-4" />
                        <h3 className="text-xl font-semibold text-success mb-2">
                          Pembelajaran Selesai!
                        </h3>
                        <p className="text-success/80">
                          Selamat! Anda telah menyelesaikan materi ini.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Tags */}
            {content.tags && content.tags.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {content.tags.map((tag, index) => (
                      <Badge key={index} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Learning Stats */}
            {progress && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Statistik Pembelajaran</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Progress</span>
                      <span>{progress.progress_percentage}%</span>
                    </div>
                    <Progress value={progress.progress_percentage} />
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Waktu Belajar</span>
                    <span className="text-sm font-medium">{progress.time_spent_minutes} menit</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge variant={progress.status === 'completed' ? 'default' : 'secondary'}>
                      {progress.status === 'completed' ? 'Selesai' : 
                       progress.status === 'in_progress' ? 'Sedang Belajar' : 'Belum Dimulai'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};