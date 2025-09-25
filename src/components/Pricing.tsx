import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Check, Star, Users, BookOpen, Award, Shield } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import type { CarouselApi } from "@/components/ui/carousel";

const Pricing = () => {
  const [currentSlide, setCurrentSlide] = useState(1); // Start with Premium (middle)
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
  
  const handleWhatsAppContact = () => {
    window.open('https://wa.me/6285155556666?text=Halo%20Talentika%2C%20saya%20tertarik%20dengan%20paket%20sekolah%20untuk%20institusi%20pendidikan', '_blank');
  };
  
  const plans = [
    {
      name: "Individual",
      price: "39,000",
      period: "/bulan",
      description: "Cocok untuk siswa dan mahasiswa yang ingin mengembangkan potensi diri",
      features: [
        "Tes minat & bakat komprehensif",
        "Assessment kepribadian & learning style", 
        "Rekomendasi jurusan & karir",
        "Akses ke 50+ course online",
        "Progress tracking & analytics",
        "1x konsultasi karir per bulan",
        "Community forum access"
      ],
      benefit: "Temukan passion dan potensi terbaik Anda dengan panduan yang tepat.",
      popular: false,
      icon: BookOpen,
      color: "primary"
    },
    {
      name: "Premium",
      price: "99,000", 
      period: "/bulan",
      description: "Untuk yang serius mengembangkan karir dan membangun networking profesional",
      features: [
        "Semua fitur Individual",
        "Unlimited konsultasi dengan mentor",
        "Akses ke program mentorship",
        "Portfolio builder & review",
        "Networking events & workshops",
        "Job placement assistance",
        "Sertifikat keahlian terverifikasi",
        "Priority support 24/7"
      ],
      benefit: "Percepat karir Anda dengan mentorship dan networking berkualitas tinggi.",
      popular: true,
      icon: Star,
      color: "accent"
    },
    {
      name: "School Package",
      price: "Hubungi",
      period: "Kami",
      description: "Solusi lengkap untuk sekolah dan institusi pendidikan",
      features: [
        "Dashboard admin untuk sekolah",
        "Bulk assessment untuk seluruh siswa",
        "Analytics & reporting mendalam", 
        "Custom branding sekolah",
        "Training untuk guru & konselor",
        "Integration dengan sistem sekolah",
        "Dedicated account manager",
        "Custom workshop & seminar"
      ],
      benefit: "Tingkatkan kualitas bimbingan karir siswa dengan data yang komprehensif.",
      popular: false,
      icon: Users,
      color: "secondary",
      isWhatsApp: true
    }
  ];

  return (
    <section className="py-24 bg-gradient-to-br from-background via-accent-light/30 to-secondary-light/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm font-medium">
            <Award className="w-4 h-4 mr-2" />
            Paket Berlangganan
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
            Pilih Paket yang Tepat
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Mulai perjalanan penemuan minat dan bakat Anda dengan paket yang sesuai kebutuhan
          </p>
        </div>

        <div className="max-w-7xl mx-auto">
          <Carousel 
            className="w-full"
            opts={{
              align: "center",
              loop: true,
            }}
            setApi={setApi}
          >
            <CarouselContent>
              {plans.map((plan, index) => {
                const IconComponent = plan.icon;
                return (
                  <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                    <div className="p-2">
                      <Card 
                        className={`relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-floating h-full ${
                          plan.popular || currentSlide === index
                            ? 'border-2 border-primary shadow-floating ring-2 ring-primary/20' 
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        {plan.popular && (
                          <div className="absolute top-0 left-0 right-0 bg-gradient-primary text-white text-center py-2 text-sm font-semibold">
                            <Star className="w-4 h-4 inline mr-1" />
                            Paling Populer
                          </div>
                        )}
                        
                        <CardHeader className={`text-center pb-8 ${plan.popular ? 'pt-12' : 'pt-8'}`}>
                          <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-${plan.color} flex items-center justify-center shadow-soft`}>
                            <IconComponent className="w-8 h-8 text-white" />
                          </div>
                          <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                          <div className="flex items-center justify-center gap-1 mb-4">
                            <span className="text-3xl font-bold text-primary">Rp{plan.price}</span>
                            <span className="text-muted-foreground">{plan.period}</span>
                          </div>
                          <CardDescription className="text-base leading-relaxed mb-4">
                            {plan.description}
                          </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-4">
                          {plan.features.map((feature, featureIndex) => (
                            <div key={featureIndex} className="flex items-center gap-3">
                              <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <Check className="w-3 h-3 text-primary" />
                              </div>
                              <span className="text-sm text-foreground">{feature}</span>
                            </div>
                          ))}
                          
                          {plan.benefit && (
                            <div className="mt-6 p-4 bg-gradient-primary/5 rounded-lg border-l-4 border-primary/20">
                              <div className="flex items-start gap-3">
                                <span className="text-lg">✨</span>
                                <div>
                                  <p className="font-medium text-primary text-sm">Manfaat:</p>
                                  <p className="text-sm text-foreground mt-1">{plan.benefit}</p>
                                </div>
                              </div>
                            </div>
                          )}
                        </CardContent>

                        <CardFooter className="pt-8">
                          <Button 
                            className={`w-full h-12 font-semibold transition-all duration-300 ${
                              plan.popular 
                                ? 'hero' 
                                : 'outline hover:bg-primary hover:text-white'
                            }`}
                            size="lg"
                            onClick={plan.isWhatsApp ? handleWhatsAppContact : undefined}
                          >
                            {plan.isWhatsApp ? (
                              "Hubungi via WhatsApp"
                            ) : (
                              <a href="/subscription" className="w-full block text-center">
                                Berlangganan Sekarang
                              </a>
                            )}
                          </Button>
                        </CardFooter>
                      </Card>
                    </div>
                  </CarouselItem>
                );
              })}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex" />
            <CarouselNext className="hidden md:flex" />
          </Carousel>
          
          {/* Dots indicator for mobile */}
          <div className="flex justify-center mt-6 gap-2 md:hidden">
            {plans.map((_, index) => (
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

        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-2 text-sm text-muted-foreground bg-card/50 px-6 py-3 rounded-full border">
            <Shield className="w-4 h-4" />
            Garansi 30 hari uang kembali • Batalkan kapan saja
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing;