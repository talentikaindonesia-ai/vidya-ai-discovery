import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Trophy, Briefcase, GraduationCap, Building2, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { BottomNavigationBar } from "@/components/dashboard/BottomNavigationBar";
import { toast } from "sonner";

interface Opportunity {
  id: string;
  title: string;
  organization: string;
  type: 'scholarship' | 'competition' | 'internship' | 'job' | 'conference';
  category: string;
  location: string;
  description: string;
  link: string;
}

const OpportunityBoard = () => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("opportunities");

  console.log("OpportunityBoard component loaded - simplified version");

  useEffect(() => {
    loadOpportunities();
  }, []);

  const loadOpportunities = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('scraped_content')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading opportunities:', error);
        toast.error('Gagal memuat peluang');
        return;
      }

      // Transform database data to match component interface
      const transformedOpportunities: Opportunity[] = data.map(item => ({
        id: item.id,
        title: item.title,
        organization: item.organizer || 'Unknown',
        type: item.category === 'SCHOLARSHIP' ? 'scholarship' : 
              item.category === 'COMPETITION' ? 'competition' : 
              item.category === 'INTERNSHIP' ? 'internship' :
              item.category === 'JOB' ? 'job' :
              item.category === 'CONFERENCE' ? 'conference' :
              'scholarship', // Default fallback
        category: item.category,
        location: item.location || 'Unknown',
        description: item.description || 'No description available',
        link: item.url || item.source_website || '#'
      }));

      setOpportunities(transformedOpportunities);
    } catch (error) {
      console.error('Error fetching opportunities:', error);
      toast.error('Terjadi kesalahan saat memuat peluang');
    } finally {
      setLoading(false);
    }
  };

  const handleOpportunityClick = (opportunity: Opportunity) => {
    window.open(opportunity.link, '_blank');
  };

  const categories = [
    { id: "all", label: "Semua", count: opportunities.length },
    { id: "scholarship", label: "Beasiswa", count: opportunities.filter(o => o.type === 'scholarship').length },
    { id: "competition", label: "Kompetisi", count: opportunities.filter(o => o.type === 'competition').length },
    { id: "internship", label: "Magang", count: opportunities.filter(o => o.type === 'internship').length },
    { id: "job", label: "Lowongan Kerja", count: opportunities.filter(o => o.type === 'job').length },
    { id: "conference", label: "Konferensi", count: opportunities.filter(o => o.type === 'conference').length }
  ];
  
  const filteredOpportunities = opportunities.filter(opp => {
    const matchesSearch = opp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         opp.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         opp.category.toLowerCase().includes(searchTerm.toLowerCase());
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
        <DashboardSidebar
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          onSignOut={handleSignOut}
        />
        
        <main className="flex-1 overflow-hidden pb-20 md:pb-0 mobile-no-scroll">
          <div className="mobile-container p-4 md:p-6">
            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl font-bold mb-2">Peluang Karir</h1>
              <p className="text-muted-foreground">
                Temukan peluang magang, beasiswa, dan kompetisi terbaik
              </p>
            </div>

            {/* Search */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Cari peluang..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Categories */}
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category.id)}
                    className="text-sm"
                  >
                    {category.label}
                    <span className="ml-2 px-2 py-1 bg-muted rounded-full text-xs">
                      {category.count}
                    </span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Opportunity Cards */}
            <div className="space-y-4">
              {filteredOpportunities.map((opportunity) => (
                <Card 
                  key={opportunity.id} 
                  className="hover:shadow-md transition-all duration-200 cursor-pointer"
                  onClick={() => handleOpportunityClick(opportunity)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          {opportunity.type === 'scholarship' && <GraduationCap className="w-5 h-5 text-primary" />}
                          {opportunity.type === 'competition' && <Trophy className="w-5 h-5 text-primary" />}
                          {opportunity.type === 'internship' && <Briefcase className="w-5 h-5 text-primary" />}
                          {opportunity.type === 'job' && <Briefcase className="w-5 h-5 text-primary" />}
                          {opportunity.type === 'conference' && <Building2 className="w-5 h-5 text-primary" />}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-semibold line-clamp-1">
                            {opportunity.title}
                          </h3>
                          <Badge 
                            variant="secondary"
                            className={
                              opportunity.type === 'scholarship' ? 'bg-green-100 text-green-700' :
                              opportunity.type === 'competition' ? 'bg-purple-100 text-purple-700' :
                              opportunity.type === 'internship' ? 'bg-orange-100 text-orange-700' :
                              opportunity.type === 'job' ? 'bg-blue-100 text-blue-700' :
                              opportunity.type === 'conference' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-700'
                            }
                          >
                            {opportunity.type === 'scholarship' ? 'Beasiswa' : 
                             opportunity.type === 'competition' ? 'Kompetisi' : 
                             opportunity.type === 'internship' ? 'Magang' :
                             opportunity.type === 'job' ? 'Lowongan Kerja' :
                             opportunity.type === 'conference' ? 'Konferensi' :
                             'Unknown'}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                          <div className="flex items-center gap-1">
                            <Building2 className="w-4 h-4" />
                            {opportunity.organization}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {opportunity.location}
                          </div>
                        </div>
                        
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {opportunity.description}
                        </p>
                        
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-xs">
                            {opportunity.category}
                          </Badge>
                          
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-primary hover:text-primary p-2"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {filteredOpportunities.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Tidak ada peluang yang ditemukan.
                  </p>
                </div>
              )}
            </div>
          </div>
        </main>

        <BottomNavigationBar 
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />
      </div>
    </SidebarProvider>
  );
};

export default OpportunityBoard;
