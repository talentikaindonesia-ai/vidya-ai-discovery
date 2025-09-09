import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Play, Clock, Star, Trophy, BookOpen, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { TalentikaJuniorBottomNav } from "@/components/dashboard/TalentikaJuniorBottomNav";

const TalentikaJuniorLearning = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [selectedCategory, setSelectedCategory] = useState("overview");
  const [activeProgram, setActiveProgram] = useState<string | null>(null);

  const learningPrograms = [
    {
      id: "steam",
      title: "STEAM Explorer",
      description: "Sains & Teknologi untuk anak dengan eksperimen seru",
      icon: "🔬",
      color: "from-blue-400 to-cyan-400",
      modules: ["Robot Mini", "Eksperimen Rumah", "Teknologi Sederhana"]
    },
    {
      id: "creative",
      title: "Creative Corner", 
      description: "Musik, seni, dan coding kreatif untuk eksplorasi diri",
      icon: "🎨",
      color: "from-pink-400 to-purple-400",
      modules: ["Digital Art", "Music Maker", "Creative Coding"]
    },
    {
      id: "eco",
      title: "Eco Hero Academy",
      description: "Lingkungan, daur ulang, dan permainan ramah bumi",
      icon: "🌱", 
      color: "from-green-400 to-emerald-400",
      modules: ["Eco Games", "Daur Ulang", "Pelestarian Alam"]
    },
    {
      id: "digital",
      title: "Digital Innovator Academy",
      description: "Coding dasar, AR/VR sederhana, dan desain game",
      icon: "💻",
      color: "from-purple-400 to-indigo-400", 
      modules: ["Coding Basics", "AR/VR Simple", "Game Design"]
    },
    {
      id: "health",
      title: "Healthy Heroes",
      description: "Kesehatan, nutrisi, dan olahraga ringan untuk anak",
      icon: "💪",
      color: "from-orange-400 to-red-400",
      modules: ["Nutrisi Fun", "Olahraga Ringan", "Kesehatan Mental"]
    },
    {
      id: "culture",
      title: "Culture & Language Fun",
      description: "Bahasa Inggris dan budaya Nusantara yang menarik",
      icon: "🌍",
      color: "from-yellow-400 to-orange-400",
      modules: ["English Games", "Budaya Nusantara", "Cerita Rakyat"]
    }
  ];

  const learningContent = [
    {
      id: 1,
      title: "Math Magic with Numbers",
      description: "Learn fun math tricks that will make you a number wizard!",
      category: "academic",
      type: "video",
      duration: "5 min",
      xp: 50,
      level: "Beginner",
      thumbnail: "🔢",
      isCompleted: false,
    },
    {
      id: 2,
      title: "Rainbow Art Adventure",
      description: "Create beautiful artwork using colors and shapes!",
      category: "creativity",
      type: "interactive",
      duration: "10 min",
      xp: 75,
      level: "Beginner",
      thumbnail: "🌈",
      isCompleted: true,
    },
    {
      id: 3,
      title: "Space Explorer Stories",
      description: "Join astronauts on exciting adventures in space!",
      category: "storytelling",
      type: "video",
      duration: "7 min",
      xp: 60,
      level: "Beginner",
      thumbnail: "🚀",
      isCompleted: false,
    },
    {
      id: 4,
      title: "Simple Science Experiments",
      description: "Safe and fun experiments you can do at home!",
      category: "stem",
      type: "interactive",
      duration: "15 min",
      xp: 100,
      level: "Intermediate",
      thumbnail: "⚗️",
      isCompleted: false,
    },
    {
      id: 5,
      title: "Animal Friends Around the World",
      description: "Discover amazing animals and their habitats!",
      category: "environment",
      type: "video",
      duration: "8 min",
      xp: 65,
      level: "Beginner",
      thumbnail: "🐾",
      isCompleted: false,
    },
    {
      id: 6,
      title: "Music Maker Workshop",
      description: "Create your own songs and learn about instruments!",
      category: "creativity",
      type: "interactive",
      duration: "12 min",
      xp: 80,
      level: "Beginner",
      thumbnail: "🎵",
      isCompleted: false,
    }
  ];

  const filteredContent = selectedCategory === "all" 
    ? learningContent 
    : learningContent.filter(content => content.category === selectedCategory);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "video":
        return <Play className="w-4 h-4" />;
      case "interactive":
        return <Trophy className="w-4 h-4" />;
      default:
        return <Star className="w-4 h-4" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Beginner":
        return "bg-green-100 text-green-700";
      case "Intermediate":
        return "bg-yellow-100 text-yellow-700";
      case "Advanced":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
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
            <BookOpen className="w-8 h-8 text-blue-500" />
            Learning Hub Junior 📚
          </h1>
          <p className="text-lg text-muted-foreground">
            6 Program Pembelajaran Seru untuk Mengembangkan Bakat dan Minatmu!
          </p>
        </div>

        {/* Mobile view - No tabs, use sections */}
        {isMobile ? (
          <div className="space-y-6">
            {/* Back to overview button if viewing a specific program */}
            {activeProgram && (
              <Button 
                variant="ghost" 
                onClick={() => setActiveProgram(null)}
                className="mb-4"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Programs
              </Button>
            )}

            {!activeProgram ? (
              <>
                {/* Programs Grid */}
                <div className="grid gap-4 mb-8">
                  {learningPrograms.map((program) => (
                    <Card 
                      key={program.id}
                      className="p-4 cursor-pointer hover:scale-105 transition-all duration-300 shadow-lg border-0"
                      onClick={() => setActiveProgram(program.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-16 h-16 bg-gradient-to-br ${program.color} rounded-lg flex items-center justify-center`}>
                          <span className="text-2xl">{program.icon}</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg mb-1">{program.title}</h3>
                          <p className="text-muted-foreground text-sm mb-2">{program.description}</p>
                          <div className="text-xs text-muted-foreground">
                            {program.modules.length} modules available
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Stats Overview */}
                <Card className="p-6 shadow-lg border-0 bg-gradient-to-r from-purple-100 to-pink-100">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Trophy className="w-6 h-6 text-yellow-500" />
                    Progress Overview
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-500 mb-1">24</div>
                      <div className="text-xs text-muted-foreground">Video Lessons</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-500 mb-1">12</div>
                      <div className="text-xs text-muted-foreground">Completed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-500 mb-1">18</div>
                      <div className="text-xs text-muted-foreground">Interactive</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-500 mb-1">50%</div>
                      <div className="text-xs text-muted-foreground">Progress</div>
                    </div>
                  </div>
                </Card>
              </>
            ) : (
              /* Program Detail View */
              <>
                {(() => {
                  const program = learningPrograms.find(p => p.id === activeProgram);
                  if (!program) return null;
                  
                  return (
                    <Card className="p-6 shadow-xl border-0">
                      <div className="text-center mb-6">
                        <div className={`w-20 h-20 bg-gradient-to-br ${program.color} rounded-full flex items-center justify-center text-4xl mx-auto mb-4`}>
                          {program.icon}
                        </div>
                        <h2 className="text-2xl font-bold mb-2">{program.title}</h2>
                        <p className="text-muted-foreground">{program.description}</p>
                      </div>

                      <div className="space-y-4 mb-6">
                        {program.modules.map((module, index) => (
                          <Card key={index} className="p-4 hover:scale-105 transition-transform cursor-pointer">
                            <div className="flex items-center gap-4">
                              <div className="text-2xl">
                                {index === 0 ? "📚" : index === 1 ? "🎮" : "⭐"}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-bold">{module}</h4>
                                <p className="text-sm text-muted-foreground">Interactive learning module</p>
                              </div>
                              <Button size="sm" variant="outline">
                                Start
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>

                      <div className="text-center">
                        <Button size="lg" className={`bg-gradient-to-r ${program.color} text-white`}>
                          <Play className="w-5 h-5 mr-2" />
                          Mulai Program Ini
                        </Button>
                      </div>
                    </Card>
                  );
                })()}
              </>
            )}
          </div>
        ) : (
          /* Desktop view - Keep tabs */
          <div className="space-y-6">
            {/* Desktop tabs navigation */}
            <div className="flex flex-wrap gap-2 justify-center">
              {[{ id: "overview", label: "Overview" }, ...learningPrograms.map(p => ({ id: p.id, label: p.title }))].map((tab) => (
                <Button
                  key={tab.id}
                  variant={selectedCategory === tab.id ? "default" : "outline"}
                  onClick={() => setSelectedCategory(tab.id)}
                  className="text-sm"
                >
                  {tab.label}
                </Button>
              ))}
            </div>

            {/* Overview Section */}
            {selectedCategory === "overview" && (
              <>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {learningPrograms.map((program) => (
                    <Card 
                      key={program.id}
                      className="p-6 cursor-pointer hover:scale-105 transition-all duration-300 shadow-lg border-0"
                      onClick={() => setSelectedCategory(program.id)}
                    >
                      <div className={`h-20 bg-gradient-to-br ${program.color} rounded-lg flex items-center justify-center mb-4`}>
                        <span className="text-4xl">{program.icon}</span>
                      </div>
                      <h3 className="font-bold text-xl mb-2">{program.title}</h3>
                      <p className="text-muted-foreground mb-4">{program.description}</p>
                      <div className="space-y-1">
                        {program.modules.map((module, index) => (
                          <div key={index} className="text-sm flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-primary rounded-full"></span>
                            {module}
                          </div>
                        ))}
                      </div>
                    </Card>
                  ))}
                </div>

                {/* Stats Overview */}
                <Card className="p-6 shadow-lg border-0 bg-gradient-to-r from-purple-100 to-pink-100">
                  <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                    <Trophy className="w-6 h-6 text-yellow-500" />
                    Progress Overview
                  </h3>
                  <div className="grid md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-500 mb-1">24</div>
                      <div className="text-sm text-muted-foreground">Video Lessons</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-500 mb-1">12</div>
                      <div className="text-sm text-muted-foreground">Completed</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-500 mb-1">18</div>
                      <div className="text-sm text-muted-foreground">Interactive</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-500 mb-1">50%</div>
                      <div className="text-sm text-muted-foreground">Progress</div>
                    </div>
                  </div>
                </Card>
              </>
            )}

            {/* Program-specific sections for desktop */}
            {learningPrograms.map((program) => 
              selectedCategory === program.id && (
                <Card key={program.id} className="p-8 shadow-xl border-0">
                  <div className="text-center mb-8">
                    <div className={`w-24 h-24 bg-gradient-to-br ${program.color} rounded-full flex items-center justify-center text-5xl mx-auto mb-4`}>
                      {program.icon}
                    </div>
                    <h2 className="text-3xl font-bold mb-2">{program.title}</h2>
                    <p className="text-lg text-muted-foreground">{program.description}</p>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6 mb-8">
                    {program.modules.map((module, index) => (
                      <Card key={index} className="p-4 hover:scale-105 transition-transform cursor-pointer">
                        <div className="text-center">
                          <div className="text-3xl mb-2">
                            {index === 0 ? "📚" : index === 1 ? "🎮" : "⭐"}
                          </div>
                          <h4 className="font-bold">{module}</h4>
                          <p className="text-sm text-muted-foreground mt-2">
                            Interactive learning module
                          </p>
                          <Button size="sm" className="mt-4" variant="outline">
                            Start Learning
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>

                  <div className="text-center">
                    <Button size="lg" className={`bg-gradient-to-r ${program.color} text-white`}>
                      <Play className="w-5 h-5 mr-2" />
                      Mulai Program Ini
                    </Button>
                  </div>
                </Card>
              )
            )}
          </div>
        )}

        {/* Recommended Next - Only on desktop for now */}
        {!isMobile && (
          <Card className="mt-6 p-6 shadow-lg border-0">
            <h3 className="text-xl font-bold mb-4">Recommended for You 🎯</h3>
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg">
              <span className="text-4xl">🔢</span>
              <div className="flex-1">
                <h4 className="font-bold">Math Magic with Numbers</h4>
                <p className="text-sm text-muted-foreground">Perfect for building your number skills!</p>
              </div>
              <Button className="bg-gradient-to-r from-primary to-accent hover:scale-105 transition-transform">
                Start Now!
              </Button>
            </div>
          </Card>
        )}
      </div>
      
      <TalentikaJuniorBottomNav />
    </div>
  );
};

export default TalentikaJuniorLearning;