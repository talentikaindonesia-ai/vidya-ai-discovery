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
    <section className="py-20 relative overflow-hidden bg-gradient-to-br from-amber-100 via-blue-100 to-orange-100">
      {/* Enhanced background with vibrant gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-200/50 via-blue-200/40 to-orange-200/50" />
      
      {/* Additional overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-t from-amber-50/80 via-transparent to-blue-50/60" />
      
      {/* Decorative elements */}
      <div className="absolute top-10 left-10 w-20 h-20 bg-blue-400/30 rounded-full blur-xl animate-pulse" />
      <div className="absolute bottom-10 right-10 w-32 h-32 bg-amber-400/30 rounded-full blur-2xl animate-pulse delay-1000" />
      <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-orange-400/40 rounded-full blur-lg animate-bounce delay-500" />
      
      {/* Additional decorative circles */}
      <div className="absolute top-20 right-1/4 w-12 h-12 bg-blue-300/25 rounded-full blur-md animate-pulse delay-700" />
      <div className="absolute bottom-20 left-1/3 w-10 h-10 bg-amber-300/35 rounded-full blur-sm animate-bounce delay-200" />
      
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
                Talentika Junior hadir untuk menumbuhkan potensi anak sejak dini melalui pendekatan minat, bakat, dan eksplorasi diri. Dengan 5 program utama yang dirancang khusus untuk anak-anak: Discover (temukan bakat), Learn (belajar menyenangkan), Play (game edukatif), Rewards (kumpulkan badge), dan Recent Adventures (pantau progress).
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={() => window.location.href = '/auth?redirect=talentika-junior'}
              >
                Mulai Eksplorasi Gratis
              </Button>
              <Button variant="outline" size="lg" className="border-primary/20 hover:bg-primary/5">
                Pelajari Lebih Lanjut
              </Button>
            </div>
          </div>

          {/* Image Section */}
          <div className="relative">
            <div className="relative rounded-3xl overflow-hidden shadow-2xl transform rotate-2 hover:rotate-0 transition-transform duration-500 hover-scale">
              <img 
                src="/lovable-uploads/95b023ea-1670-4b3c-bf9d-caf7b5c2cef1.png" 
                alt="Happy child discovering talents with Talentika Junior"
                className="w-full h-auto object-cover animate-fade-in"
              />
              {/* Overlay gradient */}
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
  );
};

export default TalentikaJunior;