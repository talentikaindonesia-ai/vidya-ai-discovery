import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Star, Compass, Heart, Lightbulb, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import TalentQuiz from "@/components/junior/TalentQuiz";
import DreamExplorer from "@/components/junior/DreamExplorer";
import { TalentikaJuniorBottomNav } from "@/components/dashboard/TalentikaJuniorBottomNav";

const TalentikaJuniorDiscovery = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [activeSection, setActiveSection] = useState("overview");
  const [quizResults, setQuizResults] = useState<any>(null);

  const discoveryPrograms = [
    {
      id: "talent-quiz",
      title: "Talent Quiz",
      description: "Tes interaktif untuk menemukan minat dan bakat unikmu",
      icon: "🎯",
      color: "from-blue-400 to-cyan-400",
      features: ["15 pertanyaan menarik", "Hasil personal", "Rekomendasi jalur belajar"]
    },
    {
      id: "dream-explorer", 
      title: "Dream Explorer",
      description: "Jelajahi berbagai profesi impian dan jalur kariermu",
      icon: "🌟",
      color: "from-purple-400 to-pink-400",
      features: ["20+ profesi menarik", "Jalur belajar detail", "Tips dari ahli"]
    },
    {
      id: "story-journey",
      title: "Story Journey", 
      description: "Cerita inspiratif tokoh-tokoh hebat dunia",
      icon: "📚",
      color: "from-green-400 to-teal-400",
      features: ["Tokoh inspiratif", "Cerita interaktif", "Pelajaran hidup"]
    }
  ];

  const inspirationalFigures = [
    {
      name: "Marie Curie",
      field: "Sains",
      achievement: "Ilmuwan pemenang Nobel pertama",
      story: "Dari laboratorium sederhana hingga penemuan radioaktivitas",
      image: "👩‍🔬",
      color: "bg-blue-100"
    },
    {
      name: "Leonardo da Vinci",
      field: "Seni & Teknologi", 
      achievement: "Seniman dan penemu genius",
      story: "Menggabungkan seni dan sains dalam karya-karya luar biasa",
      image: "🎨",
      color: "bg-purple-100"
    },
    {
      name: "Usain Bolt",
      field: "Olahraga",
      achievement: "Pelari tercepat di dunia",
      story: "Dari anak kecil di Jamaica hingga juara Olimpiade",
      image: "🏃‍♂️",
      color: "bg-yellow-100"
    }
  ];

  const handleQuizComplete = (results: any) => {
    setQuizResults(results);
    setActiveSection("results");
  };

  return (
    <div className={cn("min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 p-4", isMobile && "pb-20")}>
      <div className="max-w-6xl mx-auto">
        {!isMobile && (
          <Button 
            variant="ghost" 
            onClick={() => navigate('/talentika-junior')}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
            <Compass className="w-8 h-8 text-blue-500" />
            Discover Your Talents! 🌟
          </h1>
          <p className="text-lg text-muted-foreground">
            Temukan minat, bakat, dan passion unikmu melalui program eksplorasi yang menyenangkan
          </p>
        </div>

        {/* Mobile view - No tabs, use sections */}
        {isMobile ? (
          <div className="space-y-6">
            {/* Back button for mobile when in specific section */}
            {activeSection !== "overview" && (
              <Button 
                variant="ghost" 
                onClick={() => setActiveSection("overview")}
                className="mb-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Discovery
              </Button>
            )}

            {activeSection === "overview" ? (
              <>
                {/* Discovery Programs */}
                <div className="space-y-4 mb-8">
                  {discoveryPrograms.map((program) => (
                    <Card 
                      key={program.id}
                      className="p-4 cursor-pointer hover:scale-105 transition-all duration-300 shadow-lg border-0"
                      onClick={() => setActiveSection(program.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-16 h-16 bg-gradient-to-br ${program.color} rounded-lg flex items-center justify-center`}>
                          <span className="text-2xl">{program.icon}</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg mb-1">{program.title}</h3>
                          <p className="text-muted-foreground text-sm mb-2">{program.description}</p>
                          <div className="flex flex-wrap gap-1">
                            {program.features.slice(0, 2).map((feature, index) => (
                              <span key={index} className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                                {feature}
                              </span>
                            ))}
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Inspirational Figures Preview */}
                <Card className="p-6 shadow-lg border-0">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-500" />
                    Tokoh Inspiratif
                  </h3>
                  <div className="grid grid-cols-3 gap-4">
                    {inspirationalFigures.map((figure, index) => (
                      <div key={index} className={`p-3 ${figure.color} rounded-lg`}>
                        <div className="text-center">
                          <div className="text-3xl mb-2">{figure.image}</div>
                          <h4 className="font-bold text-sm">{figure.name}</h4>
                          <p className="text-xs text-muted-foreground">{figure.field}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </>
            ) : activeSection === "talent-quiz" ? (
              <TalentQuiz onComplete={handleQuizComplete} />
            ) : activeSection === "dream-explorer" ? (
              <DreamExplorer />
            ) : activeSection === "story-journey" ? (
              <Card className="p-6 text-center shadow-xl border-0">
                <div className="mb-6">
                  <div className="text-6xl mb-4">📚</div>
                  <h2 className="text-2xl font-bold mb-4">Story Journey</h2>
                  <p className="text-muted-foreground mb-6">
                    Cerita-cerita inspiratif dari tokoh hebat yang mengubah dunia
                  </p>
                </div>

                <div className="space-y-4">
                  {inspirationalFigures.map((figure, index) => (
                    <Card key={index} className={`p-4 ${figure.color} border-0 hover:scale-105 transition-transform cursor-pointer`}>
                      <div className="flex items-center gap-4">
                        <div className="text-4xl">{figure.image}</div>
                        <div className="flex-1 text-left">
                          <h3 className="font-bold text-lg mb-1">{figure.name}</h3>
                          <p className="text-sm font-medium text-primary mb-1">{figure.field}</p>
                          <p className="text-xs text-muted-foreground mb-2">{figure.achievement}</p>
                          <p className="text-xs italic">"{figure.story}"</p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                <div className="mt-6">
                  <Button size="lg" className="bg-gradient-to-r from-primary to-accent">
                    <Lightbulb className="w-5 h-5 mr-2" />
                    Mulai Petualangan Cerita
                  </Button>
                </div>
              </Card>
            ) : null}
          </div>
        ) : (
          /* Desktop view - Keep tabs but cleaner */
          <div className="space-y-6">
            {/* Desktop section navigation */}
            <div className="flex flex-wrap gap-2 justify-center">
              {[{ id: "overview", label: "Overview" }, ...discoveryPrograms.map(p => ({ id: p.id, label: p.title }))].map((section) => (
                <Button
                  key={section.id}
                  variant={activeSection === section.id ? "default" : "outline"}
                  onClick={() => setActiveSection(section.id)}
                  className="text-sm"
                >
                  {section.label}
                </Button>
              ))}
            </div>

            {/* Overview Section */}
            {activeSection === "overview" && (
              <>
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  {discoveryPrograms.map((program) => (
                    <Card 
                      key={program.id}
                      className="p-6 cursor-pointer hover:scale-105 transition-all duration-300 shadow-lg border-0"
                      onClick={() => setActiveSection(program.id)}
                    >
                      <div className={`h-20 bg-gradient-to-br ${program.color} rounded-lg flex items-center justify-center mb-4`}>
                        <span className="text-4xl">{program.icon}</span>
                      </div>
                      <h3 className="font-bold text-xl mb-2">{program.title}</h3>
                      <p className="text-muted-foreground mb-4">{program.description}</p>
                      <ul className="space-y-1">
                        {program.features.map((feature, index) => (
                          <li key={index} className="text-sm flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </Card>
                  ))}
                </div>

                {/* Inspirational Figures Preview */}
                <Card className="p-6 shadow-lg border-0">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-500" />
                    Tokoh Inspiratif
                  </h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    {inspirationalFigures.map((figure, index) => (
                      <div key={index} className={`p-4 ${figure.color} rounded-lg`}>
                        <div className="text-center">
                          <div className="text-4xl mb-2">{figure.image}</div>
                          <h4 className="font-bold">{figure.name}</h4>
                          <p className="text-sm text-muted-foreground">{figure.field}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </>
            )}

            {/* Talent Quiz Section */}
            {activeSection === "talent-quiz" && <TalentQuiz onComplete={handleQuizComplete} />}

            {/* Dream Explorer Section */}
            {activeSection === "dream-explorer" && <DreamExplorer />}

            {/* Story Journey Section */}
            {activeSection === "story-journey" && (
              <Card className="p-8 text-center shadow-xl border-0">
                <div className="mb-6">
                  <div className="text-8xl mb-4">📚</div>
                  <h2 className="text-3xl font-bold mb-4">Story Journey</h2>
                  <p className="text-lg text-muted-foreground mb-6">
                    Cerita-cerita inspiratif dari tokoh hebat yang mengubah dunia
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {inspirationalFigures.map((figure, index) => (
                    <Card key={index} className={`p-6 ${figure.color} border-0 hover:scale-105 transition-transform cursor-pointer`}>
                      <div className="text-center">
                        <div className="text-6xl mb-4">{figure.image}</div>
                        <h3 className="font-bold text-xl mb-2">{figure.name}</h3>
                        <p className="text-sm font-medium text-primary mb-2">{figure.field}</p>
                        <p className="text-sm text-muted-foreground mb-4">{figure.achievement}</p>
                        <p className="text-sm italic">"{figure.story}"</p>
                      </div>
                    </Card>
                  ))}
                </div>

                <div className="mt-8">
                  <Button size="lg" className="bg-gradient-to-r from-primary to-accent">
                    <Lightbulb className="w-5 h-5 mr-2" />
                    Mulai Petualangan Cerita
                  </Button>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
      
      <TalentikaJuniorBottomNav />
    </div>
  );
};

export default TalentikaJuniorDiscovery;