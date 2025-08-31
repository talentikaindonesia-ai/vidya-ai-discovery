import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Trash2, Edit, Plus, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Quiz {
  id?: string;
  title: string;
  description: string;
  category_id: string;
  difficulty: string;
  question_type: string;
  question: string;
  options: any;
  correct_answer: string;
  explanation: string;
  clue_location: string;
  media_url: string;
  points_reward: number;
  is_isc_exclusive: boolean;
  is_active: boolean;
}

interface QuizCategory {
  id: string;
  name: string;
  color: string;
}

export const QuizManager: React.FC = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [categories, setCategories] = useState<QuizCategory[]>([]);
  const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const defaultQuiz: Quiz = {
    title: '',
    description: '',
    category_id: '',
    difficulty: 'easy',
    question_type: 'multiple_choice',
    question: '',
    options: ['', '', '', ''],
    correct_answer: '',
    explanation: '',
    clue_location: '',
    media_url: '',
    points_reward: 10,
    is_isc_exclusive: false,
    is_active: true
  };

  useEffect(() => {
    loadQuizzes();
    loadCategories();
  }, []);

  const loadQuizzes = async () => {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuizzes(data || []);
    } catch (error) {
      console.error('Error loading quizzes:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('quiz_categories')
        .select('id, name, color')
        .eq('is_active', true);

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleSaveQuiz = async (quiz: Quiz) => {
    setLoading(true);
    try {
      if (quiz.id) {
        // Update existing quiz
        const { error } = await supabase
          .from('quizzes')
          .update(quiz)
          .eq('id', quiz.id);

        if (error) throw error;
        toast({ title: 'Quiz updated successfully!' });
      } else {
        // Create new quiz
        const { error } = await supabase
          .from('quizzes')
          .insert([quiz]);

        if (error) throw error;
        toast({ title: 'Quiz created successfully!' });
      }

      await loadQuizzes();
      setEditingQuiz(null);
      setShowForm(false);
    } catch (error) {
      console.error('Error saving quiz:', error);
      toast({ 
        title: 'Error saving quiz', 
        description: 'Please try again.',
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuiz = async (id: string) => {
    if (!confirm('Are you sure you want to delete this quiz?')) return;

    try {
      const { error } = await supabase
        .from('quizzes')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast({ title: 'Quiz deleted successfully!' });
      await loadQuizzes();
    } catch (error) {
      console.error('Error deleting quiz:', error);
      toast({ 
        title: 'Error deleting quiz', 
        variant: 'destructive' 
      });
    }
  };

  const QuizForm: React.FC<{ quiz: Quiz; onSave: (quiz: Quiz) => void; onCancel: () => void }> = ({ 
    quiz, 
    onSave, 
    onCancel 
  }) => {
    const [formData, setFormData] = useState<Quiz>(quiz);

    const updateFormData = (field: keyof Quiz, value: any) => {
      setFormData(prev => ({ ...prev, [field]: value }));
    };

    const updateOption = (index: number, value: string) => {
      const newOptions = [...formData.options];
      newOptions[index] = value;
      setFormData(prev => ({ ...prev, options: newOptions }));
    };

    const addOption = () => {
      setFormData(prev => ({ 
        ...prev, 
        options: [...prev.options, ''] 
      }));
    };

    const removeOption = (index: number) => {
      if (formData.options.length <= 2) return;
      const newOptions = formData.options.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, options: newOptions }));
    };

    return (
      <Card>
        <CardHeader>
          <CardTitle>{formData.id ? 'Edit Quiz' : 'Create New Quiz'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => updateFormData('title', e.target.value)}
                placeholder="Quiz title"
              />
            </div>
            
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category_id} onValueChange={(value) => updateFormData('category_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => updateFormData('description', e.target.value)}
              placeholder="Quiz description"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select value={formData.difficulty} onValueChange={(value) => updateFormData('difficulty', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="question_type">Question Type</Label>
              <Select value={formData.question_type} onValueChange={(value) => updateFormData('question_type', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                  <SelectItem value="true_false">True/False</SelectItem>
                  <SelectItem value="short_answer">Short Answer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="points">Points Reward</Label>
              <Input
                id="points"
                type="number"
                value={formData.points_reward}
                onChange={(e) => updateFormData('points_reward', parseInt(e.target.value) || 10)}
                min="1"
                max="100"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="question">Question</Label>
            <Textarea
              id="question"
              value={formData.question}
              onChange={(e) => updateFormData('question', e.target.value)}
              placeholder="What is your question?"
            />
          </div>

          {formData.question_type === 'multiple_choice' && (
            <div>
              <Label>Answer Options</Label>
              <div className="space-y-2">
                {formData.options.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                    />
                    {formData.options.length > 2 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeOption(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addOption}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Option
                </Button>
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="correct_answer">Correct Answer</Label>
            <Input
              id="correct_answer"
              value={formData.correct_answer}
              onChange={(e) => updateFormData('correct_answer', e.target.value)}
              placeholder="Enter the correct answer"
            />
          </div>

          <div>
            <Label htmlFor="explanation">Explanation</Label>
            <Textarea
              id="explanation"
              value={formData.explanation}
              onChange={(e) => updateFormData('explanation', e.target.value)}
              placeholder="Explain why this is the correct answer"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="clue_location">ISC Location/Zone</Label>
              <Input
                id="clue_location"
                value={formData.clue_location}
                onChange={(e) => updateFormData('clue_location', e.target.value)}
                placeholder="e.g., Physics Zone, Astronomy Hall"
              />
            </div>

            <div>
              <Label htmlFor="media_url">Media URL</Label>
              <Input
                id="media_url"
                value={formData.media_url}
                onChange={(e) => updateFormData('media_url', e.target.value)}
                placeholder="Image or video URL"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="is_isc_exclusive"
                checked={formData.is_isc_exclusive}
                onCheckedChange={(checked) => updateFormData('is_isc_exclusive', checked)}
              />
              <Label htmlFor="is_isc_exclusive">ISC Exclusive (QR Code)</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => updateFormData('is_active', checked)}
              />
              <Label htmlFor="is_active">Active</Label>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => onSave(formData)} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : 'Save Quiz'}
            </Button>
            <Button variant="outline" onClick={onCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Quiz Management</h2>
        <Button onClick={() => {
          setEditingQuiz(defaultQuiz);
          setShowForm(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Create Quiz
        </Button>
      </div>

      {(showForm || editingQuiz) && (
        <QuizForm 
          quiz={editingQuiz || defaultQuiz}
          onSave={handleSaveQuiz}
          onCancel={() => {
            setEditingQuiz(null);
            setShowForm(false);
          }}
        />
      )}

      <div className="grid gap-4">
        {quizzes.map((quiz) => (
          <Card key={quiz.id} className="border-l-4" style={{ borderLeftColor: categories.find(c => c.id === quiz.category_id)?.color }}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <CardTitle className="text-lg">{quiz.title}</CardTitle>
                  <div className="flex gap-2">
                    <Badge variant="outline">{quiz.difficulty}</Badge>
                    <Badge variant="secondary">{quiz.question_type.replace('_', ' ')}</Badge>
                    <Badge>{quiz.points_reward} pts</Badge>
                    {quiz.is_isc_exclusive && <Badge variant="outline">ISC Exclusive</Badge>}
                    {!quiz.is_active && <Badge variant="destructive">Inactive</Badge>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setEditingQuiz(quiz)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => quiz.id && handleDeleteQuiz(quiz.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">{quiz.description}</p>
              <p className="font-medium mb-2">{quiz.question}</p>
              {quiz.clue_location && (
                <p className="text-sm text-blue-600">📍 {quiz.clue_location}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};