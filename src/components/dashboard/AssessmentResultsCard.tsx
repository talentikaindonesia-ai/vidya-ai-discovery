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
      <Card className="bg-gradient-subtle border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Hasil Assessment
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <Brain className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Belum Ada Hasil Assessment</h3>
          <p className="text-muted-foreground mb-4">
            Ikuti tes minat bakat untuk mendapatkan rekomendasi pembelajaran yang dipersonalisasi
          </p>
          <Button onClick={() => window.location.href = '/assessment'}>
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
  
  // Type-safe calculations
  const scores = Object.values(scoreBreakdown) as number[];
  const totalScore = scores.reduce((sum, score) => sum + Number(score || 0), 0);
  const primaryScore = Number(scoreBreakdown[personalityType] || 0);
  const percentage = totalScore > 0 ? Math.round((primaryScore / totalScore) * 100) : 0;

  return (
    <Card className="bg-gradient-subtle border-primary/20">
      <CardHeader className="pb-3 sm:pb-4">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Brain className="w-5 h-5" />
          <span className="truncate">Hasil Assessment Anda</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 sm:space-y-6">
        {/* Primary Personality Type */}
        <div className="text-center">
          <div className={`w-12 h-12 sm:w-16 sm:h-16 mx-auto rounded-full bg-gradient-to-br ${personalityData?.color} flex items-center justify-center mb-4 shadow-lg`}>
            <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold mb-2 px-2">{personalityData?.name}</h3>
          <p className="text-xs sm:text-sm text-muted-foreground mb-4 leading-relaxed px-2">
            {personalityData?.description}
          </p>
          <div className="flex justify-between items-center mb-2 px-2">
            <span className="text-xs sm:text-sm font-medium">Tingkat Kesesuaian</span>
            <span className="font-bold text-primary">{percentage}%</span>
          </div>
          <Progress value={percentage} className="h-2 mx-2" />
        </div>

        {/* Career Recommendations */}
        {assessmentResults.career_recommendations && assessmentResults.career_recommendations.length > 0 && (
          <div className="px-2">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-primary" />
              <h4 className="font-semibold text-sm sm:text-base">Rekomendasi Karier</h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {assessmentResults.career_recommendations.slice(0, 4).map((career: string, index: number) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {career}
                </Badge>
              ))}
              {assessmentResults.career_recommendations.length > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{assessmentResults.career_recommendations.length - 4} lainnya
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Talent Areas */}
        {assessmentResults.talent_areas && assessmentResults.talent_areas.length > 0 && (
          <div className="px-2">
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-4 h-4 text-primary" />
              <h4 className="font-semibold text-sm sm:text-base">Area Bakat Utama</h4>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {assessmentResults.talent_areas.slice(0, 3).map((talent: string, index: number) => {
                const talentType = talent as keyof typeof riasecTypes;
                const TalentIcon = riasecTypes[talentType]?.icon || Target;
                const talentScore = Number(scoreBreakdown[talent] || 0);
                const talentPercentage = totalScore > 0 ? Math.round((talentScore / totalScore) * 100) : 0;
                
                return (
                  <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <TalentIcon className="w-4 h-4 text-primary flex-shrink-0" />
                      <span className="text-xs sm:text-sm font-medium truncate">{riasecTypes[talentType]?.name || talent}</span>
                    </div>
                    <span className="text-xs sm:text-sm text-muted-foreground flex-shrink-0 ml-2">{talentPercentage}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Assessment Date */}
        <div className="text-xs text-muted-foreground text-center border-t pt-4 px-2">
          Tes dilakukan pada: {new Date(assessmentResults.created_at).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-2 px-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 text-xs sm:text-sm"
            onClick={() => window.location.href = '/assessment'}
          >
            <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="truncate">Tes Ulang</span>
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 text-xs sm:text-sm"
            onClick={() => window.location.href = '/learning'}
          >
            <span className="truncate">Lihat Kursus</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};