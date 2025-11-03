import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { School, Users, BookOpen, BarChart, Award, CheckCircle, ArrowRight, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";

const TalentikaForSchools = () => {
  const navigate = useNavigate();

  const benefits = [
    {
      icon: Users,
      title: "Manajemen Siswa Terpusat",
      description: "Kelola ratusan siswa dengan dashboard admin yang intuitif dan mudah digunakan"
    },
    {
      icon: BarChart,
      title: "Laporan Komprehensif",
      description: "Dapatkan insight mendalam tentang perkembangan dan potensi setiap siswa"
    },
    {
      icon: BookOpen,
      title: "Kurikulum Terintegrasi",
      description: "Konten pembelajaran yang selaras dengan kurikulum nasional dan internasional"
    },
    {
      icon: Award,
      title: "Sertifikasi Digital",
      description: "Berikan sertifikat digital untuk setiap pencapaian siswa"
    }
  ];

  const features = [
    {
      title: "Assessment Bakat Berbasis AI",
      description: "Teknologi AI untuk mengidentifikasi potensi unik setiap siswa",
      items: [
        "Tes kepribadian RIASEC",
        "Analisis minat dan bakat",
        "Rekomendasi karir personal",
        "Tracking perkembangan berkala"
      ]
    },
    {
      title: "Platform Pembelajaran Interaktif",
      description: "Konten pembelajaran yang engaging dan terukur",
      items: [
        "Video pembelajaran berkualitas",
        "Kuis interaktif gamified",
        "Proyek kolaboratif",
        "Community forum siswa"
      ]
    },
    {
      title: "Dashboard Guru & Orang Tua",
      description: "Monitoring real-time untuk semua stakeholder",
      items: [
        "Progress tracking individual",
        "Notifikasi pencapaian",
        "Laporan bulanan otomatis",
        "Komunikasi terintegrasi"
      ]
    }
  ];

  const testimonials = [
    {
      name: "Ibu Siti Nurhaliza",
      role: "Kepala Sekolah SMA Negeri 5 Jakarta",
      content: "Talentika membantu kami memberikan bimbingan karir yang lebih personal untuk 600+ siswa kami. Platform ini sangat user-friendly!",
      rating: 5
    },
    {
      name: "Bapak Ahmad Dahlan",
      role: "Guru BK SMK Harapan Bangsa",
      content: "Dengan Talentika, pekerjaan konseling karir jadi jauh lebih efisien. Data insight yang diberikan sangat membantu.",
      rating: 5
    },
    {
      name: "Dr. Maya Kusuma",
      role: "Koordinator BK SMA Plus Al-Azhar",
      content: "Siswa kami lebih termotivasi belajar dengan sistem gamification. Orang tua juga senang bisa monitor perkembangan anak.",
      rating: 5
    }
  ];

  const pricingPlans = [
    {
      name: "Paket Sekolah Basic",
      price: "Rp 2.500.000",
      period: "/tahun",
      description: "Untuk sekolah hingga 100 siswa",
      features: [
        "Dashboard admin sekolah",
        "Assessment unlimited",
        "Laporan basic",
        "Support email",
        "Akses konten pembelajaran",
        "Sertifikat digital"
      ],
      highlighted: false
    },
    {
      name: "Paket Sekolah Pro",
      price: "Rp 5.000.000",
      period: "/tahun",
      description: "Untuk sekolah hingga 300 siswa",
      features: [
        "Semua fitur Basic",
        "Dashboard guru & orang tua",
        "Laporan advanced & analytics",
        "Priority support",
        "Custom branding sekolah",
        "Training untuk guru BK",
        "Konsultasi bulanan"
      ],
      highlighted: true
    },
    {
      name: "Paket Enterprise",
      price: "Custom",
      period: "sesuai kebutuhan",
      description: "Untuk jaringan sekolah atau yayasan",
      features: [
        "Semua fitur Pro",
        "Unlimited siswa",
        "Dedicated account manager",
        "API integration",
        "Custom development",
        "On-site training",
        "24/7 support"
      ],
      highlighted: false
    }
  ];

  return (
    <>
      <SEO 
        title="Talentika untuk Sekolah - Platform Pengembangan Bakat Siswa"
        description="Solusi lengkap untuk sekolah dalam mengidentifikasi dan mengembangkan potensi siswa dengan teknologi AI. Dashboard admin, assessment, dan laporan komprehensif."
        keywords="talentika sekolah, assessment siswa, bimbingan karir sekolah, platform edukasi, manajemen siswa"
      />
      <Header />
      
      <main className="min-h-screen">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-primary/10 via-background to-secondary/10 pt-32 pb-20 overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern opacity-5" />
          <div className="container relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              <Badge className="mb-6 text-lg px-4 py-2">
                <School className="w-4 h-4 mr-2" />
                Solusi untuk Institusi Pendidikan
              </Badge>
              <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Talentika untuk Sekolah
              </h1>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                Platform komprehensif untuk mengidentifikasi, mengembangkan, dan melacak potensi unik setiap siswa dengan teknologi AI
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="text-lg px-8 py-6" onClick={() => navigate('/auth')}>
                  Daftar Sekolah Anda
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                  Jadwalkan Demo
                </Button>
              </div>
              <p className="mt-6 text-sm text-muted-foreground">
                Dipercaya oleh 100+ sekolah di seluruh Indonesia
              </p>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 bg-background">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">Mengapa Sekolah Memilih Talentika?</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Solusi all-in-one untuk bimbingan karir dan pengembangan siswa
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit, index) => (
                <Card key={index} className="p-6 hover:shadow-lg transition-all hover:scale-105">
                  <benefit.icon className="w-12 h-12 text-primary mb-4" />
                  <h3 className="text-xl font-bold mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-muted/30">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">Fitur Lengkap untuk Sekolah</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Platform yang dirancang khusus untuk kebutuhan institusi pendidikan
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <Card key={index} className="p-8">
                  <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground mb-6">{feature.description}</p>
                  <ul className="space-y-3">
                    {feature.items.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 bg-background">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">Apa Kata Mereka?</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Testimoni dari pendidik yang telah menggunakan Talentika
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="p-6">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4 italic">"{testimonial.content}"</p>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-20 bg-muted/30">
          <div className="container">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">Paket Harga untuk Sekolah</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Pilih paket yang sesuai dengan kebutuhan sekolah Anda
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {pricingPlans.map((plan, index) => (
                <Card 
                  key={index} 
                  className={`p-8 relative ${plan.highlighted ? 'border-primary border-2 shadow-lg scale-105' : ''}`}
                >
                  {plan.highlighted && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
                      Paling Populer
                    </Badge>
                  )}
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <p className="text-muted-foreground text-sm mb-4">{plan.description}</p>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground">{plan.period}</span>
                    </div>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className="w-full" 
                    variant={plan.highlighted ? "default" : "outline"}
                    onClick={() => navigate('/auth')}
                  >
                    {plan.price === "Custom" ? "Hubungi Kami" : "Pilih Paket Ini"}
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-primary to-secondary text-white">
          <div className="container text-center">
            <h2 className="text-4xl font-bold mb-4">Siap Transformasi Sekolah Anda?</h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
              Bergabunglah dengan ratusan sekolah yang telah meningkatkan kualitas bimbingan karir siswa mereka
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-6" onClick={() => navigate('/auth')}>
                Daftar Sekarang
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 bg-white/10 hover:bg-white/20 text-white border-white">
                Konsultasi Gratis
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default TalentikaForSchools;
