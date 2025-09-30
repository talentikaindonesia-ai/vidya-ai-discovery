import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { 
  Wrench, 
  Microscope, 
  Palette, 
  Users, 
  Briefcase, 
  Calculator,
  Brain,
  Target,
  Award,
  TrendingUp
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import RiasecPersonalityTypes from "@/components/RiasecPersonalityTypes";

// RIASEC Personality Types Data
const riasecTypes = {
  realistic: {
    name: "Realistic",
    icon: Wrench,
    color: "from-yellow-500 to-orange-500",
    description: "Cenderung suka pekerjaan yang berorientasi dengan penerapan dari skill yang dimiliki, keterampilan fisik & minim keterampilan sosial",
    characteristics: ["Praktis", "Teknis", "Suka bekerja dengan tangan", "Oriented pada hasil nyata"],
    careers: ["Insinyur Mesin", "Teknisi", "Arsitek", "Ahli Konstruksi", "Pilot", "Chef", "Teknisi IT"]
  },
  investigative: {
    name: "Investigative", 
    icon: Microscope,
    color: "from-green-500 to-teal-500",
    description: "Lebih suka pekerjaan yang mengandalkan analisa, pemahaman cara berpikir secara kreatif dan abstrak",
    characteristics: ["Analitis", "Intelektual", "Suka riset", "Problem solver"],
    careers: ["Peneliti", "Dokter", "Scientist", "Psikolog", "Data Scientist", "Ahli Forensik", "Profesor"]
  },
  artistic: {
    name: "Artistic",
    icon: Palette, 
    color: "from-purple-500 to-pink-500",
    description: "Tipikal orang yang suka bekerja sama dengan orang lain untuk menghasilkan suatu hal yang dianggap 'Karya Seni'",
    characteristics: ["Kreatif", "Imajinatif", "Ekspresif", "Inovatif"],
    careers: ["Desainer Grafis", "Penulis", "Musisi", "Fotografer", "Animator", "Content Creator", "Art Director"]
  },
  social: {
    name: "Social",
    icon: Users,
    color: "from-blue-500 to-cyan-500", 
    description: "Lebih suka pekerjaan yang bersifat membantu sesama. Punya karakter yang supel dan friendly. Sangat menikmati pekerjaan yang rutin dan teratur",
    characteristics: ["Empatis", "Komunikatif", "Suka membantu", "Team oriented"],
    careers: ["Guru", "Konselor", "Perawat", "Pekerja Sosial", "HR Manager", "Terapis", "Customer Service"]
  },
  enterprising: {
    name: "Enterprising",
    icon: Briefcase,
    color: "from-red-500 to-rose-500",
    description: "Suka bergaul dan berbicara dengan orang banyak, jago merangkai kata dan meyakinkan orang, mudah untuk mempresentasikan sesuatu",
    characteristics: ["Persuasif", "Ambisius", "Leadership", "Goal oriented"],
    careers: ["Entrepreneur", "Sales Manager", "Marketing Director", "CEO", "Business Consultant", "Lawyer", "Politisi"]
  },
  conventional: {
    name: "Conventional",
    icon: Calculator,
    color: "from-gray-500 to-slate-500",
    description: "Karakternya formal banget, terus juga sangat setia, tipikal tim player yang baik. Suka pekerjaan yang rutin, terstruktur dan sistematis",
    characteristics: ["Terorganisir", "Detail oriented", "Sistematis", "Reliable"],
    careers: ["Akuntan", "Administrasi", "Sekretaris", "Auditor", "Perpustakaan", "Data Entry", "Quality Control"]
  }
};

// RIASEC-based personality assessment questions
const riasecQuestions = [
  {
    category: "Aktivitas Kerja",
    question: "Dari aktivitas berikut, mana yang paling menarik bagimu?",
    options: [
      { text: "Memperbaiki mesin atau alat elektronik", weight: { realistic: 3, investigative: 0, artistic: 0, social: 0, enterprising: 0, conventional: 1 } },
      { text: "Melakukan eksperimen atau penelitian", weight: { realistic: 0, investigative: 3, artistic: 0, social: 0, enterprising: 0, conventional: 1 } },
      { text: "Mendesain atau menciptakan karya seni", weight: { realistic: 0, investigative: 0, artistic: 3, social: 1, enterprising: 0, conventional: 0 } },
      { text: "Mengajar atau membantu orang lain", weight: { realistic: 0, investigative: 0, artistic: 0, social: 3, enterprising: 1, conventional: 0 } },
      { text: "Memimpin tim atau memulai bisnis", weight: { realistic: 0, investigative: 0, artistic: 0, social: 1, enterprising: 3, conventional: 0 } },
      { text: "Mengorganisir data dan dokumen", weight: { realistic: 0, investigative: 1, artistic: 0, social: 0, enterprising: 0, conventional: 3 } }
    ]
  },
  {
    category: "Lingkungan Kerja",
    question: "Lingkungan kerja seperti apa yang paling cocok denganmu?",
    options: [
      { text: "Workshop atau laboratorium dengan alat-alat praktis", weight: { realistic: 3, investigative: 1, artistic: 0, social: 0, enterprising: 0, conventional: 0 } },
      { text: "Ruang penelitian atau perpustakaan yang tenang", weight: { realistic: 0, investigative: 3, artistic: 0, social: 0, enterprising: 0, conventional: 1 } },
      { text: "Studio kreatif atau ruang terbuka yang inspiratif", weight: { realistic: 0, investigative: 0, artistic: 3, social: 0, enterprising: 0, conventional: 0 } },
      { text: "Ruang komunitas atau tempat berinteraksi dengan banyak orang", weight: { realistic: 0, investigative: 0, artistic: 1, social: 3, enterprising: 1, conventional: 0 } },
      { text: "Kantor dinamis dengan banyak meeting dan presentasi", weight: { realistic: 0, investigative: 0, artistic: 0, social: 1, enterprising: 3, conventional: 0 } },
      { text: "Kantor terstruktur dengan sistem dan prosedur yang jelas", weight: { realistic: 0, investigative: 0, artistic: 0, social: 0, enterprising: 1, conventional: 3 } }
    ]
  },
  {
    category: "Kemampuan & Minat",
    question: "Kemampuan mana yang paling menggambarkan dirimu?",
    options: [
      { text: "Mahir menggunakan peralatan dan teknologi", weight: { realistic: 3, investigative: 1, artistic: 0, social: 0, enterprising: 0, conventional: 1 } },
      { text: "Analitis dan suka memecahkan masalah kompleks", weight: { realistic: 1, investigative: 3, artistic: 0, social: 0, enterprising: 0, conventional: 1 } },
      { text: "Kreatif dan imajinatif dalam berkarya", weight: { realistic: 0, investigative: 0, artistic: 3, social: 1, enterprising: 1, conventional: 0 } },
      { text: "Empati tinggi dan mudah berkomunikasi", weight: { realistic: 0, investigative: 0, artistic: 1, social: 3, enterprising: 1, conventional: 0 } },
      { text: "Persuasif dan berorientasi pada hasil", weight: { realistic: 0, investigative: 0, artistic: 0, social: 1, enterprising: 3, conventional: 1 } },
      { text: "Teliti dan terorganisir dengan baik", weight: { realistic: 1, investigative: 1, artistic: 0, social: 0, enterprising: 1, conventional: 3 } }
    ]
  },
  {
    category: "Nilai & Motivasi",
    question: "Apa yang paling memotivasimu dalam bekerja?",
    options: [
      { text: "Melihat hasil kerja yang nyata dan bermanfaat", weight: { realistic: 3, investigative: 1, artistic: 1, social: 1, enterprising: 0, conventional: 0 } },
      { text: "Menemukan pengetahuan baru atau memecahkan misteri", weight: { realistic: 0, investigative: 3, artistic: 0, social: 0, enterprising: 0, conventional: 0 } },
      { text: "Mengekspresikan diri dan menciptakan sesuatu yang unik", weight: { realistic: 0, investigative: 0, artistic: 3, social: 0, enterprising: 0, conventional: 0 } },
      { text: "Membantu orang lain dan membuat perbedaan positif", weight: { realistic: 0, investigative: 0, artistic: 0, social: 3, enterprising: 0, conventional: 0 } },
      { text: "Mencapai kesuksesan finansial dan status", weight: { realistic: 0, investigative: 0, artistic: 0, social: 0, enterprising: 3, conventional: 1 } },
      { text: "Stabilitas dan keamanan dalam pekerjaan", weight: { realistic: 1, investigative: 0, artistic: 0, social: 1, enterprising: 0, conventional: 3 } }
    ]
  },
  {
    category: "Gaya Komunikasi",
    question: "Bagaimana cara kamu berkomunikasi yang paling efektif?",
    options: [
      { text: "Langsung ke pokok masalah dengan contoh praktis", weight: { realistic: 3, investigative: 1, artistic: 0, social: 0, enterprising: 1, conventional: 1 } },
      { text: "Menyampaikan dengan data dan analisis mendalam", weight: { realistic: 0, investigative: 3, artistic: 0, social: 0, enterprising: 0, conventional: 2 } },
      { text: "Menggunakan cerita dan visualisasi kreatif", weight: { realistic: 0, investigative: 0, artistic: 3, social: 1, enterprising: 1, conventional: 0 } },
      { text: "Mendengarkan dulu, lalu memberikan dukungan", weight: { realistic: 0, investigative: 0, artistic: 1, social: 3, enterprising: 0, conventional: 0 } },
      { text: "Mempresentasikan dengan percaya diri dan meyakinkan", weight: { realistic: 0, investigative: 0, artistic: 1, social: 1, enterprising: 3, conventional: 0 } },
      { text: "Mengikuti prosedur komunikasi yang sudah ditetapkan", weight: { realistic: 1, investigative: 0, artistic: 0, social: 0, enterprising: 0, conventional: 3 } }
    ]
  },
  {
    category: "Cara Belajar",
    question: "Metode belajar mana yang paling cocok untukmu?",
    options: [
      { text: "Learning by doing - praktik langsung", weight: { realistic: 3, investigative: 1, artistic: 1, social: 0, enterprising: 1, conventional: 0 } },
      { text: "Membaca jurnal dan melakukan riset mendalam", weight: { realistic: 0, investigative: 3, artistic: 0, social: 0, enterprising: 0, conventional: 1 } },
      { text: "Eksperimen kreatif dan eksplorasi bebas", weight: { realistic: 0, investigative: 1, artistic: 3, social: 0, enterprising: 0, conventional: 0 } },
      { text: "Diskusi kelompok dan sharing pengalaman", weight: { realistic: 0, investigative: 0, artistic: 1, social: 3, enterprising: 1, conventional: 0 } },
      { text: "Studi kasus bisnis dan simulasi", weight: { realistic: 0, investigative: 0, artistic: 0, social: 1, enterprising: 3, conventional: 1 } },
      { text: "Mengikuti panduan step-by-step yang terstruktur", weight: { realistic: 1, investigative: 0, artistic: 0, social: 0, enterprising: 0, conventional: 3 } }
    ]
  },
  {
    category: "Keputusan Karier", 
    question: "Faktor apa yang paling penting dalam memilih karier?",
    options: [
      { text: "Bisa bekerja dengan tangan dan melihat hasil konkret", weight: { realistic: 3, investigative: 0, artistic: 0, social: 0, enterprising: 0, conventional: 0 } },
      { text: "Kesempatan untuk terus belajar dan meneliti", weight: { realistic: 0, investigative: 3, artistic: 0, social: 0, enterprising: 0, conventional: 0 } },
      { text: "Kebebasan berkreasi dan mengekspresikan diri", weight: { realistic: 0, investigative: 0, artistic: 3, social: 0, enterprising: 0, conventional: 0 } },
      { text: "Dapat membantu dan berinteraksi dengan banyak orang", weight: { realistic: 0, investigative: 0, artistic: 0, social: 3, enterprising: 0, conventional: 0 } },
      { text: "Peluang untuk memimpin dan mengembangkan bisnis", weight: { realistic: 0, investigative: 0, artistic: 0, social: 0, enterprising: 3, conventional: 0 } },
      { text: "Pekerjaan yang stabil dengan aturan yang jelas", weight: { realistic: 0, investigative: 0, artistic: 0, social: 0, enterprising: 0, conventional: 3 } }
    ]
  },
  {
    category: "Tantangan Kerja",
    question: "Jenis tantangan kerja mana yang membuatmu bersemangat?",
    options: [
      { text: "Memecahkan masalah teknis atau memperbaiki sistem", weight: { realistic: 3, investigative: 2, artistic: 0, social: 0, enterprising: 0, conventional: 0 } },
      { text: "Menganalisis data kompleks untuk menemukan pola", weight: { realistic: 0, investigative: 3, artistic: 0, social: 0, enterprising: 0, conventional: 1 } },
      { text: "Menciptakan ide baru yang belum pernah ada", weight: { realistic: 0, investigative: 0, artistic: 3, social: 0, enterprising: 1, conventional: 0 } },
      { text: "Menyelesaikan konflik dan membangun hubungan", weight: { realistic: 0, investigative: 0, artistic: 0, social: 3, enterprising: 1, conventional: 0 } },
      { text: "Mencapai target penjualan atau mengembangkan pasar", weight: { realistic: 0, investigative: 0, artistic: 0, social: 1, enterprising: 3, conventional: 0 } },
      { text: "Mengelola sistem dan memastikan akurasi data", weight: { realistic: 1, investigative: 0, artistic: 0, social: 0, enterprising: 0, conventional: 3 } }
    ]
  }
];

const Assessment = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [showPersonalityTypes, setShowPersonalityTypes] = useState(true);
  const [answers, setAnswers] = useState<{[key: number]: number}>({});
  const [scores, setScores] = useState<{[key: string]: number}>({});
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);

  const handleAnswer = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
  };

  const handleNext = () => {
    if (selectedAnswer === null) return;
    
    const newAnswers = { ...answers, [currentStep]: selectedAnswer };
    setAnswers(newAnswers);
    
    if (currentStep < riasecQuestions.length - 1) {
      setCurrentStep(currentStep + 1);
      setSelectedAnswer(newAnswers[currentStep + 1] || null);
    } else {
      calculateResults(newAnswers);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setSelectedAnswer(answers[currentStep - 1] || null);
    }
  };

  const calculateResults = async (allAnswers: {[key: number]: number}) => {
    const newScores: {[key: string]: number} = {};
    
    // Calculate RIASEC scores based on answers
    riasecQuestions.forEach((question, qIndex) => {
      const answerIndex = allAnswers[qIndex];
      if (answerIndex !== undefined) {
        const selectedOption = question.options[answerIndex];
        Object.entries(selectedOption.weight).forEach(([trait, weight]) => {
          newScores[trait] = (newScores[trait] || 0) + (weight as number);
        });
      }
    });
    
    setScores(newScores);
    
    // Save assessment results to database
    await saveAssessmentResults(allAnswers, newScores);
    
    setShowResults(true);
  };

  const saveAssessmentResults = async (answers: {[key: number]: number}, scores: {[key: string]: number}) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const primaryType = getPrimaryRiasecTypeFromScores(scores);
      
      // Map RIASEC types to career recommendations and talent areas
      const careerMappings = {
        realistic: ['Teknik', 'Konstruksi', 'Pertanian', 'Teknologi'],
        investigative: ['Sains', 'Penelitian', 'Matematika', 'Kedokteran'],
        artistic: ['Seni', 'Design', 'Media', 'Kreatif'],
        social: ['Pendidikan', 'Konseling', 'Sosial', 'Kesehatan'],
        enterprising: ['Bisnis', 'Manajemen', 'Penjualan', 'Kewirausahaan'],
        conventional: ['Akuntansi', 'Administrasi', 'Keuangan', 'Organisasi']
      };

      const { error } = await supabase
        .from('assessment_results')
        .insert({
          user_id: user.id,
          assessment_type: 'riasec_personality',
          personality_type: primaryType,
          questions_answers: answers,
          score_breakdown: scores,
          career_recommendations: careerMappings[primaryType as keyof typeof careerMappings] || [],
          talent_areas: [primaryType, ...Object.entries(scores)
            .sort(([,a], [,b]) => b - a)
            .slice(1, 3)
            .map(([key]) => key)
          ]
        });

      if (error) {
        console.error('Error saving assessment results:', error);
      } else {
        console.log('Assessment results saved successfully');
      }
    } catch (error) {
      console.error('Error in saveAssessmentResults:', error);
    }
  };

  const getPrimaryRiasecTypeFromScores = (scores: {[key: string]: number}) => {
    const riasecScores = {
      realistic: scores.realistic || 0,
      investigative: scores.investigative || 0, 
      artistic: scores.artistic || 0,
      social: scores.social || 0,
      enterprising: scores.enterprising || 0,
      conventional: scores.conventional || 0
    };

    const maxScore = Math.max(...Object.values(riasecScores));
    return Object.entries(riasecScores).find(([_, score]) => score === maxScore)?.[0] || 'realistic';
  };

  const getPrimaryRiasecType = () => {
    const riasecScores = {
      realistic: scores.realistic || 0,
      investigative: scores.investigative || 0, 
      artistic: scores.artistic || 0,
      social: scores.social || 0,
      enterprising: scores.enterprising || 0,
      conventional: scores.conventional || 0
    };

    const maxScore = Math.max(...Object.values(riasecScores));
    const primaryType = Object.entries(riasecScores).find(([_, score]) => score === maxScore)?.[0] as keyof typeof riasecTypes;
    
    return primaryType || 'realistic';
  };

  const startAssessment = () => {
    setShowPersonalityTypes(false);
  };

  if (showPersonalityTypes) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
        <div className="container mx-auto px-4 py-8">
          <RiasecPersonalityTypes showButton={false} />
          
          {/* Question text below personality types */}
          <div className="text-center mt-8 mb-6">
            <h3 className="text-2xl md:text-3xl font-bold text-primary">
              Mana Tipe Kepribadianmu? 🤔
            </h3>
          </div>
          
          <div className="text-center mt-8">
            <Card className="max-w-2xl mx-auto border-primary/20 shadow-xl hover:shadow-2xl transition-shadow duration-300 bg-gradient-to-br from-card via-card to-primary/5">
              <CardContent className="pt-8 pb-8 px-6">
                <div className="mb-6 animate-pulse">
                  <Brain className="w-20 h-20 mx-auto text-primary mb-4 drop-shadow-lg" />
                  <h3 className="text-3xl md:text-4xl font-bold mb-3 bg-gradient-to-r from-primary via-primary-dark to-primary bg-clip-text text-transparent">
                    Temukan Tipe Kepribadianmu!
                  </h3>
                </div>
                <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
                  Ikuti tes minat bakat berdasarkan teori RIASEC untuk mengetahui kepribadian dan potensi kariermu.
                </p>
                <Button 
                  onClick={startAssessment} 
                  size="lg"
                  className="w-full md:w-auto px-12 py-6 text-lg bg-gradient-to-r from-primary via-primary-dark to-primary bg-[length:200%_auto] hover:bg-right-bottom hover:shadow-floating transform hover:scale-105 transition-all duration-500 font-bold animate-pulse hover:animate-none shadow-lg"
                >
                  <Target className="w-5 h-5 mr-2" />
                  Mulai Tes Minat Bakat
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (showResults) {
    const primaryType = getPrimaryRiasecType();
    const personalityData = riasecTypes[primaryType];
    const Icon = personalityData.icon;
    const totalScore = Object.values(scores).reduce((sum, score) => sum + score, 0);
    const percentage = Math.round((scores[primaryType] || 0) / totalScore * 100);

    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
        <div className="container mx-auto px-4 py-8">
          {/* Results Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-primary mb-8">
              Hasil Tes Kepribadian RIASEC
            </h1>
            
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <div className="flex items-center justify-center mb-6">
                  <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${personalityData.color} flex items-center justify-center shadow-lg`}>
                    <Icon className="w-12 h-12 text-white" />
                  </div>
                </div>
                <CardTitle className="text-3xl text-center mb-2">{personalityData.name}</CardTitle>
                <CardDescription className="text-center text-lg leading-relaxed">
                  {personalityData.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">Tingkat Kesesuaian</span>
                      <span className="font-bold text-primary">{percentage}%</span>
                    </div>
                    <Progress value={percentage} className="h-3" />
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3">Karakteristik Kepribadian:</h4>
                    <div className="flex gap-2 justify-center flex-wrap">
                      {personalityData.characteristics.map((char, index) => (
                        <Badge key={index} variant="default" className="px-3 py-1">
                          {char}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detailed RIASEC Scores */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-6 h-6" />
                Detail Skor RIASEC
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Object.entries(riasecTypes).map(([key, type]) => {
                  const score = scores[key] || 0;
                  const scorePercentage = totalScore > 0 ? (score / totalScore) * 100 : 0;
                  const TypeIcon = type.icon;
                  
                  return (
                    <div 
                      key={key} 
                      className={`p-4 rounded-lg border-2 transition-all ${
                        key === primaryType 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border bg-background hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${type.color} flex items-center justify-center`}>
                          <TypeIcon className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-semibold">{type.name}</span>
                      </div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-muted-foreground">Skor: {score}</span>
                        <span className="font-medium">{Math.round(scorePercentage)}%</span>
                      </div>
                      <Progress value={scorePercentage} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Career Recommendations */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-6 h-6" />
                Rekomendasi Karier untuk Tipe {personalityData.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                {personalityData.careers.map((career, index) => (
                  <Badge key={index} variant="outline" className="p-3 justify-center text-center">
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
              <Button onClick={() => navigate("/dashboard")} className="w-full mb-2">
                Mulai Belajar Sekarang
              </Button>
            </div>
            <Button 
              onClick={() => {
                setShowResults(false); 
                setShowPersonalityTypes(true);
                setCurrentStep(0); 
                setAnswers({});
                setScores({});
                setSelectedAnswer(null);
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
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-primary mb-4">
              Tes Kepribadian RIASEC
            </h1>
            <p className="text-lg text-muted-foreground">
              Jawab pertanyaan berikut untuk menemukan tipe kepribadian dan minat bakatmu
            </p>
          </div>

          {/* Progress */}
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-muted-foreground">Progress</span>
              <span className="text-sm font-medium">
                {currentStep + 1} dari {riasecQuestions.length}
              </span>
            </div>
            <Progress value={((currentStep + 1) / riasecQuestions.length) * 100} className="h-2" />
          </div>

          {/* Question */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center">
                  <Brain className="w-8 h-8 text-white" />
                </div>
              </div>
              <Badge variant="outline" className="mx-auto mb-2">
                {riasecQuestions[currentStep].category}
              </Badge>
              <CardTitle className="text-xl text-center">
                {riasecQuestions[currentStep].question}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup 
                value={selectedAnswer?.toString() || ""} 
                onValueChange={(value) => handleAnswer(parseInt(value))}
              >
                <div className="space-y-3">
                  {riasecQuestions[currentStep].options.map((option, index) => (
                    <div 
                      key={index} 
                      className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-all hover:bg-muted/50 ${
                        selectedAnswer === index ? 'border-primary bg-primary/5' : 'border-border'
                      }`}
                      onClick={() => handleAnswer(index)}
                    >
                      <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                      <Label 
                        htmlFor={`option-${index}`} 
                        className="flex-1 cursor-pointer font-medium leading-relaxed"
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
          <div className="flex justify-between items-center gap-4">
            <Button 
              variant="outline" 
              onClick={handleBack}
              disabled={currentStep === 0}
              className="flex items-center gap-2"
            >
              ← Sebelumnya
            </Button>
            
            <Button 
              onClick={handleNext}
              disabled={selectedAnswer === null}
              className="bg-primary text-primary-foreground flex items-center gap-2"
            >
              {currentStep === riasecQuestions.length - 1 ? 'Lihat Hasil' : 'Selanjutnya'} →
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Assessment;