import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index";
import Assessment from "./pages/Assessment";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import DiscoveryTimeline from "./pages/DiscoveryTimeline";
import LearningHub from "./pages/LearningHub";
import PortfolioBuilder from "./pages/PortfolioBuilder";
import OpportunityBoard from "./pages/OpportunityBoard";
import CommunityForum from "./pages/CommunityForum";
import Onboarding from "./pages/Onboarding";
import DashboardGamified from "./pages/DashboardGamified";
import Subscription from "./pages/Subscription";
import QuizExplore from "./pages/QuizExplore";
import Profile from "./pages/Profile";
import { ContentDetailView } from "./components/learning/ContentDetailView";
import { CategoryView } from "./components/learning/CategoryView";
import { ContentEditor } from "./components/admin/ContentEditor";
import TalentikaJuniorLanding from "./pages/TalentikaJuniorLanding";
import TalentikaJuniorDashboard from "./pages/TalentikaJuniorDashboard";
import TalentikaJuniorDiscovery from "./pages/TalentikaJuniorDiscovery";
import TalentikaJuniorLearning from "./pages/TalentikaJuniorLearning";
import TalentikaJuniorGames from "./pages/TalentikaJuniorGames";
import TalentikaJuniorRewards from "./pages/TalentikaJuniorRewards";
import MembershipDashboard from "./pages/MembershipDashboard";

const queryClient = new QueryClient();

const App = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/onboarding" element={user ? <Onboarding /> : <Navigate to="/auth" />} />
            <Route path="/assessment" element={user ? <Assessment /> : <Navigate to="/auth" />} />
            <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/auth" />} />
            <Route path="/discovery" element={user ? <DiscoveryTimeline /> : <Navigate to="/auth" />} />
            <Route path="/learning" element={user ? <LearningHub /> : <Navigate to="/auth" />} />
            <Route path="/learning/content/:contentId" element={user ? <ContentDetailView /> : <Navigate to="/auth" />} />
            <Route path="/learning/category/:categoryId" element={user ? <CategoryView /> : <Navigate to="/auth" />} />
            <Route path="/portfolio" element={user ? <PortfolioBuilder /> : <Navigate to="/auth" />} />
            <Route path="/opportunities" element={user ? <OpportunityBoard /> : <Navigate to="/auth" />} />
            <Route path="/community" element={user ? <CommunityForum /> : <Navigate to="/auth" />} />
            <Route path="/explore" element={user ? <QuizExplore /> : <Navigate to="/auth" />} />
            <Route path="/dashboard-gamified" element={user ? <DashboardGamified /> : <Navigate to="/auth" />} />
            <Route path="/subscription" element={user ? <Subscription /> : <Navigate to="/auth" />} />
            <Route path="/profile" element={user ? <Profile /> : <Navigate to="/auth" />} />
            <Route path="/admin" element={user ? <Admin /> : <Navigate to="/auth" />} />
            <Route path="/admin/content/edit/:contentId" element={user ? <ContentEditor /> : <Navigate to="/auth" />} />
            <Route path="/membership" element={user ? <MembershipDashboard /> : <Navigate to="/auth" />} />
            <Route path="/talentika-junior" element={<TalentikaJuniorLanding />} />
            <Route path="/talentika-junior/dashboard" element={user ? <TalentikaJuniorDashboard /> : <Navigate to="/auth" />} />
            <Route path="/talentika-junior/discovery" element={user ? <TalentikaJuniorDiscovery /> : <Navigate to="/auth" />} />
            <Route path="/talentika-junior/learning" element={user ? <TalentikaJuniorLearning /> : <Navigate to="/auth" />} />
            <Route path="/talentika-junior/games" element={user ? <TalentikaJuniorGames /> : <Navigate to="/auth" />} />
            <Route path="/talentika-junior/rewards" element={user ? <TalentikaJuniorRewards /> : <Navigate to="/auth" />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
