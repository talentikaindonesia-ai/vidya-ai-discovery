import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Play, 
  Clock, 
  BookOpen, 
  Video, 
  FileText, 
  Brain, 
  Star, 
  Filter,
  Zap,
  TrendingUp,
  Users,
  ExternalLink,
  Bookmark,
  CheckCircle2
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
  average_rating: number;
  learning_categories?: {
    name: string;
    icon: string;
    color: string;
  };
  relevance_score?: number;
  user_progress?: {
    status: string;
    progress_percentage: number;
    rating: number;
  };
}

interface AdaptiveLearningFeedProps {
  userAssessment?: any;
  userInterests?: string[];
  subscriptionInfo?: any;
}

export const AdaptiveLearningFeed = ({ 
  userAssessment, 
  userInterests = [],
  subscriptionInfo 
}: AdaptiveLearningFeedProps) => {
  const [content, setContent] = useState<LearningContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<string>("relevance");
  const [contentType, setContentType] = useState<string>("all");
  const [difficultyLevel, setDifficultyLevel] = useState<string>("all");

  useEffect(() => {
    loadAdaptiveContent();
  }, [userAssessment, userInterests, filter, sortBy, contentType, difficultyLevel]);

  const loadAdaptiveContent = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      let query = supabase
        .from('learning_content')
        .select(`
          *,
          learning_categories (
            name,
            icon,
            color
          ),
          learning_progress!left (
            status,
            progress_percentage,
            rating
          )
        `)
        .eq('is_active', true);

      if (filter !== "all") {
        query = query.eq('learning_categories.name', filter);
      }

      if (contentType !== "all") {
        query = query.eq('content_type', contentType);
      }

      if (difficultyLevel !== "all") {
        query = query.eq('difficulty_level', difficultyLevel);
      }

      if (user) {
        query = query.eq('learning_progress.user_id', user.id);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;

      // Enhance with personalization scoring
      const enhancedContent = (data || []).map(item => {
        let relevanceScore = 0;

        // Base score from priority
        relevanceScore += item.priority_score || 0;

        // Score based on user assessment
        if (userAssessment) {
          const { personality_type, career_recommendations, talent_areas } = userAssessment;
          
          // Match with career recommendations
          if (career_recommendations) {
            const careerMatch = career_recommendations.some((career: string) =>
              item.title.toLowerCase().includes(career.toLowerCase()) ||
              item.description.toLowerCase().includes(career.toLowerCase()) ||
              item.tags.some(tag => tag.toLowerCase().includes(career.toLowerCase()))
            );
            if (careerMatch) relevanceScore += 5;
          }

          // Match with talent areas
          if (talent_areas) {
            const talentMatch = talent_areas.some((talent: string) =>
              item.tags.some(tag => tag.toLowerCase().includes(talent.toLowerCase()))
            );
            if (talentMatch) relevanceScore += 3;
          }

          // RIASEC personality matching
          if (personality_type) {
            const personalityKeywords: Record<string, string[]> = {
              'realistic': ['engineering', 'teknologi', 'programming', 'coding'],
              'investigative': ['research', 'science', 'data', 'analysis'],
              'artistic': ['design', 'creative', 'art', 'music', 'writing'],
              'social': ['communication', 'presentation', 'leadership', 'psychology'],
              'enterprising': ['business', 'entrepreneurship', 'marketing', 'finance'],
              'conventional': ['management', 'organization', 'administration']
            };

            const typeKeywords = personalityKeywords[personality_type.toLowerCase()] || [];
            const personalityMatch = typeKeywords.some(keyword =>
              item.title.toLowerCase().includes(keyword) ||
              item.description.toLowerCase().includes(keyword) ||
              item.tags.some(tag => tag.toLowerCase().includes(keyword))
            );
            if (personalityMatch) relevanceScore += 2;
          }
        }

        // Score based on user interests
        if (userInterests.length > 0) {
          const matchedInterests = item.tags.filter(tag => 
            userInterests.some(interest => 
              interest.toLowerCase().includes(tag.toLowerCase()) ||
              tag.toLowerCase().includes(interest.toLowerCase())
            )
          );
          relevanceScore += matchedInterests.length * 2;
        }

        // Boost featured content
        if (item.is_featured) relevanceScore += 3;

        // Boost highly rated content
        if (item.average_rating >= 4.0) relevanceScore += 2;

        return {
          ...item,
          relevance_score: relevanceScore
        };
      });

      // Sort content
      const sortedContent = enhancedContent.sort((a, b) => {
        switch (sortBy) {
          case 'relevance':
            return (b.relevance_score || 0) - (a.relevance_score || 0);
          case 'rating':
            return (b.average_rating || 0) - (a.average_rating || 0);
          case 'duration':
            return a.duration_minutes - b.duration_minutes;
          case 'newest':
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          default:
            return (b.relevance_score || 0) - (a.relevance_score || 0);
        }
      });

      setContent(sortedContent);
    } catch (error) {
      console.error('Error loading adaptive content:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredContent = content.filter(item =>
    searchTerm === "" || 
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'course':
        return <BookOpen className="w-4 h-4" />;
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'article':
        return <FileText className="w-4 h-4" />;
      case 'module':
        return <Brain className="w-4 h-4" />;
      default:
        return <BookOpen className="w-4 h-4" />;
    }
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'advanced':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const handleStartLearning = async (contentId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Silakan login terlebih dahulu");
        return;
      }

      // Check if progress exists
      const { data: existingProgress } = await supabase
        .from('learning_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('content_id', contentId)
        .maybeSingle();

      if (!existingProgress) {
        // Create new progress
        const { error } = await supabase
          .from('learning_progress')
          .insert({
            user_id: user.id,
            content_id: contentId,
            status: 'in_progress',
            progress_percentage: 0
          });

        if (error) throw error;
        toast.success("Mulai belajar!");
      } else {
        toast.success("Melanjutkan pembelajaran...");
      }

      // Open content URL
      const content = filteredContent.find(c => c.id === contentId);
      if (content?.content_url) {
        window.open(content.content_url, '_blank');
      }

      loadAdaptiveContent();
    } catch (error: any) {
      toast.error("Gagal memulai pembelajaran: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-20 bg-muted rounded mb-4"></div>
              <div className="h-8 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Input
              placeholder="Cari konten pembelajaran..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Select value={contentType} onValueChange={setContentType}>
              <SelectTrigger>
                <SelectValue placeholder="Jenis Konten" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Jenis</SelectItem>
                <SelectItem value="course">Kursus</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="article">Artikel</SelectItem>
                <SelectItem value="module">Modul</SelectItem>
              </SelectContent>
            </Select>
            <Select value={difficultyLevel} onValueChange={setDifficultyLevel}>
              <SelectTrigger>
                <SelectValue placeholder="Tingkat Kesulitan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Level</SelectItem>
                <SelectItem value="beginner">Pemula</SelectItem>
                <SelectItem value="intermediate">Menengah</SelectItem>
                <SelectItem value="advanced">Lanjutan</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Urutkan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevansi</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
                <SelectItem value="duration">Durasi</SelectItem>
                <SelectItem value="newest">Terbaru</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Personalized Sections */}
      <Tabs defaultValue="for-you" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="for-you" className="gap-2">
            <Zap className="w-4 h-4" />
            Untuk Anda
          </TabsTrigger>
          <TabsTrigger value="trending" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            Trending
          </TabsTrigger>
          <TabsTrigger value="all" className="gap-2">
            <Users className="w-4 h-4" />
            Jelajahi Semua
          </TabsTrigger>
        </TabsList>

        <TabsContent value="for-you" className="mt-6">
          <ContentGrid 
            content={filteredContent.filter(item => (item.relevance_score || 0) > 2).slice(0, 12)} 
            onStartLearning={handleStartLearning}
            subscriptionInfo={subscriptionInfo}
            showPersonalized={true}
          />
        </TabsContent>

        <TabsContent value="trending" className="mt-6">
          <ContentGrid 
            content={filteredContent.filter(item => item.is_featured || item.average_rating >= 4.0).slice(0, 12)} 
            onStartLearning={handleStartLearning}
            subscriptionInfo={subscriptionInfo}
          />
        </TabsContent>

        <TabsContent value="all" className="mt-6">
          <ContentGrid 
            content={filteredContent} 
            onStartLearning={handleStartLearning}
            subscriptionInfo={subscriptionInfo}
          />
        </TabsContent>
      </Tabs>
    </div>
  );

  function ContentGrid({ 
    content, 
    onStartLearning, 
    subscriptionInfo,
    showPersonalized = false 
  }: { 
    content: LearningContent[]; 
    onStartLearning: (id: string) => void;
    subscriptionInfo?: any;
    showPersonalized?: boolean;
  }) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {content.map((item, index) => (
          <Card key={item.id} className={`hover:shadow-card transition-all duration-300 ${showPersonalized && (item.relevance_score || 0) > 5 ? 'ring-2 ring-primary/20' : ''}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="secondary" className="gap-1">
                    {getContentIcon(item.content_type)}
                    {item.content_type}
                  </Badge>
                  {showPersonalized && (item.relevance_score || 0) > 5 && (
                    <Badge variant="default" className="gap-1">
                      <Star className="w-3 h-3" />
                      Rekomendasi
                    </Badge>
                  )}
                  {item.is_featured && (
                    <Badge variant="outline" className="gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Featured
                    </Badge>
                  )}
                </div>
                <Badge className={getDifficultyColor(item.difficulty_level)}>
                  {item.difficulty_level === 'beginner' ? 'Pemula' : 
                   item.difficulty_level === 'intermediate' ? 'Menengah' : 'Lanjutan'}
                </Badge>
              </div>
              <CardTitle className="text-lg line-clamp-2 hover:text-primary transition-colors">
                {item.title}
              </CardTitle>
              <CardDescription className="line-clamp-2">
                {item.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    {item.duration_minutes}m
                  </div>
                  {item.average_rating > 0 && (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span>{item.average_rating.toFixed(1)}</span>
                    </div>
                  )}
                </div>

                {item.user_progress && item.user_progress.progress_percentage > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Progress</span>
                      <span>{item.user_progress.progress_percentage}%</span>
                    </div>
                    <Progress value={item.user_progress.progress_percentage} />
                  </div>
                )}

                <div className="flex flex-wrap gap-1">
                  {item.tags.slice(0, 3).map((tag, tagIndex) => (
                    <Badge key={tagIndex} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <Button 
                  className="w-full gap-2"
                  onClick={() => onStartLearning(item.id)}
                  variant={showPersonalized && (item.relevance_score || 0) > 5 ? "default" : "outline"}
                >
                  {item.user_progress?.status === 'completed' ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Selesai
                    </>
                  ) : item.user_progress?.progress_percentage > 0 ? (
                    <>
                      <Play className="w-4 h-4" />
                      Lanjutkan
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Mulai Belajar
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
};