import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Calendar, MapPin, Trophy, Users, GraduationCap, Building2, ArrowRight, Lock, Globe, Star, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface OpportunitiesPreviewProps {
  profile?: any;
}

const SEA_KEYWORDS = [
  'indonesia', 'malaysia', 'singapore', 'singapura', 'thailand', 'philippines', 'filipina',
  'vietnam', 'myanmar', 'cambodia', 'asean', 'sea', 'southeast asia', 'asia tenggara',
];

const CATEGORY_META: Record<string, { label: string; gradient: string; badgeColor: string; icon: JSX.Element }> = {
  beasiswa:       { label: "Beasiswa",       gradient: "from-blue-500 to-blue-700",    badgeColor: "bg-blue-100 text-blue-800 border-blue-200",    icon: <GraduationCap className="w-7 h-7 text-white" /> },
  kompetisi:      { label: "Kompetisi",      gradient: "from-purple-500 to-purple-700",badgeColor: "bg-purple-100 text-purple-800 border-purple-200",icon: <Trophy className="w-7 h-7 text-white" /> },
  magang:         { label: "Magang",         gradient: "from-orange-400 to-orange-600",badgeColor: "bg-orange-100 text-orange-800 border-orange-200",icon: <Briefcase className="w-7 h-7 text-white" /> },
  lowongan_kerja: { label: "Lowongan Kerja", gradient: "from-green-500 to-green-700",  badgeColor: "bg-green-100 text-green-800 border-green-200",  icon: <Briefcase className="w-7 h-7 text-white" /> },
  konferensi:     { label: "Konferensi",     gradient: "from-pink-500 to-rose-600",    badgeColor: "bg-pink-100 text-pink-800 border-pink-200",     icon: <Building2 className="w-7 h-7 text-white" /> },
};

function getRegionScore(location: string, tags: string[]): { score: number; label: string | null } {
  const combined = `${location} ${(tags || []).join(' ')}`.toLowerCase();
  if (combined.includes('indonesia')) return { score: 3, label: 'Indonesia' };
  for (const kw of SEA_KEYWORDS) {
    if (combined.includes(kw)) return { score: 2, label: 'Asia Tenggara' };
  }
  return { score: 0, label: null };
}

const FILTER_TABS = [
  { label: "Semua",         cat: null },
  { label: "Beasiswa",      cat: "beasiswa" },
  { label: "Kompetisi",     cat: "kompetisi" },
  { label: "Magang",        cat: "magang" },
  { label: "Lowongan Kerja",cat: "lowongan_kerja" },
  { label: "Konferensi",    cat: "konferensi" },
];

