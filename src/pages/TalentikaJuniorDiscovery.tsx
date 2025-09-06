import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TalentikaJuniorDiscovery = () => {
  const navigate = useNavigate();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);

  const questions = [
    {
      question: "What do you like to do in your free time?",
      emoji: "🎭",
      options: [
        { text: "Draw or paint pictures", value: "artistic", emoji: "🎨" },
        { text: "Play with building blocks", value: "realistic", emoji: "🧱" },
        { text: "Read stories or books", value: "investigative", emoji: "📚" },
        { text: "Play with friends", value: "social", emoji: "👫" }
      ]
    },
    {
      question: "Which activity sounds most fun?",
      emoji: "🌟",
      options: [
        { text: "Making a science experiment", value: "investigative", emoji: "🔬" },
        { text: "Organizing my toys", value: "conventional", emoji: "📦" },
        { text: "Leading a group game", value: "enterprising", emoji: "👑" },
        { text: "Creating art or music", value: "artistic", emoji: "🎵" }
      ]
    },
    {
      question: "What kind of stories do you like best?",
      emoji: "📖",
      options: [
        { text: "Adventure and exploration", value: "enterprising", emoji: "🗺️" },
        { text: "Helping others", value: "social", emoji: "🤝" },
        { text: "Mystery and puzzles", value: "investigative", emoji: "🔍" },
        { text: "Fantasy and imagination", value: "artistic", emoji: "🦄" }
      ]
    },
    {
      question: "How do you like to solve problems?",
      emoji: "🧩",
      options: [
        { text: "Follow step-by-step instructions", value: "conventional", emoji: "📝" },
        { text: "Try different creative ways", value: "artistic", emoji: "💡" },
        { text: "Research and learn more", value: "investigative", emoji: "🔍" },
        { text: "Work with others to find solutions", value: "social", emoji: "👥" }
      ]
    },
    {
      question: "What would be your dream job?",
      emoji: "💭",
      options: [
        { text: "Doctor or Scientist", value: "investigative", emoji: "👨‍⚕️" },
        { text: "Artist or Musician", value: "artistic", emoji: "🎨" },
        { text: "Teacher or Helper", value: "social", emoji: "👩‍🏫" },
        { text: "Builder or Engineer", value: "realistic", emoji: "👷" }
      ]
    }
  ];

  const personalityTypes = {
    artistic: {
      title: "Creative Artist! 🎨",
      description: "You love to create, imagine, and express yourself through art, music, and stories!",
      traits: ["Creative", "Imaginative", "Expressive", "Original"],
      activities: ["Drawing & Painting", "Music & Dance", "Creative Writing", "Drama & Theater"],
      color: "from-pink-400 to-purple-400"
    },
    realistic: {
      title: "Hands-on Builder! 🔧",
      description: "You enjoy working with your hands, building things, and figuring out how things work!",
      traits: ["Practical", "Hands-on", "Problem-solver", "Builder"],
      activities: ["Building & Construction", "Science Experiments", "Sports & Outdoor", "Crafts & Making"],
      color: "from-green-400 to-blue-400"
    },
    investigative: {
      title: "Curious Explorer! 🔬",
      description: "You love to learn, discover new things, and solve mysteries like a real scientist!",
      traits: ["Curious", "Analytical", "Observant", "Logical"],
      activities: ["Science & Nature", "Reading & Research", "Puzzles & Games", "Experiments"],
      color: "from-blue-400 to-cyan-400"
    },
    social: {
      title: "Helpful Friend! 🤝",
      description: "You care about others, love helping friends, and enjoy being part of a team!",
      traits: ["Caring", "Helpful", "Friendly", "Team Player"],
      activities: ["Helping Others", "Group Activities", "Communication", "Leadership"],
      color: "from-orange-400 to-red-400"
    },
    enterprising: {
      title: "Leader & Organizer! 👑",
      description: "You like to lead, organize activities, and help others achieve their goals!",
      traits: ["Leadership", "Confident", "Organized", "Goal-oriented"],
      activities: ["Leadership Games", "Planning & Organizing", "Public Speaking", "Business Games"],
      color: "from-yellow-400 to-orange-400"
    },
    conventional: {
      title: "Detail Master! 📋",
      description: "You love organizing, following plans, and making sure everything is neat and tidy!",
      traits: ["Organized", "Detail-oriented", "Systematic", "Reliable"],
      activities: ["Organizing Games", "Following Instructions", "Planning Activities", "Data Collection"],
      color: "from-teal-400 to-green-400"
    }
  };

  const handleAnswer = (value: string) => {
    const newAnswers = [...answers, value];
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Calculate result
      const counts: { [key: string]: number } = {};
      newAnswers.forEach(answer => {
        counts[answer] = (counts[answer] || 0) + 1;
      });
      
      const topType = Object.keys(counts).reduce((a, b) => 
        counts[a] > counts[b] ? a : b
      );
      
      setShowResult(true);
    }
  };

  const getTopPersonalityType = () => {
    const counts: { [key: string]: number } = {};
    answers.forEach(answer => {
      counts[answer] = (counts[answer] || 0) + 1;
    });
    
    return Object.keys(counts).reduce((a, b) => 
      counts[a] > counts[b] ? a : b
    );
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  if (showResult) {
    const topType = getTopPersonalityType();
    const result = personalityTypes[topType as keyof typeof personalityTypes];
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 p-4">
        <div className="max-w-2xl mx-auto">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/talentika-junior')}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <Card className="p-8 text-center shadow-xl border-0">
            <div className="mb-6">
              <div className={`w-32 h-32 bg-gradient-to-br ${result.color} rounded-full flex items-center justify-center text-6xl mx-auto mb-4 shadow-lg`}>
                🌟
              </div>
              <h1 className="text-3xl font-bold mb-2">{result.title}</h1>
              <p className="text-lg text-muted-foreground mb-6">{result.description}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="text-left">
                <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" />
                  Your Strengths
                </h3>
                <div className="space-y-2">
                  {result.traits.map((trait, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-primary rounded-full"></span>
                      <span>{trait}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-left">
                <h3 className="text-xl font-bold mb-3 flex items-center gap-2">
                  <Star className="w-5 h-5 text-green-500" />
                  Fun Activities for You
                </h3>
                <div className="space-y-2">
                  {result.activities.map((activity, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      <span>{activity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg"
                onClick={() => navigate('/talentika-junior/learning')}
                className="bg-gradient-to-r from-primary to-accent hover:scale-105 transition-transform"
              >
                Start Learning! 🚀
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => {
                  setCurrentQuestion(0);
                  setAnswers([]);
                  setShowResult(false);
                }}
              >
                Take Quiz Again
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 p-4">
      <div className="max-w-2xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/talentika-junior')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card className="p-8 shadow-xl border-0">
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold">Talent Discovery Quiz 🌟</h1>
              <span className="text-sm text-muted-foreground">
                {currentQuestion + 1} of {questions.length}
              </span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>

          <div className="text-center mb-8">
            <div className="text-6xl mb-4">{questions[currentQuestion].emoji}</div>
            <h2 className="text-xl font-bold mb-6">{questions[currentQuestion].question}</h2>
          </div>

          <div className="grid gap-4">
            {questions[currentQuestion].options.map((option, index) => (
              <Button
                key={index}
                variant="outline"
                size="lg"
                className="h-auto p-6 text-left hover:scale-105 transition-all"
                onClick={() => handleAnswer(option.value)}
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{option.emoji}</span>
                  <span className="text-lg">{option.text}</span>
                </div>
              </Button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default TalentikaJuniorDiscovery;