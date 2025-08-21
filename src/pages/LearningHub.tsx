import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Clock, Award, BookOpen, Code, FileText, Users } from "lucide-react";
import { toast } from "sonner";

interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  difficulty_level: string;
  duration_hours: number;
  category_id: string;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  video_url: string;
  content: string;
  duration_minutes: number;
  order_index: number;
  is_preview: boolean;
}

const LearningHub = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [userProgress, setUserProgress] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCourses();
    loadUserProgress();
  }, []);

  const loadCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          lessons (*)
        `)
        .eq('is_featured', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCourses(data || []);
    } catch (error: any) {
      toast.error("Gagal memuat kursus: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadUserProgress = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setUserProgress(data || []);
    } catch (error: any) {
      console.error('Error loading progress:', error);
    }
  };

  const getCourseProgress = (courseId: string) => {
    const courseProgressData = userProgress.filter(p => p.course_id === courseId);
    if (courseProgressData.length === 0) return 0;
    
    const totalProgress = courseProgressData.reduce((sum, p) => sum + p.progress_percentage, 0);
    return Math.round(totalProgress / courseProgressData.length);
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-secondary text-secondary-foreground';
      case 'intermediate': return 'bg-accent text-accent-foreground';
      case 'advanced': return 'bg-primary text-primary-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getDifficultyLabel = (level: string) => {
    switch (level) {
      case 'beginner': return 'Pemula';
      case 'intermediate': return 'Menengah';
      case 'advanced': return 'Lanjutan';
      default: return 'Tidak Diketahui';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Memuat kursus...</p>
        </div>
      </div>
    );
  }

  if (selectedCourse) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <Button 
            variant="outline" 
            onClick={() => setSelectedCourse(null)}
            className="mb-6"
          >
            ← Kembali ke Daftar Kursus
          </Button>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="text-2xl">{selectedCourse.title}</CardTitle>
                  <p className="text-muted-foreground">{selectedCourse.description}</p>
                  <div className="flex items-center gap-4 mt-4">
                    <Badge className={getDifficultyColor(selectedCourse.difficulty_level)}>
                      {getDifficultyLabel(selectedCourse.difficulty_level)}
                    </Badge>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{selectedCourse.duration_hours} jam</span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <Tabs defaultValue="lessons" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="lessons">
                        <BookOpen className="w-4 h-4 mr-2" />
                        Materi
                      </TabsTrigger>
                      <TabsTrigger value="quiz">
                        <FileText className="w-4 h-4 mr-2" />
                        Quiz
                      </TabsTrigger>
                      <TabsTrigger value="project">
                        <Code className="w-4 h-4 mr-2" />
                        Project
                      </TabsTrigger>
                      <TabsTrigger value="discussion">
                        <Users className="w-4 h-4 mr-2" />
                        Diskusi
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="lessons" className="mt-6">
                      <div className="space-y-4">
                        {selectedCourse.lessons
                          .sort((a, b) => a.order_index - b.order_index)
                          .map((lesson, index) => (
                          <Card key={lesson.id} className="border-2 hover:border-primary/50 transition-colors">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <h3 className="font-semibold mb-2">
                                    {index + 1}. {lesson.title}
                                  </h3>
                                  <p className="text-sm text-muted-foreground mb-3">
                                    {lesson.description}
                                  </p>
                                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                      <Play className="w-4 h-4" />
                                      <span>Video</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <Clock className="w-4 h-4" />
                                      <span>{lesson.duration_minutes} menit</span>
                                    </div>
                                    {lesson.is_preview && (
                                      <Badge variant="outline">Preview</Badge>
                                    )}
                                  </div>
                                </div>
                                <Button size="sm" className="bg-primary text-primary-foreground">
                                  <Play className="w-4 h-4 mr-2" />
                                  Mulai
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </TabsContent>

                    <TabsContent value="quiz" className="mt-6">
                      <Card className="text-center py-12">
                        <CardContent>
                          <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-semibold mb-2">Quiz Interaktif</h3>
                          <p className="text-muted-foreground mb-4">
                            Uji pemahaman materi dengan quiz yang menarik
                          </p>
                          <Button className="bg-primary text-primary-foreground">
                            Mulai Quiz
                          </Button>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="project" className="mt-6">
                      <Card className="text-center py-12">
                        <CardContent>
                          <Code className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-semibold mb-2">Mini Project</h3>
                          <p className="text-muted-foreground mb-4">
                            Buat karya nyata untuk portfolio Anda
                          </p>
                          <Button className="bg-accent text-accent-foreground">
                            <Award className="w-4 h-4 mr-2" />
                            Mulai Project
                          </Button>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="discussion" className="mt-6">
                      <Card className="text-center py-12">
                        <CardContent>
                          <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-semibold mb-2">Forum Diskusi</h3>
                          <p className="text-muted-foreground mb-4">
                            Diskusikan materi dengan sesama pelajar
                          </p>
                          <Button variant="outline">
                            Gabung Diskusi
                          </Button>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Progress Kursus</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center mb-4">
                    <div className="text-3xl font-bold text-primary">
                      {getCourseProgress(selectedCourse.id)}%
                    </div>
                    <p className="text-muted-foreground">Selesai</p>
                  </div>
                  <Progress value={getCourseProgress(selectedCourse.id)} className="mb-4" />
                  <div className="text-sm text-muted-foreground">
                    {selectedCourse.lessons.length} materi pembelajaran
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle>Sertifikat</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <Award className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Selesaikan semua materi untuk mendapatkan sertifikat
                  </p>
                  <Button 
                    disabled={getCourseProgress(selectedCourse.id) < 100}
                    className="w-full bg-primary text-primary-foreground"
                  >
                    Dapatkan Sertifikat
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative bg-gradient-primary overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container mx-auto px-4 py-24 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-white">
              <h1 className="text-5xl font-bold mb-6 leading-tight">
                Learning Hub
              </h1>
              <p className="text-xl text-white/90 mb-8 leading-relaxed">
                Jelajahi kursus interaktif dengan mini project dan dapatkan sertifikat untuk portfolio Anda. 
                Belajar dari ahli industri dengan kurikulum yang selalu update.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90 shadow-floating">
                  <BookOpen className="w-5 h-5 mr-2" />
                  Mulai Belajar
                </Button>
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  <Play className="w-5 h-5 mr-2" />
                  Lihat Demo
                </Button>
              </div>
              <div className="flex items-center gap-8 mt-8 text-white/80">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">50+</div>
                  <div className="text-sm">Kursus</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">10k+</div>
                  <div className="text-sm">Pelajar</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">95%</div>
                  <div className="text-sm">Kepuasan</div>
                </div>
              </div>
            </div>
            <div className="hidden lg:block">
              <img 
                src="/src/assets/learning-hero.jpg" 
                alt="Learning Hub" 
                className="rounded-2xl shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Card 
              key={course.id} 
              className="shadow-card hover:shadow-floating transition-all cursor-pointer group"
              onClick={() => setSelectedCourse(course)}
            >
              {course.thumbnail_url && (
                <div className="aspect-video bg-muted rounded-t-lg overflow-hidden">
                  <img 
                    src={course.thumbnail_url} 
                    alt={course.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
              )}
              
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                    {course.title}
                  </CardTitle>
                  <Badge className={getDifficultyColor(course.difficulty_level)}>
                    {getDifficultyLabel(course.difficulty_level)}
                  </Badge>
                </div>
                <p className="text-muted-foreground line-clamp-3">
                  {course.description}
                </p>
              </CardHeader>

              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{course.duration_hours} jam</span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <BookOpen className="w-4 h-4" />
                    <span>{course.lessons?.length || 0} materi</span>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span>Progress</span>
                    <span>{getCourseProgress(course.id)}%</span>
                  </div>
                  <Progress value={getCourseProgress(course.id)} />
                </div>

                <Button className="w-full bg-primary text-primary-foreground group-hover:shadow-floating">
                  {getCourseProgress(course.id) > 0 ? 'Lanjutkan' : 'Mulai Belajar'}
                  <Play className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LearningHub;