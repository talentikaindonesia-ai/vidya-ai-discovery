import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Trophy, Briefcase, GraduationCap, Building2, ExternalLink, Globe, Star, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { BottomNavigationBar } from "@/components/dashboard/BottomNavigationBar";
import { toast } from "sonner";

type OpportunityCategory = 'beasiswa' | 'kompetisi' | 'magang' | 'lowongan_kerja' | 'konferensi';

interface Opportunity {
  id: string;
  title: string;
  organization: string;
  type: OpportunityCategory;
  category: string;
  location: string;
  description: string;
  link: string;
  deadline?: string;
  poster_url?: string;
  source_website: string;
  created_at: string;
  tags: string[];
  regionScore: number;
}

const SEA_KEYWORDS = [
  'indonesia', 'malaysia', 'singapore', 'singapura', 'thailand', 'philippines', 'filipina',
  'vietnam', 'myanmar', 'cambodia', 'kamboja', 'laos', 'brunei', 'timor', 'asean', 'sea',
  'southeast asia', 'asia tenggara',
];

const CATEGORY_META: Record<OpportunityCategory, { color: string; gradient: string; icon: JSX.Element; label: string; badgeColor: string }> = {
  beasiswa:       { color: 'text-blue-600',   gradient: 'from-blue-500 to-blue-700',    icon: <GraduationCap className="w-8 h-8 text-white" />, label: 'Beasiswa',       badgeColor: 'bg-blue-100 text-blue-700' },
  kompetisi:      { color: 'text-purple-600', gradient: 'from-purple-500 to-purple-700',icon: <Trophy className="w-8 h-8 text-white" />,        label: 'Kompetisi',      badgeColor: 'bg-purple-100 text-purple-700' },
  magang:         { color: 'text-orange-600', gradient: 'from-orange-400 to-orange-600',icon: <Briefcase className="w-8 h-8 text-white" />,      label: 'Magang',         badgeColor: 'bg-orange-100 text-orange-700' },
  lowongan_kerja: { color: 'text-green-600',  gradient: 'from-green-500 to-green-700',  icon: <Briefcase className="w-8 h-8 text-white" />,      label: 'Lowongan Kerja', badgeColor: 'bg-green-100 text-green-700' },
  konferensi:     { color: 'text-pink-600',   gradient: 'from-pink-500 to-rose-600',    icon: <Building2 className="w-8 h-8 text-white" />,      label: 'Konferensi',     badgeColor: 'bg-pink-100 text-pink-700' },
};

function getRegionScore(location: string, tags: string[]): { score: number; label: string | null } {
  const combined = `${location} ${(tags || []).join(' ')}`.toLowerCase();
  if (combined.includes('indonesia')) return { score: 3, label: 'Indonesia' };
  for (const kw of SEA_KEYWORDS) {
    if (combined.includes(kw)) return { score: 2, label: 'Asia Tenggara' };
  }
  return { score: 0, label: null };
}

function getRecencyBoost(createdAt: string): number {
  const days = (Date.now() - new Date(createdAt).getTime()) / 86400000;
  if (days <= 3) return 3;
  if (days <= 7) return 2;
  if (days <= 14) return 1;
  return 0;
}

