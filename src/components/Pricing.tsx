import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Check, Star, Users, BookOpen, Award, Shield, Loader2 } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import type { CarouselApi } from "@/components/ui/carousel";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface DbPlan {
  id: string;
  name: string;
  type: string;
  price_monthly: number;
  price_yearly: number | null;
  features: string[] | string | null;
  description: string | null;
  is_active: boolean;
}

interface DisplayPlan {
  id: string;
  name: string;
  type: string;
  price: string;
  period: string;
  description: string;
  features: string[];
  popular: boolean;
  isSchool: boolean;
}

function parseFeatures(raw: string[] | string | null): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as string[];
  try {
    const parsed = JSON.parse(raw as string);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function formatRp(n: number) {
  return `Rp ${Math.round(n / 1000).toLocaleString("id-ID")}.000`;
}

function toDisplayPlan(db: DbPlan): DisplayPlan {
  const isSchool = db.type === "school";
  const price = isSchool
    ? db.price_yearly != null
      ? formatRp(db.price_yearly)
      : formatRp(db.price_monthly * 12)
    : formatRp(db.price_monthly);
  const period = isSchool ? "/tahun" : "/bulan";
  const popular = db.type === "premium_individual";

  return {
    id: db.id,
    name: db.name,
    type: db.type,
    price,
    period,
    description: db.description ?? "",
    features: parseFeatures(db.features),
    popular,
    isSchool,
  };
}

const TYPE_ORDER: Record<string, number> = {
  individual: 0,
  premium_individual: 1,
  school: 2,
};

const Pricing = () => {
  const [plans, setPlans] = useState<DisplayPlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(1); // default to middle (Premium)
  const [api, setApi] = useState<CarouselApi>();
  const navigate = useNavigate();

  // Fetch active non-free plans from DB
  useEffect(() => {
    supabase
      .from("subscription_packages")
      .select("id, name, type, price_monthly, price_yearly, features, description, is_active")
      .eq("is_active", true)
      .not("type", "eq", "free")
      .order("price_monthly")
      .then(({ data, error }) => {
        if (error) {
          console.error("Error fetching plans:", error);
          setLoadingPlans(false);
          return;
        }
        const sorted = (data ?? [] as DbPlan[]).sort(
          (a, b) => (TYPE_ORDER[a.type] ?? 99) - (TYPE_ORDER[b.type] ?? 99)
        );
        setPlans(sorted.map(toDisplayPlan));
        setLoadingPlans(false);
      });
  }, []);

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

  const handleSubscribe = (plan: DisplayPlan) => {
    if (plan.isSchool) {
      // School plan: jump to contact section or a contact page
      const el = document.getElementById("contact");
      if (el) el.scrollIntoView({ behavior: "smooth" });
      else navigate("/schools");
    } else {
      navigate(`/subscription?planId=${plan.id}&planName=${encodeURIComponent(plan.name)}`);
    }
  };

  const getPlanIcon = (type: string) => {
    switch (type) {
      case "school":            return Users;
      case "premium_individual": return Star;
      default:                  return BookOpen;
    }
  };

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

        {loadingPlans ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="max-w-7xl mx-auto">
            <Carousel
              className="w-full"
              opts={{ align: "center", loop: true }}
              setApi={setApi}
            >
              <CarouselContent>
                {plans.map((plan, index) => {
                  const IconComponent = getPlanIcon(plan.type);
                  const isHighlighted = plan.popular || currentSlide === index;

                  return (
                    <CarouselItem key={plan.id} className="md:basis-1/2 lg:basis-1/3">
                      <div className="p-2">
                        <Card
                          className={`relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-floating h-full flex flex-col ${
                            isHighlighted
                              ? "border-2 border-primary shadow-floating ring-2 ring-primary/20"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          {plan.popular && (
                            <div className="absolute top-0 left-0 right-0 bg-gradient-primary text-white text-center py-2 text-sm font-semibold">
                              <Star className="w-4 h-4 inline mr-1" />
                              Paling Populer
                            </div>
                          )}

                          <CardHeader
                            className={`text-center pb-6 ${plan.popular ? "pt-12" : "pt-8"}`}
                          >
                            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-primary flex items-center justify-center shadow-soft">
                              <IconComponent className="w-8 h-8 text-white" />
                            </div>
                            <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                            <div className="flex items-baseline justify-center gap-1 mb-4">
                              <span className="text-3xl font-bold text-primary">{plan.price}</span>
                              <span className="text-muted-foreground">{plan.period}</span>
                            </div>
                            {plan.description && (
                              <CardDescription className="text-base leading-relaxed">
                                {plan.description}
                              </CardDescription>
                            )}
                          </CardHeader>

                          <CardContent className="space-y-3 flex-1">
                            {plan.features.map((feature, fi) => (
                              <div key={fi} className="flex items-start gap-3">
                                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                  <Check className="w-3 h-3 text-primary" />
                                </div>
                                <span className="text-sm text-foreground">{feature}</span>
                              </div>
                            ))}
                          </CardContent>

                          <CardFooter className="pt-6">
                            <Button
                              className="w-full h-12 font-semibold"
                              variant={plan.popular ? "default" : "outline"}
                              size="lg"
                              onClick={() => handleSubscribe(plan)}
                            >
                              {plan.isSchool ? "Hubungi Sales" : "Berlangganan Sekarang"}
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

            {/* Dots indicator — mobile */}
            <div className="flex justify-center mt-6 gap-2 md:hidden">
              {plans.map((_, index) => (
                <button
                  key={index}
                  aria-label={`Go to slide ${index + 1}`}
                  className={`w-2 h-2 rounded-full transition-all ${
                    currentSlide === index ? "bg-primary w-6" : "bg-primary/30"
                  }`}
                  onClick={() => api?.scrollTo(index)}
                />
              ))}
            </div>
          </div>
        )}

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
