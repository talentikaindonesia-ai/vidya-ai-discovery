import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Calendar, MapPin, Star, TrendingUp, Filter } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface PersonalizedContent {
  id: string;
  title: string;
  description: string;
  url: string;
  source_website: string;
  category: string;
  tags: string[];
  content_type: string;
  location: string;
  deadline: string;
  created_at: string;
  relevance_score?: number;
  is_recommended?: boolean;
}

interface PersonalizedFeedProps {
  userInterests?: string[];
  assessmentData?: any;
  limit?: number;
}

export const PersonalizedFeed = ({ userInterests = [], assessmentData, limit = 20 }: PersonalizedFeedProps) => {
  const [content, setContent] = useState<PersonalizedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<string>("relevance");

  useEffect(() => {
    loadPersonalizedContent();
  }, [userInterests, assessmentData, filter, sortBy]);

  const loadPersonalizedContent = async () => {
    try {
      let query = supabase
        .from('scraped_content')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (filter !== "all") {
        query = query.eq('category', filter);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Enhance with personalization scoring
      const enhancedContent = (data || []).map(item => {
        let relevanceScore = 0;
        let isRecommended = false;

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

        // Score based on assessment data
        if (assessmentData) {
          const { personality_type, career_recommendations, talent_areas } = assessmentData;
          
          // Match with career recommendations
          if (career_recommendations) {
            const careerMatch = career_recommendations.some((career: string) =>
              item.title.toLowerCase().includes(career.toLowerCase()) ||
              item.description.toLowerCase().includes(career.toLowerCase()) ||
              item.tags.some(tag => tag.toLowerCase().includes(career.toLowerCase()))
            );
            if (careerMatch) {
              relevanceScore += 3;
              isRecommended = true;
            }
          }

          // Match with talent areas
          if (talent_areas) {
            const talentMatch = talent_areas.some((talent: string) =>
              item.tags.some(tag => tag.toLowerCase().includes(talent.toLowerCase()))
            );
            if (talentMatch) relevanceScore += 2;
          }

          // RIASEC personality matching
          if (personality_type) {
            const personalityKeywords: Record<string, string[]> = {
              'realistic': ['teknik', 'engineering', 'teknologi', 'stem'],
              'investigative': ['research', 'penelitian', 'sains', 'science'],
              'artistic': ['creative', 'kreatif', 'design', 'art', 'seni'],
              'social': ['social', 'education', 'pendidikan', 'community'],
              'enterprising': ['business', 'bisnis', 'entrepreneurship', 'leadership'],
              'conventional': ['administration', 'management', 'finance', 'keuangan']
            };

            const typeKeywords = personalityKeywords[personality_type.toLowerCase()] || [];
            const personalityMatch = typeKeywords.some(keyword =>
              item.title.toLowerCase().includes(keyword) ||
              item.description.toLowerCase().includes(keyword) ||
              item.tags.some(tag => tag.toLowerCase().includes(keyword))
            );
            if (personalityMatch) relevanceScore += 1;
          }
        }

        // Boost newer content
        const daysSinceCreated = Math.floor((Date.now() - new Date(item.created_at).getTime()) / (1000 * 60 * 60 * 24));
        if (daysSinceCreated <= 7) relevanceScore += 1;

        // Boost content with deadlines
        if (item.deadline) {
          const daysUntilDeadline = Math.floor((new Date(item.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          if (daysUntilDeadline > 0 && daysUntilDeadline <= 30) {
            relevanceScore += 2;
          }
        }

        return {
          ...item,
          relevance_score: relevanceScore,
          is_recommended: isRecommended
        };
      });

      // Sort by relevance or other criteria
      const sortedContent = enhancedContent.sort((a, b) => {
        switch (sortBy) {
          case 'relevance':
            return (b.relevance_score || 0) - (a.relevance_score || 0);
          case 'deadline':
            if (!a.deadline && !b.deadline) return 0;
            if (!a.deadline) return 1;
            if (!b.deadline) return -1;
            return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
          case 'newest':
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          default:
            return 0;
        }
      });

      setContent(sortedContent);
    } catch (error) {
      console.error('Error loading personalized content:', error);
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

  const getDaysUntilDeadline = (deadline: string) => {
    const days = Math.floor((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const getDeadlineColor = (deadline: string) => {
    const days = getDaysUntilDeadline(deadline);
    if (days < 0) return "text-destructive";
    if (days <= 7) return "text-orange-500";
    if (days <= 30) return "text-yellow-500";
    return "text-muted-foreground";
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
              <div className="space-y-2">
                <div className="h-3 bg-muted rounded w-full"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Cari peluang yang relevan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Semua Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                <SelectItem value="scholarship">Beasiswa</SelectItem>
                <SelectItem value="job">Pekerjaan & Magang</SelectItem>
                <SelectItem value="competition">Kompetisi</SelectItem>
                <SelectItem value="conference">Konferensi & Event</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Urutkan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="relevance">Relevansi</SelectItem>
                <SelectItem value="deadline">Deadline</SelectItem>
                <SelectItem value="newest">Terbaru</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Personalized Content Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredContent.map((item) => (
          <Card key={item.id} className={`hover:shadow-card transition-all duration-300 bg-card border-primary/10 ${item.is_recommended ? 'ring-2 ring-primary/20' : ''}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex gap-2 flex-wrap">
                  <Badge variant={item.is_recommended ? "default" : "secondary"} className="mb-2">
                    {item.is_recommended && <Star className="w-3 h-3 mr-1" />}
                    {item.content_type}
                  </Badge>
                  {item.relevance_score && item.relevance_score > 3 && (
                    <Badge variant="outline" className="mb-2">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Relevan
                    </Badge>
                  )}
                </div>
                <Badge variant="outline" className="text-xs">
                  {item.source_website}
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
                {item.location && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    {item.location}
                  </div>
                )}
                
                {item.deadline && (
                  <div className={`flex items-center gap-2 text-sm ${getDeadlineColor(item.deadline)}`}>
                    <Calendar className="w-4 h-4" />
                    Deadline: {getDaysUntilDeadline(item.deadline) >= 0 ? 
                      `${getDaysUntilDeadline(item.deadline)} hari lagi` : 
                      'Sudah lewat'
                    }
                  </div>
                )}

                {item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {item.tags.slice(0, 3).map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                <Button 
                  variant={item.is_recommended ? "default" : "outline"}
                  size="sm" 
                  className="w-full group"
                  onClick={() => window.open(item.url, '_blank')}
                >
                  {item.is_recommended ? 'Lihat Rekomendasi' : 'Lihat Detail'}
                  <ExternalLink className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredContent.length === 0 && (
        <Card className="text-center py-8">
          <CardContent>
            <p className="text-muted-foreground">
              Tidak ada peluang yang sesuai dengan filter saat ini.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};