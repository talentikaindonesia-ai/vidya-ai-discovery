import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Play, Clock, Award, BookOpen, Code, FileText, Users, ArrowLeft, Crown, Lock, GraduationCap, Zap, Brain, TrendingUp, Search, Star, Filter, Target, Calendar } from "lucide-react";
import { toast } from "sonner";
import { getSubscriptionLimits, checkSubscriptionAccess, getUserSubscriptionInfo } from "@/lib/subscription";
import { PersonalizedLearningHub } from "@/components/dashboard/PersonalizedLearningHub";
import { MentorsSection } from "@/components/dashboard/MentorsSection";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { LearningProgressTracker } from "@/components/dashboard/LearningProgressTracker";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { BottomNavigationBar } from "@/components/dashboard/BottomNavigationBar";

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
  const [activeSection, setActiveSection] = useState("courses");
  const [searchTerm, setSearchTerm] = useState("");

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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/auth';
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
    <SidebarProvider>
      <div className="flex min-h-screen bg-background">
        <DashboardSidebar
          activeSection={activeSection}
          setActiveSection={setActiveSection}
          onSignOut={handleSignOut}
        />
        
        <main className="flex-1 overflow-hidden pb-20 md:pb-0">
          <div className="p-6">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-3xl font-bold">Kursus Pembelajaran</h1>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Muhammad Dafa</span>
                  <Badge variant="outline" className="text-xs">Individual</Badge>
                </div>
              </div>
              
              {/* Search Bar */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 relative max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Cari kursus..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" size="icon">
                  <Filter className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Learning Progress Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-8">
              <Card className="shadow-card">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <Target className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                    Target Mingguan
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium">Kursus Diselesaikan</span>
                      <span className="text-primary font-bold">2/3</span>
                    </div>
                    <Progress value={67} className="h-2 sm:h-3" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium">Waktu Belajar Mingguan</span>
                      <span className="text-primary font-bold">8/12 jam</span>
                    </div>
                    <Progress value={67} className="h-2 sm:h-3" />
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground">
                      Anda sudah mencapai <span className="font-semibold text-primary">67%</span> dari target mingguan!
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-card">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                    Jadwal Hari Ini
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 sm:space-y-4">
                  <div className="flex items-center gap-3 p-3 sm:p-4 bg-primary/5 rounded-xl border-l-4 border-primary">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Play className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm sm:text-base">Kelas Python Dasar</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">09:00 - 10:30 WIB</p>
                    </div>
                    <Badge className="bg-primary text-primary-foreground text-xs">Live</Badge>
                  </div>
                  <div className="flex items-center gap-3 p-3 sm:p-4 bg-muted/30 rounded-xl border-l-4 border-muted">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-muted/50 rounded-full flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm sm:text-base">Quiz Matematika</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">14:00 - 14:30 WIB</p>
                    </div>
                    <Badge variant="outline" className="text-xs">Upcoming</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="personal">Rekomendasi Personal</TabsTrigger>
                <TabsTrigger value="all">Semua Kursus</TabsTrigger>
                <TabsTrigger value="my">Kursus Saya</TabsTrigger>
                <TabsTrigger value="finished">Selesai</TabsTrigger>
              </TabsList>

              <TabsContent value="personal">
                {/* Rekomendasi Personal Section */}
                <Card className="mb-6 border-blue-200">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Brain className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">Rekomendasi Personal Anda</h3>
                        <p className="text-muted-foreground text-sm mb-3">
                          Berdasarkan hasil assessment dan minat Anda:
                        </p>
                        
                        {/* Assessment Tags */}
                        {userAssessment && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            <Badge variant="outline" className="bg-blue-50 border-blue-200">
                              <span className="text-xs mr-1">💡</span>
                              Tipe: {userAssessment.personality_type || 'social'}
                            </Badge>
                            <Badge variant="outline" className="bg-blue-50 border-blue-200">
                              Gaya Belajar: {userAssessment.learning_style || 'social'}
                            </Badge>
                            <Badge variant="outline" className="bg-blue-50 border-blue-200">
                              realistic
                            </Badge>
                            <Badge variant="outline" className="bg-blue-50 border-blue-200">
                              investigative
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Course Grid for Personal Recommendations */}
                <div className="space-y-4 mb-6">
                  <h3 className="font-semibold flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    Kursus yang Direkomendasikan
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.slice(0, 3).map((course, index) => (
                      <Card 
                        key={course.id} 
                        className="overflow-hidden hover:shadow-lg transition-all cursor-pointer bg-gradient-to-br from-blue-500 to-blue-600 text-white"
                        onClick={() => handleCourseClick(course, index)}
                      >
                        <CardContent className="p-0">
                          <div className="relative p-6">
                            <Badge className="absolute top-4 left-4 bg-white/20 text-white border-white/30">
                              Rekomendasi
                            </Badge>
                            
                            <div className="flex items-center justify-center w-16 h-16 bg-white/10 rounded-lg mb-4 mt-8">
                              <BookOpen className="w-8 h-8" />
                            </div>
                            
                            <h4 className="font-semibold text-lg mb-2 line-clamp-2">
                              {course.title}
                            </h4>
                            <p className="text-white/80 text-sm mb-4 line-clamp-2">
                              {course.description}
                            </p>
                            
                            <div className="flex items-center justify-between text-sm mb-4">
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                <span>{course.duration_hours}h</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 fill-current" />
                                <span>4.8</span>
                              </div>
                            </div>
                            
                            <Button 
                              className="w-full bg-white text-blue-600 hover:bg-white/90"
                              onClick={(e) => {
                                e.stopPropagation();
                                startLearning(course.id, index);
                              }}
                            >
                              <Play className="w-4 h-4 mr-2" />
                              Mulai Kursus
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="all">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.filter(course => 
                    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    course.description.toLowerCase().includes(searchTerm.toLowerCase())
                  ).map((course, index) => {
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
                </div>
              </TabsContent>

              <TabsContent value="my">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.filter(course => {
                    const progress = getCourseProgress(course.id);
                    return progress > 0 && progress < 100;
                  }).map((course, index) => {
                    const progress = getCourseProgress(course.id);
                    
                    return (
                      <Card 
                        key={course.id} 
                        className="shadow-card hover:shadow-floating transition-all cursor-pointer group"
                        onClick={() => handleCourseClick(course, index)}
                      >
                        <CardHeader>
                          <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                            {course.title}
                          </CardTitle>
                          <p className="text-muted-foreground line-clamp-3">
                            {course.description}
                          </p>
                        </CardHeader>

                        <CardContent>
                          <div className="mb-4">
                            <div className="flex items-center justify-between text-sm mb-2">
                              <span>Progress</span>
                              <span>{progress}%</span>
                            </div>
                            <Progress value={progress} />
                          </div>

                          <Button 
                            className="w-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              startLearning(course.id, index);
                            }}
                          >
                            <Play className="w-4 h-4 mr-2" />
                            Lanjutkan Belajar
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>

              <TabsContent value="finished">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.filter(course => {
                    const progress = getCourseProgress(course.id);
                    return progress === 100;
                  }).map((course, index) => {
                    return (
                      <Card 
                        key={course.id} 
                        className="shadow-card hover:shadow-floating transition-all cursor-pointer group border-green-200"
                        onClick={() => handleCourseClick(course, index)}
                      >
                        <CardHeader>
                          <div className="flex items-center justify-between mb-2">
                            <CardTitle className="line-clamp-2 group-hover:text-primary transition-colors">
                              {course.title}
                            </CardTitle>
                            <Badge className="bg-green-100 text-green-800">
                              <Award className="w-3 h-3 mr-1" />
                              Selesai
                            </Badge>
                          </div>
                          <p className="text-muted-foreground line-clamp-3">
                            {course.description}
                          </p>
                        </CardHeader>

                        <CardContent>
                          <Button 
                            className="w-full"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCourseClick(course, index);
                            }}
                          >
                            <Award className="w-4 h-4 mr-2" />
                            Lihat Sertifikat
                          </Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </main>
        
        {/* Bottom Navigation Bar for Mobile */}
        <BottomNavigationBar />
      </div>
    </SidebarProvider>
  );
};

export default LearningHub;