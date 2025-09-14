import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { CheckCircle, ArrowRight, PlayCircle } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import type { CarouselApi } from "@/components/ui/carousel";

const HowItWorks = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [api, setApi] = useState<CarouselApi>();

  const onSelect = useCallback(() => {
    if (!api) return;
    setCurrentSlide(api.selectedScrollSnap());
  }, [api]);

  useEffect(() => {
    if (!api) return;
    
    onSelect();
    api.on("select", onSelect);
    api.on("reInit", onSelect);
    
    return () => {
      api.off("select", onSelect);
      api.off("reInit", onSelect);
    };
  }, [api, onSelect]);
  
  const steps = [
    {
      number: "01",
      title: "Daftar & Setup Profil",
      description: "Buat akun dan lengkapi informasi dasar seperti umur, pendidikan, dan minat awal.",
      highlight: "Hanya 2 menit!"
    },
    {
      number: "02", 
      title: "Ikuti Tes Minat & Bakat",
      description: "Selesaikan tes psikometri yang fun dan interaktif untuk mengidentifikasi potensimu.",
      highlight: "5 menit"
    },
    {
      number: "03",
      title: "Dapatkan Hasil Personal",
      description: "Terima peta minat & bakat visual yang detail plus rekomendasi bidang yang cocok.",
      highlight: "Hasil Instan"
    },
    {
      number: "04",
      title: "Jelajahi & Kembangkan",
      description: "Eksplorasi bidang yang disarankan dan ikuti aktivitas untuk mengembangkan skill.",
      highlight: "Seumur Hidup!"
    }
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="container px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Bagaimana Cara <span className="text-primary">Kerjanya?</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Proses eksplorasi minat dan bakat yang mudah, cepat, dan menyenangkan dalam 4 langkah sederhana.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <Carousel 
            className="w-full"
            opts={{
              align: "start",
              loop: true,
            }}
            setApi={setApi}
          >
            <CarouselContent>
              {steps.map((step, index) => (
                <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                  <div className="p-2">
                    <Card className={`bg-gradient-card border-primary/10 shadow-card hover:shadow-floating transition-all duration-300 h-full ${
                      currentSlide === index ? 'ring-2 ring-primary/50 border-primary/30' : ''
                    }`}>
                      <CardContent className="p-6">
                        <div className="flex flex-col items-center text-center gap-4">
                          {/* Step Number */}
                          <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-soft">
                            {step.number}
                          </div>
                          
                          {/* Content */}
                          <div className="space-y-3">
                            <h3 className="text-lg font-bold text-foreground">
                              {step.title}
                            </h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                              {step.description}
                            </p>
                            <span className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-medium">
                              <CheckCircle className="w-3 h-3" />
                              {step.highlight}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex" />
            <CarouselNext className="hidden md:flex" />
          </Carousel>
          
          {/* Dots indicator for mobile */}
          <div className="flex justify-center mt-6 gap-2 md:hidden">
            {steps.map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 rounded-full transition-all ${
                  currentSlide === index ? 'bg-primary w-6' : 'bg-primary/30'
                }`}
                onClick={() => api?.scrollTo(index)}
              />
            ))}
          </div>
        </div>

        <div className="text-center mt-16">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="hero" className="group" onClick={() => window.location.href = '/onboarding'}>
              Mulai Sekarang
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="soft" size="hero" className="group">
              <PlayCircle className="w-5 h-5 mr-2" />
              Tonton Demo
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;