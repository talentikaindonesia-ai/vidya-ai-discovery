import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Play, Clock, Star, Trophy, BookOpen, Gamepad2, Microscope } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TalentikaJuniorLearning = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("all");

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
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 p-4">
      <div className="max-w-6xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/talentika-junior')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

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

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-7">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="steam">STEAM</TabsTrigger>
            <TabsTrigger value="creative">Creative</TabsTrigger>
            <TabsTrigger value="eco">Eco Hero</TabsTrigger>
            <TabsTrigger value="digital">Digital</TabsTrigger>
            <TabsTrigger value="health">Health</TabsTrigger>
            <TabsTrigger value="culture">Culture</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
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
          </TabsContent>

          {/* Program-specific tabs */}
          {learningPrograms.map((program) => (
            <TabsContent key={program.id} value={program.id}>
              <Card className="p-8 shadow-xl border-0">
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
            </TabsContent>
          ))}
        </Tabs>

        {/* Content Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredContent.map((content) => (
            <Card 
              key={content.id} 
              className="group cursor-pointer hover:scale-105 transition-all duration-300 shadow-lg border-0 overflow-hidden"
              onClick={() => {
                // Navigate to content player or show modal
                console.log('Starting content:', content.title);
              }}
            >
              {/* Thumbnail */}
              <div className="relative h-32 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                <span className="text-6xl">{content.thumbnail}</span>
                {content.isCompleted && (
                  <Badge className="absolute top-2 right-2 bg-green-500 text-white">
                    Completed ✓
                  </Badge>
                )}
              </div>

              {/* Content Info */}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  {getTypeIcon(content.type)}
                  <Badge variant="secondary" className={getLevelColor(content.level)}>
                    {content.level}
                  </Badge>
                </div>

                <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">
                  {content.title}
                </h3>
                
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {content.description}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {content.duration}
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500" />
                      {content.xp} XP
                    </div>
                  </div>
                </div>

                {/* Progress bar for completed content */}
                {content.isCompleted && (
                  <div className="mt-3">
                    <Progress value={100} className="h-2" />
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* Progress Summary */}
        <Card className="mt-8 p-6 shadow-lg border-0">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Your Learning Progress
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-1">
                {learningContent.filter(c => c.isCompleted).length}
              </div>
              <div className="text-sm text-muted-foreground">Completed Activities</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-500 mb-1">
                {learningContent.filter(c => c.isCompleted).reduce((sum, c) => sum + c.xp, 0)}
              </div>
              <div className="text-sm text-muted-foreground">XP Earned</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-500 mb-1">
                {Math.round((learningContent.filter(c => c.isCompleted).length / learningContent.length) * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Overall Progress</div>
            </div>
          </div>
        </Card>

        {/* Recommended Next */}
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
      </div>
    </div>
  );
};

export default TalentikaJuniorLearning;