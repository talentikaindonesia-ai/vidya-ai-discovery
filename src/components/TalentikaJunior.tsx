import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Star, Sparkles, Heart, Palette } from "lucide-react";

const TalentikaJunior = () => {
  const features = [
    {
      icon: Star,
      title: "Eksplorasi Minat",
      description: "Membantu anak menemukan passion mereka melalui beragam aktivitas menarik"
    },
    {
      icon: Sparkles,
      title: "Pengembangan Bakat", 
      description: "Mengasah kemampuan unik setiap anak dengan pendekatan yang menyenangkan"
    },
    {
      icon: Heart,
      title: "Pendekatan Personal",
      description: "Setiap anak diperlakukan sebagai individu dengan kebutuhan yang berbeda"
    },
    {
      icon: Palette,
      title: "Kreativitas Tanpa Batas",
      description: "Memberikan ruang bebas untuk anak mengekspresikan diri mereka"
    }
  ];

  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background with gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-secondary/20 via-accent/10 to-primary/5" />
      
      {/* Decorative elements */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-accent/20 rounded-full blur-xl" />
      <div className="absolute bottom-10 right-10 w-32 h-32 bg-primary/10 rounded-full blur-2xl" />
      <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-secondary/30 rounded-full blur-lg" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content Section */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-4xl lg:text-5xl font-bold text-foreground">
                Talentika Junior: 
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent block">
                  Discover, Explore, and Shine!
                </span>
              </h2>
              
              <p className="text-lg text-muted-foreground leading-relaxed">
                Talentika Junior hadir untuk menumbuhkan potensi anak sejak dini melalui pendekatan minat, bakat, dan eksplorasi diri. Kami percaya setiap anak punya keunikan, dan dengan ruang yang tepat mereka bisa berkembang menjadi bintang masa depan.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid sm:grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <Card key={index} className="p-4 border-0 bg-card/50 backdrop-blur-sm hover:bg-card/80 transition-all duration-300 group">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <feature.icon className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button size="lg" className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground font-medium shadow-lg hover:shadow-xl transition-all duration-300">
                Mulai Eksplorasi Gratis
              </Button>
              <Button variant="outline" size="lg" className="border-primary/20 hover:bg-primary/5">
                Pelajari Lebih Lanjut
              </Button>
            </div>
          </div>

          {/* Image Section */}
          <div className="relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl transform rotate-2 hover:rotate-0 transition-transform duration-500">
              <img 
                src="/lovable-uploads/d3833557-6c75-4159-adea-99cbc2ef3f6d.png" 
                alt="Happy child discovering talents with Talentika Junior"
                className="w-full h-auto object-cover"
              />
              {/* Overlay gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
            </div>
            
            {/* Floating elements */}
            <div className="absolute -top-4 -left-4 w-8 h-8 bg-accent rounded-full animate-bounce delay-100" />
            <div className="absolute -bottom-4 -right-4 w-6 h-6 bg-primary rounded-full animate-bounce delay-300" />
            <div className="absolute top-1/4 -right-6 w-4 h-4 bg-secondary rounded-full animate-pulse" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default TalentikaJunior;