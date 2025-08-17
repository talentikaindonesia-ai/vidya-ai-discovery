import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { 
  BookOpen, 
  Award, 
  Briefcase, 
  Trophy, 
  GraduationCap, 
  Building, 
  Users, 
  Target,
  Brain,
  Heart,
  Zap,
  Palette,
  Code,
  Microscope,
  Calculator,
  Music,
  Camera,
  Lightbulb,
  Globe,
  TrendingUp,
  UserCheck
} from "lucide-react";

// Comprehensive personality and interest assessment
const personalityQuestions = [
  {
    category: "Learning Style",
    question: "Bagaimana cara kamu belajar paling efektif?",
    options: [
      { text: "Membaca dan menulis catatan", weight: { visual: 2, auditory: 0, kinesthetic: 1 } },
      { text: "Mendengarkan penjelasan", weight: { visual: 0, auditory: 2, kinesthetic: 1 } },
      { text: "Praktek langsung", weight: { visual: 1, auditory: 0, kinesthetic: 2 } },
      { text: "Diskusi kelompok", weight: { visual: 1, auditory: 2, kinesthetic: 0 } }
    ]
  },
  {
    category: "Problem Solving",
    question: "Ketika menghadapi masalah, kamu cenderung...",
    options: [
      { text: "Menganalisis secara logis step by step", weight: { analytical: 2, creative: 0, practical: 1 } },
      { text: "Mencari solusi kreatif dan inovatif", weight: { analytical: 0, creative: 2, practical: 1 } },
      { text: "Langsung mencoba berbagai cara", weight: { analytical: 1, creative: 1, practical: 2 } },
      { text: "Berkonsultasi dengan orang lain", weight: { analytical: 0, creative: 1, practical: 1 } }
    ]
  },
  {
    category: "Interest Areas",
    question: "Aktivitas mana yang paling membuatmu excited?",
    options: [
      { text: "Coding dan teknologi", weight: { technology: 2, arts: 0, science: 1, business: 0, social: 0 } },
      { text: "Seni dan desain", weight: { technology: 0, arts: 2, science: 0, business: 0, social: 1 } },
      { text: "Penelitian dan eksperimen", weight: { technology: 1, arts: 0, science: 2, business: 0, social: 0 } },
      { text: "Bisnis dan entrepreneurship", weight: { technology: 0, arts: 0, science: 0, business: 2, social: 1 } },
      { text: "Membantu dan berinteraksi dengan orang", weight: { technology: 0, arts: 0, science: 0, business: 1, social: 2 } }
    ]
  },
  {
    category: "Work Environment",
    question: "Lingkungan kerja yang ideal bagimu adalah...",
    options: [
      { text: "Quiet space untuk fokus sendiri", weight: { introvert: 2, extrovert: 0, structure: 1 } },
      { text: "Open space dengan banyak kolaborasi", weight: { introvert: 0, extrovert: 2, structure: 0 } },
      { text: "Fleksibel, bisa kerja dari mana saja", weight: { introvert: 1, extrovert: 1, flexibility: 2 } },
      { text: "Structured dengan jadwal yang jelas", weight: { introvert: 0, extrovert: 0, structure: 2 } }
    ]
  },
  {
    category: "Motivation",
    question: "Apa yang paling memotivasimu dalam belajar/bekerja?",
    options: [
      { text: "Mencapai target dan prestasi", weight: { achievement: 2, impact: 0, autonomy: 1 } },
      { text: "Membuat dampak positif untuk orang lain", weight: { achievement: 0, impact: 2, autonomy: 0 } },
      { text: "Kebebasan dan kontrol atas pekerjaanmu", weight: { achievement: 1, impact: 0, autonomy: 2 } },
      { text: "Belajar hal-hal baru", weight: { achievement: 0, impact: 1, autonomy: 1 } }
    ]
  },
  {
    category: "Communication",
    question: "Cara komunikasi yang kamu sukai adalah...",
    options: [
      { text: "Presentasi di depan banyak orang", weight: { verbal: 2, written: 0, visual: 1 } },
      { text: "Menulis laporan atau artikel", weight: { verbal: 0, written: 2, visual: 0 } },
      { text: "Membuat infografis atau video", weight: { verbal: 1, written: 0, visual: 2 } },
      { text: "Diskusi one-on-one", weight: { verbal: 1, written: 1, visual: 0 } }
    ]
  },
  {
    category: "Future Goals",
    question: "Impian kariermu dalam 10 tahun ke depan adalah...",
    options: [
      { text: "Tech entrepreneur atau CTO", weight: { technology: 2, leadership: 2, innovation: 2 } },
      { text: "Creative director atau seniman terkenal", weight: { arts: 2, creativity: 2, recognition: 2 } },
      { text: "Peneliti atau profesor", weight: { science: 2, knowledge: 2, academic: 2 } },
      { text: "CEO atau business leader", weight: { business: 2, leadership: 2, influence: 2 } },
      { text: "Social impact leader atau NGO founder", weight: { social: 2, impact: 2, service: 2 } }
    ]
  },
  {
    category: "Stress Response",
    question: "Ketika menghadapi deadline ketat, kamu...",
    options: [
      { text: "Membuat plan detail dan mengerjakannya step by step", weight: { organized: 2, spontaneous: 0, collaborative: 0 } },
      { text: "Bekerja intensif last minute dengan energy tinggi", weight: { organized: 0, spontaneous: 2, collaborative: 0 } },
      { text: "Meminta bantuan tim dan mendelegasikan", weight: { organized: 1, spontaneous: 0, collaborative: 2 } },
      { text: "Fokus pada bagian terpenting saja", weight: { organized: 1, spontaneous: 1, collaborative: 0 } }
    ]
  }
];

