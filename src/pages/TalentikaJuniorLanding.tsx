import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Star, 
  Sparkles, 
  Heart, 
  Palette,
  Microscope,
  Cpu,
  Lightbulb,
  Users,
  Trophy,
  Target,
  School,
  Building2,
  Phone,
  Award,
  MapPin,
  Camera,
  Clock,
  CheckCircle,
  ArrowRight
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import talentikaJuniorLogo from "@/assets/talentika-junior-logo.png";

const TalentikaJuniorLanding = () => {
  const handleWhatsAppPartner = () => {
    const whatsappUrl = `https://wa.me/6285148434141?text=Halo%20Talentika,%20saya%20ingin%20bergabung%20sebagai%20mitra.`;
    window.open(whatsappUrl, '_blank');
  };

  const handleRegister = () => {
    window.location.href = '/auth?redirect=talentika-junior';
  };

  const fields = [
    {
      icon: Microscope,
      title: "Scientist",
      description: "Eksplorasi sains dan penelitian",
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      icon: Cpu,
      title: "Technologist", 
      description: "Teknologi dan inovasi digital",
      color: "text-purple-600",
      bgColor: "bg-purple-100"
    },
    {
      icon: Lightbulb,
      title: "Entrepreneur",
      description: "Kewirausahaan dan bisnis",
      color: "text-orange-600",
      bgColor: "bg-orange-100"
    },
    {
      icon: Palette,
      title: "Creative",
      description: "Seni dan kreativitas",
      color: "text-pink-600",
      bgColor: "bg-pink-100"
    },
    {
      icon: Heart,
      title: "Environmentalist",
      description: "Peduli lingkungan",
      color: "text-green-600",
      bgColor: "bg-green-100"
    }
  ];

  const targetAudience = [
    {
      icon: Users,
      title: "Untuk Anak",
      description: "Main sambil belajar, portofolio digital",
      benefits: ["Challenge seru", "XP & Badge", "Portofolio digital"]
    },
    {
      icon: Heart,
      title: "Untuk Orang Tua", 
      description: "Aktivitas positif, terpantau, punya value nyata",
      benefits: ["Progress terpantau", "Aktivitas edukatif", "Skill terukur"]
    },
    {
      icon: School,
      title: "Untuk Sekolah",
      description: "Field trip edukatif & integrasi pembelajaran",
      benefits: ["Program terintegrasi", "Experience Center", "Modul kurikulum"]
    },
    {
      icon: Building2,
      title: "Untuk Brand",
      description: "CSR & sponsorship dengan impact",
      benefits: ["CSR program", "Brand exposure", "Impact measurement"]
    }
  ];

  const achievements = [
    { name: "Alex S.", achievement: "Jagoan Sains Minggu Ini", xp: 2450, badge: "🔬" },
    { name: "Maya L.", achievement: "Creative Master", xp: 1890, badge: "🎨" },
    { name: "Rio K.", achievement: "Tech Innovator", xp: 2100, badge: "💻" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-24 pb-20 relative overflow-hidden bg-gradient-to-br from-amber-100 via-blue-100 to-orange-100">
        <div className="absolute inset-0 bg-gradient-to-br from-amber-200/50 via-blue-200/40 to-orange-200/50" />
        <div className="absolute inset-0 bg-gradient-to-t from-amber-50/80 via-transparent to-blue-50/60" />
        
        {/* Decorative elements */}
        <div className="absolute top-10 left-10 w-20 h-20 bg-blue-400/30 rounded-full blur-xl animate-pulse" />
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-amber-400/30 rounded-full blur-2xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-orange-400/40 rounded-full blur-lg animate-bounce delay-500" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <img 
                  src={talentikaJuniorLogo} 
                  alt="Talentika Junior Logo" 
                  className="h-24 w-auto mb-4"
                />
                <h1 className="text-4xl lg:text-6xl font-bold">
                  <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    Jelajahi Dunia,
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-accent to-secondary bg-clip-text text-transparent">
                    Temukan Bakatmu,
                  </span>
                  <br />
                  <span className="bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
                    Jadi Jagoan Masa Depan!
                  </span>
                </h1>
                
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Talentika Junior menghadirkan pengalaman belajar interaktif, challenge seru, dan portofolio digital untuk anak-anak Indonesia.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                  onClick={handleRegister}
                >
                  Daftar Sekarang
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="border-primary/20 hover:bg-primary/5"
                  onClick={handleWhatsAppPartner}
                >
                  Bergabung Jadi Mitra
                </Button>
              </div>
            </div>
            
            <div className="relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl transform rotate-2 hover:rotate-0 transition-transform duration-500">
                <img 
                  src="/lovable-uploads/95b023ea-1670-4b3c-bf9d-caf7b5c2cef1.png" 
                  alt="Happy child discovering talents with Talentika Junior"
                  className="w-full h-auto object-cover animate-fade-in"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-amber-500/10 via-transparent to-blue-500/10" />
              </div>
              
              {/* Floating elements */}
              <div className="absolute -top-4 -left-4 w-8 h-8 bg-blue-400 rounded-full animate-bounce delay-100" />
              <div className="absolute -bottom-4 -right-4 w-6 h-6 bg-amber-400 rounded-full animate-bounce delay-300" />
              <div className="absolute top-1/4 -right-6 w-4 h-4 bg-orange-400 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">
              Apa itu <span className="text-primary">Talentika Junior</span>?
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-8">
              Belajar sambil bermain, membangun masa depan dengan sains, teknologi, kreativitas, kewirausahaan, dan peduli lingkungan.
            </p>
          </div>

          <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-6 mb-12">
            {fields.map((field, index) => (
              <Card key={index} className="p-6 text-center hover:shadow-lg transition-shadow duration-300">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full ${field.bgColor} mb-4`}>
                  <field.icon className={`w-8 h-8 ${field.color}`} />
                </div>
                <h3 className="font-bold mb-2">{field.title}</h3>
                <p className="text-sm text-muted-foreground">{field.description}</p>
              </Card>
            ))}
          </div>

          <div className="text-center">
            <Button variant="outline" onClick={() => window.open('https://talentika.id/experience-center', '_blank')}>
              <MapPin className="w-4 h-4 mr-2" />
              Kunjungi Talentika Experience Center
            </Button>
          </div>
        </div>
      </section>

      {/* Challenge & Gamifikasi */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">
              Challenge & <span className="text-primary">Gamifikasi</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Sistem pembelajaran interaktif dengan modul "Si Jagoan Sains" dan bidang lainnya
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="space-y-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Target className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl">Discover</h3>
                    <p className="text-muted-foreground">Eksplorasi minat dan bakat alami</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                    <Lightbulb className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl">Develop</h3>
                    <p className="text-muted-foreground">Kembangkan kemampuan melalui challenge</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                    <Trophy className="w-6 h-6 text-secondary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl">Grow</h3>
                    <p className="text-muted-foreground">Raih pencapaian dan portofolio digital</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold">Progress Journey</h3>
                  <Badge variant="secondary">Level 5</Badge>
                </div>
                <Progress value={75} className="mb-4" />
                <div className="grid grid-cols-4 gap-2">
                  <div className="text-center">
                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold mb-1">XP</div>
                    <p className="text-xs text-muted-foreground">2,450</p>
                  </div>
                  <div className="text-center">
                    <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center text-xs">🏆</div>
                    <p className="text-xs text-muted-foreground">Badges</p>
                  </div>
                  <div className="text-center">
                    <div className="w-8 h-8 rounded-full bg-secondary text-white flex items-center justify-center text-xs">⭐</div>
                    <p className="text-xs text-muted-foreground">Rewards</p>
                  </div>
                  <div className="text-center">
                    <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs">👑</div>
                    <p className="text-xs text-muted-foreground">Wall of Fame</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Experience Center Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">
              <span className="text-primary">Experience Center</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Rasakan keseruan langsung di Talentika Experience Center (bermitra dengan Indonesia Science Center).
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 mb-12">
            <Card className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 mx-auto mb-4 flex items-center justify-center">
                <Target className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-bold text-xl mb-2">Discovery Zone</h3>
              <p className="text-muted-foreground">Eksplorasi interaktif untuk menemukan minat dan bakat</p>
            </Card>

            <Card className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-orange-100 mx-auto mb-4 flex items-center justify-center">
                <Lightbulb className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="font-bold text-xl mb-2">Development Zone</h3>
              <p className="text-muted-foreground">Praktik langsung mengembangkan kemampuan spesifik</p>
            </Card>

            <Card className="p-6 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 mx-auto mb-4 flex items-center justify-center">
                <Trophy className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-bold text-xl mb-2">Growth Zone</h3>
              <p className="text-muted-foreground">Showcase hasil karya dan pencapaian</p>
            </Card>
          </div>

          <div className="text-center">
            <Button size="lg" onClick={() => window.open('https://talentika.id/experience-center', '_blank')}>
              <MapPin className="w-4 h-4 mr-2" />
              Kunjungi Experience Center
            </Button>
          </div>
        </div>
      </section>

      {/* Achievement & Wall of Fame */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">
              Achievement & <span className="text-primary">Wall of Fame</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Showcase karya & prestasi anak-anak Talentika Junior
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-bold mb-6">🏆 Leaderboard Mingguan</h3>
              <div className="space-y-4">
                {achievements.map((achievement, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{achievement.badge}</div>
                        <div>
                          <h4 className="font-bold">{achievement.name}</h4>
                          <p className="text-sm text-muted-foreground">{achievement.achievement}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-primary">{achievement.xp} XP</div>
                        <Badge variant="secondary" className="text-xs">#{index + 1}</Badge>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-2xl font-bold mb-6">📸 Galeri Event</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                    <Camera className="w-12 h-12 text-muted-foreground" />
                  </div>
                  <div className="absolute bottom-2 left-2 right-2">
                    <Badge variant="secondary" className="text-xs">Science Fair 2024</Badge>
                  </div>
                </div>
                <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                  <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center">
                    <Trophy className="w-12 h-12 text-muted-foreground" />
                  </div>
                  <div className="absolute bottom-2 left-2 right-2">
                    <Badge variant="secondary" className="text-xs">Tech Competition</Badge>
                  </div>
                </div>
                <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-teal-500/20 flex items-center justify-center">
                    <Palette className="w-12 h-12 text-muted-foreground" />
                  </div>
                  <div className="absolute bottom-2 left-2 right-2">
                    <Badge variant="secondary" className="text-xs">Creative Workshop</Badge>
                  </div>
                </div>
                <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                    <Award className="w-12 h-12 text-muted-foreground" />
                  </div>
                  <div className="absolute bottom-2 left-2 right-2">
                    <Badge variant="secondary" className="text-xs">Award Ceremony</Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Untuk Siapa? */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">
              Untuk <span className="text-primary">Siapa</span>?
            </h2>
            <p className="text-lg text-muted-foreground">
              Talentika Junior dirancang untuk berbagai kalangan
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {targetAudience.map((audience, index) => (
              <Card key={index} className="p-6 text-center hover:shadow-lg transition-shadow duration-300">
                <div className="w-16 h-16 rounded-full bg-primary/10 mx-auto mb-4 flex items-center justify-center">
                  <audience.icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-bold text-xl mb-2">{audience.title}</h3>
                <p className="text-muted-foreground mb-4">{audience.description}</p>
                <div className="space-y-2">
                  {audience.benefits.map((benefit, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span>{benefit}</span>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Partner & Sponsor Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-6">
              Partner & <span className="text-primary">Sponsor</span>
            </h2>
            <p className="text-lg text-muted-foreground">
              Bergabung dengan mitra terpercaya kami
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 mb-12">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-square bg-background rounded-lg shadow-sm flex items-center justify-center">
                <Building2 className="w-12 h-12 text-muted-foreground" />
              </div>
            ))}
          </div>

          <div className="text-center">
            <Button size="lg" onClick={handleWhatsAppPartner}>
              <Phone className="w-4 h-4 mr-2" />
              Bergabung Jadi Mitra Talentika
            </Button>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl lg:text-5xl font-bold mb-6">
            Ayo Bergabung Bersama <span className="text-primary">Talentika Junior</span>,
            <br />
            Jadi Bagian dari <span className="text-accent">Masa Depan Indonesia</span>!
          </h2>
          
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Mulai perjalanan seru menemukan dan mengembangkan bakat anak sejak dini
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300"
              onClick={handleRegister}
            >
              Daftar Sekarang
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              onClick={handleWhatsAppPartner}
            >
              <Phone className="w-4 h-4 mr-2" />
              Bergabung Jadi Mitra
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default TalentikaJuniorLanding;