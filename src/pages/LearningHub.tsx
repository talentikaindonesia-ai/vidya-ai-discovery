import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Play, Clock, Award, BookOpen, Code, FileText, Users, ArrowLeft, Crown, Lock, GraduationCap, Zap, Brain, TrendingUp, Search, Star, Filter, Target, Calendar, Trophy, Rocket, Users2, Timer } from "lucide-react";
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
  const [challenges, setChallenges] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);

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
        
        await Promise.all([
          loadCourses(),
          loadUserProgress(),
          loadUserAssessment(session.user.id),
          loadUserInterests(session.user.id),
          loadChallenges(),
          loadPrograms()
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

  const loadChallenges = async () => {
    try {
      const { data, error } = await supabase
        .from('community_challenges')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;
      setChallenges(data || []);
    } catch (error: any) {
      console.error('Error loading challenges:', error);
    }
  };

  const loadPrograms = async () => {
    try {
      const { data, error } = await supabase
        .from('learning_paths')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;
      setPrograms(data || []);
    } catch (error: any) {
      console.error('Error loading programs:', error);
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
      const existingProgress = userProgress.find(p => p.course_id === courseId);
      
      if (!existingProgress) {
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
          <div className="w-full max-w-none px-4 md:px-6 prevent-overflow">
            {/* Header */}
            <div className="mb-6 md:mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold truncate">Kursus Pembelajaran</h1>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm text-muted-foreground">Muhammad Dafa</span>
                  <Badge variant="outline" className="text-xs">Individual</Badge>
                </div>
              </div>
              
              {/* Search Bar */}
              <div className="flex items-center gap-2 md:gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Cari kursus..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline" size="icon" className="shrink-0">
                  <Filter className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Direct Content Display - PersonalizedLearningHub */}
            <PersonalizedLearningHub 
              user={user}
              userAssessment={userAssessment}
              userInterests={userInterests}
              subscriptionInfo={subscriptionInfo}
            />

            {/* All Courses Section */}
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4">Semua Kursus</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course, index) => (
                  <Card 
                    key={course.id} 
                    className="shadow-card hover:shadow-floating transition-all cursor-pointer group"
                    onClick={() => handleCourseClick(course, index)}
                  >
                    <CardContent className="p-0">
                      <div className="relative overflow-hidden">
                        {course.thumbnail_url && (
                          <img 
                            src={course.thumbnail_url} 
                            alt={course.title}
                            className="w-full h-40 object-cover group-hover:scale-105 transition-transform"
                          />
                        )}
                        <div className="absolute top-3 left-3">
                          <Badge className={getDifficultyColor(course.difficulty_level)}>
                            {getDifficultyLabel(course.difficulty_level)}
                          </Badge>
                        </div>
                        {!canAccessCourse(index) && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <div className="bg-white/90 rounded-lg p-3 flex items-center gap-2">
                              <Lock className="w-4 h-4 text-primary" />
                              <span className="text-sm font-medium text-primary">Premium</span>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="p-4 sm:p-6">
                        <h4 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                          {course.title}
                        </h4>
                        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                          {course.description}
                        </p>
                        
                        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{course.duration_hours} jam</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <BookOpen className="w-4 h-4" />
                            <span>{course.lessons?.length || 0} materi</span>
                          </div>
                        </div>
                        
                        {getCourseProgress(course.id) > 0 && (
                          <div className="mb-4">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span>Progress</span>
                              <span>{getCourseProgress(course.id)}%</span>
                            </div>
                            <Progress value={getCourseProgress(course.id)} className="h-2" />
                          </div>
                        )}
                        
                        <Button 
                          className="w-full"
                          variant={canAccessCourse(index) ? "default" : "outline"}
                          disabled={!canAccessCourse(index)}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (canAccessCourse(index)) {
                              startLearning(course.id, index);
                            }
                          }}
                        >
                          {canAccessCourse(index) ? (
                            <>
                              <Play className="w-4 h-4 mr-2" />
                              {getCourseProgress(course.id) > 0 ? 'Lanjutkan' : 'Mulai'} Belajar
                            </>
                          ) : (
                            <>
                              <Crown className="w-4 h-4 mr-2" />
                              Upgrade ke Premium
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </main>
        
        <BottomNavigationBar />
      </div>
    </SidebarProvider>
  );
};

export default LearningHub;
