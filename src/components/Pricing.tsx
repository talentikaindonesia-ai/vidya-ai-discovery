import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Users, BookOpen, Award, Shield } from "lucide-react";

const Pricing = () => {
  const plans = [
    {
      name: "Individu",
      price: "39,000",
      period: "/bulan",
      description: "Cocok untuk pelajar dan mahasiswa yang ingin mengembangkan minat bakat",
      features: [
        "Tes minat & bakat lengkap",
        "Hasil analisis mendalam",
        "Rekomendasi bidang studi",
        "Akses kursus online dasar",
        "Progress tracking",
        "Community forum",
        "1-on-1 konsultasi/bulan"
      ],
      popular: false,
      icon: BookOpen,
      color: "primary"
    },
    {
      name: "Premium",
      price: "99,000",
      period: "/bulan",
      description: "Untuk individu yang serius mengembangkan karir dan skill mendalam",
      features: [
        "Semua fitur Individu",
        "Advanced analytics",
        "Unlimited konsultasi",
        "Akses semua kursus premium",
        "Portfolio builder",
        "Networking events",
        "Mentorship program",
        "Certificate tracking",
        "Priority support"
      ],
      popular: true,
      icon: Star,
      color: "accent"
    },
    {
      name: "School Package",
      price: "3,999,000",
      period: "/tahun",
      description: "Solusi lengkap untuk sekolah dan institusi pendidikan",
      features: [
        "Multi-user dashboard",
        "Bulk student assessment",
        "Teacher admin panel",
        "Detailed reporting",
        "Custom branding",
        "Integration support",
        "Training sessions",
        "24/7 dedicated support",
        "Analytics & insights",
        "Progress monitoring"
      ],
      popular: false,
      icon: Users,
      color: "secondary"
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan, index) => {
            const IconComponent = plan.icon;
            return (
              <Card 
                key={index} 
                className={`relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-floating ${
                  plan.popular 
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
                  <CardDescription className="text-base leading-relaxed">
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
                </CardContent>

                <CardFooter className="pt-8">
                  <Button 
                    className={`w-full h-12 font-semibold transition-all duration-300 ${
                      plan.popular 
                        ? 'hero' 
                        : 'outline hover:bg-primary hover:text-white'
                    }`}
                    size="lg"
                  >
                    {plan.name === "School Package" ? "Hubungi Sales" : "Berlangganan Sekarang"}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
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