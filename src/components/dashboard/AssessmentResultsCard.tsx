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
import personalitySocial from "@/assets/personality-social.png";
import personalityRealistic from "@/assets/personality-realistic.png";
import personalityInvestigative from "@/assets/personality-investigative.png";
import personalityArtistic from "@/assets/personality-artistic.png";
import personalityEnterprising from "@/assets/personality-enterprising.png";
import personalityConventional from "@/assets/personality-conventional.png";

interface AssessmentResultsCardProps {
  assessmentResults: any;
}

const riasecTypes = {
  realistic: {
    name: "Realistic (Doer)",
    icon: Wrench,
    image: personalityRealistic,
    color: "from-orange-400 to-orange-500",
    bgColor: "bg-orange-50",
    description: "Suka bekerja dengan tangan, praktis, dan berorientasi pada hasil konkret"
  },
  investigative: {
    name: "Investigative (Thinker)",
    icon: Microscope,
    image: personalityInvestigative,
    color: "from-blue-400 to-blue-500",
    bgColor: "bg-blue-50",
    description: "Suka menganalisis, meneliti, dan memecahkan masalah kompleks"
  },
  artistic: {
    name: "Artistic (Creator)",
    icon: Palette,
    image: personalityArtistic,
    color: "from-purple-400 to-purple-500",
    bgColor: "bg-purple-50",
    description: "Kreatif, ekspresif, dan suka menciptakan sesuatu yang baru"
  },
  social: {
    name: "Social (Helper)",
    icon: Users,
    image: personalitySocial,
    color: "from-pink-400 to-pink-500",
    bgColor: "bg-pink-50",
    description: "Suka membantu orang lain, empatis, dan berorientasi pada hubungan sosial"
  },
  enterprising: {
    name: "Enterprising (Persuader)",
    icon: Briefcase,
    image: personalityEnterprising,
    color: "from-green-400 to-green-500",
    bgColor: "bg-green-50",
    description: "Suka memimpin, persuasif, dan berorientasi pada pencapaian tujuan"
  },
  conventional: {
    name: "Conventional (Organizer)",
    icon: Calculator,
    image: personalityConventional,
    color: "from-teal-400 to-teal-500",
    bgColor: "bg-teal-50",
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
    <div className="bg-gradient-primary rounded-2xl p-4 text-white relative overflow-hidden mx-2 sm:mx-0">
      <div className="absolute inset-0 bg-black/10"></div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Hasil Assessment Anda
          </h2>
        </div>
        
        <Card className="bg-white text-gray-900 shadow-lg">
          <CardContent className="p-4 text-center">
            <h3 className="text-sm font-medium mb-4 text-gray-600">Hasil Assessment Anda</h3>
            
            {/* Personality Character Image */}
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-pink-100 flex items-center justify-center overflow-hidden">
              {personalityData?.image ? (
                <img 
                  src={personalityData.image} 
                  alt={personalityData.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 bg-pink-200 rounded-full flex items-center justify-center">
                  <Icon className="w-8 h-8 text-pink-600" />
                </div>
              )}
            </div>
            
            <h2 className="text-xl font-bold mb-2">{personalityData?.name}</h2>
            <p className="text-sm text-gray-600 mb-4 leading-relaxed">
              {personalityData?.description}
            </p>
            
            {/* Compatibility Level */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Tingkat Kesesuaian</span>
                <span className="font-bold text-blue-600">{percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full" 
                  style={{ width: `${percentage}%` }}
                ></div>
              </div>
            </div>

            {/* Career Recommendations */}
            {assessmentResults.career_recommendations && assessmentResults.career_recommendations.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 justify-center">
                  <Target className="w-4 h-4 text-gray-600" />
                  Rekomendasi Karier
                </h4>
                <div className="flex flex-wrap gap-2 justify-center">
                  {assessmentResults.career_recommendations.slice(0, 4).map((career: string, index: number) => (
                    <Badge 
                      key={index} 
                      className="bg-orange-100 text-orange-800 border-orange-200 px-3 py-1 text-xs"
                    >
                      {career}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Talent Areas */}
            {assessmentResults.talent_areas && assessmentResults.talent_areas.length > 0 && (
              <div className="mb-4">
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 justify-center">
                  <Award className="w-4 h-4 text-gray-600" />
                  Area Bakat Utama
                </h4>
                <div className="space-y-2">
                  {assessmentResults.talent_areas.slice(0, 3).map((talent: string, index: number) => {
                    const talentType = talent as keyof typeof riasecTypes;
                    const TalentIcon = riasecTypes[talentType]?.icon || Target;
                    
                    return (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <TalentIcon className="w-4 h-4 text-gray-600" />
                        <span>{riasecTypes[talentType]?.name || talent}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Test Date */}
            <div className="text-xs text-gray-500 mb-4">
              Tes dilakukan pada {new Date(assessmentResults.created_at).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1 text-sm border-gray-300"
                onClick={() => window.location.href = '/assessment'}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Tes Ulang
              </Button>
              <Button 
                className="flex-1 text-sm bg-blue-600 hover:bg-blue-700"
                onClick={() => window.location.href = '/learning'}
              >
                Lihat Kursus
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};