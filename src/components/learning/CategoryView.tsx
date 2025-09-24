import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Play, Clock, BookOpen, Users, Star } from "lucide-react";
import { toast } from "sonner";

interface LearningContent {
  id: string;
  title: string;
  description: string;
  content_type: string;
  thumbnail_url: string;
  duration_minutes: number;
  difficulty_level: string;
  total_enrollments: number;
  average_rating: number;
  is_featured: boolean;
  is_premium: boolean;
}

export const CategoryView = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const [content, setContent] = useState<LearningContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryName, setCategoryName] = useState("");

  useEffect(() => {
    if (categoryId) {
      loadCategoryContent();
    }
  }, [categoryId]);

  const loadCategoryContent = async () => {
    try {
      // Load category info
      const { data: categoryData, error: categoryError } = await supabase
        .from('learning_categories')
        .select('name')
        .eq('id', categoryId)
        .single();

      if (categoryError) throw categoryError;
      setCategoryName(categoryData.name);

      // Load content for this category
      const { data: contentData, error: contentError } = await supabase
        .from('learning_content')
        .select('*')
        .eq('category_id', categoryId)
        .eq('is_active', true)
        .order('priority_score', { ascending: false });

      if (contentError) throw contentError;
      setContent(contentData || []);
    } catch (error: any) {
      toast.error("Gagal memuat konten kategori: " + error.message);
      navigate('/learning');
    } finally {
      setLoading(false);
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
        </div>

        {/* Category Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{categoryName}</h1>
          <p className="text-lg text-muted-foreground">
            {content.length} konten pembelajaran tersedia
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {content.map((item) => (
            <Card 
              key={item.id} 
              className="cursor-pointer hover:shadow-lg transition-all duration-300"
              onClick={() => navigate(`/learning/content/${item.id}`)}
            >
              <CardContent className="p-0">
                {/* Thumbnail */}
                <div className="aspect-video bg-muted rounded-t-lg flex items-center justify-center overflow-hidden">
                  {item.thumbnail_url ? (
                    <img 
                      src={item.thumbnail_url} 
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-muted-foreground">
                      <BookOpen className="w-8 h-8 mb-2" />
                      <span className="text-sm">No Preview</span>
                    </div>
                  )}
                </div>

                {/* Content Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="outline" className="text-xs">
                      {item.content_type}
                    </Badge>
                    {item.is_featured && (
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">
                        <Star className="w-3 h-3 mr-1" />
                        Featured
                      </Badge>
                    )}
                  </div>

                  <h3 className="font-semibold mb-2 line-clamp-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {item.description}
                  </p>

                  {/* Metadata */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{item.duration_minutes} menit</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>{item.total_enrollments}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span>{item.average_rating.toFixed(1)}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Badge className={getDifficultyColor(item.difficulty_level)}>
                      {getDifficultyLabel(item.difficulty_level)}
                    </Badge>
                    <Button size="sm" variant="outline">
                      <Play className="w-3 h-3 mr-1" />
                      Mulai
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {content.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Belum Ada Konten</h3>
            <p className="text-muted-foreground">
              Konten untuk kategori ini akan segera tersedia.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};