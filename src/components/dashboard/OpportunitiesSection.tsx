import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Briefcase, MapPin, Calendar, Building, Search, ExternalLink, Clock, GraduationCap } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Opportunity {
  id: string;
  title: string;
  company: string;
  type: 'internship' | 'scholarship' | 'job' | 'competition';
  location: string;
  deadline: string;
  description: string;
  requirements: string[];
  benefits: string[];
  isRecommended?: boolean;
  isPersonalized?: boolean;
  salaryRange?: string;
  reason?: string;
  field?: string;
}

export const OpportunitiesSection = () => {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [userAssessment, setUserAssessment] = useState<any>(null);

  const loadUserAssessment = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: assessment } = await supabase
        .from('assessment_results')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (assessment) {
        setUserAssessment(assessment);
      }
    } catch (error) {
      console.error('Error loading user assessment:', error);
    }
  };

  const loadOpportunities = () => {
    // Get personalized opportunities based on assessment results
    const getPersonalizedOpportunities = () => {
      if (!userAssessment) return getMockOpportunities();
      
      const personalityType = userAssessment.personality_type;
      const careerRecommendations = userAssessment.career_recommendations || [];
      
      const riasecOpportunities = {
        realistic: [
          { title: 'Engineering Intern - Manufacturing Company', company: 'IndustriCorp', type: 'internship' as const, field: 'Teknik' },
          { title: 'Agricultural Technology Scholarship', company: 'AgriTech Foundation', type: 'scholarship' as const, field: 'Pertanian' },
          { title: 'Construction Project Manager', company: 'BuildMax', type: 'job' as const, field: 'Konstruksi' }
        ],
        investigative: [
          { title: 'Data Science Internship', company: 'DataTech Solutions', type: 'internship' as const, field: 'Data Science' },
          { title: 'Research Fellowship Program', company: 'National Science Foundation', type: 'scholarship' as const, field: 'Penelitian' },
          { title: 'Bioinformatics Analyst Position', company: 'BioLab Inc', type: 'job' as const, field: 'Sains' }
        ],
        artistic: [
          { title: 'Creative Design Intern', company: 'Design Studio Pro', type: 'internship' as const, field: 'Design' },
          { title: 'Digital Art Competition', company: 'Creative Foundation', type: 'competition' as const, field: 'Seni' },
          { title: 'Media Production Assistant', company: 'MediaCorp', type: 'job' as const, field: 'Media' }
        ],
        social: [
          { title: 'Education Program Coordinator', company: 'Learn Foundation', type: 'job' as const, field: 'Pendidikan' },
          { title: 'Community Health Intern', company: 'Health NGO', type: 'internship' as const, field: 'Kesehatan' },
          { title: 'Social Work Scholarship', company: 'Social Care Fund', type: 'scholarship' as const, field: 'Sosial' }
        ],
        enterprising: [
          { title: 'Business Development Trainee', company: 'GrowthCorp', type: 'job' as const, field: 'Bisnis' },
          { title: 'Startup Accelerator Program', company: 'Innovation Hub', type: 'competition' as const, field: 'Kewirausahaan' },
          { title: 'Sales Management Intern', company: 'SalesPro', type: 'internship' as const, field: 'Penjualan' }
        ],
        conventional: [
          { title: 'Financial Analyst Trainee', company: 'FinanceCorp', type: 'job' as const, field: 'Keuangan' },
          { title: 'Administrative Excellence Program', company: 'OfficePro', type: 'internship' as const, field: 'Administrasi' },
          { title: 'Accounting Scholarship', company: 'CPA Foundation', type: 'scholarship' as const, field: 'Akuntansi' }
        ]
      };

      const personalizedOpps = personalityType && riasecOpportunities[personalityType as keyof typeof riasecOpportunities] 
        ? riasecOpportunities[personalityType as keyof typeof riasecOpportunities]
        : [];

      // Add personalized opportunities with reasons
      const personalizedWithReasons = personalizedOpps.map((opp, index) => ({
        id: `personalized-${index + 1}`,
        ...opp,
        location: ['Jakarta', 'Bandung', 'Surabaya', 'Yogyakarta'][index % 4],
        deadline: `2024-12-${20 + index}T23:59:59`,
        description: `Peluang yang disesuaikan dengan kepribadian ${personalityType} dan minat di bidang ${opp.field}`,
        requirements: ['Sesuai assessment RIASEC', 'Passion di bidang ini', 'Kemampuan komunikasi', 'Teamwork'],
        benefits: ['Pengembangan karier', 'Mentoring', 'Certificate', 'Networking'],
        isRecommended: true,
        isPersonalized: true,
        reason: `Cocok dengan kepribadian ${personalityType} Anda`
      }));

      // Combine with general opportunities
      return [...personalizedWithReasons, ...getMockOpportunities().slice(0, 3)];
    };

    const getMockOpportunities = (): Opportunity[] => [
      {
        id: '1',
        title: 'Software Engineer Intern',
        company: 'TechCorp Indonesia',
        type: 'internship',
        location: 'Jakarta',
        deadline: '2024-12-25T23:59:59',
        description: 'Bergabunglah dengan tim engineering untuk mengembangkan aplikasi mobile dan web',
        requirements: ['React/React Native', 'JavaScript/TypeScript', 'Git', 'Mahasiswa aktif'],
        benefits: ['Stipend 2-3 juta/bulan', 'Mentoring', 'Certificate', 'Networking'],
        isRecommended: true,
        salaryRange: 'Rp 2-3 juta/bulan'
      },
      {
        id: '2',
        title: 'LPDP Scholarship 2025',
        company: 'Lembaga Pengelola Dana Pendidikan',
        type: 'scholarship',
        location: 'Global',
        deadline: '2024-12-15T23:59:59',
        description: 'Beasiswa penuh untuk studi S2/S3 di universitas terbaik dunia',
        requirements: ['GPA min 3.0', 'TOEFL/IELTS', 'Proposal penelitian', 'Komitmen kembali ke Indonesia'],
        benefits: ['Full tuition fee', 'Living allowance', 'Research fund', 'Book allowance'],
        isRecommended: true
      },
      {
        id: '3',
        title: 'UI/UX Designer',
        company: 'Creative Studio',
        type: 'job',
        location: 'Bandung',
        deadline: '2024-12-30T23:59:59',
        description: 'Mencari UI/UX Designer kreatif untuk proyek aplikasi mobile dan website',
        requirements: ['Portfolio design', 'Figma/Adobe XD', '1+ tahun experience', 'Problem solving'],
        benefits: ['Salary kompetitif', 'Remote friendly', 'Health insurance', 'Training budget'],
        salaryRange: 'Rp 6-10 juta/bulan'
      },
      {
        id: '4',
        title: 'Data Science Competition',
        company: 'DataFest Indonesia',
        type: 'competition',
        location: 'Online',
        deadline: '2024-12-20T23:59:59',
        description: 'Kompetisi analisis data untuk prediksi customer behavior',
        requirements: ['Python/R', 'Machine Learning', 'Data visualization', 'Team 3-5 orang'],
        benefits: ['Hadiah 50 juta', 'Certificate', 'Job opportunities', 'Mentoring session']
      },
      {
        id: '5',
        title: 'Google Developer Student Club Lead',
        company: 'Google',
        type: 'internship',
        location: 'Universitas Partner',
        deadline: '2024-12-18T23:59:59',
        description: 'Memimpin komunitas developer di kampus dan mengorganisir event teknologi',
        requirements: ['Leadership skills', 'Programming knowledge', 'Event organizing', 'Communication skills'],
        benefits: ['Google swag', 'Training program', 'Certificate', 'Networking'],
        isRecommended: true
      }
    ];

    const allOpportunities = getPersonalizedOpportunities();
    setOpportunities(allOpportunities);
  };

  useEffect(() => {
    loadUserAssessment();
  }, []);

  useEffect(() => {
    loadOpportunities();
  }, [userAssessment]);

  const filteredOpportunities = opportunities.filter(opportunity => {
    const matchesSearch = opportunity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         opportunity.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         opportunity.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === "all" || opportunity.type === selectedType;
    const matchesLocation = selectedLocation === "all" || opportunity.location === selectedLocation;
    
    return matchesSearch && matchesType && matchesLocation;
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'internship': return 'bg-blue-100 text-blue-800';
      case 'scholarship': return 'bg-green-100 text-green-800';
      case 'job': return 'bg-purple-100 text-purple-800';
      case 'competition': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'internship': return Briefcase;
      case 'scholarship': return GraduationCap;
      case 'job': return Building;
      case 'competition': return Briefcase;
      default: return Briefcase;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'internship': return 'Magang';
      case 'scholarship': return 'Beasiswa';
      case 'job': return 'Kerja';
      case 'competition': return 'Kompetisi';
      default: return type;
    }
  };

  const getDaysRemaining = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleApply = (opportunityId: string) => {
    toast.success("Aplikasi berhasil dikirim!");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Peluang Karir</h1>
        <p className="text-muted-foreground mt-2">
          Temukan peluang magang, beasiswa, pekerjaan, dan kompetisi terbaik
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Cari peluang..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Tipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Tipe</SelectItem>
                <SelectItem value="internship">Magang</SelectItem>
                <SelectItem value="scholarship">Beasiswa</SelectItem>
                <SelectItem value="job">Pekerjaan</SelectItem>
                <SelectItem value="competition">Kompetisi</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedLocation} onValueChange={setSelectedLocation}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Lokasi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Lokasi</SelectItem>
                <SelectItem value="Jakarta">Jakarta</SelectItem>
                <SelectItem value="Bandung">Bandung</SelectItem>
                <SelectItem value="Surabaya">Surabaya</SelectItem>
                <SelectItem value="Online">Online</SelectItem>
                <SelectItem value="Global">Global</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Opportunities Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {filteredOpportunities.map((opportunity) => {
          const TypeIcon = getTypeIcon(opportunity.type);
          const daysRemaining = getDaysRemaining(opportunity.deadline);
          
          return (
            <Card key={opportunity.id} className={`hover:shadow-lg transition-all ${opportunity.isRecommended ? 'ring-2 ring-primary/20' : ''}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <TypeIcon className="w-8 h-8 text-primary" />
                  <div className="flex gap-2">
                    {opportunity.isRecommended && (
                      <Badge className="bg-primary text-primary-foreground">
                        Rekomendasi
                      </Badge>
                    )}
                    {opportunity.isPersonalized && (
                      <Badge variant="outline" className="text-xs">
                        Personal
                      </Badge>
                    )}
                    <Badge className={getTypeColor(opportunity.type)}>
                      {getTypeLabel(opportunity.type)}
                    </Badge>
                  </div>
                </div>
                <CardTitle className="text-xl">{opportunity.title}</CardTitle>
                <CardDescription className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <Building className="w-4 h-4" />
                    {opportunity.company}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    {opportunity.location}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {opportunity.description}
                </p>

                {opportunity.reason && (
                  <div className="text-xs text-primary bg-primary/10 p-2 rounded">
                    💡 {opportunity.reason}
                  </div>
                )}

                {opportunity.salaryRange && (
                  <div className="text-sm">
                    <span className="font-semibold text-primary">{opportunity.salaryRange}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className={daysRemaining <= 3 ? 'text-red-600 font-semibold' : ''}>
                    {daysRemaining > 0 
                      ? `${daysRemaining} hari lagi`
                      : 'Deadline terlewat'}
                  </span>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Persyaratan:</p>
                  <div className="flex flex-wrap gap-1">
                    {opportunity.requirements.slice(0, 3).map((req, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {req}
                      </Badge>
                    ))}
                    {opportunity.requirements.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{opportunity.requirements.length - 3} lainnya
                      </Badge>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium mb-2">Benefit:</p>
                  <div className="flex flex-wrap gap-1">
                    {opportunity.benefits.slice(0, 2).map((benefit, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {benefit}
                      </Badge>
                    ))}
                    {opportunity.benefits.length > 2 && (
                      <Badge variant="secondary" className="text-xs">
                        +{opportunity.benefits.length - 2} lainnya
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  {daysRemaining > 0 && (
                    <Button 
                      onClick={() => handleApply(opportunity.id)}
                      className="flex-1"
                    >
                      Lamar Sekarang
                    </Button>
                  )}
                  <Button variant="outline" size="sm">
                    <ExternalLink className="w-4 h-4 mr-1" />
                    Detail
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredOpportunities.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Tidak ada peluang ditemukan</h3>
            <p className="text-muted-foreground">
              Coba ubah filter pencarian atau tunggu peluang baru
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};