import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, ArrowRight, PlayCircle } from "lucide-react";

const HowItWorks = () => {
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
      highlight: "15-20 menit"
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
          <div className="grid gap-8">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <Card className="bg-gradient-card border-primary/10 shadow-card hover:shadow-floating transition-all duration-300">
                  <CardContent className="p-8">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                      {/* Step Number */}
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-soft">
                          {step.number}
                        </div>
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                          <div>
                            <h3 className="text-xl md:text-2xl font-bold mb-2 text-foreground">
                              {step.title}
                            </h3>
                            <p className="text-muted-foreground leading-relaxed">
                              {step.description}
                            </p>
                          </div>
                          <div className="flex-shrink-0">
                            <span className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
                              <CheckCircle className="w-4 h-4" />
                              {step.highlight}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Arrow */}
                {index < steps.length - 1 && (
                  <div className="hidden md:flex justify-center py-4">
                    <ArrowRight className="w-6 h-6 text-primary/50" />
                  </div>
                )}
              </div>
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