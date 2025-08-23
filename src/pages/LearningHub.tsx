import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Clock, Award, BookOpen, Code, FileText, Users, ArrowLeft, Crown, Lock, GraduationCap, Zap, Brain } from "lucide-react";
import { toast } from "sonner";
import { getSubscriptionLimits, checkSubscriptionAccess, getUserSubscriptionInfo } from "@/lib/subscription";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { MentorsSection } from "@/components/dashboard/MentorsSection";
import { AdaptiveLearningFeed } from "@/components/dashboard/AdaptiveLearningFeed";

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
  const [subscriptionInfo, setSubscriptionInfo] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [userAssessment, setUserAssessment] = useState<any>(null);
  const [userInterests, setUserInterests] = useState<string[]>([]);

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const subInfo = await getUserSubscriptionInfo(session.user.id);
        setSubscriptionInfo(subInfo);
        
        // Load user assessment and interests for personalization
        await Promise.all([
          loadCourses(),
          loadUserProgress(),
          loadUserAssessment(session.user.id),
          loadUserInterests(session.user.id)
        ]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserAssessment = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('assessment_results')
        .select('*')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        setUserAssessment(data[0]);
      }
    } catch (error) {
      console.error('Error loading assessment:', error);
    }
  };

  const loadUserInterests = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('user_interests')
        .select(`
          interest_categories (
            name
          )
        `)
        .eq('user_id', userId);

      if (data) {
        const interests = data.map((item: any) => item.interest_categories?.name).filter(Boolean);
        setUserInterests(interests);
      }
    } catch (error) {
      console.error('Error loading interests:', error);
    }
  };

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

  const canAccessCourse = (index: number) => {
    if (!subscriptionInfo) return true;
    const limits = getSubscriptionLimits(subscriptionInfo.subscription_status, subscriptionInfo.subscription_type);
    const { canAccess } = checkSubscriptionAccess(index + 1, limits.maxCourses, subscriptionInfo.subscription_status);
    return canAccess;
  };

  const handleCourseClick = (course: Course, index: number) => {
    if (!canAccessCourse(index)) {
      toast.error("Upgrade ke Premium untuk mengakses kursus ini!");
      return;
    }
    setSelectedCourse(course);
  };

  const startLearning = async (courseId: string, courseIndex: number) => {
    if (!canAccessCourse(courseIndex)) {
      toast.error("Upgrade ke Premium untuk mengakses kursus ini!");
      return;
    }

    if (!user) {
      toast.error("Silakan login terlebih dahulu");
      return;
    }

    try {
      // Check if progress already exists
      const existingProgress = userProgress.find(p => p.course_id === courseId);
      
      if (!existingProgress) {
        // Create new progress entry
        const { error } = await supabase
          .from('user_progress')
          .insert({
            user_id: user.id,
            course_id: courseId,
            progress_percentage: 0,
            time_spent_minutes: 0
          });

        if (error) throw error;
        
        toast.success("Kursus dimulai! Selamat belajar!");
        await loadUserProgress();
      } else {
        toast.success("Melanjutkan kursus...");
      }
    } catch (error: any) {
      console.error('Error starting course:', error);
      toast.error("Gagal memulai kursus: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (selectedCourse) {
    return (
      <div className="min-h-screen bg-background">
        {/* Course Detail View */}
        <div className="container mx-auto px-4 py-8">
          <Button 
            onClick={() => setSelectedCourse(null)}
            variant="outline" 
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Kursus
          </Button>
          
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Course Content */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl">{selectedCourse.title}</CardTitle>
                  <p className="text-muted-foreground">{selectedCourse.description}</p>
                  <div className="flex items-center gap-4 mt-4">
                    <Badge className={getDifficultyColor(selectedCourse.difficulty_level)}>
                      {getDifficultyLabel(selectedCourse.difficulty_level)}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>{selectedCourse.duration_hours} jam</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <BookOpen className="w-4 h-4" />
                      <span>{selectedCourse.lessons?.length || 0} materi</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <h3 className="font-semibold mb-4">Materi Pembelajaran</h3>
                    <div className="space-y-2">
                      {selectedCourse.lessons?.sort((a, b) => a.order_index - b.order_index).map((lesson, index) => (
                        <div key={lesson.id} className="flex items-center gap-3 p-3 rounded-lg border">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium">{lesson.title}</h4>
                            <p className="text-sm text-muted-foreground">{lesson.description}</p>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            <span>{lesson.duration_minutes}m</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Course Progress Sidebar */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Progress Belajar</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span>Kemajuan</span>
                      <span>{getCourseProgress(selectedCourse.id)}%</span>
                    </div>
                    <Progress value={getCourseProgress(selectedCourse.id)} />
                  </div>
                  
                  <Button 
                    className="w-full"
                    onClick={() => {
                      const courseIndex = courses.findIndex(c => c.id === selectedCourse.id);
                      startLearning(selectedCourse.id, courseIndex);
                    }}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {getCourseProgress(selectedCourse.id) > 0 ? 'Lanjutkan Belajar' : 'Mulai Belajar'}
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
      {/* Back to Dashboard Button */}
      <div className="container mx-auto px-4 pt-6">
        <Button 
          variant="outline" 
          onClick={() => window.location.href = '/dashboard'}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali ke Dashboard
        </Button>
      </div>

      {/* Hero Section */}
      <div className="relative bg-gradient-primary overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 container mx-auto px-4 py-24">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6 leading-tight">
                Learning
                <span className="block text-gradient-gold">Hub</span>
              </h1>
              <p className="text-xl text-white/90 mb-8 max-w-2xl">
                Temukan berbagai kursus berkualitas untuk mengembangkan keahlian dan membangun masa depan yang lebih cerah
              </p>
              <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                  <Award className="w-8 h-8 text-accent mx-auto mb-2" />
                  <div className="text-white font-semibold">Sertifikat</div>
                  <div className="text-white/70 text-sm">Resmi</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                  <Users className="w-8 h-8 text-accent mx-auto mb-2" />
                  <div className="text-white font-semibold">Komunitas</div>
                  <div className="text-white/70 text-sm">Aktif</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                  <BookOpen className="w-8 h-8 text-accent mx-auto mb-2" />
                  <div className="text-white font-semibold">Materi</div>
                  <div className="text-white/70 text-sm">Terkini</div>
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
        {/* Subscription Status Banner */}
        {subscriptionInfo && subscriptionInfo.subscription_status !== 'active' && (
          <div className="mb-8">
            <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Crown className="w-6 h-6 text-primary" />
                    <div>
                      <h3 className="font-semibold">Akun Basic - Akses Terbatas</h3>
                      <p className="text-sm text-muted-foreground">
                        Anda dapat mengakses {getSubscriptionLimits(subscriptionInfo.subscription_status, subscriptionInfo.subscription_type).maxCourses} kursus gratis. 
                        Upgrade ke Premium untuk akses tidak terbatas!
                      </p>
                    </div>
                  </div>
                  <Button onClick={() => window.location.href = '/dashboard'} className="gap-2">
                    <Crown className="w-4 h-4" />
                    Upgrade
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Tabs defaultValue="adaptive" className="w-full">
          <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-3">
            <TabsTrigger value="adaptive" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Adaptive Learning
            </TabsTrigger>
            <TabsTrigger value="courses" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Kursus
            </TabsTrigger>
            <TabsTrigger value="mentors" className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4" />
              Mentor
            </TabsTrigger>
          </TabsList>

          <TabsContent value="adaptive" className="mt-8">
            <div className="space-y-6">
              <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-6 h-6" />
                    Learning Hub Personal untuk Anda
                  </CardTitle>
                  <CardDescription>
                    Konten pembelajaran yang dipersonalisasi berdasarkan hasil assessment dan minat Anda
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AdaptiveLearningFeed 
                    userAssessment={userAssessment}
                    userInterests={userInterests}
                    subscriptionInfo={subscriptionInfo}
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="courses" className="mt-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course, index) => {
            const canAccess = canAccessCourse(index);
            const isLocked = !canAccess;
            const progress = getCourseProgress(course.id);
            
            return (
              <Card 
                key={course.id} 
                className={`shadow-card hover:shadow-floating transition-all cursor-pointer group ${isLocked ? 'opacity-75' : ''}`}
                onClick={() => handleCourseClick(course, index)}
              >
                {course.thumbnail_url && (
                  <div className="aspect-video bg-muted rounded-t-lg overflow-hidden relative">
                    <img 
                      src={course.thumbnail_url} 
                      alt={course.title}
                      className={`w-full h-full object-cover transition-transform ${isLocked ? 'grayscale' : 'group-hover:scale-105'}`}
                    />
                    <div className="absolute top-3 right-3 flex gap-2">
                      {isLocked && (
                        <Badge variant="secondary" className="bg-black/70 text-white border-0">
                          <Crown className="w-3 h-3 mr-1" />
                          Premium
                        </Badge>
                      )}
                      <Badge className={getDifficultyColor(course.difficulty_level)}>
                        {getDifficultyLabel(course.difficulty_level)}
                      </Badge>
                    </div>
                    {isLocked && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Lock className="w-8 h-8 text-white" />
                      </div>
                    )}
                  </div>
                )}
                
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                      {course.title}
                    </CardTitle>
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

                  {progress > 0 && !isLocked && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span>Progress</span>
                        <span>{progress}%</span>
                      </div>
                      <Progress value={progress} />
                    </div>
                  )}

                  <Button 
                    className="w-full bg-primary text-primary-foreground group-hover:shadow-floating"
                    disabled={isLocked}
                    onClick={(e) => {
                      e.stopPropagation();
                      startLearning(course.id, index);
                    }}
                  >
                    {isLocked ? (
                      <>
                        <Lock className="w-4 h-4 mr-2" />
                        Upgrade untuk Akses
                      </>
                    ) : (
                      <>
                        {progress > 0 ? 'Lanjutkan' : 'Mulai Belajar'}
                        <Play className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
          
          {/* Show upgrade prompt if user has reached course limit */}
          {subscriptionInfo && subscriptionInfo.subscription_status !== 'active' && courses.length > 0 && (() => {
            const limits = getSubscriptionLimits(subscriptionInfo.subscription_status, subscriptionInfo.subscription_type);
            const accessedCount = Math.min(limits.maxCourses, courses.length);
            return accessedCount >= limits.maxCourses && (
              <div className="md:col-span-2 lg:col-span-3">
                <UpgradePrompt 
                  type="courses" 
                  currentCount={accessedCount} 
                  limit={limits.maxCourses} 
                />
              </div>
            );
          })()}
            </div>
          </TabsContent>

          <TabsContent value="mentors" className="mt-8">
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Mentor & Expert</h2>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Terhubung dengan mentor profesional untuk mendapatkan bimbingan personal dalam pengembangan karir dan keahlian Anda
                </p>
              </div>
              <MentorsSection />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default LearningHub;