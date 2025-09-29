import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { ArrowLeft, Plus } from "lucide-react";

// Import admin components
import { CoursesManager } from "@/components/admin/CoursesManager";
import { LearningContentManager } from "@/components/dashboard/LearningContentManager";
import { LearningPathBuilder } from "@/components/admin/LearningPathBuilder";
import { QuizManager } from "@/components/admin/QuizManager";
import { OpportunitiesManager } from "@/components/admin/OpportunitiesManager";
import { PaymentManagement } from "@/components/admin/PaymentManagement";
import { WebScrapingAdmin } from "@/components/admin/WebScrapingAdmin";
import { CommunityManager } from "@/components/admin/CommunityManager";
import { ChallengesManager } from "@/components/admin/ChallengesManager";
import { ArticlesManager } from "@/components/admin/ArticlesManager";

const Admin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("courses");

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }

    // Check if user has admin role
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('role', 'admin')
      .single();

    if (!userRole) {
      toast.error("Akses ditolak. Anda tidak memiliki izin admin.");
      navigate("/dashboard");
      return;
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
            </Button>
            <h1 className="text-3xl font-bold text-primary">Admin CMS</h1>
          </div>
          <Button 
            onClick={() => {
              // Add content based on active tab
              const tabActions = {
                courses: () => navigate('/admin/courses/new'),
                learning: () => navigate('/admin/content/new'),
                paths: () => setActiveTab('paths'), // Will trigger form in component
                quizzes: () => setActiveTab('quizzes'), // Will trigger form in component
                opportunities: () => setActiveTab('opportunities'),
                challenges: () => setActiveTab('challenges'),
                community: () => setActiveTab('community'),
              };
              
              const action = tabActions[activeTab as keyof typeof tabActions];
              if (action) action();
            }}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Tambah Konten
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-10 mb-8">
            <TabsTrigger value="courses">Kursus</TabsTrigger>
            <TabsTrigger value="learning">Learning Hub</TabsTrigger>
            <TabsTrigger value="paths">Learning Paths</TabsTrigger>
            <TabsTrigger value="quizzes">Quiz Explorer</TabsTrigger>
            <TabsTrigger value="articles">Artikel</TabsTrigger>
            <TabsTrigger value="opportunities">Peluang</TabsTrigger>
            <TabsTrigger value="challenges">Tantangan</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="scraping">Web Scraping</TabsTrigger>
            <TabsTrigger value="community">Komunitas</TabsTrigger>
          </TabsList>

          {/* Courses Management */}
          <TabsContent value="courses" className="mt-6">
            <CoursesManager />
          </TabsContent>

          {/* Learning Hub Management */}
          <TabsContent value="learning" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Kelola Konten Pembelajaran</CardTitle>
                <CardDescription>
                  Tambah, edit, dan kelola semua konten pembelajaran termasuk video, artikel, modul interaktif
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LearningContentManager />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Learning Paths Management */}
          <TabsContent value="paths" className="mt-6">
            <LearningPathBuilder />
          </TabsContent>

          {/* Quiz Management */}
          <TabsContent value="quizzes" className="mt-6">
            <QuizManager />
          </TabsContent>

          {/* Articles Management */}
          <TabsContent value="articles" className="mt-6">
            <ArticlesManager />
          </TabsContent>

          {/* Opportunities Management */}
          <TabsContent value="opportunities" className="mt-6">
            <OpportunitiesManager />
          </TabsContent>

          {/* Challenges Management */}
          <TabsContent value="challenges" className="mt-6">
            <ChallengesManager />
          </TabsContent>

          {/* Payment Management */}
          <TabsContent value="payments" className="mt-6">
            <PaymentManagement />
          </TabsContent>

          {/* Web Scraping */}
          <TabsContent value="scraping" className="mt-6">
            <WebScrapingAdmin />
          </TabsContent>

          {/* Community Management */}
          <TabsContent value="community" className="mt-6">
            <CommunityManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;