import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Gamepad2, Trophy, Clock, Star, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useGameification } from "@/hooks/useGameification";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { TalentikaJuniorBottomNav } from "@/components/dashboard/TalentikaJuniorBottomNav";

const TalentikaJuniorGames = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { awardXP, updateStreak } = useGameification();
  const [playingGame, setPlayingGame] = useState<string | null>(null);

  const games = [
    {
      id: "math-adventure",
      title: "Math Adventure",
      description: "Solve puzzles and explore the magical world of numbers!",
      category: "academic",
      difficulty: "Easy",
      duration: "5-10 min",
      xp: 50,
      coins: 25,
      thumbnail: "🔢",
      color: "from-blue-400 to-cyan-400",
      isUnlocked: true,
    },
    {
      id: "word-explorer",
      title: "Word Explorer",
      description: "Discover new words and build your vocabulary in fun ways!",
      category: "language",
      difficulty: "Easy",
      duration: "5-8 min",
      xp: 40,
      coins: 20,
      thumbnail: "📝",
      color: "from-green-400 to-teal-400",
      isUnlocked: true,
    },
    {
      id: "eco-challenge",
      title: "Eco Challenge Game",
      description: "Save the planet with environmental missions!",
      category: "environment",
      difficulty: "Medium",
      duration: "10-15 min",
      xp: 75,
      coins: 40,
      thumbnail: "🌱",
      color: "from-emerald-400 to-green-400",
      isUnlocked: true,
    },
    {
      id: "robot-builder",
      title: "Robot Builder",
      description: "Build and program your own virtual robots!",
      category: "stem",
      difficulty: "Medium",
      duration: "15-20 min",
      xp: 100,
      coins: 50,
      thumbnail: "🤖",
      color: "from-purple-400 to-indigo-400",
      isUnlocked: true,
    },
    {
      id: "art-music-jam",
      title: "Art & Music Jam",
      description: "Create digital art and compose simple melodies!",
      category: "creativity",
      difficulty: "Easy",
      duration: "10-12 min",
      xp: 60,
      coins: 30,
      thumbnail: "🎨",
      color: "from-pink-400 to-rose-400",
      isUnlocked: true,
    },
    {
      id: "space-explorer",
      title: "Space Explorer",
      description: "Journey through the solar system and learn about planets!",
      category: "science",
      difficulty: "Medium",
      duration: "12-15 min",
      xp: 80,
      coins: 40,
      thumbnail: "🚀",
      color: "from-indigo-400 to-purple-400",
      isUnlocked: false,
    },
  ];

  const categories = [
    { id: "all", name: "All Games", emoji: "🎮", color: "bg-purple-100 text-purple-600" },
    { id: "academic", name: "Academic", emoji: "📚", color: "bg-blue-100 text-blue-600" },
    { id: "creativity", name: "Creative", emoji: "🎨", color: "bg-pink-100 text-pink-600" },
    { id: "stem", name: "STEM", emoji: "🔬", color: "bg-cyan-100 text-cyan-600" },
    { id: "environment", name: "Eco", emoji: "🌱", color: "bg-green-100 text-green-600" },
    { id: "science", name: "Science", emoji: "🌌", color: "bg-indigo-100 text-indigo-600" },
  ];

  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredGames = selectedCategory === "all" 
    ? games 
    : games.filter(game => game.category === selectedCategory);

  const handlePlayGame = async (game: any) => {
    if (!game.isUnlocked) {
      toast.error("This game will be unlocked soon! Keep playing other games to unlock it.");
      return;
    }

    setPlayingGame(game.id);
    
    // Simulate game completion
    setTimeout(async () => {
      await awardXP(game.xp, `Completed ${game.title}`);
      await updateStreak('gaming');
      
      toast.success(`🎉 Game completed! +${game.xp} XP, +${game.coins} coins!`);
      setPlayingGame(null);
    }, 2000);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "bg-green-100 text-green-700";
      case "Medium":
        return "bg-yellow-100 text-yellow-700";
      case "Hard":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 p-4">
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
            <Gamepad2 className="w-8 h-8 text-purple-500" />
            Play & Learn Games 🎮
          </h1>
          <p className="text-lg text-muted-foreground">
            Have fun while learning with our educational games!
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

        {/* Games Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {filteredGames.map((game) => (
            <Card 
              key={game.id} 
              className={`group cursor-pointer hover:scale-105 transition-all duration-300 shadow-lg border-0 overflow-hidden ${!game.isUnlocked ? 'opacity-75' : ''}`}
              onClick={() => handlePlayGame(game)}
            >
              {/* Game Thumbnail */}
              <div className={`relative h-32 bg-gradient-to-br ${game.color} flex items-center justify-center`}>
                <span className="text-6xl">{game.thumbnail}</span>
                {!game.isUnlocked && (
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <span className="text-white font-bold">🔒 Coming Soon</span>
                  </div>
                )}
                {playingGame === game.id && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="text-white text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent mx-auto mb-2"></div>
                      <span className="text-sm">Playing...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Game Info */}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Play className="w-4 h-4 text-primary" />
                  <Badge variant="secondary" className={getDifficultyColor(game.difficulty)}>
                    {game.difficulty}
                  </Badge>
                </div>

                <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">
                  {game.title}
                </h3>
                
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {game.description}
                </p>

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {game.duration}
                    </div>
                  </div>
                </div>

                {/* Rewards */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm font-medium">{game.xp} XP</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-yellow-600">🪙</span>
                      <span className="text-sm font-medium">{game.coins}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Challenge si Jagoan Sains */}
        <Card className="p-6 shadow-lg border-0 bg-gradient-to-r from-blue-100 to-purple-100">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            🧪 Challenge si Jagoan Sains
          </h3>
          <div className="flex items-center gap-6">
            <div className="text-6xl">🧪</div>
            <div className="flex-1">
              <h4 className="text-2xl font-bold mb-2">Quiz Sains Interaktif</h4>
              <p className="text-muted-foreground mb-4">
                Uji pengetahuan sainsmu dengan quiz interaktif ala Kahoot! Kompetisi dengan teman-teman dan lihat posisimu di leaderboard.
              </p>
              <div className="flex items-center gap-4 mb-4">
                <Badge className="bg-blue-100 text-blue-700">Quiz Challenge</Badge>
                <div className="flex items-center gap-2 text-sm">
                  <Star className="w-4 h-4 text-yellow-500" />
                  <span>200 XP per Quiz</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  <span>Leaderboard</span>
                </div>
              </div>
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:scale-105 transition-transform"
                onClick={() => navigate('/quiz-explore')}
              >
                Mulai Quiz Sekarang! 🚀
              </Button>
            </div>
          </div>
        </Card>

        {/* Game Stats */}
        <Card className="mt-6 p-6 shadow-lg border-0">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Your Gaming Stats
          </h3>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-500 mb-1">12</div>
              <div className="text-sm text-muted-foreground">Games Played</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-500 mb-1">8</div>
              <div className="text-sm text-muted-foreground">Games Completed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-500 mb-1">450</div>
              <div className="text-sm text-muted-foreground">XP from Games</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-500 mb-1">3</div>
              <div className="text-sm text-muted-foreground">Day Streak</div>
            </div>
          </div>
        </Card>
      </div>
      
      <TalentikaJuniorBottomNav />
    </div>
  );
};

export default TalentikaJuniorGames;