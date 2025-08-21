import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, MapPin, Calendar, ExternalLink, Sparkles, Trophy, Briefcase, GraduationCap, ArrowLeft } from "lucide-react";

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

  useEffect(() => {
    // Mock data - in real app, this would come from an API or database
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
  }, []);

  const filteredOpportunities = opportunities.filter(opp => {
    const matchesSearch = opp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         opp.organization.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         opp.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || opp.type === filterType;
    const matchesCategory = filterCategory === "all" || opp.category.toLowerCase() === filterCategory.toLowerCase();
    
    return matchesSearch && matchesType && matchesCategory;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'scholarship': return <GraduationCap className="w-5 h-5" />;
      case 'competition': return <Trophy className="w-5 h-5" />;
      case 'internship': return <Briefcase className="w-5 h-5" />;
      default: return <Sparkles className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'scholarship': return 'bg-secondary text-secondary-foreground';
      case 'competition': return 'bg-accent text-accent-foreground';
      case 'internship': return 'bg-primary text-primary-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'scholarship': return 'Beasiswa';
      case 'competition': return 'Kompetisi';
      case 'internship': return 'Magang';
      default: return type;
    }
  };

  const getDaysUntilDeadline = (deadline: string) => {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const recommendedOpportunities = opportunities.filter(opp => opp.isRecommended);

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
                Raih impianmu dengan peluang terbaik dari seluruh dunia.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-white text-accent hover:bg-white/90 shadow-floating">
                  <Briefcase className="w-5 h-5 mr-2" />
                  Jelajahi Peluang
                </Button>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  <Trophy className="w-5 h-5 mr-2" />
                  Lihat Kompetisi
                </Button>
              </div>
              <div className="flex items-center gap-8 mt-8 text-white/80">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">200+</div>
                  <div className="text-sm">Peluang</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">5k+</div>
                  <div className="text-sm">Berhasil</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">24/7</div>
                  <div className="text-sm">Update</div>
                </div>
              </div>
            </div>
            <div className="hidden lg:block">
              <img 
                src="/src/assets/opportunity-hero.jpg" 
                alt="Opportunity Board" 
                className="rounded-2xl shadow-2xl transform -rotate-3 hover:rotate-0 transition-transform duration-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">

        {/* Recommended Section */}
        {recommendedOpportunities.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-accent" />
              <h2 className="text-2xl font-semibold">Direkomendasikan Untukmu</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              {recommendedOpportunities.map((opportunity) => (
                <Card key={opportunity.id} className="shadow-card hover:shadow-floating transition-all border-2 border-accent/20">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={getTypeColor(opportunity.type)}>
                            {getTypeIcon(opportunity.type)}
                            <span className="ml-1">{getTypeLabel(opportunity.type)}</span>
                          </Badge>
                          <Badge variant="outline" className="border-accent text-accent">
                            <Sparkles className="w-3 h-3 mr-1" />
                            Rekomendasi
                          </Badge>
                        </div>
                        <CardTitle className="line-clamp-2">{opportunity.title}</CardTitle>
                        <p className="text-muted-foreground">{opportunity.organization}</p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm line-clamp-3">{opportunity.description}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{opportunity.location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{getDaysUntilDeadline(opportunity.deadline)} hari lagi</span>
                        </div>
                      </div>

                      <Button asChild className="w-full bg-gradient-accent">
                        <a href={opportunity.link} target="_blank" rel="noopener noreferrer">
                          Lihat Detail
                          <ExternalLink className="w-4 h-4 ml-2" />
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <Card className="shadow-card mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
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

              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Semua Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kategori</SelectItem>
                  <SelectItem value="technology">Teknologi</SelectItem>
                  <SelectItem value="science">Sains</SelectItem>
                  <SelectItem value="business">Bisnis</SelectItem>
                  <SelectItem value="design">Desain</SelectItem>
                  <SelectItem value="education">Pendidikan</SelectItem>
                  <SelectItem value="finance">Keuangan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Opportunities List */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">Semua</TabsTrigger>
            <TabsTrigger value="scholarship">Beasiswa</TabsTrigger>
            <TabsTrigger value="competition">Kompetisi</TabsTrigger>
            <TabsTrigger value="internship">Magang</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredOpportunities.map((opportunity) => (
                <Card key={opportunity.id} className="shadow-card hover:shadow-floating transition-all">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <Badge className={getTypeColor(opportunity.type)}>
                        {getTypeIcon(opportunity.type)}
                        <span className="ml-1">{getTypeLabel(opportunity.type)}</span>
                      </Badge>
                      {opportunity.isRecommended && (
                        <Badge variant="outline" className="border-accent text-accent">
                          <Sparkles className="w-3 h-3" />
                        </Badge>
                      )}
                    </div>
                    
                    <CardTitle className="line-clamp-2">{opportunity.title}</CardTitle>
                    <p className="text-muted-foreground">{opportunity.organization}</p>
                  </CardHeader>

                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-sm line-clamp-3">{opportunity.description}</p>
                      
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Persyaratan:</h4>
                        <ul className="text-xs text-muted-foreground space-y-1">
                          {opportunity.requirements.slice(0, 3).map((req, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="w-1 h-1 bg-muted-foreground rounded-full mt-1.5 flex-shrink-0"></span>
                              <span className="line-clamp-1">{req}</span>
                            </li>
                          ))}
                          {opportunity.requirements.length > 3 && (
                            <li className="text-accent">
                              +{opportunity.requirements.length - 3} persyaratan lainnya
                            </li>
                          )}
                        </ul>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          <span>{opportunity.location}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span className={getDaysUntilDeadline(opportunity.deadline) <= 7 ? 'text-destructive font-medium' : ''}>
                            {getDaysUntilDeadline(opportunity.deadline)} hari lagi
                          </span>
                        </div>
                      </div>

                      <Button asChild className="w-full bg-gradient-primary">
                        <a href={opportunity.link} target="_blank" rel="noopener noreferrer">
                          Apply Sekarang
                          <ExternalLink className="w-4 h-4 ml-2" />
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredOpportunities.length === 0 && (
              <Card className="text-center py-12">
                <CardContent>
                  <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Tidak Ada Hasil</h3>
                  <p className="text-muted-foreground">
                    Coba ubah kata kunci pencarian atau filter yang dipilih
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Individual tabs content */}
          {['scholarship', 'competition', 'internship'].map(type => (
            <TabsContent key={type} value={type} className="mt-6">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredOpportunities
                  .filter(opp => opp.type === type)
                  .map((opportunity) => (
                  <Card key={opportunity.id} className="shadow-card hover:shadow-floating transition-all">
                    {/* Same card content as above */}
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <Badge className={getTypeColor(opportunity.type)}>
                          {getTypeIcon(opportunity.type)}
                          <span className="ml-1">{getTypeLabel(opportunity.type)}</span>
                        </Badge>
                        {opportunity.isRecommended && (
                          <Badge variant="outline" className="border-accent text-accent">
                            <Sparkles className="w-3 h-3" />
                          </Badge>
                        )}
                      </div>
                      
                      <CardTitle className="line-clamp-2">{opportunity.title}</CardTitle>
                      <p className="text-muted-foreground">{opportunity.organization}</p>
                    </CardHeader>

                    <CardContent>
                      <div className="space-y-4">
                        <p className="text-sm line-clamp-3">{opportunity.description}</p>
                        
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium">Persyaratan:</h4>
                          <ul className="text-xs text-muted-foreground space-y-1">
                            {opportunity.requirements.slice(0, 3).map((req, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <span className="w-1 h-1 bg-muted-foreground rounded-full mt-1.5 flex-shrink-0"></span>
                                <span className="line-clamp-1">{req}</span>
                              </li>
                            ))}
                            {opportunity.requirements.length > 3 && (
                              <li className="text-accent">
                                +{opportunity.requirements.length - 3} persyaratan lainnya
                              </li>
                            )}
                          </ul>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{opportunity.location}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span className={getDaysUntilDeadline(opportunity.deadline) <= 7 ? 'text-destructive font-medium' : ''}>
                              {getDaysUntilDeadline(opportunity.deadline)} hari lagi
                            </span>
                          </div>
                        </div>

                        <Button asChild className="w-full bg-gradient-primary">
                          <a href={opportunity.link} target="_blank" rel="noopener noreferrer">
                            Apply Sekarang
                            <ExternalLink className="w-4 h-4 ml-2" />
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

export default OpportunityBoard;