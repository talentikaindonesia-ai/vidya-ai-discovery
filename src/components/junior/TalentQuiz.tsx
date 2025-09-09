import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface TalentQuizProps {
  onComplete: (results: any) => void;
}

const TalentQuiz = ({ onComplete }: TalentQuizProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);

  const questions = [
    {
      question: "Apa yang paling kamu suka lakukan di waktu luang?",
      emoji: "🎭",
      options: [
        { text: "Menggambar atau melukis", value: "artistic", emoji: "🎨" },
        { text: "Bermain dengan balok-balok", value: "realistic", emoji: "🧱" },
        { text: "Membaca buku cerita", value: "investigative", emoji: "📚" },
        { text: "Bermain dengan teman-teman", value: "social", emoji: "👫" }
      ]
    },
    {
      question: "Aktivitas mana yang terdengar paling seru?",
      emoji: "🌟",
      options: [
        { text: "Eksperimen sains sederhana", value: "investigative", emoji: "🔬" },
        { text: "Merapikan mainan", value: "conventional", emoji: "📦" },
        { text: "Memimpin permainan kelompok", value: "enterprising", emoji: "👑" },
        { text: "Membuat karya seni atau musik", value: "artistic", emoji: "🎵" }
      ]
    },
    {
      question: "Cerita seperti apa yang paling kamu suka?",
      emoji: "📖",
      options: [
        { text: "Petualangan dan eksplorasi", value: "enterprising", emoji: "🗺️" },
        { text: "Menolong orang lain", value: "social", emoji: "🤝" },
        { text: "Misteri dan teka-teki", value: "investigative", emoji: "🔍" },
        { text: "Fantasi dan imajinasi", value: "artistic", emoji: "🦄" }
      ]
    },
    {
      question: "Bagaimana cara kamu suka menyelesaikan masalah?",
      emoji: "🧩",
      options: [
        { text: "Ikuti langkah-langkah yang jelas", value: "conventional", emoji: "📝" },
        { text: "Coba cara-cara kreatif yang berbeda", value: "artistic", emoji: "💡" },
        { text: "Cari tahu lebih banyak informasi", value: "investigative", emoji: "🔍" },
        { text: "Bekerja sama dengan orang lain", value: "social", emoji: "👥" }
      ]
    },
    {
      question: "Apa cita-cita impianmu?",
      emoji: "💭",
      options: [
        { text: "Dokter atau Ilmuwan", value: "investigative", emoji: "👨‍⚕️" },
        { text: "Seniman atau Musisi", value: "artistic", emoji: "🎨" },
        { text: "Guru atau Penolong", value: "social", emoji: "👩‍🏫" },
        { text: "Insinyur atau Pembangun", value: "realistic", emoji: "👷" }
      ]
    }
  ];

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
      
      onComplete({ 
        primaryType: topType, 
        scores: counts, 
        answers: newAnswers 
      });
    }
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="p-8 shadow-xl border-0">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Quiz Eksplorasi Bakat 🌟</h2>
            <Badge variant="outline">
              {currentQuestion + 1} dari {questions.length}
            </Badge>
          </div>
          <Progress value={progress} className="h-3" />
        </div>

        <div className="text-center mb-8">
          <div className="text-6xl mb-4">{questions[currentQuestion].emoji}</div>
          <h3 className="text-xl font-bold mb-6">{questions[currentQuestion].question}</h3>
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
  );
};

export default TalentQuiz;