import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Calendar, MapPin, Star, TrendingUp, Clock, Play } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  days_until_deadline?: number;
  timeline_status?: 'ongoing' | 'future';
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
  const [ongoingCount, setOngoingCount] = useState(0);
  const [futureCount, setFutureCount] = useState(0);

  useEffect(() => {
    loadPersonalizedContent();
  }, [userInterests, assessmentData, filter, sortBy]);

  const loadPersonalizedContent = async () => {
    try {
      const now = new Date().toISOString();

      let query = supabase
        .from('scraped_content')
        .select('*')
        .eq('is_active', true)
        .or(`deadline.is.null,deadline.gt.${now}`)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (filter !== "all") {
        query = query.eq('category', filter);
      }

      const { data, error } = await query;
      if (error) throw error;

      const enhancedContent = (data || []).map(item => {
        let relevanceScore = 0;
        let isRecommended = false;

        if (userInterests.length > 0) {
          const matchedInterests = (item.tags || []).filter((tag: string) =>
            userInterests.some(interest =>
              interest.toLowerCase().includes(tag.toLowerCase()) ||
              tag.toLowerCase().includes(interest.toLowerCase())
            )
          );
          relevanceScore += matchedInterests.length * 2;
        }

        if (assessmentData) {
          const { personality_type, career_recommendations, talent_areas } = assessmentData;

          if (career_recommendations) {
            const careerMatch = career_recommendations.some((career: string) =>
              item.title.toLowerCase().includes(career.toLowerCase()) ||
              (item.description || '').toLowerCase().includes(career.toLowerCase()) ||
              (item.tags || []).some((tag: string) => tag.toLowerCase().includes(career.toLowerCase()))
            );
            if (careerMatch) { relevanceScore += 3; isRecommended = true; }
          }

          if (talent_areas) {
            const talentMatch = talent_areas.some((talent: string) =>
              (item.tags || []).some((tag: string) => tag.toLowerCase().includes(talent.toLowerCase()))
            );
            if (talentMatch) relevanceScore += 2;
          }

          if (personality_type) {
            const personalityKeywords: Record<string, string[]> = {
              'realistic': ['teknik', 'engineering', 'teknologi', 'stem'],
              'investigative': ['research', 'penelitian', 'sains', 'science'],
              'artistic': ['creative', 'kreatif', 'design', 'art', 'seni'],
              'social': ['social', 'education', 'pendidikan', 'community'],
              'enterprising': ['business', 'bisnis', 'entrepreneurship', 'leadership'],
              'conventional': ['administration', 'management', 'finance', 'keuangan'],
            };
            const typeKeywords = personalityKeywords[personality_type.toLowerCase()] || [];
            const personalityMatch = typeKeywords.some(keyword =>
              item.title.toLowerCase().includes(keyword) ||
              (item.description || '').toLowerCase().includes(keyword) ||
              (item.tags || []).some((tag: string) => tag.toLowerCase().includes(keyword))
            );
            if (personalityMatch) relevanceScore += 1;
          }
        }

        const daysSinceCreated = Math.floor((Date.now() - new Date(item.created_at).getTime()) / 86400000);
        if (daysSinceCreated <= 7) relevanceScore += 1;

        let daysUntilDeadline = 0;
        let timelineStatus: 'ongoing' | 'future' = 'ongoing';

        if (item.deadline) {
          daysUntilDeadline = Math.floor((new Date(item.deadline).getTime() - Date.now()) / 86400000);
          timelineStatus = daysUntilDeadline <= 30 ? 'ongoing' : 'future';
          if (daysUntilDeadline > 0 && daysUntilDeadline <= 30) relevanceScore += 2;
        }

        return {
          ...item,
          relevance_score: relevanceScore,
          is_recommended: isRecommended,
          timeline_status: timelineStatus,
          days_until_deadline: daysUntilDeadline,
        };
      });

      const sorted = enhancedContent.sort((a, b) => {
        if (a.is_recommended && !b.is_recommended) return -1;
        if (!a.is_recommended && b.is_recommended) return 1;

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
          default: {
            const scoreA = (a.relevance_score || 0) + new Date(a.created_at).getTime() / 1e9;
            const scoreB = (b.relevance_score || 0) + new Date(b.created_at).getTime() / 1e9;
            return scoreB - scoreA;
          }
        }
      });

      setContent(sorted);
      setOngoingCount(sorted.filter(i => i.timeline_status === 'ongoing').length);
      setFutureCount(sorted.filter(i => i.timeline_status === 'future').length);
    } catch (error) {
      console.error('Error loading personalized content:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredContent = content.filter(item => {
    if (searchTerm === '') return true;
    const q = searchTerm.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      (item.description || '').toLowerCase().includes(q) ||
      (item.tags || []).some(t => t.toLowerCase().includes(q))
    );
  });

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
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
      {/* Filters */}
      {content.length > 6 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Cari peluang yang relevan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Semua Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kategori</SelectItem>
                  <SelectItem value="beasiswa">Beasiswa</SelectItem>
                  <SelectItem value="magang">Magang</SelectItem>
                  <SelectItem value="lowongan_kerja">Lowongan Kerja</SelectItem>
                  <SelectItem value="kompetisi">Kompetisi</SelectItem>
                  <SelectItem value="konferensi">Konferensi</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Urutkan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Relevansi</SelectItem>
                  <SelectItem value="deadline">Deadline Terdekat</SelectItem>
                  <SelectItem value="newest">Terbaru</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-700 text-sm font-medium">Sedang Berlangsung</p>
                <p className="text-2xl font-bold text-green-800">{ongoingCount}</p>
              </div>
              <Play className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-700 text-sm font-medium">Akan Datang</p>
                <p className="text-2xl font-bold text-blue-800">{futureCount}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">Semua ({content.length})</TabsTrigger>
          <TabsTrigger value="ongoing" className="text-green-700">
            Berlangsung ({ongoingCount})
          </TabsTrigger>
          <TabsTrigger value="future" className="text-blue-700">
            Akan Datang ({futureCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <OpportunityGrid opportunities={filteredContent} />
        </TabsContent>
        <TabsContent value="ongoing" className="mt-6">
          <OpportunityGrid opportunities={content.filter(i => i.timeline_status === 'ongoing')} />
        </TabsContent>
        <TabsContent value="future" className="mt-6">
          <OpportunityGrid opportunities={content.filter(i => i.timeline_status === 'future')} />
        </TabsContent>
      </Tabs>

      {filteredContent.length === 0 && !loading && (
        <Card className="text-center py-8">
          <CardContent>
            <p className="text-muted-foreground">Tidak ada peluang yang sesuai dengan filter saat ini.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  function OpportunityGrid({ opportunities }: { opportunities: PersonalizedContent[] }) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {opportunities.map((item) => (
          <Card
            key={item.id}
            className={`hover:shadow-card transition-all duration-300 bg-card border-primary/10 ${item.is_recommended ? 'ring-2 ring-primary/20' : ''}`}
          >
            <CardHeader>
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <div className="flex gap-2 flex-wrap">
                  <Badge variant={item.is_recommended ? "default" : "secondary"}>
                    {item.is_recommended && <Star className="w-3 h-3 mr-1" />}
                    {item.content_type}
                  </Badge>
                  {(item.relevance_score || 0) > 3 && (
                    <Badge variant="outline">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Relevan
                    </Badge>
                  )}
                  <Badge
                    variant="outline"
                    className={item.timeline_status === 'ongoing'
                      ? 'border-green-300 text-green-700'
                      : 'border-blue-300 text-blue-700'}
                  >
                    {item.timeline_status === 'ongoing'
                      ? <><Play className="w-3 h-3 mr-1" />Berlangsung</>
                      : <><Clock className="w-3 h-3 mr-1" />Akan Datang</>}
                  </Badge>
                </div>
                <Badge variant="outline" className="text-xs shrink-0">
                  {item.source_website}
                </Badge>
              </div>
              <CardTitle className="text-lg line-clamp-2 hover:text-primary transition-colors">
                {item.title}
              </CardTitle>
              <CardDescription className="line-clamp-2">{item.description}</CardDescription>
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
                  <div className={`flex items-center gap-2 text-sm ${item.days_until_deadline <= 7 ? 'text-red-500' : item.timeline_status === 'ongoing' ? 'text-green-600' : 'text-blue-600'}`}>
                    <Calendar className="w-4 h-4" />
                    {item.days_until_deadline > 0
                      ? `Deadline: ${item.days_until_deadline} hari lagi`
                      : `Deadline: ${new Date(item.deadline).toLocaleDateString('id-ID')}`}
                  </div>
                )}
                {(item.tags || []).length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {item.tags.slice(0, 3).map((tag, i) => (
                      <Badge key={i} variant="outline" className="text-xs">{tag}</Badge>
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
    );
  }
};
