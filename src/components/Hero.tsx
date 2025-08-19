import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Target, Users } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-primary">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-primary/90"></div>
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-secondary/10 rounded-full blur-3xl"></div>
      
      <div className="container relative z-10 px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="text-center lg:text-left space-y-8">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-white text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              Temukan Potensi Tersembunyimu
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-white leading-tight">
              Kenali <span className="text-accent-light">Minat</span> &<br />
              Kembangkan <span className="text-secondary-light">Bakatmu</span>
            </h1>
            
            <p className="text-xl text-white/90 max-w-lg">
              Vidya membantu pelajar dan mahasiswa menemukan passion mereka melalui tes psikometri yang fun dan rekomendasi yang personal.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button 
                variant="hero" 
                size="hero" 
                className="group"
                onClick={() => window.location.href = '/assessment'}
              >
                Mulai Tes Sekarang
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="soft" size="hero">
                Lihat Demo
              </Button>
            </div>
            
            {/* Stats */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-8 pt-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">10K+</div>
                <div className="text-white/80 text-sm">Pengguna Aktif</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">25+</div>
                <div className="text-white/80 text-sm">Bidang Eksplorasi</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white">95%</div>
                <div className="text-white/80 text-sm">Tingkat Kepuasan</div>
              </div>
            </div>
          </div>
          
          {/* Hero Image */}
          <div className="relative">
            <div className="relative z-10">
              <img 
                src={heroImage} 
                alt="Vidya - Eksplorasi Minat dan Bakat" 
                className="w-full max-w-lg mx-auto rounded-3xl shadow-floating"
              />
            </div>
            <div className="absolute inset-0 bg-secondary/30 opacity-30 rounded-3xl blur-xl transform scale-105"></div>
          </div>
        </div>
      </div>
      
      {/* Floating Elements */}
      <div className="absolute top-20 right-10 bg-white/20 backdrop-blur-sm p-4 rounded-2xl transform rotate-12 animate-pulse">
        <Target className="w-8 h-8 text-white" />
      </div>
      <div className="absolute bottom-20 left-10 bg-white/20 backdrop-blur-sm p-4 rounded-2xl transform -rotate-12 animate-pulse delay-1000">
        <Users className="w-8 h-8 text-white" />
      </div>
    </section>
  );
};

export default Hero;