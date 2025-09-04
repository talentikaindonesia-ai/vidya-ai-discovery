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
  type: 'scholarship' | 'competition' | 'internship';
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

  useEffect(() => {
    loadOpportunities();
    setLoading(false);
  }, []);

  const loadOpportunities = () => {
    const mockOpportunities: Opportunity[] = [
      {
        id: "1",
        title: "Beasiswa LPDP S2 Luar Negeri",
        organization: "LPDP",
        type: "scholarship",
        category: "Education",
        location: "Internasional",
        description: "Beasiswa penuh untuk program magister di universitas terbaik dunia dengan dukungan biaya hidup dan penelitian.",
        link: "https://lpdp.kemenkeu.go.id"
      },
      {
        id: "2",
        title: "Kompetisi Data Science Indonesia",
        organization: "Dicoding & Google",
        type: "competition",
        category: "Technology",
        location: "Online",
        description: "Kompetisi analisis data terbesar di Indonesia dengan hadiah total 500 juta rupiah dan kesempatan magang di perusahaan teknologi.",
        link: "https://dicoding.com/competition"
      },
      {
        id: "3",
        title: "Internship Program - Product Manager",
        organization: "GoTo Group",
        type: "internship",
        category: "Business",
        location: "Jakarta",
        description: "Program magang 6 bulan sebagai Product Manager dengan mentorship langsung dari senior PM dan project nyata.",
        link: "https://careers.goto.com"
      },
      {
        id: "4",
        title: "Olimpiade Sains Nasional",
        organization: "Kemendikbud",
        type: "competition",
        category: "Science",
        location: "Nasional",
        description: "Kompetisi sains tingkat nasional untuk siswa SMA dengan kesempatan mewakili Indonesia di olimpiade internasional.",
        link: "https://osn.kemdikbud.go.id"
      },
      {
        id: "5",
        title: "Beasiswa BCA Finance",
        organization: "BCA Finance",
        type: "scholarship",
        category: "Finance",
        location: "Indonesia",
        description: "Beasiswa untuk mahasiswa S1 jurusan ekonomi dan bisnis dengan program magang dan jaminan kerja.",
        link: "https://bcafinance.co.id/scholarship"
      },
      {
        id: "6",
        title: "UI/UX Design Challenge",
        organization: "Figma Community Indonesia",
        type: "competition",
        category: "Design",
        location: "Online",
        description: "Kompetisi desain UI/UX dengan tema 'Design for Good' dan hadiah peralatan desain senilai 50 juta rupiah.",
        link: "https://figma.com/community"
      },
      {
        id: "7",
        title: "Google Developer Student Club",
        organization: "Google",
        type: "internship",
        category: "Technology",
        location: "Online",
        description: "Program pengembangan mahasiswa dengan fokus pada teknologi dan inovasi digital.",
        link: "https://developers.google.com/community/gdsc"
      },
      {
        id: "8",
        title: "Beasiswa Unggulan Kemendikbud",
        organization: "Kemendikbud",
        type: "scholarship",
        category: "Education",
        location: "Indonesia",
        description: "Beasiswa untuk mahasiswa berprestasi dengan dukungan penuh biaya pendidikan.",
        link: "https://beasiswaunggulan.kemdikbud.go.id"
      }
    ];
    setOpportunities(mockOpportunities);
  };

  const handleOpportunityClick = (opportunity: Opportunity) => {
    window.open(opportunity.link, '_blank');
  };

  const categories = ["all", "Education", "Technology", "Business", "Science", "Finance", "Design"];
  
  const filteredOpportunities = opportunities.filter(opp => {
    const matchesSearch = opp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         opp.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         opp.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || opp.category === selectedCategory;
    
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
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className="text-sm"
                  >
                    {category === "all" ? "Semua" : category}
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
                              'bg-orange-100 text-orange-700'
                            }
                          >
                            {opportunity.type === 'scholarship' ? 'Beasiswa' : 
                             opportunity.type === 'competition' ? 'Kompetisi' : 
                             'Magang'}
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
