import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, MapPin, Calendar, ExternalLink, Sparkles, Trophy, Briefcase, GraduationCap, ArrowLeft, Crown, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getSubscriptionLimits, checkSubscriptionAccess, getUserSubscriptionInfo } from "@/lib/subscription";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { ScrapedContent } from "@/components/dashboard/ScrapedContent";
import { DynamicOpportunityBoard } from "@/components/dashboard/DynamicOpportunityBoard";
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
  const [filterCategory, setFilterCategory] = useState("all");
  const [subscriptionInfo, setSubscriptionInfo] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dynamic");
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
    const matchesCategory = filterCategory === "all" || opp.category.toLowerCase() === filterCategory.toLowerCase();
    
    return matchesSearch && matchesType && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Back to Dashboard Button */}
      <div className="container mx-auto px-4 pt-6">
        <Button 
          variant="outline" 
          onClick={() => window.location.href = '/dashboard'}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali ke Dashboard
        </Button>
      </div>

      {/* Hero Section */}
      <div className="relative bg-gradient-accent overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container mx-auto px-4 py-24 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-white">
              <h1 className="text-5xl font-bold mb-6 leading-tight">
                Opportunity Board
              </h1>
              <p className="text-xl text-white/90 mb-8 leading-relaxed">
                Temukan beasiswa, kompetisi, dan kesempatan magang yang sesuai dengan minat dan bakatmu.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        {/* Subscription Status Banner */}
        {subscriptionInfo && subscriptionInfo.subscription_status !== 'active' && (
          <div className="mb-8">
            <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Crown className="w-6 h-6 text-primary" />
                    <div>
                      <h3 className="font-semibold">Akun Basic - Akses Terbatas</h3>
                      <p className="text-sm text-muted-foreground">
                        Anda dapat mengakses {getSubscriptionLimits(subscriptionInfo.subscription_status, subscriptionInfo.subscription_type).maxOpportunities} peluang gratis. 
                        Upgrade ke Premium untuk akses tidak terbatas!
                      </p>
                    </div>
                  </div>
                  <Button onClick={() => window.location.href = '/dashboard'} className="gap-2">
                    <Crown className="w-4 h-4" />
                    Upgrade
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search and Filters */}
        <Card className="shadow-card mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Cari beasiswa, kompetisi, atau magang..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Semua Jenis" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Jenis</SelectItem>
                  <SelectItem value="scholarship">Beasiswa</SelectItem>
                  <SelectItem value="competition">Kompetisi</SelectItem>
                  <SelectItem value="internship">Magang</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {/* Unified Real-time Opportunity Feed */}
            <DynamicOpportunityBoard
              userAssessment={userAssessment}
              userInterests={userInterests}
              subscriptionInfo={subscriptionInfo}
            />
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default OpportunityBoard;
