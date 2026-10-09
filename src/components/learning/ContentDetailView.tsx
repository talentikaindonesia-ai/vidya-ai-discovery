import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { BottomNavigationBar } from "@/components/dashboard/BottomNavigationBar";
import {
  ArrowLeft,
  Play,
  Clock,
  BookOpen,
  Star,
  Users,
  Download,
  FileText,
  Video,
  Brain,
  Edit,
  CheckCircle,
  Eye,
  Share2,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradeGate } from "@/components/payment/UpgradeGate";

interface LearningContent {
  id: string;
  title: string;
  description: string;
  content_type: string;
  content_url: string;
  thumbnail_url: string;
  duration_minutes: number;
  difficulty_level: string;
  target_personas: string[];
  category_id: string;
  tags: string[];
  external_source: string;
  is_featured: boolean;
  is_premium: boolean;
  priority_score: number;
  total_enrollments: number;
  average_rating: number;
  is_active: boolean;
  created_at: string;
  learning_objectives?: string[] | null;
  learning_categories?: {
    name: string;
    icon: string;
    color: string;
  };
}

interface ContentProgress {
  progress_percentage: number;
  status: string;
  last_accessed_at: string;
  time_spent_minutes: number;
}

export const ContentDetailView = () => {
  const { contentId } = useParams<{ contentId: string }>();
  const navigate = useNavigate();
  const [content, setContent] = useState<LearningContent | null>(null);
  const [progress, setProgress] = useState<ContentProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  // Free tier: first 3 contents (by started progress) are the free allocation.
  // New content beyond that shows the premium gate. Already-started stays open.
  const [freeQuotaExceeded, setFreeQuotaExceeded] = useState(false);
  const sub = useSubscription();
  const [activeTab, setActiveTab] = useState("overview");
  const [activeSection, setActiveSection] = useState("courses");

  useEffect(() => {
    if (contentId) {
      loadContentDetails();
      checkUserRole();
    }
  }, [contentId]);

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();
        
        setIsAdmin(roleData?.role === 'admin');
      }
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  };

  const loadContentDetails = async () => {
    try {
      const { data: contentData, error: contentError } = await supabase
        .from('learning_content')
        .select(`
          *,
          learning_categories (
            name,
            icon,
            color
          )
        `)
        .eq('id', contentId)
        .single();

      if (contentError) throw contentError;

      setContent(contentData);

      // Load user progress if authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: progressData } = await supabase
          .from('learning_progress')
          .select('*')
          .eq('user_id', user.id)
          .eq('content_id', contentId)
          .single();

        setProgress(progressData);

        // Free quota check: this content is NEW to the user and they already
        // used their 3 free slots → gate it (premium check happens at render)
        if (!progressData) {
          const { count } = await supabase
            .from('learning_progress')
            .select('content_id', { count: 'exact', head: true })
            .eq('user_id', user.id);
          setFreeQuotaExceeded((count ?? 0) >= 3);
        } else {
          setFreeQuotaExceeded(false);
        }
      }
    } catch (error: any) {
      toast.error("Gagal memuat detail konten: " + error.message);
      navigate('/learning');
    } finally {
      setLoading(false);
    }
  };

  const startContent = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Silakan login terlebih dahulu");
        return;
      }

      // Create or update progress
      const { error } = await supabase
        .from('learning_progress')
        .upsert({
          user_id: user.id,
          content_id: contentId,
          status: 'in_progress',
          progress_percentage: progress?.progress_percentage || 0,
          last_accessed_at: new Date().toISOString(),
        }, { onConflict: "user_id,content_id" });

      if (error) throw error;

      // Open content URL in new tab
      if (content?.content_url) {
        window.open(content.content_url, '_blank');
      }

      toast.success("Pembelajaran dimulai!");
      loadContentDetails(); // Refresh progress
    } catch (error: any) {
      toast.error("Gagal memulai pembelajaran: " + error.message);
    }
  };

  const markAsCompleted = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('learning_progress')
        .upsert({
          user_id: user.id,
          content_id: contentId,
          status: 'completed',
          progress_percentage: 100,
          completed_at: new Date().toISOString(),
          last_accessed_at: new Date().toISOString(),
        }, { onConflict: "user_id,content_id" });

      if (error) throw error;

      toast.success("Pembelajaran telah diselesaikan!");
      loadContentDetails();
    } catch (error: any) {
      toast.error("Gagal menyelesaikan pembelajaran: " + error.message);
    }
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'course': return <BookOpen className="w-5 h-5" />;
      case 'video': return <Video className="w-5 h-5" />;
      case 'article': return <FileText className="w-5 h-5" />;
      case 'module': return <Brain className="w-5 h-5" />;
      default: return <BookOpen className="w-5 h-5" />;
    }
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Konten tidak ditemukan</h2>
          <Button onClick={() => navigate('/learning')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Learning Hub
          </Button>
        </div>
      </div>
    );
  }

  // ── Premium gate: free users get 3 contents; new content beyond that is locked ──
  if (freeQuotaExceeded && !sub.loading && sub.isFree && !isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6 max-w-3xl">
          <Button
            variant="ghost"
            onClick={() => navigate('/learning')}
            className="flex items-center gap-2 mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Learning Hub
          </Button>

          <UpgradeGate
            feature="Kamu sudah memakai 3 konten gratis. Upgrade Premium untuk akses semua konten pembelajaran tanpa batas + sertifikat."
            fromPath={`/learning/content/${contentId}`}
          >
            {/* Blurred preview of the locked content */}
            <Card>
              <CardContent className="p-6">
                <div className="aspect-video bg-muted rounded-lg mb-4 overflow-hidden">
                  {content.thumbnail_url && (
                    <img src={content.thumbnail_url} alt={content.title} className="w-full h-full object-cover" />
                  )}
                </div>
                <h1 className="text-2xl font-bold mb-2">{content.title}</h1>
                <p className="text-muted-foreground">{content.description}</p>
              </CardContent>
            </Card>
          </UpgradeGate>
        </div>
        <BottomNavigationBar />
      </div>
    );
  }

  return (
    <SidebarProvider>
    <div className="min-h-screen bg-background flex w-full">
      <DashboardSidebar
        activeSection={activeSection}
        setActiveSection={(s) => {
          if (s === 'community') { navigate('/community'); return; }
          if (s === 'timeline')  { navigate('/discovery'); return; }
          navigate('/dashboard');
        }}
        onSignOut={async () => {
          await supabase.auth.signOut();
          navigate('/');
        }}
        userRole={null}
      />
      <div className="flex-1 flex flex-col min-w-0">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/learning')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Learning Hub
          </Button>
          
          {isAdmin && (
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate(`/admin/content/edit/${contentId}`)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Konten
              </Button>
              <Button variant="outline" size="sm">
                <Eye className="w-4 h-4 mr-2" />
                Analytics
              </Button>
            </div>
          )}
        </div>

        {/* Content Header */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Thumbnail */}
              <div className="lg:w-1/3">
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                  {content.thumbnail_url ? (
                    <img loading="lazy" decoding="async" 
                      src={content.thumbnail_url} 
                      alt={content.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center text-muted-foreground">
                      {getContentIcon(content.content_type)}
                      <span className="text-sm mt-2">No Preview</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Content Info */}
              <div className="lg:w-2/3">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-2xl font-bold mb-2">{content.title}</h1>
                    <p className="text-muted-foreground mb-4">{content.description}</p>
                  </div>
                  {content.is_featured && (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      <Star className="w-3 h-3 mr-1" />
                      Featured
                    </Badge>
                  )}
                </div>

                {/* Metadata */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="outline" className="flex items-center gap-1">
                    {getContentIcon(content.content_type)}
                    {content.content_type}
                  </Badge>
                  <Badge variant="outline" className={getDifficultyColor(content.difficulty_level)}>
                    {getDifficultyLabel(content.difficulty_level)}
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {content.duration_minutes} menit
                  </Badge>
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {content.total_enrollments} peserta
                  </Badge>
                  {content.learning_categories && (
                    <Badge variant="outline" style={{ backgroundColor: content.learning_categories.color + '20' }}>
                      {content.learning_categories.name}
                    </Badge>
                  )}
                </div>

                {/* Progress */}
                {progress && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Progress</span>
                      <span className="text-sm text-muted-foreground">
                        {progress.progress_percentage}%
                      </span>
                    </div>
                    <Progress value={progress.progress_percentage} className="h-2" />
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button onClick={startContent} size="lg" className="flex items-center gap-2">
                    <Play className="w-4 h-4" />
                    {progress?.status === 'completed' ? 'Pelajari Lagi' :
                     progress?.status === 'in_progress' ? 'Lanjutkan' : 'Mulai Belajar'}
                  </Button>

                  {progress?.status === 'in_progress' && (
                    <Button
                      variant="outline"
                      onClick={markAsCompleted}
                      className="flex items-center gap-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Tandai Selesai
                    </Button>
                  )}

                  {content.content_url && (
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => window.open(content.content_url, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Buka
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quiz card — shown when the content has quiz questions attached */}
        {contentId && <ContentQuizCard contentId={contentId} progressStatus={progress?.status ?? null} onPassed={loadContentDetails} />}

        {/* Rating card — only for users who have started this content */}
        {contentId && progress && (
          <ContentRatingCard contentId={contentId} onRated={loadContentDetails} />
        )}

        {/* Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="content">Konten</TabsTrigger>
            <TabsTrigger value="resources">Sumber Daya</TabsTrigger>
            <TabsTrigger value="discussion">Diskusi</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Tentang Pembelajaran Ini</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">{content.description}</p>

                    {(content.learning_objectives?.length ?? 0) > 0 && (
                      <div className="mb-4">
                        <h4 className="font-semibold mb-2">Yang akan kamu pelajari:</h4>
                        <ul className="space-y-1.5">
                          {content.learning_objectives!.map((o, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                              <span>{o}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {(content.tags?.length ?? 0) > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Tags:</h4>
                        <div className="flex flex-wrap gap-2">
                          {content.tags.map((tag, index) => (
                            <Badge key={index} variant="secondary">#{tag}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Statistik</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Total Peserta</span>
                      <span className="font-semibold">{content.total_enrollments}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Rating</span>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold">{content.average_rating.toFixed(1)}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Durasi</span>
                      <span className="font-semibold">{content.duration_minutes} menit</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Level</span>
                      <Badge className={getDifficultyColor(content.difficulty_level)}>
                        {getDifficultyLabel(content.difficulty_level)}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="content" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Materi Pembelajaran</CardTitle>
                <CardDescription>
                  Akses semua konten dan materi pembelajaran
                </CardDescription>
              </CardHeader>
              <CardContent>
                {content.content_url ? (
                  <div className="aspect-video w-full">
                    <iframe
                      src={content.content_url}
                      className="w-full h-full rounded-lg border"
                      allowFullScreen
                      title={content.title}
                    />
                  </div>
                ) : (
                  <div className="aspect-video w-full bg-muted rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">Konten akan segera tersedia</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resources" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Sumber Daya Tambahan</CardTitle>
                <CardDescription>
                  Download materi, file, dan resource lainnya
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5" />
                      <div>
                        <p className="font-medium">Materi PDF</p>
                        <p className="text-sm text-muted-foreground">Ringkasan pembelajaran</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Video className="w-5 h-5" />
                      <div>
                        <p className="font-medium">Video Tutorial</p>
                        <p className="text-sm text-muted-foreground">Panduan lengkap</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">
                      <Play className="w-4 h-4 mr-2" />
                      Tonton
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="discussion" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Forum Diskusi</CardTitle>
                <CardDescription>
                  Diskusi dengan peserta lain dan pengajar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-muted-foreground">Fitur diskusi akan segera tersedia</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <BottomNavigationBar activeSection={activeSection} setActiveSection={setActiveSection} />
      </div>
    </div>
    </SidebarProvider>
  );
};

// ─── ContentQuizCard: student-facing quiz (server-graded via submit_content_quiz) ───
function ContentQuizCard({ contentId, progressStatus, onPassed }: {
  contentId: string;
  progressStatus: string | null;
  onPassed: () => void;
}) {
  const [questions, setQuestions] = useState<{ id: string; question: string; options: string[] | null }[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{
    score: number; correct: number; total: number; passed: boolean;
    results: { question_id: string; correct: boolean; correct_answer: string; explanation: string | null }[];
  } | null>(null);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (supabase.rpc as any)("get_content_quiz", { p_content_id: contentId }).then(({ data }: any) => {
      setQuestions(Array.isArray(data) ? data : []);
    });
  }, [contentId]);

  if (questions.length === 0) return null;

  const submit = async () => {
    if (Object.keys(answers).length < questions.length) {
      toast.error("Jawab semua pertanyaan dulu ya");
      return;
    }
    setSubmitting(true);
    const { data, error } = await (supabase.rpc as any)("submit_content_quiz", {
      p_content_id: contentId,
      p_answers: answers,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    setResult(data);
    if (data?.passed) {
      toast.success(`🎉 Lulus dengan skor ${data.score}%! Konten ditandai selesai.`);
      onPassed();
    } else {
      toast.error(`Skor ${data?.score}% — belum lulus (minimal 70%). Coba lagi!`);
    }
  };

  const retry = () => { setResult(null); setAnswers({}); };
  const resultFor = (qid: string) => result?.results.find(r => r.question_id === qid);

  return (
    <Card className="mb-6 border-purple-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              📝 Kuis Pemahaman
              {progressStatus === "completed" && <Badge className="bg-green-100 text-green-700">Selesai ✓</Badge>}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              {questions.length} soal · lulus ≥70% otomatis menandai konten selesai
            </p>
          </div>
          {!open && (
            <Button onClick={() => setOpen(true)} className="bg-purple-600 hover:bg-purple-700">
              {progressStatus === "completed" ? "Kerjakan Lagi" : "Kerjakan Kuis"}
            </Button>
          )}
        </div>

        {open && (
          <div className="mt-5 space-y-5">
            {questions.map((q, i) => {
              const res = resultFor(q.id);
              return (
                <div key={q.id} className="border rounded-xl p-4">
                  <div className="font-semibold text-sm mb-3">{i + 1}. {q.question}</div>
                  <div className="grid gap-2">
                    {(q.options ?? []).map(opt => {
                      const chosen = answers[q.id] === opt;
                      const showCorrect = result && res && opt === res.correct_answer;
                      const showWrong = result && chosen && !res?.correct;
                      return (
                        <button
                          key={opt}
                          disabled={!!result}
                          onClick={() => setAnswers(prev => ({ ...prev, [q.id]: opt }))}
                          className={`text-left text-sm px-4 py-2.5 rounded-lg border transition-colors ${
                            showCorrect ? "bg-green-50 border-green-400 text-green-800 font-semibold"
                            : showWrong ? "bg-red-50 border-red-300 text-red-700"
                            : chosen ? "bg-blue-50 border-blue-400 text-blue-800 font-semibold"
                            : "bg-background hover:bg-muted border-border"
                          }`}
                        >
                          {showCorrect ? "✓ " : showWrong ? "✗ " : ""}{opt}
                        </button>
                      );
                    })}
                  </div>
                  {result && res?.explanation && (
                    <div className="mt-3 text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2">
                      💡 {res.explanation}
                    </div>
                  )}
                </div>
              );
            })}

            {!result ? (
              <Button onClick={submit} disabled={submitting} className="w-full bg-purple-600 hover:bg-purple-700" size="lg">
                {submitting ? "Menilai…" : "Kumpulkan Jawaban"}
              </Button>
            ) : (
              <div className={`rounded-xl p-4 text-center ${result.passed ? "bg-green-50 border border-green-200" : "bg-amber-50 border border-amber-200"}`}>
                <div className="text-3xl font-extrabold" style={{ color: result.passed ? "#059669" : "#B45309" }}>
                  {result.score}%
                </div>
                <div className="text-sm mt-1 text-muted-foreground">
                  {result.correct}/{result.total} benar · {result.passed ? "🎉 Lulus! Konten ditandai selesai." : "Belum lulus — minimal 70%."}
                </div>
                {!result.passed && (
                  <Button onClick={retry} variant="outline" className="mt-3">Coba Lagi</Button>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── ContentRatingCard: star rating + optional review (server-side rate_content) ───
function ContentRatingCard({ contentId, onRated }: { contentId: string; onRated: () => void }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [review, setReview] = useState("");
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("content_ratings")
        .select("rating, review")
        .eq("content_id", contentId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (active && data) {
        setRating(data.rating);
        setReview(data.review ?? "");
        setSaved(true);
      }
    })();
    return () => { active = false; };
  }, [contentId]);

  const submit = async () => {
    if (rating < 1) { toast.error("Pilih bintang dulu ya"); return; }
    setSubmitting(true);
    const { error } = await (supabase.rpc as any)("rate_content", {
      p_content_id: contentId,
      p_rating: rating,
      p_review: review.trim() || null,
    });
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    setSaved(true);
    toast.success("Terima kasih atas penilaianmu! ⭐");
    onRated();
  };

  return (
    <Card className="mb-6 border-amber-200">
      <CardContent className="p-6">
        <h3 className="text-lg font-bold flex items-center gap-2">
          ⭐ Beri Penilaian
          {saved && <Badge className="bg-green-100 text-green-700">Tersimpan ✓</Badge>}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Seberapa bermanfaat konten ini untukmu?
        </p>

        <div className="flex items-center gap-1.5 mt-4">
          {[1, 2, 3, 4, 5].map(n => (
            <button
              key={n}
              type="button"
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating(n)}
              className="transition-transform hover:scale-110"
              aria-label={`Beri ${n} bintang`}
            >
              <Star
                className="w-8 h-8"
                style={{
                  fill: (hover || rating) >= n ? "#FBBF24" : "transparent",
                  color: (hover || rating) >= n ? "#FBBF24" : "#D1D5DB",
                }}
              />
            </button>
          ))}
          {rating > 0 && <span className="ml-2 text-sm font-semibold text-amber-600">{rating}/5</span>}
        </div>

        <textarea
          value={review}
          onChange={e => setReview(e.target.value)}
          placeholder="Tulis ulasan singkat (opsional)…"
          rows={3}
          maxLength={500}
          className="mt-4 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-300"
        />

        <Button
          onClick={submit}
          disabled={submitting}
          className="mt-3 bg-amber-500 hover:bg-amber-600"
        >
          {submitting ? "Menyimpan…" : saved ? "Perbarui Penilaian" : "Kirim Penilaian"}
        </Button>
      </CardContent>
    </Card>
  );
}