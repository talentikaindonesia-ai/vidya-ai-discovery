import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Calendar, MapPin, Star, TrendingUp, Filter, Clock, Play, Pause, CheckCircle2 } from "lucide-react";
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
  timeline_status?: 'past' | 'ongoing' | 'future';
  days_until_deadline?: number;
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
  const [timelineFilter, setTimelineFilter] = useState<string>("all");
  const [categorizedContent, setCategorizedContent] = useState({
    ongoing: [] as PersonalizedContent[],
    future: [] as PersonalizedContent[],
    past: [] as PersonalizedContent[]
  });

  useEffect(() => {
    loadPersonalizedContent();
  }, [userInterests, assessmentData, filter, sortBy, timelineFilter]);

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

        // Determine timeline status
        const now = new Date();
        const createdDate = new Date(item.created_at);
        const deadlineDate = item.deadline ? new Date(item.deadline) : null;
        
        let timelineStatus: 'past' | 'ongoing' | 'future' = 'ongoing';
        let daysUntilDeadline = 0;
        
        if (deadlineDate) {
          daysUntilDeadline = Math.floor((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysUntilDeadline < 0) {
            timelineStatus = 'past';
          } else if (daysUntilDeadline <= 30) {
            timelineStatus = 'ongoing';
          } else {
            timelineStatus = 'future';
          }
        } else {
          // If no deadline, assume it's ongoing if created within last 30 days
          const daysSinceCreated = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
          if (daysSinceCreated > 30) {
            timelineStatus = 'past';
          } else {
            timelineStatus = 'ongoing';
          }
        }

        return {
          ...item,
          relevance_score: relevanceScore,
          is_recommended: isRecommended,
          timeline_status: timelineStatus,
          days_until_deadline: daysUntilDeadline
        };
      });

      // Sort by relevance or other criteria with real-time priority
      const sortedContent = enhancedContent.sort((a, b) => {
        // Always prioritize recommended content first
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
          default:
            // Default: Mix of relevance and recency
            const scoreA = (a.relevance_score || 0) + (new Date(a.created_at).getTime() / 1000000000);
            const scoreB = (b.relevance_score || 0) + (new Date(b.created_at).getTime() / 1000000000);
            return scoreB - scoreA;
        }
      });

      setContent(sortedContent);
      
      // Categorize content by timeline
      const categorized = {
        ongoing: sortedContent.filter(item => item.timeline_status === 'ongoing'),
        future: sortedContent.filter(item => item.timeline_status === 'future'),
        past: sortedContent.filter(item => item.timeline_status === 'past')
      };
      setCategorizedContent(categorized);
    } catch (error) {
      console.error('Error loading personalized content:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredContent = content.filter(item => {
    const matchesSearch = searchTerm === "" || 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesTimeline = timelineFilter === "all" || item.timeline_status === timelineFilter;
    
    return matchesSearch && matchesTimeline;
  });

  const getTimelineIcon = (status: string) => {
    switch (status) {
      case 'ongoing':
        return <Play className="w-4 h-4" />;
      case 'future':
        return <Clock className="w-4 h-4" />;
      case 'past':
        return <CheckCircle2 className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getTimelineColor = (status: string) => {
    switch (status) {
      case 'ongoing':
        return "text-green-500";
      case 'future':
        return "text-blue-500";
      case 'past':
        return "text-gray-500";
      default:
        return "text-muted-foreground";
    }
  };

  const getTimelineText = (item: PersonalizedContent) => {
    switch (item.timeline_status) {
      case 'ongoing':
        if (item.days_until_deadline > 0) {
          return `Berlangsung - ${item.days_until_deadline} hari lagi`;
        }
        return "Sedang Berlangsung";
      case 'future':
        return `Akan Dibuka - ${item.days_until_deadline} hari lagi`;
      case 'past':
        return "Sudah Berakhir";
      default:
        return "Status Tidak Diketahui";
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
      {/* Filters and Search - Simplified for unified view */}
      {content.length > 8 && (
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
              <Select value={timelineFilter} onValueChange={setTimelineFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Semua Waktu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Waktu</SelectItem>
                  <SelectItem value="ongoing">Sedang Berlangsung</SelectItem>
                  <SelectItem value="future">Akan Datang</SelectItem>
                  <SelectItem value="past">Sudah Berakhir</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Timeline Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-700 text-sm font-medium">Sedang Berlangsung</p>
                <p className="text-2xl font-bold text-green-800">{categorizedContent.ongoing.length}</p>
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
                <p className="text-2xl font-bold text-blue-800">{categorizedContent.future.length}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-gray-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-700 text-sm font-medium">Sudah Berakhir</p>
                <p className="text-2xl font-bold text-gray-800">{categorizedContent.past.length}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">Semua ({content.length})</TabsTrigger>
          <TabsTrigger value="ongoing" className="text-green-700">
            Berlangsung ({categorizedContent.ongoing.length})
          </TabsTrigger>
          <TabsTrigger value="future" className="text-blue-700">
            Akan Datang ({categorizedContent.future.length})
          </TabsTrigger>
          <TabsTrigger value="past" className="text-gray-700">
            Berakhir ({categorizedContent.past.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">

        <OpportunityGrid opportunities={filteredContent} />
        </TabsContent>

        <TabsContent value="ongoing" className="mt-6">
          <OpportunityGrid opportunities={categorizedContent.ongoing} />
        </TabsContent>

        <TabsContent value="future" className="mt-6">
          <OpportunityGrid opportunities={categorizedContent.future} />
        </TabsContent>

        <TabsContent value="past" className="mt-6">
          <OpportunityGrid opportunities={categorizedContent.past} />
        </TabsContent>
      </Tabs>

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

  // Opportunity Grid Component
  function OpportunityGrid({ opportunities }: { opportunities: PersonalizedContent[] }) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {opportunities.map((item) => (
          <Card key={item.id} className={`hover:shadow-card transition-all duration-300 bg-card border-primary/10 ${item.is_recommended ? 'ring-2 ring-primary/20' : ''} ${item.timeline_status === 'past' ? 'opacity-75' : ''}`}>
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
                  {/* Timeline Status Badge */}
                  <Badge 
                    variant="outline" 
                    className={`mb-2 ${item.timeline_status === 'ongoing' ? 'border-green-300 text-green-700' : 
                      item.timeline_status === 'future' ? 'border-blue-300 text-blue-700' : 
                      'border-gray-300 text-gray-700'}`}
                  >
                    {getTimelineIcon(item.timeline_status)}
                    <span className="ml-1">{item.timeline_status === 'ongoing' ? 'Berlangsung' : 
                      item.timeline_status === 'future' ? 'Akan Datang' : 'Berakhir'}</span>
                  </Badge>
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
                
                {/* Timeline Status Display */}
                <div className={`flex items-center gap-2 text-sm ${getTimelineColor(item.timeline_status)}`}>
                  {getTimelineIcon(item.timeline_status)}
                  {getTimelineText(item)}
                </div>

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
                  variant={item.is_recommended ? "default" : item.timeline_status === 'past' ? "secondary" : "outline"}
                  size="sm" 
                  className="w-full group"
                  onClick={() => window.open(item.url, '_blank')}
                  disabled={item.timeline_status === 'past'}
                >
                  {item.timeline_status === 'past' ? 'Sudah Berakhir' : 
                   item.is_recommended ? 'Lihat Rekomendasi' : 'Lihat Detail'}
                  {item.timeline_status !== 'past' && (
                    <ExternalLink className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
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