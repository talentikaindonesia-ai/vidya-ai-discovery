import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, MapPin, Star, CheckCircle, XCircle } from 'lucide-react';
import { Quiz } from '@/hooks/useQuizSystem';

interface QuizCardProps {
  quiz: Quiz;
  onSubmit: (answer: string, timeTaken: number) => Promise<any>;
  loading: boolean;
}

export const QuizCard: React.FC<QuizCardProps> = ({ quiz, onSubmit, loading }) => {
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [shortAnswer, setShortAnswer] = useState('');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [startTime] = useState(Date.now());
  const [result, setResult] = useState<any>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getAnswer = () => {
    if (quiz.question_type === 'short_answer') {
      return shortAnswer.trim();
    }
    return selectedAnswer;
  };

  const handleSubmit = async () => {
    if (submitted) return;
    
    const answer = getAnswer();
    if (!answer) return;

    const timeTaken = Math.floor((Date.now() - startTime) / 1000);
    setSubmitted(true);
    
    const submitResult = await onSubmit(answer, timeTaken);
    setResult(submitResult);
  };

  const canSubmit = () => {
    if (submitted) return false;
    if (quiz.question_type === 'short_answer') {
      return shortAnswer.trim().length > 0;
    }
    return selectedAnswer !== '';
  };

  if (result) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {result.isCorrect ? (
              <CheckCircle className="h-16 w-16 text-green-500" />
            ) : (
              <XCircle className="h-16 w-16 text-red-500" />
            )}
          </div>
          <CardTitle className={result.isCorrect ? 'text-green-600' : 'text-red-600'}>
            {result.isCorrect ? '🎉 Correct Answer!' : '❌ Incorrect Answer'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-2xl font-bold mb-2">
              {result.isCorrect ? `+${result.pointsEarned} Points!` : '0 Points'}
            </div>
            {!result.isCorrect && (
              <div className="text-muted-foreground">
                Correct answer: <span className="font-semibold text-foreground">{quiz.correct_answer}</span>
              </div>
            )}
          </div>
          
          {result.explanation && (
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Explanation:</h4>
              <p className="text-sm text-muted-foreground">{result.explanation}</p>
            </div>
          )}
          
          <div className="flex justify-center">
            <Button onClick={() => window.location.reload()} variant="outline">
              Try Another Quiz
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between mb-2">
          <Badge className={getDifficultyColor(quiz.difficulty)}>
            {quiz.difficulty.toUpperCase()}
          </Badge>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            {formatTime(timeLeft)}
          </div>
        </div>
        
        <CardTitle className="text-xl">{quiz.title}</CardTitle>
        
        {quiz.description && (
          <p className="text-muted-foreground">{quiz.description}</p>
        )}
        
        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          {quiz.clue_location && (
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {quiz.clue_location}
            </div>
          )}
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4" />
            {quiz.points_reward} points
          </div>
        </div>
        
        <Progress value={(300 - timeLeft) / 300 * 100} className="mt-2" />
      </CardHeader>
      
      <CardContent className="space-y-6">
        {quiz.media_url && (
          <div className="flex justify-center">
            <img 
              src={quiz.media_url} 
              alt="Quiz media" 
              className="max-w-full h-auto rounded-lg shadow-md"
            />
          </div>
        )}
        
        <div className="bg-primary/5 p-4 rounded-lg">
          <h3 className="font-semibold text-lg mb-4">{quiz.question}</h3>
          
          {quiz.question_type === 'multiple_choice' && (
            <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer}>
              <div className="space-y-3">
                {quiz.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={`option-${index}`} />
                    <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          )}
          
          {quiz.question_type === 'true_false' && (
            <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer}>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="True" id="true" />
                  <Label htmlFor="true" className="cursor-pointer">True</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="False" id="false" />
                  <Label htmlFor="false" className="cursor-pointer">False</Label>
                </div>
              </div>
            </RadioGroup>
          )}
          
          {quiz.question_type === 'short_answer' && (
            <Input
              placeholder="Type your answer here..."
              value={shortAnswer}
              onChange={(e) => setShortAnswer(e.target.value)}
              className="w-full"
            />
          )}
        </div>
        
        <Button 
          onClick={handleSubmit}
          disabled={!canSubmit() || loading}
          className="w-full"
          size="lg"
        >
          {loading ? 'Submitting...' : 'Submit Answer'}
        </Button>
      </CardContent>
    </Card>
  );
};