const OpportunitiesPreview = ({ profile }: OpportunitiesPreviewProps) => {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState("Semua");
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const isFreeUser = profile?.subscription_type === 'free' || !profile?.subscription_type;

  useEffect(() => {
    loadOpportunities();
  }, []);

  const loadOpportunities = async () => {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('scraped_content')
        .select('id, title, description, category, organizer, location, url, deadline, poster_url, source_website, created_at, tags')
        .eq('is_active', true)
        .or(`deadline.is.null,deadline.gt.${now}`)
        .order('created_at', { ascending: false })
        .limit(24); // fetch 24 — enough headroom for scoring, display 6

      if (error) throw error;

      // Score and sort: Indonesia → SEA → recent
      const scored = (data || []).map(item => {
        const { score: regionScore } = getRegionScore(item.location || '', item.tags || []);
        const recency = (Date.now() - new Date(item.created_at).getTime()) / 86400000 <= 7 ? 1 : 0;
        return { ...item, _score: regionScore * 3 + recency };
      }).sort((a, b) => b._score - a._score || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setOpportunities(scored.slice(0, 12));
    } catch (error) {
      console.error('Error loading opportunities:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTabs = FILTER_TABS.map(t => ({
    ...t,
    count: t.cat ? opportunities.filter(o => o.category === t.cat).length : opportunities.length,
  }));

  const filteredOpportunities = activeFilter === "Semua"
    ? opportunities
    : opportunities.filter(opp => {
        const tab = filterTabs.find(t => t.label === activeFilter);
        return tab?.cat ? opp.category === tab.cat : true;
      });

  if (loading) {
    return (
      <section className="py-12 bg-muted/30">
        <div className="container px-4 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-muted/30">
      <div className="container px-4">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Briefcase className="w-8 h-8 text-primary" />
            <h2 className="text-3xl md:text-4xl font-bold">Opportunity for You</h2>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Beasiswa, kompetisi, dan magang terbaik — diprioritaskan untuk Indonesia & Asia Tenggara
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex justify-center mb-8">
          <div className="flex flex-wrap gap-2 p-1 bg-card rounded-lg border">
            {filterTabs.map((tab) => (
              <button
                key={tab.label}
                onClick={() => setActiveFilter(tab.label)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  activeFilter === tab.label
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {tab.label}
                <span className="ml-2 text-xs opacity-70">{tab.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {filteredOpportunities.slice(0, 6).map((opp, index) => {
            const isBlurred = isFreeUser && index >= 2;
            const meta = CATEGORY_META[opp.category] || CATEGORY_META['beasiswa'];
            const { label: regionLabel } = getRegionScore(opp.location || '', opp.tags || []);
            const isNew = (Date.now() - new Date(opp.created_at).getTime()) / 86400000 <= 7;
            const daysLeft = opp.deadline
              ? Math.floor((new Date(opp.deadline).getTime() - Date.now()) / 86400000)
              : null;

            return (
              <Card key={opp.id} className="group hover:shadow-card transition-all duration-300 hover:-translate-y-1 bg-card border-primary/10 relative overflow-hidden">
                {/* Image / Gradient */}
                <div className={`relative h-36 overflow-hidden ${isBlurred ? 'blur-sm' : ''}`}>
                  {opp.poster_url ? (
                    <img
                      src={opp.poster_url}
                      alt={opp.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                  ) : (
                    <div className={`w-full h-full bg-gradient-to-br ${meta.gradient} flex items-center justify-center relative`}>
                      <div className="absolute inset-0 opacity-10"
                        style={{ backgroundImage: 'radial-gradient(circle at 25% 50%, white 1px, transparent 1px), radial-gradient(circle at 75% 20%, white 1px, transparent 1px)', backgroundSize: '28px 28px' }}
                      />
                      <div className="text-center relative z-10">
                        {meta.icon}
                        <p className="text-white/70 text-xs mt-1">{opp.source_website}</p>
                      </div>
                    </div>
                  )}

                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex gap-1">
                    <Badge variant="outline" className={`${meta.badgeColor} text-xs border shadow-sm`}>{meta.label}</Badge>
                    {isNew && (
                      <Badge className="bg-yellow-400 text-yellow-900 text-xs border-0 shadow-sm">
                        <Star className="w-2.5 h-2.5 mr-0.5" />Baru
                      </Badge>
                    )}
                  </div>

                  {regionLabel && (
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-white/90 text-gray-700 text-xs border-0 shadow-sm">
                        <Globe className="w-2.5 h-2.5 mr-0.5" />{regionLabel}
                      </Badge>
                    </div>
                  )}

                  {daysLeft !== null && daysLeft <= 30 && (
                    <div className={`absolute bottom-0 left-0 right-0 px-2 py-1 text-xs font-medium flex items-center gap-1 ${daysLeft <= 7 ? 'bg-red-600 text-white' : 'bg-black/60 text-white'}`}>
                      <Clock className="w-3 h-3" />
                      {daysLeft <= 0 ? 'Deadline hari ini' : `${daysLeft} hari lagi`}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className={`p-4 ${isBlurred ? 'blur-sm' : ''}`}>
                  <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors mb-2 leading-snug">
                    {opp.title}
                  </h3>
                  <div className="space-y-1 mb-3">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="line-clamp-1">{opp.location || 'Online'}</span>
                    </div>
                    {opp.deadline && !isBlurred && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3 shrink-0" />
                        <span>{new Date(opp.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    )}
                  </div>
                  {(opp.tags || []).length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {opp.tags.slice(0, 2).map((tag: string, i: number) => (
                        <span key={i} className="text-xs bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">{tag}</span>
                      ))}
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors text-xs"
                    onClick={() => window.open(opp.url, '_blank')}
                  >
                    Lihat Detail
                  </Button>
                </div>

                {/* Lock overlay */}
                {isBlurred && (
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                    <div className="text-center p-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Lock className="w-6 h-6 text-primary" />
                      </div>
                      <p className="font-medium text-foreground mb-1">Peluang Premium</p>
                      <p className="text-xs text-muted-foreground mb-3">Upgrade untuk mengakses</p>
                      <Button size="sm" onClick={() => navigate('/subscription')}>Buka Kunci</Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {filteredOpportunities.length === 0 && (
          <div className="text-center py-12">
            <Briefcase className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Belum Ada Opportunity</h3>
            <p className="text-muted-foreground">Opportunity untuk kategori ini akan segera tersedia.</p>
          </div>
        )}

        <div className="text-center">
          <Button
            size="lg"
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-lg hover:shadow-xl transition-all duration-300 group"
            onClick={() => navigate('/opportunities')}
          >
            <Briefcase className="w-5 h-5 mr-2" />
            Explore Opportunity for You
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default OpportunitiesPreview;
