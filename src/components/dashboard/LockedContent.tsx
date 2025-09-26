import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Crown, Star, BookOpen, Trophy, Users, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface LockedContentProps {
  type: 'courses' | 'opportunities' | 'mentors' | 'premium-content' | 'certificates' | 'networking';
  title: string;
  description: string;
  features: string[];
  className?: string;
}

export const LockedContent = ({ type, title, description, features, className = "" }: LockedContentProps) => {
  const navigate = useNavigate();

  const getIcon = () => {
    switch (type) {
      case 'courses':
        return BookOpen;
      case 'opportunities':
        return Star;
      case 'mentors':
        return Users;
      case 'certificates':
        return Trophy;
      case 'networking':
        return Users;
      default:
        return Crown;
    }
  };

  const Icon = getIcon();

  return (
    <Card className={`relative overflow-hidden border-2 border-dashed border-primary/30 bg-gradient-to-br from-background to-primary/5 ${className}`}>
      <div className="absolute inset-0 bg-primary/5 opacity-50" />
      <div className="absolute top-4 right-4">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Lock className="w-6 h-6 text-primary" />
        </div>
      </div>
      
      <CardHeader className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <Icon className="w-6 h-6 text-primary" />
          <Badge variant="outline" className="border-primary/30 text-primary">
            <Crown className="w-3 h-3 mr-1" />
            Premium
          </Badge>
        </div>
        <CardTitle className="text-xl text-foreground">{title}</CardTitle>
        <CardDescription className="text-base">{description}</CardDescription>
      </CardHeader>

      <CardContent className="relative z-10 space-y-4">
        <div className="space-y-2">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
              <Star className="w-4 h-4 text-primary flex-shrink-0" />
              <span>{feature}</span>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-primary/20">
          <Button 
            onClick={() => navigate('/subscription')} 
            className="w-full h-12"
            size="lg"
          >
            Unlock Premium Features
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <p className="text-xs text-center text-muted-foreground mt-2">
            Mulai dari Rp 39K/bulan • Akses unlimited
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

interface FreeLimitReachedProps {
  type: 'courses' | 'opportunities';
  current: number;
  limit: number;
  className?: string;
}

export const FreeLimitReached = ({ type, current, limit, className = "" }: FreeLimitReachedProps) => {
  const navigate = useNavigate();

  return (
    <Card className={`border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
            <Lock className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <h4 className="font-medium text-amber-900 dark:text-amber-100">
              Batas Free Plan Tercapai
            </h4>
            <p className="text-sm text-amber-700 dark:text-amber-200">
              Anda telah melihat {current} dari {limit} {type === 'courses' ? 'kursus' : 'peluang'} gratis
            </p>
          </div>
          <Button 
            size="sm" 
            onClick={() => navigate('/subscription')}
            className="bg-amber-600 hover:bg-amber-700"
          >
            Upgrade
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};