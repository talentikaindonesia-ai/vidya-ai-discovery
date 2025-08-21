import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Brain, 
  Compass, 
  Target, 
  Users, 
  TrendingUp, 
  Award,
  ArrowRight 
} from "lucide-react";

const Features = () => {
  const features = [
    {
      icon: Brain,
      title: "Tes Minat & Bakat",
      description: "Tes psikometri berbasis Holland, MBTI, dan Multiple Intelligences dengan UI yang interaktif dan gamified.",
      color: "bg-primary/10 text-primary"
    },
    {
      icon: Compass,
      title: "Eksplorasi Bidang",
      description: "Jelajahi berbagai bidang studi dan profesi yang sesuai dengan hasil tes minat dan bakatmu.",
      color: "bg-secondary/10 text-secondary"
    },
    {
      icon: Target,
      title: "Rekomendasi Personal",
      description: "Dapatkan rekomendasi kursus, workshop, dan proyek yang disesuaikan dengan minat dan bakatmu.",
      color: "bg-accent/10 text-accent-foreground"
    },
    {
      icon: Users,
      title: "Komunitas Belajar",
      description: "Bergabung dengan komunitas pelajar dan mahasiswa untuk berbagi pengalaman dan tips belajar.",
      color: "bg-primary/10 text-primary"
    },
    {
      icon: TrendingUp,
      title: "Progress Tracking",
      description: "Pantau perkembangan skill dan capai milestone pribadi dengan sistem tracking yang motivasi.",
      color: "bg-secondary/10 text-secondary"
    },
    {
      icon: Award,
      title: "Gamifikasi Belajar",
      description: "Sistem poin, badge, dan tantangan mingguan yang membuat proses eksplorasi jadi lebih seru.",
      color: "bg-accent/10 text-accent-foreground"
    }
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Fitur Unggulan <span className="text-primary">Vidya</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Temukan dan kembangkan potensimu dengan fitur-fitur canggih yang dibuat khusus untuk perjalanan eksplorasi minat dan bakatmu.
          </p>
        </div>
        
        {/* Desktop Grid */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-card transition-all duration-300 hover:-translate-y-2 bg-card border-primary/10"
            >
              <CardHeader className="pb-4">
                <div className={`inline-flex w-12 h-12 items-center justify-center rounded-xl ${feature.color} mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Mobile Carousel */}
        <div className="md:hidden">
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="min-w-[280px] flex-shrink-0 snap-start group hover:shadow-card transition-all duration-300 bg-card border-primary/10"
              >
                <CardHeader className="pb-4">
                  <div className={`inline-flex w-12 h-12 items-center justify-center rounded-xl ${feature.color} mb-4 group-hover:scale-110 transition-transform`}>
                    <feature.icon className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-center text-sm text-muted-foreground mt-4">← Geser untuk melihat fitur lainnya →</p>
        </div>
        
        <div className="text-center mt-16">
          <Button 
            variant="floating" 
            size="hero" 
            className="group"
            onClick={() => window.location.href = '/assessment'}
          >
            Mulai Test Minat Bakat
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Features;