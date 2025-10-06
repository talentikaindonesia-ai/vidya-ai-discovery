import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Target, Users } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-hero">
      {/* Elegant Background Elements */}
      <div className="absolute top-20 right-20 w-72 h-72 bg-secondary/10 rounded-full blur-2xl"></div>
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-primary/8 rounded-full blur-3xl"></div>
      
      <div className="container relative z-10 px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <div className="text-center lg:text-left space-y-8">
            <div className="inline-flex items-center gap-2 bg-secondary-light/80 backdrop-blur-sm px-6 py-3 rounded-full text-foreground text-sm font-medium shadow-soft">
              <Sparkles className="w-4 h-4 text-secondary" />
              Discover your full Potential
            </div>
            
            <h1 className="text-6xl md:text-7xl font-bold text-foreground leading-[1.1] tracking-tight">
              Temukan<br />
              <span className="text-primary">Potensi</span> &<br />
              <span className="text-secondary">Bakatmu</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-xl leading-relaxed">
              Talentika membantu generasi muda menemukan passion dan mengembangkan talenta melalui assessment yang komprehensif dan panduan karir yang personal.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 pt-6">
              <Button 
                variant="hero" 
                size="hero" 
                className="group shadow-floating"
                onClick={() => window.location.href = '/onboarding'}
              >
                Mulai Assessment
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                variant="elegant" 
                size="hero"
                onClick={() => window.open('https://www.instagram.com/talentika.id/', '_blank')}
              >
                Pelajari Lebih Lanjut
              </Button>
            </div>
            
            {/* Professional Stats */}
            <div className="grid grid-cols-3 gap-8 pt-8 max-w-md lg:max-w-none">
              <div className="text-center lg:text-left">
                <div className="text-3xl font-bold text-primary mb-1">10K+</div>
                <div className="text-muted-foreground text-sm font-medium">Siswa Terdampak</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-3xl font-bold text-secondary mb-1">25+</div>
                <div className="text-muted-foreground text-sm font-medium">Bidang Karir</div>
              </div>
              <div className="text-center lg:text-left">
                <div className="text-3xl font-bold text-accent mb-1">95%</div>
                <div className="text-muted-foreground text-sm font-medium">Tingkat Akurasi</div>
              </div>
            </div>
          </div>
          
          {/* Professional Hero Image */}
          <div className="relative">
            <img 
              src="/lovable-uploads/029928be-11a9-49ba-9a70-7dd69aff1316.png" 
              alt="Professional young woman with laptop - Career development and talent discovery" 
              className="w-full max-w-lg mx-auto rounded-2xl relative z-10"
            />
            <div className="absolute inset-0 bg-gradient-secondary opacity-20 rounded-3xl blur-2xl transform scale-110"></div>
          </div>
        </div>
      </div>
      
      {/* Professional Floating Elements */}
      <div className="absolute top-32 right-16 bg-card/80 backdrop-blur-sm p-4 rounded-2xl shadow-soft border border-primary/10 transform rotate-6 hover:rotate-0 transition-transform">
        <Target className="w-6 h-6 text-primary" />
      </div>
      <div className="absolute bottom-32 left-16 bg-card/80 backdrop-blur-sm p-4 rounded-2xl shadow-soft border border-secondary/20 transform -rotate-6 hover:rotate-0 transition-transform">
        <Users className="w-6 h-6 text-secondary" />
      </div>
    </section>
  );
};

export default Hero;