import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Calendar, MapPin, Trophy, Users, ArrowRight, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface OpportunitiesPreviewProps {
  profile?: any;
}

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
      const { data, error } = await supabase
        .from('scraped_content')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;
      setOpportunities(data || []);
    } catch (error) {
      console.error('Error loading opportunities:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilterTabs = () => {
    const allCount = opportunities.length;
    const scholarshipCount = opportunities.filter(opp => opp.category === 'SCHOLARSHIP').length;
    const competitionCount = opportunities.filter(opp => opp.category === 'COMPETITION').length;
    const internshipCount = opportunities.filter(opp => opp.category === 'JOB').length;

    return [
      { label: "Semua", count: allCount },
      { label: "Beasiswa", count: scholarshipCount },
      { label: "Kompetisi", count: competitionCount },
      { label: "Magang", count: internshipCount }
    ];
  };

  const filteredOpportunities = activeFilter === "Semua" 
    ? opportunities 
    : opportunities.filter(opp => {
        if (activeFilter === "Beasiswa") return opp.category === 'SCHOLARSHIP';
        if (activeFilter === "Kompetisi") return opp.category === 'COMPETITION';
        if (activeFilter === "Magang") return opp.category === 'JOB';
        return false;
      });

  const getTypeIcon = (category: string) => {
    switch (category) {
      case "SCHOLARSHIP": return <Trophy className="w-4 h-4" />;
      case "COMPETITION": return <Users className="w-4 h-4" />;
      case "JOB": return <Briefcase className="w-4 h-4" />;
      default: return <Briefcase className="w-4 h-4" />;
    }
  };

  const getTypeColor = (category: string) => {
    switch (category) {
      case "SCHOLARSHIP": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "COMPETITION": return "bg-blue-100 text-blue-800 border-blue-200";
      case "JOB": return "bg-green-100 text-green-800 border-green-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getTypeLabel = (category: string) => {
    switch (category) {
      case "SCHOLARSHIP": return "Beasiswa";
      case "COMPETITION": return "Kompetisi";
      case "JOB": return "Magang";
      default: return category;
    }
  };

  if (loading) {
    return (
      <section className="py-12 bg-muted/30">
        <div className="container px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        </div>
      </section>
    );
  }

  const filterTabs = getFilterTabs();

  return (
    <section className="py-20 bg-muted/30">
      <div className="container px-4">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Briefcase className="w-8 h-8 text-primary" />
            <h2 className="text-3xl md:text-4xl font-bold">
              Opportunity for You
            </h2>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Temukan peluang beasiswa, kompetisi, dan magang yang sesuai dengan minatmu
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

        {/* Opportunities Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {filteredOpportunities.map((opportunity, index) => {
            const isBlurred = isFreeUser && index >= 2; // First 2 opportunities free, rest blurred
            return (
            <Card key={opportunity.id} className="group hover:shadow-card transition-all duration-300 hover:-translate-y-1 bg-card border-primary/10 relative overflow-hidden">
              <CardHeader className={`pb-3 ${isBlurred ? 'blur-sm' : ''}`}>
                <div className="flex items-start justify-between mb-2">
                  <Badge variant="outline" className={`${getTypeColor(opportunity.category)} flex items-center gap-1`}>
                    {getTypeIcon(opportunity.category)}
                    {getTypeLabel(opportunity.category)}
                  </Badge>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {opportunity.deadline ? new Date(opportunity.deadline).toLocaleDateString('id-ID') : 'TBA'}
                  </div>
                </div>
                <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2">
                  {opportunity.title}
                </CardTitle>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {opportunity.description}
                </p>
              </CardHeader>
              <CardContent className={`pt-0 ${isBlurred ? 'blur-sm' : ''}`}>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{opportunity.location || 'Online'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>{opportunity.organizer || 'Tidak diketahui'}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mb-4">
                  {opportunity.tags && opportunity.tags.slice(0, 2).map((tag: string, index: number) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {opportunity.tags && opportunity.tags.length > 2 && (
                    <Badge variant="secondary" className="text-xs">
                      +{opportunity.tags.length - 2}
                    </Badge>
                  )}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  onClick={() => window.open(opportunity.url, '_blank')}
                >
                  Lihat Detail
                </Button>
              </CardContent>
              
              {/* Lock overlay for blurred content */}
              {isBlurred && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                  <div className="text-center p-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Lock className="w-6 h-6 text-primary" />
                    </div>
                    <p className="font-medium text-foreground mb-2">Peluang Premium</p>
                    <p className="text-sm text-muted-foreground mb-3">Upgrade untuk mengakses</p>
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

        {filteredOpportunities.length === 0 && !loading && (
          <div className="text-center py-12">
            <Briefcase className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Belum Ada Opportunity</h3>
            <p className="text-muted-foreground">
              Opportunity untuk kategori ini akan segera tersedia.
            </p>
          </div>
        )}

        <div className="text-center">
          <Button 
            size="lg" 
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-lg hover:shadow-xl transition-all duration-300 group"
            onClick={() => window.location.href = '/opportunities'}
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