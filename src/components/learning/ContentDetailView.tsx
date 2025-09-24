import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Play, 
  Clock, 
  BookOpen, 
  Star, 
  Users, 
  Download,
  FileText,
  Video,
  Brain,
  Edit,
  Trash2,
  Eye,
  Share2
} from "lucide-react";
import { toast } from "sonner";

interface LearningContent {
  id: string;
  title: string;
  description: string;
  content_type: string;
  content_url: string;
  thumbnail_url: string;
  duration_minutes: number;
  difficulty_level: string;
  target_personas: string[];
  category_id: string;
  tags: string[];
  external_source: string;
  is_featured: boolean;
  is_premium: boolean;
  priority_score: number;
  total_enrollments: number;
  average_rating: number;
  is_active: boolean;
  created_at: string;
  learning_categories?: {
    name: string;
    icon: string;
    color: string;
  };
}

interface ContentProgress {
  progress_percentage: number;
  status: string;
  last_accessed_at: string;
  time_spent_minutes: number;
}

export const ContentDetailView = () => {
  const { contentId } = useParams<{ contentId: string }>();
  const navigate = useNavigate();
  const [content, setContent] = useState<LearningContent | null>(null);
  const [progress, setProgress] = useState<ContentProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (contentId) {
      loadContentDetails();
      checkUserRole();
    }
  }, [contentId]);

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();
        
        setIsAdmin(roleData?.role === 'admin');
      }
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  };

  const loadContentDetails = async () => {
    try {
      const { data: contentData, error: contentError } = await supabase
        .from('learning_content')
        .select(`
          *,
          learning_categories (
            name,
            icon,
            color
          )
        `)
        .eq('id', contentId)
        .single();

      if (contentError) throw contentError;

      setContent(contentData);

      // Load user progress if authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: progressData } = await supabase
          .from('learning_progress')
          .select('*')
          .eq('user_id', user.id)
          .eq('content_id', contentId)
          .single();

        setProgress(progressData);
      }
    } catch (error: any) {
      toast.error("Gagal memuat detail konten: " + error.message);
      navigate('/learning');
    } finally {
      setLoading(false);
    }
  };

  const startContent = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Silakan login terlebih dahulu");
        return;
      }

      // Create or update progress
      const { error } = await supabase
        .from('learning_progress')
        .upsert({
          user_id: user.id,
          content_id: contentId,
          status: 'in_progress',
          progress_percentage: progress?.progress_percentage || 0,
          last_accessed_at: new Date().toISOString()
        });

      if (error) throw error;

      // Open content URL in new tab
      if (content?.content_url) {
        window.open(content.content_url, '_blank');
      }

      toast.success("Pembelajaran dimulai!");
      loadContentDetails(); // Refresh progress
    } catch (error: any) {
      toast.error("Gagal memulai pembelajaran: " + error.message);
    }
  };

  const markAsCompleted = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('learning_progress')
        .upsert({
          user_id: user.id,
          content_id: contentId,
          status: 'completed',
          progress_percentage: 100,
          completed_at: new Date().toISOString(),
          last_accessed_at: new Date().toISOString()
        });

      if (error) throw error;

      toast.success("Pembelajaran telah diselesaikan!");
      loadContentDetails();
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
      default: return <BookOpen className="w-5 h-5" />;
    }
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyLabel = (level: string) => {
    switch (level) {
      case 'beginner': return 'Pemula';
      case 'intermediate': return 'Menengah';
      case 'advanced': return 'Lanjutan';
      default: return 'Tidak Diketahui';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Konten tidak ditemukan</h2>
          <Button onClick={() => navigate('/learning')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Learning Hub
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/learning')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Learning Hub
          </Button>
          
          {isAdmin && (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate(`/admin/content/edit/${contentId}`)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Konten
              </Button>
              <Button variant="outline" size="sm">
                <Eye className="w-4 h-4 mr-2" />
                Analytics
              </Button>
            </div>
          )}
        </div>

        {/* Content Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Thumbnail */}
              <div className="lg:w-1/3">
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                  {content.thumbnail_url ? (
                    <img 
                      src={content.thumbnail_url} 
                      alt={content.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-muted-foreground">
                      {getContentIcon(content.content_type)}
                      <span className="text-sm mt-2">No Preview</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Content Info */}
              <div className="lg:w-2/3">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-2xl font-bold mb-2">{content.title}</h1>
                    <p className="text-muted-foreground mb-4">{content.description}</p>
                  </div>
                  {content.is_featured && (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      <Star className="w-3 h-3 mr-1" />
                      Featured
                    </Badge>
                  )}
                </div>

                {/* Metadata */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="outline" className="flex items-center gap-1">
                    {getContentIcon(content.content_type)}
                    {content.content_type}
                  </Badge>
                  <Badge variant="outline" className={getDifficultyColor(content.difficulty_level)}>
                    {getDifficultyLabel(content.difficulty_level)}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {content.duration_minutes} menit
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {content.total_enrollments} peserta
                  </Badge>
                  {content.learning_categories && (
                    <Badge variant="outline" style={{ backgroundColor: content.learning_categories.color + '20' }}>
                      {content.learning_categories.name}
                    </Badge>
                  )}
                </div>

                {/* Progress */}
                {progress && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Progress</span>
                      <span className="text-sm text-muted-foreground">
                        {progress.progress_percentage}%
                      </span>
                    </div>
                    <Progress value={progress.progress_percentage} className="h-2" />
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button onClick={startContent} size="lg" className="flex items-center gap-2">
                    <Play className="w-4 h-4" />
                    {progress?.status === 'completed' ? 'Pelajari Lagi' : 
                     progress?.status === 'in_progress' ? 'Lanjutkan' : 'Mulai Belajar'}
                  </Button>
                  
                  {progress?.status === 'in_progress' && (
                    <Button 
                      variant="outline" 
                      onClick={markAsCompleted}
                      className="flex items-center gap-2"
                    >
                      <Star className="w-4 h-4" />
                      Tandai Selesai
                    </Button>
                  )}

                  <Button variant="outline" size="lg">
                    <Share2 className="w-4 h-4 mr-2" />
                    Bagikan
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="content">Konten</TabsTrigger>
            <TabsTrigger value="resources">Sumber Daya</TabsTrigger>
            <TabsTrigger value="discussion">Diskusi</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Tentang Pembelajaran Ini</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">{content.description}</p>
                    
                    {content.tags.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Tags:</h4>
                        <div className="flex flex-wrap gap-2">
                          {content.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary">#{tag}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Statistik</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total Peserta</span>
                      <span className="font-semibold">{content.total_enrollments}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Rating</span>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">{content.average_rating.toFixed(1)}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Durasi</span>
                      <span className="font-semibold">{content.duration_minutes} menit</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Level</span>
                      <Badge className={getDifficultyColor(content.difficulty_level)}>
                        {getDifficultyLabel(content.difficulty_level)}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="content" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Materi Pembelajaran</CardTitle>
                <CardDescription>
                  Akses semua konten dan materi pembelajaran
                </CardDescription>
              </CardHeader>
              <CardContent>
                {content.content_url ? (
                  <div className="aspect-video w-full">
                    <iframe
                      src={content.content_url}
                      className="w-full h-full rounded-lg border"
                      allowFullScreen
                      title={content.title}
                    />
                  </div>
                ) : (
                  <div className="aspect-video w-full bg-muted rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">Konten akan segera tersedia</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resources" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Sumber Daya Tambahan</CardTitle>
                <CardDescription>
                  Download materi, file, dan resource lainnya
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5" />
                      <div>
                        <p className="font-medium">Materi PDF</p>
                        <p className="text-sm text-muted-foreground">Ringkasan pembelajaran</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Video className="w-5 h-5" />
                      <div>
                        <p className="font-medium">Video Tutorial</p>
                        <p className="text-sm text-muted-foreground">Panduan lengkap</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Play className="w-4 h-4 mr-2" />
                      Tonton
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="discussion" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Forum Diskusi</CardTitle>
                <CardDescription>
                  Diskusi dengan peserta lain dan pengajar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Fitur diskusi akan segera tersedia</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};