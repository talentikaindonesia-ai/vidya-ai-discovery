import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Play, Clock, BookOpen, Search, Filter, MessageSquare, Briefcase, Leaf, Globe, Cpu, TreePine, Lightbulb, Heart, ArrowRight, Users, Code, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getUserSubscriptionInfo } from "@/lib/subscription";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { BottomNavigationBar } from "@/components/dashboard/BottomNavigationBar";

interface CourseCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  courses: Course[];
}

interface Course {
  id: string;
  title: string;
  description: string;
  project: string;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  isRecommended?: boolean;
}

const LearningHub = () => {
  const [user, setUser] = useState<any>(null);
  const [activeSection, setActiveSection] = useState("courses");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const courseCategories: CourseCategory[] = [
    {
      id: "life-skills",
      title: "Life Skills",
      description: "Keterampilan hidup fundamental untuk masa depan",
      icon: Heart,
      color: "bg-rose-500",
      courses: [
        {
          id: "communication",
          title: "Komunikasi Efektif & Public Speaking",
          description: "Belajar berbicara di depan umum dengan percaya diri",
          project: "Membuat podcast/video 5 menit tentang isu sosial",
          duration: "2 minggu",
          difficulty: "beginner",
          isRecommended: true
        },
        {
          id: "leadership",
          title: "Kepemimpinan & Kerja Tim",
          description: "Mengembangkan jiwa kepemimpinan dan kolaborasi",
          project: "Simulasi community project (kegiatan bakti sosial sekolah)",
          duration: "3 minggu",
          difficulty: "intermediate"
        },
        {
          id: "financial-literacy",
          title: "Literasi Keuangan",
          description: "Mengelola keuangan dengan bijak sejak dini",
          project: "Simulasi membuat anggaran keluarga/UKM mini",
          duration: "2 minggu",
          difficulty: "beginner"
        },
        {
          id: "problem-solving",
          title: "Problem Solving & Critical Thinking",
          description: "Mengasah kemampuan berpikir kritis dan memecahkan masalah",
          project: "Studi kasus: mengurangi sampah plastik di sekolah",
          duration: "2 minggu",
          difficulty: "intermediate"
        }
      ]
    },
    {
      id: "digital-skills",
      title: "Digital Skills",
      description: "Keterampilan digital untuk era modern",
      icon: Code,
      color: "bg-blue-500",
      courses: [
        {
          id: "graphic-design",
          title: "Desain Grafis",
          description: "Membuat karya visual yang menarik dan profesional",
          project: "Buat poster digital untuk kampanye sekolah/lingkungan",
          duration: "3 minggu",
          difficulty: "beginner",
          isRecommended: true
        },
        {
          id: "coding-basics",
          title: "Coding Dasar",
          description: "Pengenalan pemrograman dengan bahasa yang mudah dipahami",
          project: "Bikin game sederhana dengan Scratch/Python",
          duration: "4 minggu",
          difficulty: "beginner"
        },
        {
          id: "digital-marketing",
          title: "Digital Marketing",
          description: "Strategi pemasaran digital untuk generasi Z",
          project: "Jalankan mini campaign IG/TikTok untuk produk/jasa lokal",
          duration: "3 minggu",
          difficulty: "intermediate"
        },
        {
          id: "data-literacy",
          title: "Data Literacy",
          description: "Memahami dan menganalisis data dengan mudah",
          project: "Analisis data sederhana: survei minat siswa di sekolah",
          duration: "2 minggu",
          difficulty: "intermediate"
        }
      ]
    },
    {
      id: "vocational-skills",
      title: "Vocational Skills",
      description: "Keterampilan vokasional yang praktis dan aplikatif",
      icon: Briefcase,
      color: "bg-orange-500",
      courses: [
        {
          id: "culinary",
          title: "Tata Boga",
          description: "Seni memasak dan mengelola bisnis kuliner",
          project: "Buka pop-up cafe di sekolah untuk sehari",
          duration: "4 minggu",
          difficulty: "beginner"
        },
        {
          id: "fashion-design",
          title: "Fashion Design & Menjahit",
          description: "Merancang dan membuat busana dengan kreativitas",
          project: "Lomba upcycle pakaian bekas jadi produk baru",
          duration: "5 minggu",
          difficulty: "intermediate"
        },
        {
          id: "agribusiness",
          title: "Agribisnis",
          description: "Bisnis pertanian modern dan berkelanjutan",
          project: "Buat kebun hidroponik mini & jual hasil panen",
          duration: "6 minggu",
          difficulty: "beginner"
        },
        {
          id: "automotive",
          title: "Otomotif Dasar",
          description: "Pemahaman dasar sistem kendaraan bermotor",
          project: "Simulasi bengkel kecil (service sepeda motor sekolah)",
          duration: "4 minggu",
          difficulty: "intermediate"
        }
      ]
    },
    {
      id: "entrepreneurship",
      title: "Entrepreneurship & Business",
      description: "Jiwa wirausaha dan keterampilan bisnis",
      icon: TrendingUp,
      color: "bg-green-500",
      courses: [
        {
          id: "business-model",
          title: "Business Model Canvas",
          description: "Merancang model bisnis yang solid dan terukur",
          project: "Susun BMC untuk ide usaha siswa",
          duration: "2 minggu",
          difficulty: "beginner",
          isRecommended: true
        },
        {
          id: "product-innovation",
          title: "Inovasi Produk & Prototyping",
          description: "Mengembangkan produk inovatif dari ide hingga prototype",
          project: "Kembangkan prototipe produk dengan barang sederhana",
          duration: "4 minggu",
          difficulty: "intermediate"
        },
        {
          id: "pitching",
          title: "Pitching",
          description: "Mempresentasikan ide bisnis dengan meyakinkan",
          project: "Presentasi ide bisnis ke 'investor' (guru, orang tua, komunitas)",
          duration: "2 minggu",
          difficulty: "intermediate"
        },
        {
          id: "export-business",
          title: "Ekspor & Go Global",
          description: "Memahami pasar global dan strategi ekspor",
          project: "Riset produk lokal & buat export readiness plan",
          duration: "3 minggu",
          difficulty: "advanced"
        }
      ]
    },
    {
      id: "green-skills",
      title: "Green Skills & Sustainability",
      description: "Keterampilan untuk masa depan yang berkelanjutan",
      icon: TreePine,
      color: "bg-emerald-500",
      courses: [
        {
          id: "waste-management",
          title: "Pengelolaan Sampah",
          description: "Mengelola sampah dengan prinsip reduce, reuse, recycle",
          project: "Mendirikan bank sampah di sekolah/komunitas",
          duration: "3 minggu",
          difficulty: "beginner"
        },
        {
          id: "renewable-energy",
          title: "Energi Terbarukan",
          description: "Memahami dan memanfaatkan energi ramah lingkungan",
          project: "Membuat panel surya mini/lampu tenaga surya sederhana",
          duration: "4 minggu",
          difficulty: "intermediate"
        },
        {
          id: "urban-farming",
          title: "Urban Farming",
          description: "Bertani di lahan terbatas dengan teknik modern",
          project: "Kebun vertikal di sekolah",
          duration: "5 minggu",
          difficulty: "beginner"
        },
        {
          id: "eco-entrepreneurship",
          title: "Eco-Entrepreneurship",
          description: "Bisnis yang menguntungkan dan ramah lingkungan",
          project: "Membuat produk ramah lingkungan & dijual di bazaar sekolah",
          duration: "4 minggu",
          difficulty: "intermediate"
        }
      ]
    },
    {
      id: "soft-skills",
      title: "Soft Skills untuk Dunia Kerja",
      description: "Persiapan memasuki dunia profesional",
      icon: Users,
      color: "bg-purple-500",
      courses: [
        {
          id: "career-preparation",
          title: "Persiapan Karir",
          description: "Mempersiapkan diri untuk dunia kerja profesional",
          project: "Buat CV, LinkedIn, & mock interview",
          duration: "2 minggu",
          difficulty: "beginner",
          isRecommended: true
        },
        {
          id: "networking-branding",
          title: "Networking & Branding",
          description: "Membangun jaringan dan personal branding yang kuat",
          project: "Susun portfolio online",
          duration: "3 minggu",
          difficulty: "intermediate"
        },
        {
          id: "project-management",
          title: "Project Management",
          description: "Mengelola proyek dari perencanaan hingga eksekusi",
          project: "Jalankan event nyata (pameran, lomba, expo kecil)",
          duration: "4 minggu",
          difficulty: "intermediate"
        },
        {
          id: "service-excellence",
          title: "Service Excellence",
          description: "Memberikan pelayanan terbaik kepada pelanggan",
          project: "Simulasi melayani pelanggan (role-play restoran/hotel)",
          duration: "2 minggu",
          difficulty: "beginner"
        }
      ]
    },
    {
      id: "steam-skills",
      title: "21st Century STEAM Skills",
      description: "Integrasi sains, teknologi, engineering, seni, dan matematika",
      icon: Cpu,
      color: "bg-indigo-500",
      courses: [
        {
          id: "robotics",
          title: "Robotics Dasar",
          description: "Pengenalan dunia robotika dan automasi",
          project: "Membuat robot line follower sederhana",
          duration: "5 minggu",
          difficulty: "intermediate"
        },
        {
          id: "game-based-learning",
          title: "Game-Based Learning",
          description: "Belajar melalui permainan yang edukatif",
          project: "Membuat boardgame edukasi",
          duration: "3 minggu",
          difficulty: "beginner"
        },
        {
          id: "ar-vr-education",
          title: "AR/VR untuk Edukasi",
          description: "Teknologi immersive untuk pembelajaran",
          project: "Buat AR sederhana pakai Assemblr",
          duration: "4 minggu",
          difficulty: "advanced"
        },
        {
          id: "steam-interdisciplinary",
          title: "STEAM Interdisipliner",
          description: "Menggabungkan berbagai disiplin ilmu dalam proyek",
          project: "Pameran karya gabungan sains, seni, teknologi",
          duration: "6 minggu",
          difficulty: "advanced"
        }
      ]
    },
    {
      id: "community-skills",
      title: "Community & Civic Skills",
      description: "Keterampilan untuk berkontribusi pada masyarakat",
      icon: Globe,
      color: "bg-teal-500",
      courses: [
        {
          id: "community-organizing",
          title: "Community Organizing",
          description: "Mengorganisir dan memobilisasi komunitas",
          project: "Buat program sosial lokal (literasi anak kecil di sekitar sekolah)",
          duration: "4 minggu",
          difficulty: "intermediate"
        },
        {
          id: "disaster-preparedness",
          title: "Disaster Preparedness",
          description: "Kesiapsiagaan menghadapi bencana alam",
          project: "Simulasi tanggap bencana di sekolah",
          duration: "2 minggu",
          difficulty: "beginner"
        },
        {
          id: "youth-empowerment",
          title: "Youth Empowerment",
          description: "Memberdayakan generasi muda untuk perubahan positif",
          project: "Adakan youth talkshow atau webinar SDGs",
          duration: "3 minggu",
          difficulty: "intermediate"
        }
      ]
    }
  ];

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/auth';
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyLabel = (level: string) => {
    switch (level) {
      case 'beginner': return 'Pemula';
      case 'intermediate': return 'Menengah';
      case 'advanced': return 'Lanjutan';
      default: return 'Tidak Diketahui';
    }
  };

  const filteredCategories = courseCategories.filter(category => 
    category.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.courses.some(course => 
      course.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const recommendedCourses = courseCategories.flatMap(category => 
    category.courses.filter(course => course.isRecommended)
      .map(course => ({ ...course, categoryTitle: category.title, categoryColor: category.color }))
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        <DashboardSidebar
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          onSignOut={handleSignOut}
        />
        
        <main className="flex-1 overflow-hidden pb-20 md:pb-0">
          <div className="w-full max-w-none px-4 md:px-6">
            {/* Header */}
            <div className="mb-6 md:mb-8 pt-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold">Kursus Pembelajaran</h1>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Muhammad Dafa</span>
                  <Badge variant="outline" className="text-xs">Individual</Badge>
                </div>
              </div>
              
              {/* Search Bar */}
              <div className="flex items-center gap-2 md:gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Cari kursus atau kategori..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" size="icon">
                  <Filter className="w-4 h-4" />
                </Button>
              </div>

              {/* Recommended Courses */}
              {recommendedCourses.length > 0 && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-yellow-500" />
                      Rekomendasi untuk Anda
                    </CardTitle>
                    <CardDescription>
                      Kursus yang dipersonalisasi berdasarkan minat dan kemampuan Anda
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {recommendedCourses.map((course) => (
                        <Card 
                          key={course.id} 
                          className="cursor-pointer hover:shadow-md transition-shadow"
                          onClick={() => navigate(`/learning/content/${course.id}`)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <Badge className={course.categoryColor + " text-white text-xs"}>
                                {course.categoryTitle}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                Rekomendasi
                              </Badge>
                            </div>
                            <h3 className="font-semibold text-sm mb-2">{course.title}</h3>
                            <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                              {course.description}
                            </p>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{course.duration}</span>
                              </div>
                              <Badge className={getDifficultyColor(course.difficulty)}>
                                {getDifficultyLabel(course.difficulty)}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Course Categories Overview */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">Kategori Pembelajaran</CardTitle>
                  <CardDescription>
                    Pilih kategori yang sesuai dengan minat dan tujuan karirmu
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {courseCategories.map((category) => (
                      <Card key={category.id} className="cursor-pointer hover:shadow-md transition-all hover:-translate-y-1 text-center">
                        <CardContent className="p-4">
                          <div className={`p-3 rounded-lg ${category.color} text-white w-fit mx-auto mb-3`}>
                            <category.icon className="w-6 h-6" />
                          </div>
                          <h3 className="font-semibold text-sm mb-2">{category.title}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {category.description}
                          </p>
                          <div className="mt-3 text-xs text-muted-foreground">
                            {category.courses.length} kursus tersedia
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
        
        <BottomNavigationBar />
      </div>
    </SidebarProvider>
  );
};

export default LearningHub;