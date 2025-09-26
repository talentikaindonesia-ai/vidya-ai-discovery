import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Users, BookOpen, Award, Crown } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface SubscriptionPlanProps {
  plan: {
    id: string;
    name: string;
    type: string;
    price_monthly: number;
    price_yearly: number;
    features: string[];
    max_users: number;
    is_popular?: boolean;
  };
  billingCycle: "monthly" | "yearly";
  onSelectPlan: (planId: string, billingCycle: "monthly" | "yearly") => void;
  currentPlan?: string;
  loading?: boolean;
}

export const SubscriptionPlan = ({ 
  plan, 
  billingCycle, 
  onSelectPlan, 
  currentPlan, 
  loading 
}: SubscriptionPlanProps) => {
  const getIcon = () => {
    switch (plan.type) {
      case 'premium_individual':
        return plan.price_monthly > 50000 ? Crown : Star;
      case 'family':
        return Users;
      case 'school':
        return Award;
      default:
        return BookOpen;
    }
  };

  const Icon = getIcon();
  const price = billingCycle === "monthly" ? plan.price_monthly : plan.price_yearly;
  const isCurrentPlan = currentPlan === plan.id;
  const isFree = plan.type === 'free';

  return (
    <Card 
      className={`relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-floating ${
        plan.type === 'individual' || isCurrentPlan
          ? 'border-2 border-primary shadow-floating ring-2 ring-primary/20' 
          : 'border-border hover:border-primary/50'
      }`}
    >
      {(plan.type === 'individual' || isCurrentPlan) && (
        <div className="absolute top-0 left-0 right-0 bg-gradient-primary text-white text-center py-2 text-sm font-semibold">
          <Star className="w-4 h-4 inline mr-1" />
          {isCurrentPlan ? 'Paket Aktif' : 'Paling Populer'}
        </div>
      )}
      
      <CardHeader className={`text-center pb-8 ${plan.type === 'individual' || isCurrentPlan ? 'pt-12' : 'pt-8'}`}>
        <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-primary flex items-center justify-center shadow-soft`}>
          <Icon className="w-8 h-8 text-white" />
        </div>
        <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
        <div className="flex items-center justify-center gap-1 mb-4">
          {isFree ? (
            <span className="text-3xl font-bold text-primary">Gratis</span>
          ) : (
            <>
              <span className="text-3xl font-bold text-primary">
                {formatCurrency(price)}
              </span>
              <span className="text-muted-foreground">
                /{billingCycle === "monthly" ? "bulan" : "tahun"}
              </span>
            </>
          )}
        </div>
        {billingCycle === "yearly" && !isFree && (
          <Badge variant="secondary" className="mb-2">
            Hemat {Math.round(((plan.price_monthly * 12 - plan.price_yearly) / (plan.price_monthly * 12)) * 100)}%
          </Badge>
        )}
        <CardDescription className="text-base leading-relaxed">
          {plan.max_users > 1 ? `Untuk ${plan.max_users} pengguna` : 'Untuk pengguna individu'}
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
            isCurrentPlan
              ? 'hero opacity-50 cursor-not-allowed'
              : plan.type === 'individual'
                ? 'hero' 
                : 'outline hover:bg-primary hover:text-white'
          }`}
          size="lg"
          disabled={loading || isCurrentPlan}
          onClick={() => onSelectPlan(plan.id, billingCycle)}
        >
          {isCurrentPlan ? 'Paket Aktif' : isFree ? 'Mulai Gratis' : 'Berlangganan Sekarang'}
        </Button>
      </CardFooter>
    </Card>
  );
};