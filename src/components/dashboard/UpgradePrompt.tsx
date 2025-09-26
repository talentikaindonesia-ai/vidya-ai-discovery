import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Lock, Star, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface UpgradePromptProps {
  title: string;
  description: string;
  feature: string;
  className?: string;
  compact?: boolean;
}

export const UpgradePrompt = ({ title, description, feature, className = "", compact = false }: UpgradePromptProps) => {
  const navigate = useNavigate();

  if (compact) {
    return (
      <div className={`relative overflow-hidden rounded-lg border border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary" />
            <Badge variant="outline" className="text-xs">Premium</Badge>
          </div>
          <Crown className="w-5 h-5 text-primary opacity-50" />
        </div>
        <h4 className="font-semibold text-foreground mt-2">{title}</h4>
        <p className="text-sm text-muted-foreground mb-3">{description}</p>
        <Button 
          size="sm" 
          onClick={() => navigate('/subscription')}
          className="w-full"
        >
          Upgrade Sekarang
          <ArrowRight className="w-3 h-3 ml-1" />
        </Button>
      </div>
    );
  }

  return (
    <Card className={`relative overflow-hidden border-primary/20 shadow-md ${className}`}>
      <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-primary opacity-10 rounded-bl-full" />
      <CardHeader className="relative">
        <div className="flex items-center justify-between mb-2">
          <Badge variant="outline" className="text-primary border-primary/30">
            <Crown className="w-3 h-3 mr-1" />
            Premium Feature
          </Badge>
          <Lock className="w-5 h-5 text-primary" />
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription className="text-base">{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-sm text-muted-foreground">
            <Star className="w-4 h-4 inline mr-1 text-primary" />
            {feature}
          </p>
        </div>
        <Button 
          onClick={() => navigate('/subscription')} 
          className="w-full h-12"
          size="lg"
        >
          Upgrade ke Premium
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
        <p className="text-xs text-center text-muted-foreground">
          Mulai dari Rp 39K/bulan • Batalkan kapan saja
        </p>
      </CardContent>
    </Card>
  );
};