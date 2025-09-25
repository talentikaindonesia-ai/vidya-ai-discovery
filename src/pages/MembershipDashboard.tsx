import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { PortfolioBuilder } from "@/components/membership/PortfolioBuilder";
import { MentorshipBooking } from "@/components/membership/MentorshipBooking";
import { NetworkingHub } from "@/components/membership/NetworkingHub";
import { 
  User, BookOpen, Award, Users, Calendar, FileText, 
  TrendingUp, Target, CheckCircle, Clock, Star,
  ArrowLeft, Crown, Zap
} from "lucide-react";

interface UserSubscription {
  id: string;
  status: string;
  subscription_packages: {
    name: string;
    type: string;
    features: any; // Change from string[] to any to handle Json type
  };
}

interface AssessmentResult {
  personality_type?: string;
  talent_areas: string[];
  career_recommendations: string[];
  completed_at: string;
}

const MembershipDashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [assessmentResults, setAssessmentResults] = useState<AssessmentResult[]>([]);
  const [portfolioStats, setPortfolioStats] = useState({ total: 0, featured: 0 });
  const [mentorshipStats, setMentorshipStats] = useState({ total: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      toast({
        title: "Login Required",
        description: "Silakan login terlebih dahulu",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    setUser(session.user);
    await Promise.all([
      loadUserSubscription(session.user.id),
      loadAssessmentResults(session.user.id),
      loadPortfolioStats(session.user.id),
      loadMentorshipStats(session.user.id)
    ]);
    setLoading(false);
  };

  const loadUserSubscription = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_subscriptions')
      .select(`
        *,
        subscription_packages (*)
      `)
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle(); // Use maybeSingle to handle no data gracefully

    if (data) {
      // Ensure features is properly typed
      const subscriptionData = {
        ...data,
        subscription_packages: {
          ...data.subscription_packages,
          features: Array.isArray(data.subscription_packages.features) 
            ? data.subscription_packages.features 
            : JSON.parse(data.subscription_packages.features as string)
        }
      };
      setSubscription(subscriptionData);
    }
  };

  const loadAssessmentResults = async (userId: string) => {
    const { data, error } = await supabase
      .from('assessment_results')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false });

    if (data) {
      setAssessmentResults(data);
    }
  };

  const loadPortfolioStats = async (userId: string) => {
    const { count: totalCount } = await supabase
      .from('portfolio_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const { count: featuredCount } = await supabase
      .from('portfolio_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_featured', true);

    setPortfolioStats({
      total: totalCount || 0,
      featured: featuredCount || 0
    });
  };

  const loadMentorshipStats = async (userId: string) => {
    const { count: totalCount } = await supabase
      .from('mentorship_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    const { count: completedCount } = await supabase
      .from('mentorship_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'completed');

    setMentorshipStats({
      total: totalCount || 0,
      completed: completedCount || 0
    });
  };

  const getPlanType = (): 'individual' | 'premium' => {
    return subscription?.subscription_packages?.type === 'premium_individual' ? 'premium' : 'individual';
  };

  const getCompletionPercentage = () => {
    const steps = [
      assessmentResults.length > 0, // Has assessment
      portfolioStats.total > 0, // Has portfolio items
      mentorshipStats.total > 0, // Has mentorship sessions
    ];
    
    const completed = steps.filter(Boolean).length;
    return Math.round((completed / steps.length) * 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent-light/30 to-secondary-light/20">
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto text-center p-8">
            <div className="text-4xl mb-4">🔒</div>
            <h2 className="text-2xl font-bold mb-4">Akses Premium Required</h2>
            <p className="text-muted-foreground mb-6">
              Berlangganan untuk mengakses fitur membership lengkap
            </p>
            <Button onClick={() => navigate('/subscription')} className="w-full">
              Berlangganan Sekarang
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent-light/30 to-secondary-light/20">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Membership Dashboard
              </h1>
              <p className="text-muted-foreground">
                Kelola dan kembangkan perjalanan karir Anda
              </p>
            </div>
          </div>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
                {getPlanType() === 'premium' ? (
                  <Crown className="w-5 h-5 text-white" />
                ) : (
                  <Star className="w-5 h-5 text-white" />
                )}
              </div>
              <div>
                <div className="font-semibold">{subscription.subscription_packages.name}</div>
                <div className="text-sm text-muted-foreground">
                  Status: <Badge variant="default">Active</Badge>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Progress Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Progress Membership
            </CardTitle>
            <CardDescription>
              Selesaikan langkah-langkah berikut untuk memaksimalkan membership Anda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Progres Keseluruhan</span>
                <span className="font-semibold">{getCompletionPercentage()}%</span>
              </div>
              <Progress value={getCompletionPercentage()} className="h-2" />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  {assessmentResults.length > 0 ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <Clock className="w-5 h-5 text-muted-foreground" />
                  )}
                  <div>
                    <div className="font-medium">Assessment</div>
                    <div className="text-sm text-muted-foreground">
                      {assessmentResults.length > 0 ? 'Selesai' : 'Belum dikerjakan'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  {portfolioStats.total > 0 ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <Clock className="w-5 h-5 text-muted-foreground" />
                  )}
                  <div>
                    <div className="font-medium">Portfolio</div>
                    <div className="text-sm text-muted-foreground">
                      {portfolioStats.total} item
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  {mentorshipStats.total > 0 ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <Clock className="w-5 h-5 text-muted-foreground" />
                  )}
                  <div>
                    <div className="font-medium">Mentorship</div>
                    <div className="text-sm text-muted-foreground">
                      {mentorshipStats.completed}/{mentorshipStats.total} sesi
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="assessment">Assessment</TabsTrigger>
            <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
            <TabsTrigger value="mentorship">Mentorship</TabsTrigger>
            <TabsTrigger value="networking">Networking</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Stats Cards */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Assessment</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{assessmentResults.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Tes selesai
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Portfolio Items</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{portfolioStats.total}</div>
                  <p className="text-xs text-muted-foreground">
                    {portfolioStats.featured} unggulan
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Mentorship</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{mentorshipStats.total}</div>
                  <p className="text-xs text-muted-foreground">
                    Total sesi
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Plan Status</CardTitle>
                  <Zap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{getPlanType() === 'premium' ? 'Premium' : 'Individual'}</div>
                  <p className="text-xs text-muted-foreground">
                    Membership aktif
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Latest Assessment Results */}
            {assessmentResults.length > 0 && (
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Hasil Assessment Terbaru</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {assessmentResults[0].personality_type && (
                      <div>
                        <label className="text-sm font-medium">Tipe Kepribadian</label>
                        <div className="mt-1">
                          <Badge variant="secondary">{assessmentResults[0].personality_type}</Badge>
                        </div>
                      </div>
                    )}
                    
                    {assessmentResults[0].talent_areas.length > 0 && (
                      <div>
                        <label className="text-sm font-medium">Area Talenta</label>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {assessmentResults[0].talent_areas.map((talent, index) => (
                            <Badge key={index} variant="outline">{talent}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {assessmentResults[0].career_recommendations.length > 0 && (
                      <div>
                        <label className="text-sm font-medium">Rekomendasi Karir</label>
                        <div className="mt-1 flex flex-wrap gap-2">
                          {assessmentResults[0].career_recommendations.slice(0, 3).map((career, index) => (
                            <Badge key={index} className="bg-primary/10 text-primary">{career}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="assessment">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Assessment & Analisis Minat Bakat
                </CardTitle>
                <CardDescription>
                  {getPlanType() === 'individual' 
                    ? 'Basic assessment untuk mengenal potensi diri'
                    : 'Full assessment dengan analisis mendalam'
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {assessmentResults.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-4xl mb-4">🎯</div>
                    <h3 className="text-xl font-semibold mb-2">Belum Ada Assessment</h3>
                    <p className="text-muted-foreground mb-4">
                      Mulai dengan tes minat dan bakat untuk mengenal potensi diri
                    </p>
                    <Button onClick={() => navigate('/assessment')}>
                      Mulai Assessment
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">Riwayat Assessment</h4>
                      <Button variant="outline" onClick={() => navigate('/assessment')}>
                        Tes Ulang
                      </Button>
                    </div>
                    {assessmentResults.map((result, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <Badge variant="default">
                            {getPlanType() === 'premium' ? 'Full Assessment' : 'Basic Assessment'}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(result.completed_at).toLocaleDateString('id-ID')}
                          </span>
                        </div>
                        {/* Display assessment details here */}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="portfolio">
            <PortfolioBuilder userId={user?.id} />
          </TabsContent>

          <TabsContent value="mentorship">
            <MentorshipBooking userId={user?.id} userPlan={getPlanType()} />
          </TabsContent>

          <TabsContent value="networking">
            <NetworkingHub userId={user?.id} userPlan={getPlanType()} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MembershipDashboard;