const OpportunityBoard = () => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("opportunities");

  useEffect(() => {
    loadOpportunities();
  }, []);

  const loadOpportunities = async () => {
    try {
      setLoading(true);
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('scraped_content')
        .select('id, title, organizer, category, location, description, url, deadline, poster_url, source_website, created_at, tags')
        .eq('is_active', true)
        .or(`deadline.is.null,deadline.gt.${now}`)
        .order('created_at', { ascending: false })
        .limit(200);

      if (error) { toast.error('Gagal memuat peluang'); return; }

      const validCategories: OpportunityCategory[] = ['beasiswa', 'kompetisi', 'magang', 'lowongan_kerja', 'konferensi'];

      const scored: Opportunity[] = (data || []).map(item => {
        const { score: regionScore } = getRegionScore(item.location || '', item.tags || []);
        const recency = getRecencyBoost(item.created_at);
        const deadlineBoost = item.deadline ? 1 : 0;
        return {
          id: item.id,
          title: item.title,
          organization: item.organizer || item.source_website || 'Unknown',
          type: validCategories.includes(item.category as OpportunityCategory)
            ? (item.category as OpportunityCategory) : 'beasiswa',
          category: item.category,
          location: item.location || 'Online',
          description: item.description || '',
          link: item.url || '#',
          deadline: item.deadline,
          poster_url: item.poster_url,
          source_website: item.source_website,
          created_at: item.created_at,
          tags: item.tags || [],
          regionScore: regionScore * 3 + recency + deadlineBoost,
        };
      });

      // Sort: Indonesia first, then SEA, then by recency
      scored.sort((a, b) => b.regionScore - a.regionScore || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setOpportunities(scored);
    } catch {
      toast.error('Terjadi kesalahan saat memuat peluang');
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { id: "all",            label: "Semua",         count: opportunities.length },
    { id: "beasiswa",       label: "Beasiswa",       count: opportunities.filter(o => o.type === 'beasiswa').length },
    { id: "kompetisi",      label: "Kompetisi",      count: opportunities.filter(o => o.type === 'kompetisi').length },
    { id: "magang",         label: "Magang",         count: opportunities.filter(o => o.type === 'magang').length },
    { id: "lowongan_kerja", label: "Lowongan Kerja", count: opportunities.filter(o => o.type === 'lowongan_kerja').length },
    { id: "konferensi",     label: "Konferensi",     count: opportunities.filter(o => o.type === 'konferensi').length },
  ];

  const filteredOpportunities = opportunities.filter(opp => {
    const matchesSearch = opp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         opp.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         opp.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || opp.type === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/auth';
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        <DashboardSidebar activeSection={activeSection} setActiveSection={setActiveSection} onSignOut={handleSignOut} />

        <main className="flex-1 overflow-hidden pb-20 md:pb-0 mobile-no-scroll">
          <div className="mobile-container p-4 md:p-6">
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-1">Peluang Karir</h1>
              <p className="text-muted-foreground text-sm">
                Diprioritaskan untuk Indonesia & Asia Tenggara — diperbarui setiap hari
              </p>
            </div>

            {/* Search */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Cari peluang..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Categories */}
            <div className="mb-6 flex flex-wrap gap-2">
              {categories.map((cat) => (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  {cat.label}
                  <span className="ml-2 px-1.5 py-0.5 bg-muted rounded-full text-xs">{cat.count}</span>
                </Button>
              ))}
            </div>

            {/* Cards */}
            {loading ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-36 bg-muted rounded-t-lg" />
                    <CardContent className="p-4 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-3 bg-muted rounded w-1/2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredOpportunities.map((opp) => {
                  const meta = CATEGORY_META[opp.type] || CATEGORY_META.beasiswa;
                  const { score: regionScore, label: regionLabel } = getRegionScore(opp.location, opp.tags);
                  const isNew = (Date.now() - new Date(opp.created_at).getTime()) / 86400000 <= 7;
                  const daysLeft = opp.deadline
                    ? Math.floor((new Date(opp.deadline).getTime() - Date.now()) / 86400000)
                    : null;

                  return (
                    <Card
                      key={opp.id}
                      className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden cursor-pointer"
                      onClick={() => window.open(opp.link, '_blank')}
                    >
                      {/* Image / Gradient Preview */}
                      <div className="relative h-36 overflow-hidden">
                        {opp.poster_url ? (
                          <img
                            src={opp.poster_url}
                            alt={opp.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                        ) : (
                          <div className={`w-full h-full bg-gradient-to-br ${meta.gradient} flex items-center justify-center relative`}>
                            {/* Pattern overlay */}
                            <div className="absolute inset-0 opacity-10"
                              style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }}
                            />
                            <div className="text-center relative z-10">
                              {meta.icon}
                              <p className="text-white/80 text-xs mt-1 font-medium">{opp.source_website}</p>
                            </div>
                          </div>
                        )}

                        {/* Top badges */}
                        <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
                          <Badge className={`${meta.badgeColor} text-xs border-0 shadow-sm`}>{meta.label}</Badge>
                          {isNew && (
                            <Badge className="bg-yellow-400 text-yellow-900 text-xs border-0 shadow-sm">
                              <Star className="w-2.5 h-2.5 mr-0.5" />Baru
                            </Badge>
                          )}
                        </div>

                        {/* Region badge */}
                        {regionLabel && (
                          <div className="absolute top-2 right-2">
                            <Badge className="bg-white/90 text-gray-700 text-xs border-0 shadow-sm">
                              <Globe className="w-2.5 h-2.5 mr-0.5" />{regionLabel}
                            </Badge>
                          </div>
                        )}

                        {/* Deadline strip */}
                        {daysLeft !== null && daysLeft <= 30 && (
                          <div className={`absolute bottom-0 left-0 right-0 px-2 py-1 text-xs font-medium flex items-center gap-1 ${daysLeft <= 7 ? 'bg-red-600 text-white' : 'bg-black/60 text-white'}`}>
                            <Clock className="w-3 h-3" />
                            {daysLeft <= 0 ? 'Deadline hari ini' : `${daysLeft} hari lagi`}
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <CardContent className="p-4">
                        <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors mb-2 leading-snug">
                          {opp.title}
                        </h3>

                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                          <Building2 className="w-3 h-3 shrink-0" />
                          <span className="line-clamp-1">{opp.organization}</span>
                        </div>

                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="line-clamp-1">{opp.location}</span>
                        </div>

                        {opp.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {opp.tags.slice(0, 3).map((tag, i) => (
                              <span key={i} className="text-xs bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">{tag}</span>
                            ))}
                          </div>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors text-xs"
                          onClick={(e) => { e.stopPropagation(); window.open(opp.link, '_blank'); }}
                        >
                          Lihat Detail
                          <ExternalLink className="w-3 h-3 ml-1.5" />
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}

                {filteredOpportunities.length === 0 && (
                  <div className="col-span-full text-center py-12">
                    <p className="text-muted-foreground">Tidak ada peluang yang ditemukan.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>

        <BottomNavigationBar activeSection={activeSection} onSectionChange={setActiveSection} />
      </div>
    </SidebarProvider>
  );
};

export default OpportunityBoard;
