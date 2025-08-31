import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { QuizCard } from './QuizCard';
import { QuizLeaderboard } from './QuizLeaderboard';
import { useQuizSystem, Quiz, QuizCategory } from '@/hooks/useQuizSystem';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, Trophy, Shuffle, Filter, MapPin } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

export const QuizExplore: React.FC = () => {
  const { 
    categories, 
    currentQuiz, 
    loading, 
    getRandomQuiz, 
    startQuiz, 
    submitQuizAnswer,
    resetCurrentQuiz 
  } = useQuizSystem();
  
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('');
  const [availableQuizzes, setAvailableQuizzes] = useState<Quiz[]>([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);

  const getCategoryIcon = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName] || Brain;
    return <IconComponent className="h-5 w-5" />;
  };

  const startRandomQuiz = async () => {
    setLoadingQuizzes(true);
    try {
      const quiz = await getRandomQuiz(selectedCategory || undefined, selectedDifficulty || undefined);
      if (quiz) {
        await startQuiz(quiz);
      }
    } catch (error) {
      console.error('Error starting quiz:', error);
    } finally {
      setLoadingQuizzes(false);
    }
  };

  const handleQuizSubmit = async (answer: string, timeTaken: number) => {
    return await submitQuizAnswer(answer, timeTaken);
  };

  if (currentQuiz) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button 
            variant="outline" 
            onClick={resetCurrentQuiz}
            className="mb-4"
          >
            ← Back to Explore
          </Button>
        </div>
        <QuizCard 
          quiz={currentQuiz} 
          onSubmit={handleQuizSubmit}
          loading={loading}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
          Science Quiz Explorer
        </h1>
        <p className="text-xl text-muted-foreground">
          Explore science through interactive quizzes inspired by Indonesia Science Center
        </p>
      </div>

      <Tabs defaultValue="explore" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="explore">Explore Quizzes</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        <TabsContent value="explore" className="space-y-6">
          {/* Quiz Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <Card 
                key={category.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                style={{ borderLeftColor: category.color, borderLeftWidth: '4px' }}
              >
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {getCategoryIcon(category.icon)}
                    {category.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{category.description}</p>
                  <Button 
                    onClick={() => {
                      setSelectedCategory(category.id);
                      startRandomQuiz();
                    }}
                    className="w-full"
                    disabled={loadingQuizzes}
                  >
                    {loadingQuizzes && selectedCategory === category.id ? 'Loading...' : 'Start Quiz'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Quick Start Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shuffle className="h-5 w-5" />
                Quick Start
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Category</label>
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any Category</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Difficulty</label>
                  <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any Difficulty</SelectItem>
                      <SelectItem value="easy">Easy</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button 
                onClick={startRandomQuiz} 
                className="w-full" 
                size="lg"
                disabled={loadingQuizzes}
              >
                {loadingQuizzes ? 'Finding Quiz...' : 'Start Random Quiz'}
              </Button>
            </CardContent>
          </Card>

          {/* Special Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700">
                  <MapPin className="h-5 w-5" />
                  ISC Exclusive Quizzes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-blue-600 mb-4">
                  Visit Indonesia Science Center and scan QR codes to unlock exclusive location-based quizzes!
                </p>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                  Coming Soon
                </Badge>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-700">
                  <Trophy className="h-5 w-5" />
                  Monthly Challenges
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-purple-600 mb-4">
                  Participate in themed monthly challenges and compete for special rewards!
                </p>
                <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                  This Month: Space Exploration
                </Badge>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="leaderboard">
          <QuizLeaderboard />
        </TabsContent>
      </Tabs>
    </div>
  );
};