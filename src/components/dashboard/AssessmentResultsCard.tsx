import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  Brain, 
  Target, 
  Award,
  Wrench, 
  Microscope, 
  Palette, 
  Users, 
  Briefcase, 
  Calculator,
  RefreshCw
} from "lucide-react";

interface AssessmentResultsCardProps {
  assessmentResults: any;
}

const riasecTypes = {
  realistic: {
    name: "Realistic (Doer)",
    icon: Wrench,
    color: "from-green-500 to-green-600",
    description: "Suka bekerja dengan tangan, praktis, dan berorientasi pada hasil konkret"
  },
  investigative: {
    name: "Investigative (Thinker)",
    icon: Microscope,
    color: "from-blue-500 to-blue-600",
    description: "Suka menganalisis, meneliti, dan memecahkan masalah kompleks"
  },
  artistic: {
    name: "Artistic (Creator)",
    icon: Palette,
    color: "from-purple-500 to-purple-600",
    description: "Kreatif, ekspresif, dan suka menciptakan sesuatu yang baru"
  },
  social: {
    name: "Social (Helper)",
    icon: Users,
    color: "from-pink-500 to-pink-600",
    description: "Suka membantu orang lain, empatis, dan berorientasi pada hubungan sosial"
  },
  enterprising: {
    name: "Enterprising (Persuader)",
    icon: Briefcase,
    color: "from-orange-500 to-orange-600",
    description: "Suka memimpin, persuasif, dan berorientasi pada pencapaian tujuan"
  },
  conventional: {
    name: "Conventional (Organizer)",
    icon: Calculator,
    color: "from-indigo-500 to-indigo-600",
    description: "Teratur, detail, dan suka mengorganisir informasi atau data"
  }
};

export const AssessmentResultsCard = ({ assessmentResults }: AssessmentResultsCardProps) => {
  if (!assessmentResults) {
    return (
      <Card className="shadow-card border-primary/20 mobile-card">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Brain className="w-5 h-5 text-primary" />
            Hasil Assessment Anda
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-6">
          <div className="w-16 h-16 mx-auto bg-muted/50 rounded-full flex items-center justify-center mb-4">
            <Brain className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Belum Ada Hasil Assessment</h3>
          <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
            Ikuti tes minat bakat untuk mendapatkan rekomendasi pembelajaran yang dipersonalisasi
          </p>
          <Button 
            onClick={() => window.location.href = '/assessment'}
            className="w-full sm:w-auto"
          >
            Mulai Tes Sekarang
          </Button>
        </CardContent>
      </Card>
    );
  }

  const personalityType = assessmentResults.personality_type as keyof typeof riasecTypes;
  const personalityData = riasecTypes[personalityType];
  const Icon = personalityData?.icon || Brain;
  const scoreBreakdown = assessmentResults.score_breakdown || {};
  
  const scores = Object.values(scoreBreakdown) as number[];
  const totalScore = scores.reduce((sum, score) => sum + Number(score || 0), 0);
  const primaryScore = Number(scoreBreakdown[personalityType] || 0);
  const percentage = totalScore > 0 ? Math.round((primaryScore / totalScore) * 100) : 0;

  return (
    <Card className="shadow-card border-primary/20 mobile-card bg-gradient-subtle">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Brain className="w-5 h-5 text-primary" />
          Hasil Assessment Anda
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Personality Type - Centered and Simple */}
        <div className="text-center">
          <div className={`w-16 h-16 mx-auto rounded-full bg-gradient-to-br ${personalityData?.color} flex items-center justify-center mb-4 shadow-lg`}>
            <Icon className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-bold mb-2">{personalityData?.name}</h3>
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed px-2">
            {personalityData?.description}
          </p>
          
          {/* Compatibility Level */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Tingkat Kesesuaian</span>
              <span className="font-bold text-primary">{percentage}%</span>
            </div>
            <Progress value={percentage} className="h-3" />
          </div>
        </div>

        {/* Career Recommendations - Simple Badges */}
        {assessmentResults.career_recommendations && assessmentResults.career_recommendations.length > 0 && (
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-primary" />
              Rekomendasi Karier
            </h4>
            <div className="flex flex-wrap gap-2">
              {assessmentResults.career_recommendations.slice(0, 4).map((career: string, index: number) => (
                <Badge 
                  key={index} 
                  className="bg-secondary text-secondary-foreground px-3 py-1"
                >
                  {career}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Talent Areas - Simple List */}
        {assessmentResults.talent_areas && assessmentResults.talent_areas.length > 0 && (
          <div>
            <h4 className="font-semibold mb-3 flex items-center gap-2">
              <Award className="w-4 h-4 text-primary" />
              Area Bakat Utama
            </h4>
            <div className="space-y-2">
              {assessmentResults.talent_areas.slice(0, 3).map((talent: string, index: number) => {
                const talentType = talent as keyof typeof riasecTypes;
                const TalentIcon = riasecTypes[talentType]?.icon || Target;
                
                return (
                  <div key={index} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                    <TalentIcon className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">{riasecTypes[talentType]?.name || talent}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Test Date */}
        <div className="text-xs text-muted-foreground text-center pt-4 border-t">
          Tes dilakukan pada {new Date(assessmentResults.created_at).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })}
        </div>

        {/* Action Buttons - Simple Layout */}
        <div className="flex gap-3 pt-2">
          <Button 
            variant="outline" 
            className="flex-1 text-sm"
            onClick={() => window.location.href = '/assessment'}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Tes Ulang
          </Button>
          <Button 
            className="flex-1 text-sm bg-primary"
            onClick={() => window.location.href = '/learning'}
          >
            Lihat Kursus
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};