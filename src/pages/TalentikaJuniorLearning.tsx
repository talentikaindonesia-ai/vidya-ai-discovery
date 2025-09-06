import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Play, Clock, Star, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TalentikaJuniorLearning = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = [
    { id: "all", name: "All", emoji: "🌟", color: "bg-purple-100 text-purple-600" },
    { id: "academic", name: "Academic Fun", emoji: "📚", color: "bg-blue-100 text-blue-600" },
    { id: "creativity", name: "Arts & Creativity", emoji: "🎨", color: "bg-pink-100 text-pink-600" },
    { id: "storytelling", name: "Storytelling", emoji: "📖", color: "bg-green-100 text-green-600" },
    { id: "stem", name: "STEM Kids", emoji: "🔬", color: "bg-cyan-100 text-cyan-600" },
    { id: "environment", name: "Environment", emoji: "🌱", color: "bg-emerald-100 text-emerald-600" },
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
          <h1 className="text-3xl font-bold mb-2">Learning Hub Junior 📚</h1>
          <p className="text-lg text-muted-foreground">
            Choose your adventure and start learning with fun!
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-3 justify-center mb-8">
          {categories.map((category) => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              onClick={() => setSelectedCategory(category.id)}
              className={`${category.color} hover:scale-105 transition-all`}
            >
              <span className="mr-2">{category.emoji}</span>
              {category.name}
            </Button>
          ))}
        </div>

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