const Assessment = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [answers, setAnswers] = useState<{[key: number]: number}>({});
  const [scores, setScores] = useState<{[key: string]: number}>({});

  const handleAnswer = (questionIndex: number, answerIndex: number) => {
    const newAnswers = { ...answers, [questionIndex]: answerIndex };
    setAnswers(newAnswers);
    
    if (currentStep < personalityQuestions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      calculateResults(newAnswers);
    }
  };

  const calculateResults = (allAnswers: {[key: number]: number}) => {
    const newScores: {[key: string]: number} = {};
    
    // Calculate scores based on answers
    personalityQuestions.forEach((question, qIndex) => {
      const answerIndex = allAnswers[qIndex];
      if (answerIndex !== undefined) {
        const selectedOption = question.options[answerIndex];
        Object.entries(selectedOption.weight).forEach(([trait, weight]) => {
          newScores[trait] = (newScores[trait] || 0) + weight;
        });
      }
    });
    
    setScores(newScores);
    setShowResults(true);
  };

  const getPersonalityType = () => {
    const maxScores = {
      learning: Math.max(scores.visual || 0, scores.auditory || 0, scores.kinesthetic || 0),
      thinking: Math.max(scores.analytical || 0, scores.creative || 0, scores.practical || 0),
      interest: Math.max(scores.technology || 0, scores.arts || 0, scores.science || 0, scores.business || 0, scores.social || 0)
    };

    let learningStyle = "Visual";
    if (scores.auditory === maxScores.learning) learningStyle = "Auditory";
    if (scores.kinesthetic === maxScores.learning) learningStyle = "Kinesthetic";

    let thinkingStyle = "Analytical";
    if (scores.creative === maxScores.thinking) thinkingStyle = "Creative";
    if (scores.practical === maxScores.thinking) thinkingStyle = "Practical";

    let primaryInterest = "Technology";
    if (scores.arts === maxScores.interest) primaryInterest = "Arts";
    if (scores.science === maxScores.interest) primaryInterest = "Science";
    if (scores.business === maxScores.interest) primaryInterest = "Business";
    if (scores.social === maxScores.interest) primaryInterest = "Social";

    return {
      learning: learningStyle,
      thinking: thinkingStyle,
      interest: primaryInterest,
      combination: `${thinkingStyle} ${learningStyle} - ${primaryInterest} Oriented`
    };
  };

  const getCareerRecommendations = () => {
    const personality = getPersonalityType();
    const combinations: {[key: string]: string[]} = {
      "Technology": ["Software Engineer", "Data Scientist", "Product Manager", "DevOps Engineer", "AI Researcher"],
      "Arts": ["UI/UX Designer", "Graphic Designer", "Content Creator", "Art Director", "Digital Artist"],
      "Science": ["Research Scientist", "Biomedical Engineer", "Environmental Scientist", "Lab Technician", "Science Teacher"],
      "Business": ["Business Analyst", "Marketing Manager", "Consultant", "Entrepreneur", "Sales Director"],
      "Social": ["Psychology", "Social Worker", "HR Manager", "Teacher", "Community Organizer"]
    };
    
    return combinations[personality.interest] || [];
  };

  if (showResults) {
    const personality = getPersonalityType();
    const careerRecs = getCareerRecommendations();
    const compatibilityScore = Math.max(...Object.values(scores));
    const percentage = Math.min(95, Math.max(70, (compatibilityScore / (personalityQuestions.length * 2)) * 100));

    return (
      <div className="min-h-screen bg-gradient-soft">
        <div className="container mx-auto px-4 py-8">
          {/* Results Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
              Hasil Assessment Kepribadian & Minat
            </h1>
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <div className="flex items-center justify-center mb-4">
                  <div className="w-20 h-20 rounded-full bg-gradient-primary flex items-center justify-center">
                    <Brain className="w-10 h-10 text-white" />
                  </div>
                </div>
                <CardTitle className="text-2xl text-center">{personality.combination}</CardTitle>
                <CardDescription className="text-center text-lg">
                  Tipe pembelajar {personality.learning} dengan gaya berpikir {personality.thinking} yang tertarik pada bidang {personality.interest}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>Kesesuaian Kepribadian</span>
                      <span className="font-semibold">{Math.round(percentage)}%</span>
                    </div>
                    <Progress value={percentage} className="h-3" />
                  </div>
                  <div className="flex gap-2 justify-center flex-wrap">
                    <Badge variant="default">{personality.learning} Learner</Badge>
                    <Badge variant="secondary">{personality.thinking} Thinker</Badge>
                    <Badge variant="outline">{personality.interest} Oriented</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed Results */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-primary" />
                  Gaya Belajar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Visual</span>
                    <span>{scores.visual || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Auditory</span>
                    <span>{scores.auditory || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kinesthetic</span>
                    <span>{scores.kinesthetic || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  Gaya Berpikir
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Analytical</span>
                    <span>{scores.analytical || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Creative</span>
                    <span>{scores.creative || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Practical</span>
                    <span>{scores.practical || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Bidang Minat
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Technology</span>
                    <span>{scores.technology || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Arts</span>
                    <span>{scores.arts || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Science</span>
                    <span>{scores.science || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Business</span>
                    <span>{scores.business || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Social</span>
                    <span>{scores.social || 0}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Career Recommendations */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="w-6 h-6" />
                Rekomendasi Karier
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                {careerRecs.map((career, index) => (
                  <Badge key={index} variant="outline" className="p-2 justify-center">
                    {career}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="text-center space-y-4">
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 max-w-md mx-auto">
              <h3 className="text-lg font-semibold mb-2">Siap Memulai Perjalanan Belajarmu?</h3>
              <p className="text-muted-foreground mb-4">
                Daftar sekarang untuk mendapatkan pembelajaran yang dipersonalisasi berdasarkan hasil assessment ini!
              </p>
              <Button onClick={() => navigate("/auth")} className="w-full mb-2">
                Mulai Belajar Sekarang
              </Button>
            </div>
            <Button 
              onClick={() => {
                setShowResults(false); 
                setCurrentStep(0); 
                setAnswers({});
                setScores({});
              }} 
              variant="outline"
            >
              Tes Ulang
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-soft">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
              Assessment Kepribadian & Minat Bakat
            </h1>
            <p className="text-lg text-muted-foreground">
              Temukan gaya belajar, kepribadian, dan bidang yang paling sesuai denganmu
            </p>
          </div>

          {/* Progress */}
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-muted-foreground">Progress</span>
              <span className="text-sm font-medium">
                {currentStep + 1} dari {personalityQuestions.length}
              </span>
            </div>
            <Progress value={((currentStep + 1) / personalityQuestions.length) * 100} className="h-2" />
          </div>

          {/* Question */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center">
                  {currentStep < 3 && <Heart className="w-8 h-8 text-white" />}
                  {currentStep >= 3 && currentStep < 6 && <Zap className="w-8 h-8 text-white" />}
                  {currentStep >= 6 && <Target className="w-8 h-8 text-white" />}
                </div>
              </div>
              <Badge variant="outline" className="mx-auto mb-2">
                {personalityQuestions[currentStep].category}
              </Badge>
              <CardTitle className="text-xl text-center">
                {personalityQuestions[currentStep].question}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup onValueChange={(value) => handleAnswer(currentStep, parseInt(value))}>
                <div className="space-y-3">
                  {personalityQuestions[currentStep].options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer">
                      <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                      <Label 
                        htmlFor={`option-${index}`} 
                        className="flex-1 cursor-pointer"
                      >
                        {option.text}
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button 
              variant="outline" 
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
            >
              Sebelumnya
            </Button>
            <Button variant="outline" onClick={() => navigate("/")}>
              Kembali ke Beranda
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Assessment;