import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, Sparkles, ArrowRight } from "lucide-react";
import { useNavigate } from 'react-router-dom';

interface UpgradePromptProps {
  type: 'courses' | 'opportunities';
  currentCount: number;
  limit: number;
  className?: string;
}

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({ 
  type, 
  currentCount, 
  limit, 
  className = "" 
}) => {
  const navigate = useNavigate();

  const getContent = () => {
    if (type === 'courses') {
      return {
        title: 'Akses Lebih Banyak Kursus',
        description: `Anda telah mengakses ${currentCount} dari ${limit} kursus gratis. Upgrade ke Premium untuk akses tidak terbatas!`,
        features: ['Akses ke semua kursus', 'Sertifikat digital', 'Materi eksklusif', 'Mentor support'],
      };
    } else {
      return {
        title: 'Akses Lebih Banyak Peluang',
        description: `Anda telah melihat ${currentCount} dari ${limit} peluang gratis. Upgrade untuk melihat semua peluang karir!`,
        features: ['Akses ke semua peluang', 'Filter advanced', 'Notifikasi prioritas', 'Recommendation engine'],
      };
    }
  };

  const content = getContent();

  return (
    <Card className={`border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5 ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-primary" />
          <CardTitle className="text-lg">{content.title}</CardTitle>
        </div>
        <CardDescription>{content.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {content.features.map((feature, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <Sparkles className="w-3 h-3 text-primary" />
              <span>{feature}</span>
            </div>
          ))}
        </div>
        <Button 
          onClick={() => navigate('/dashboard')}
          className="w-full gap-2"
          size="lg"
        >
          <Crown className="w-4 h-4" />
          Upgrade ke Premium
          <ArrowRight className="w-4 h-4" />
        </Button>
      </CardContent>
    </Card>
  );
};