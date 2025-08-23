import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Calendar, Sparkles, Trophy, Briefcase, GraduationCap, Crown, Lock, Building2, ArrowLeft, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getSubscriptionLimits, checkSubscriptionAccess, getUserSubscriptionInfo } from "@/lib/subscription";
import { DynamicOpportunityBoard } from "@/components/dashboard/DynamicOpportunityBoard";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { toast } from "sonner";

interface Opportunity {
  id: string;
  title: string;
  organization: string;
  type: 'scholarship' | 'competition' | 'internship';
  category: string;
  location: string;
  deadline: string;
  description: string;
  requirements: string[];
  isRecommended?: boolean;
  link: string;
}

const OpportunityBoard = () => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterLocation, setFilterLocation] = useState("all");
  const [subscriptionInfo, setSubscriptionInfo] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState("opportunities");
  const [userAssessment, setUserAssessment] = useState<any>(null);
  const [userInterests, setUserInterests] = useState<string[]>([]);

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const subInfo = await getUserSubscriptionInfo(session.user.id);
        setSubscriptionInfo(subInfo);
        
        // Load user assessment and interests
        await Promise.all([
          loadUserAssessment(session.user.id),
          loadUserInterests(session.user.id)
        ]);
      }
      loadOpportunities();
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserAssessment = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('assessment_results')
        .select('*')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        setUserAssessment(data[0]);
      }
    } catch (error) {
      console.error('Error loading assessment:', error);
    }
  };

  const loadUserInterests = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('user_interests')
        .select(`
          interest_categories (
            name
          )
        `)
        .eq('user_id', userId);

      if (data) {
        const interests = data.map((item: any) => item.interest_categories?.name).filter(Boolean);
        setUserInterests(interests);
      }
    } catch (error) {
      console.error('Error loading interests:', error);
    }
  };

  const loadOpportunities = () => {
    const mockOpportunities: Opportunity[] = [
      {
        id: "1",
        title: "Beasiswa LPDP S2 Luar Negeri",
        organization: "LPDP",
        type: "scholarship",
        category: "Education",
        location: "Internasional",
        deadline: "2024-03-15",
        description: "Beasiswa penuh untuk program magister di universitas terbaik dunia dengan dukungan biaya hidup dan penelitian.",
        requirements: ["IPK minimal 3.25", "IELTS 6.5", "Proposal penelitian", "Surat rekomendasi"],
        isRecommended: true,
        link: "https://lpdp.kemenkeu.go.id"
      },
      {
        id: "2",
        title: "Kompetisi Data Science Indonesia",
        organization: "Dicoding & Google",
        type: "competition",
        category: "Technology",
        location: "Online",
        deadline: "2024-02-28",
        description: "Kompetisi analisis data terbesar di Indonesia dengan hadiah total 500 juta rupiah dan kesempatan magang di perusahaan teknologi.",
        requirements: ["Tim 3-4 orang", "Mahasiswa aktif", "Portfolio data science", "Proposal solusi"],
        isRecommended: true,
        link: "https://dicoding.com/competition"
      },
      {
        id: "3",
        title: "Internship Program - Product Manager",
        organization: "GoTo Group",
        type: "internship",
        category: "Business",
        location: "Jakarta",
        deadline: "2024-03-01",
        description: "Program magang 6 bulan sebagai Product Manager dengan mentorship langsung dari senior PM dan project nyata.",
        requirements: ["Mahasiswa semester 5+", "IPK minimal 3.0", "Pengalaman organisasi", "English proficiency"],
        link: "https://careers.goto.com"
      },
      {
        id: "4",
        title: "Olimpiade Sains Nasional",
        organization: "Kemendikbud",
        type: "competition",
        category: "Science",
        location: "Nasional",
        deadline: "2024-04-10",
        description: "Kompetisi sains tingkat nasional untuk siswa SMA dengan kesempatan mewakili Indonesia di olimpiade internasional.",
        requirements: ["Siswa SMA aktif", "Nilai rata-rata 85+", "Rekomendasi sekolah"],
        link: "https://osn.kemdikbud.go.id"
      },
      {
        id: "5",
        title: "Beasiswa BCA Finance",
        organization: "BCA Finance",
        type: "scholarship",
        category: "Finance",
        location: "Indonesia",
        deadline: "2024-03-20",
        description: "Beasiswa untuk mahasiswa S1 jurusan ekonomi dan bisnis dengan program magang dan jaminan kerja.",
        requirements: ["Mahasiswa aktif", "Jurusan Ekonomi/Bisnis", "IPK minimal 3.5", "Proposal bisnis"],
        link: "https://bcafinance.co.id/scholarship"
      },
      {
        id: "6",
        title: "UI/UX Design Challenge",
        organization: "Figma Community Indonesia",
        type: "competition",
        category: "Design",
        location: "Online",
        deadline: "2024-02-25",
        description: "Kompetisi desain UI/UX dengan tema 'Design for Good' dan hadiah peralatan desain senilai 50 juta rupiah.",
        requirements: ["Portfolio design", "Prototype interaktif", "Case study lengkap"],
        isRecommended: true,
        link: "https://figma.com/community"
      }
    ];
    setOpportunities(mockOpportunities);
  };

  const canAccessOpportunity = (index: number) => {
    if (!subscriptionInfo) return true;
    const limits = getSubscriptionLimits(subscriptionInfo.subscription_status, subscriptionInfo.subscription_type);
    const { canAccess } = checkSubscriptionAccess(index + 1, limits.maxOpportunities, subscriptionInfo.subscription_status);
    return canAccess;
  };

  const handleOpportunityClick = (opportunity: Opportunity, index: number) => {
    if (!canAccessOpportunity(index)) {
      toast.error("Upgrade ke Premium untuk mengakses peluang ini!");
      return;
    }
    window.open(opportunity.link, '_blank');
  };

  const filteredOpportunities = opportunities.filter(opp => {
    const matchesSearch = opp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         opp.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         opp.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || opp.type === filterType;
    const matchesLocation = filterLocation === "all" || opp.location.toLowerCase().includes(filterLocation.toLowerCase());
    
    return matchesSearch && matchesType && matchesLocation;
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
        
        <main className="flex-1 overflow-hidden">
          <div className="p-6">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-3xl font-bold">Peluang Karir</h1>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Muhammad Dafa</span>
                  <Badge variant="outline" className="text-xs">Individual</Badge>
                </div>
              </div>
              <p className="text-muted-foreground">
                Temukan peluang magang, beasiswa, pekerjaan, dan kompetisi terbait
              </p>
            </div>

            {/* Search and Filters */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Cari peluang..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="Semua Tipe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Tipe</SelectItem>
                      <SelectItem value="scholarship">Beasiswa</SelectItem>
                      <SelectItem value="competition">Kompetisi</SelectItem>
                      <SelectItem value="internship">Magang</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterLocation} onValueChange={setFilterLocation}>
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue placeholder="Semua Lokasi" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Lokasi</SelectItem>
                      <SelectItem value="jakarta">Jakarta</SelectItem>
                      <SelectItem value="bandung">Bandung</SelectItem>
                      <SelectItem value="surabaya">Surabaya</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                      <SelectItem value="nasional">Nasional</SelectItem>
                      <SelectItem value="internasional">Internasional</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Dynamic Opportunity Board */}
                <DynamicOpportunityBoard
                  userAssessment={userAssessment}
                  userInterests={userInterests}
                  subscriptionInfo={subscriptionInfo}
                />
              </CardContent>
            </Card>

            {/* Opportunity Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredOpportunities.map((opportunity, index) => (
                <Card 
                  key={opportunity.id} 
                  className={`hover:shadow-lg transition-all duration-300 cursor-pointer ${
                    opportunity.isRecommended ? 'border-primary/30' : ''
                  } ${
                    !canAccessOpportunity(index) ? 'opacity-75' : ''
                  }`}
                  onClick={() => handleOpportunityClick(opportunity, index)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                          {opportunity.type === 'scholarship' && <GraduationCap className="w-6 h-6 text-primary" />}
                          {opportunity.type === 'competition' && <Trophy className="w-6 h-6 text-primary" />}
                          {opportunity.type === 'internship' && <Briefcase className="w-6 h-6 text-primary" />}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <h3 className="font-semibold text-lg line-clamp-1">
                            {opportunity.title}
                          </h3>
                          <div className="flex gap-1 flex-wrap">
                            {opportunity.isRecommended && (
                              <Badge className="bg-blue-500 text-white text-xs">
                                Rekomendasi
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              Personal
                            </Badge>
                            <Badge 
                              className={
                                opportunity.type === 'scholarship' ? 'bg-green-500 text-white' :
                                opportunity.type === 'competition' ? 'bg-purple-500 text-white' :
                                'bg-orange-500 text-white'
                              }
                            >
                              {opportunity.type === 'scholarship' ? 'Beasiswa' : 
                               opportunity.type === 'competition' ? 'Kompetisi' : 
                               'Magang'}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center gap-1">
                            <Building2 className="w-4 h-4" />
                            {opportunity.organization}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {opportunity.location}
                          </div>
                        </div>
                        
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                          {opportunity.description}
                        </p>
                        
                        {/* Warning for overdue */}
                        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-red-500" />
                            <span className="text-sm text-red-700 font-medium">Deadline terlewat</span>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm font-medium mb-2">Persyaratan:</p>
                            <div className="flex flex-wrap gap-2">
                              {opportunity.requirements.slice(0, 4).map((req, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {req}
                                </Badge>
                              ))}
                              {opportunity.requirements.length > 4 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{opportunity.requirements.length - 4} lainnya
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          <div>
                            <p className="text-sm font-medium mb-2">Benefit:</p>
                            <div className="flex flex-wrap gap-2">
                              <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                                Pengembangan karier
                              </Badge>
                              <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                                Mentoring
                              </Badge>
                              <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                                +2 lainnya
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-end mt-4">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-primary hover:text-primary"
                            disabled={!canAccessOpportunity(index)}
                          >
                            {!canAccessOpportunity(index) ? (
                              <>
                                <Lock className="w-4 h-4 mr-2" />
                                Premium
                              </>
                            ) : (
                              <>
                                <ExternalLink className="w-4 h-4 mr-2" />
                                Detail
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default OpportunityBoard;
