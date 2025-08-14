import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
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
  Zap
} from "lucide-react";

const Assessment = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [answers, setAnswers] = useState<number[]>([]);

  const questions = [
    {
      question: "Apa yang paling kamu sukai saat belajar?",
      options: [
        "Memecahkan masalah matematika",
        "Menulis cerita atau puisi", 
        "Mengamati alam dan lingkungan",
        "Berinteraksi dengan orang lain"
      ]
    },
    {
      question: "Aktivitas mana yang membuatmu paling bersemangat?",
      options: [
        "Membuat program komputer",
        "Menggambar atau melukis",
        "Melakukan eksperimen sains",
        "Memimpin organisasi"
      ]
    },
    {
      question: "Impian kariermu adalah...",
      options: [
        "Menjadi insinyur atau programmer",
        "Menjadi seniman atau desainer",
        "Menjadi peneliti atau dokter", 
        "Menjadi pengusaha atau diplomat"
      ]
    }
  ];

  const results = {
    primary: "Teknologi & Engineering",
    secondary: "Sains & Penelitian", 
    percentage: 85,
    description: "Kamu memiliki bakat kuat di bidang teknologi dan engineering dengan minat pada problem solving dan inovasi."
  };

  const recommendations = {
    courses: [
      { title: "Web Development Bootcamp", provider: "TechAcademy", duration: "12 minggu", price: "Rp 2.500.000" },
      { title: "Data Science Fundamentals", provider: "DataLearn", duration: "8 minggu", price: "Rp 1.800.000" },
      { title: "Mobile App Development", provider: "CodeCamp", duration: "10 minggu", price: "Rp 2.200.000" }
    ],
    certificates: [
      { name: "Google IT Support Certificate", issuer: "Google", level: "Professional" },
      { name: "AWS Cloud Practitioner", issuer: "Amazon", level: "Entry" },
      { name: "Microsoft Azure Fundamentals", issuer: "Microsoft", level: "Fundamentals" }
    ],
    opportunities: [
      { title: "Hackathon Jakarta 2024", type: "Kompetisi", date: "15 Maret 2024" },
      { title: "Tech Startup Incubator", type: "Program", date: "April 2024" },
      { title: "AI Workshop Series", type: "Workshop", date: "Ongoing" }
    ],
    scholarships: [
      { name: "Beasiswa Teknologi Indonesia", amount: "Rp 50.000.000", deadline: "30 April 2024" },
      { name: "STEM Excellence Scholarship", amount: "Rp 30.000.000", deadline: "15 Mei 2024" }
    ],
    internships: [
      { company: "Gojek", position: "Software Engineering Intern", location: "Jakarta" },
      { company: "Tokopedia", position: "Data Science Intern", location: "Jakarta" },
      { company: "Traveloka", position: "Product Manager Intern", location: "Jakarta" }
    ],
    communities: [
      { name: "Indonesia JavaScript Community", members: "25K+", focus: "Web Development" },
      { name: "Data Science Indonesia", members: "18K+", focus: "Data & AI" },
      { name: "Google Developer Group Jakarta", members: "15K+", focus: "Tech General" }
    ]
  };

  const handleAnswer = (answerIndex: number) => {
    const newAnswers = [...answers, answerIndex];
    setAnswers(newAnswers);
    
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowResults(true);
    }
  };

  if (showResults) {
    return (
      <div className="min-h-screen bg-gradient-soft">
        <div className="container mx-auto px-4 py-8">
          {/* Results Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
              Hasil Tes Minat & Bakatmu
            </h1>
            <Card className="max-w-2xl mx-auto">
              <CardHeader>
                <div className="flex items-center justify-center mb-4">
                  <div className="w-20 h-20 rounded-full bg-gradient-primary flex items-center justify-center">
                    <Brain className="w-10 h-10 text-white" />
                  </div>
                </div>
                <CardTitle className="text-2xl text-center">{results.primary}</CardTitle>
                <CardDescription className="text-center text-lg">
                  {results.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>Kesesuaian</span>
                      <span className="font-semibold">{results.percentage}%</span>
                    </div>
                    <Progress value={results.percentage} className="h-3" />
                  </div>
                  <div className="flex gap-2 justify-center">
                    <Badge variant="default">{results.primary}</Badge>
                    <Badge variant="secondary">{results.secondary}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations Tabs */}
          <Tabs defaultValue="courses" className="max-w-6xl mx-auto">
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
              <TabsTrigger value="courses">Kursus</TabsTrigger>
              <TabsTrigger value="certificates">Sertifikat</TabsTrigger>
              <TabsTrigger value="portfolio">Portofolio</TabsTrigger>
              <TabsTrigger value="opportunities">Peluang</TabsTrigger>
              <TabsTrigger value="competitions">Kompetisi</TabsTrigger>
              <TabsTrigger value="scholarships">Beasiswa</TabsTrigger>
              <TabsTrigger value="internships">Magang</TabsTrigger>
              <TabsTrigger value="communities">Komunitas</TabsTrigger>
            </TabsList>

            <TabsContent value="courses" className="mt-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {recommendations.courses.map((course, index) => (
                  <Card key={index} className="hover:shadow-card transition-smooth">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <BookOpen className="w-8 h-8 text-primary" />
                        <Badge variant="outline">{course.duration}</Badge>
                      </div>
                      <CardTitle className="text-lg">{course.title}</CardTitle>
                      <CardDescription>{course.provider}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-primary">{course.price}</span>
                        <Button size="sm">Daftar</Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="certificates" className="mt-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {recommendations.certificates.map((cert, index) => (
                  <Card key={index} className="hover:shadow-card transition-smooth">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <Award className="w-8 h-8 text-primary" />
                        <Badge variant="secondary">{cert.level}</Badge>
                      </div>
                      <CardTitle className="text-lg">{cert.name}</CardTitle>
                      <CardDescription>{cert.issuer}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button size="sm" className="w-full">Pelajari</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="portfolio" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="w-6 h-6" />
                    Bangun Portofolio Digital
                  </CardTitle>
                  <CardDescription>
                    Showcase karya dan proyekmu untuk menarik perhatian rekruter
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">GitHub Portfolio</h4>
                      <p className="text-sm text-muted-foreground mb-3">Tampilkan project coding-mu</p>
                      <Button size="sm" variant="outline">Buat GitHub</Button>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">LinkedIn Profile</h4>
                      <p className="text-sm text-muted-foreground mb-3">Networking profesional</p>
                      <Button size="sm" variant="outline">Optimasi LinkedIn</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="opportunities" className="mt-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {recommendations.opportunities.map((opp, index) => (
                  <Card key={index} className="hover:shadow-card transition-smooth">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <Target className="w-8 h-8 text-primary" />
                        <Badge>{opp.type}</Badge>
                      </div>
                      <CardTitle className="text-lg">{opp.title}</CardTitle>
                      <CardDescription>{opp.date}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button size="sm" className="w-full">Info Detail</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="competitions" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-6 h-6" />
                    Kompetisi & Olimpiade
                  </CardTitle>
                  <CardDescription>
                    Uji kemampuanmu dengan mengikuti kompetisi bergengsi
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">Olimpiade Informatika</h4>
                      <p className="text-sm text-muted-foreground mb-3">Kompetisi programming nasional</p>
                      <Button size="sm" variant="outline">Daftar</Button>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h4 className="font-semibold mb-2">Hackathon Nasional</h4>
                      <p className="text-sm text-muted-foreground mb-3">48 jam coding challenge</p>
                      <Button size="sm" variant="outline">Info Detail</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="scholarships" className="mt-6">
              <div className="grid gap-4 md:grid-cols-2">
                {recommendations.scholarships.map((scholarship, index) => (
                  <Card key={index} className="hover:shadow-card transition-smooth">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <GraduationCap className="w-8 h-8 text-primary" />
                        <Badge variant="default">{scholarship.amount}</Badge>
                      </div>
                      <CardTitle className="text-lg">{scholarship.name}</CardTitle>
                      <CardDescription>Deadline: {scholarship.deadline}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button size="sm" className="w-full">Apply Sekarang</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="internships" className="mt-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {recommendations.internships.map((internship, index) => (
                  <Card key={index} className="hover:shadow-card transition-smooth">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <Building className="w-8 h-8 text-primary" />
                        <Badge variant="outline">{internship.location}</Badge>
                      </div>
                      <CardTitle className="text-lg">{internship.position}</CardTitle>
                      <CardDescription>{internship.company}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button size="sm" className="w-full">Lamar</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="communities" className="mt-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {recommendations.communities.map((community, index) => (
                  <Card key={index} className="hover:shadow-card transition-smooth">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <Users className="w-8 h-8 text-primary" />
                        <Badge variant="secondary">{community.members}</Badge>
                      </div>
                      <CardTitle className="text-lg">{community.name}</CardTitle>
                      <CardDescription>{community.focus}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button size="sm" className="w-full">Gabung</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          <div className="text-center mt-8">
            <Button onClick={() => {setShowResults(false); setCurrentStep(0); setAnswers([])}} variant="outline">
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
              Tes Minat & Bakatmu
            </h1>
            <p className="text-lg text-muted-foreground">
              Temukan bidang yang paling sesuai dengan kepribadian dan minatmu
            </p>
          </div>

          {/* Progress */}
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-muted-foreground">Progress</span>
              <span className="text-sm font-medium">
                {currentStep + 1} dari {questions.length}
              </span>
            </div>
            <Progress value={((currentStep + 1) / questions.length) * 100} className="h-2" />
          </div>

          {/* Question */}
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-primary flex items-center justify-center">
                  {currentStep === 0 && <Heart className="w-8 h-8 text-white" />}
                  {currentStep === 1 && <Zap className="w-8 h-8 text-white" />}
                  {currentStep === 2 && <Target className="w-8 h-8 text-white" />}
                </div>
              </div>
              <CardTitle className="text-xl text-center">
                {questions[currentStep].question}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {questions[currentStep].options.map((option, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="w-full text-left justify-start h-auto p-4"
                  onClick={() => handleAnswer(index)}
                >
                  {option}
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Assessment;