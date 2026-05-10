import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, Trophy, Target, ArrowRight, User, MessageCircle, Lock } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface CommunityPreviewProps {
  userAssessment?: any;
  userInterests?: any[];
  profile?: any;
}

const FALLBACK_COMMUNITIES = [
  {
    id: "tech",
    name: "Tech Innovators Community",
    description: "Komunitas untuk para inovator teknologi yang ingin berbagi ide dan berkolaborasi",
    type: "Technology",
    members: 1247,
    activeDiscussions: 89,
    category: "RIASEC-I",
    tags: ["Programming", "AI", "Web Dev"],
    isRecommended: true,
  },
  {
    id: "design",
    name: "Creative Designers Hub",
    description: "Tempat berkumpul para desainer untuk saling menginspirasi dan belajar",
    type: "Design",
    members: 892,
    activeDiscussions: 156,
    category: "RIASEC-A",
    tags: ["UI/UX", "Graphic Design", "Animation"],
    isRecommended: true,
  },
  {
    id: "social",
    name: "Social Impact Leaders",
    description: "Komunitas untuk mereka yang ingin membuat perubahan positif di masyarakat",
    type: "Social",
    members: 567,
    activeDiscussions: 78,
    category: "RIASEC-S",
    tags: ["Social Work", "NGO", "Community Dev"],
    isRecommended: false,
  },
];

const CommunityPreview = ({ userAssessment, userInterests, profile }: CommunityPreviewProps) => {
  const navigate = useNavigate();
  const [communities, setCommunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const isFreeUser = profile?.subscription_type === 'free' || !profile?.subscription_type;

  useEffect(() => {
    loadCommunityData();
  }, [userAssessment, userInterests]);

  const loadCommunityData = async () => {
    try {
      const { data, error } = await supabase
        .from('community_events')
        .select('id, title, description, event_type, location, event_date, max_participants, current_participants, organizer_id')
        .eq('is_active', true)
        .gte('event_date', new Date().toISOString())
        .order('event_date', { ascending: true })
        .limit(3);

      if (!error && data && data.length > 0) {
        const mapped = data.map((e: any) => ({
          id: e.id,
          name: e.title,
          description: e.description || '',
          type: e.event_type || 'Community',
          members: e.current_participants || 0,
          maxMembers: e.max_participants || null,
          activeDiscussions: 0,
          tags: [],
          location: e.location || 'Online',
          startDate: e.event_date,
          isRecommended: false,
        }));
        setCommunities(mapped);
      } else {
        // Fall back to static communities when table is empty or missing
        let sorted = [...FALLBACK_COMMUNITIES];
        if (userAssessment?.personality_type) {
          sorted = sorted.sort((a, b) => {
            const aM = a.category.includes(userAssessment.personality_type.toUpperCase());
            const bM = b.category.includes(userAssessment.personality_type.toUpperCase());
            if (aM && !bM) return -1;
            if (!aM && bM) return 1;
            return 0;
          });
        }
        setCommunities(sorted);
      }
    } catch (error) {
      console.error('Error loading community data:', error);
      setCommunities(FALLBACK_COMMUNITIES);
    } finally {
      setLoading(false);
    }
  };

  const getTypeColor = (type: string) => {
    const map: Record<string, string> = {
      Technology: "bg-blue-100 text-blue-800 border-blue-200",
      Design: "bg-purple-100 text-purple-800 border-purple-200",
      Social: "bg-green-100 text-green-800 border-green-200",
      Business: "bg-orange-100 text-orange-800 border-orange-200",
      "Data Science": "bg-indigo-100 text-indigo-800 border-indigo-200",
      Engineering: "bg-gray-100 text-gray-800 border-gray-200",
      Community: "bg-teal-100 text-teal-800 border-teal-200",
    };
    return map[type] || "bg-gray-100 text-gray-800 border-gray-200";
  };

  if (loading) {
    return (
      <section className="py-20 bg-muted/30">
        <div className="container px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Memuat komunitas...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-muted/30">
      <div className="container px-4">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Users className="w-8 h-8 text-primary" />
            <h2 className="text-3xl md:text-4xl font-bold">
              Community for You
            </h2>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Bergabung dengan komunitas yang sesuai dengan minat dan kepribadianmu
          </p>
        </div>

        {/* Communities Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {communities.map((community, index) => {
            const isBlurred = isFreeUser && index >= 1;
            return (
              <Card key={community.id} className="group hover:shadow-card transition-all duration-300 hover:-translate-y-1 bg-card border-primary/10 relative overflow-hidden">
                <CardHeader className={`pb-3 ${isBlurred ? 'blur-sm' : ''}`}>
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="outline" className={`${getTypeColor(community.type)} flex items-center gap-1`}>
                      <Users className="w-3 h-3" />
                      {community.type}
                    </Badge>
                    {community.isRecommended && (
                      <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                        Rekomendasi
                      </Badge>
                    )}
                    {community.startDate && (
                      <Badge variant="outline" className="text-xs">
                        <Calendar className="w-3 h-3 mr-1" />
                        {new Date(community.startDate).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' })}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2">
                    {community.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {community.description}
                  </p>
                </CardHeader>
                <CardContent className={`pt-0 ${isBlurred ? 'blur-sm' : ''}`}>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        <span>
                          {community.members.toLocaleString()}
                          {community.maxMembers ? `/${community.maxMembers}` : ''} peserta
                        </span>
                      </div>
                      {community.activeDiscussions > 0 && (
                        <div className="flex items-center gap-2">
                          <MessageCircle className="w-4 h-4" />
                          <span>{community.activeDiscussions} diskusi</span>
                        </div>
                      )}
                    </div>
                  </div>
                  {(community.tags || []).length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {community.tags.slice(0, 2).map((tag: string, i: number) => (
                        <Badge key={i} variant="secondary" className="text-xs">{tag}</Badge>
                      ))}
                      {community.tags.length > 2 && (
                        <Badge variant="secondary" className="text-xs">+{community.tags.length - 2}</Badge>
                      )}
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                    onClick={() => navigate('/community')}
                  >
                    Bergabung
                  </Button>
                </CardContent>

                {isBlurred && (
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                    <div className="text-center p-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Lock className="w-6 h-6 text-primary" />
                      </div>
                      <p className="font-medium text-foreground mb-2">Komunitas Premium</p>
                      <p className="text-sm text-muted-foreground mb-3">Upgrade untuk bergabung</p>
                      <Button size="sm" onClick={() => navigate('/subscription')}>
                        Buka Kunci
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        <div className="text-center">
          <Button
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-lg hover:shadow-xl transition-all duration-300 group"
            onClick={() => navigate('/community')}
          >
            <Users className="w-5 h-5 mr-2" />
            Explore All Communities
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CommunityPreview;
