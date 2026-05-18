import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState, lazy, Suspense } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { UpgradeModalProvider } from "@/contexts/UpgradeModalContext";

// ── Eager (hit on very first load or needed for error/auth states) ──────────
import Index   from "./pages/Index";
import Auth    from "./pages/Auth";
import NotFound from "./pages/NotFound";

// ── Lazy (loaded only when the user navigates to that route) ────────────────
const Assessment            = lazy(() => import("./pages/Assessment"));
const Dashboard             = lazy(() => import("./pages/Dashboard"));
const Admin                 = lazy(() => import("./pages/Admin"));
const DiscoveryTimeline     = lazy(() => import("./pages/DiscoveryTimeline"));
const LearningHub           = lazy(() => import("./pages/LearningHub"));
const PortfolioBuilder      = lazy(() => import("./pages/PortfolioBuilder"));
const OpportunityBoard      = lazy(() => import("./pages/OpportunityBoard"));
const CommunityForum        = lazy(() => import("./pages/CommunityForum"));
const Onboarding            = lazy(() => import("./pages/Onboarding"));
const DashboardGamified     = lazy(() => import("./pages/DashboardGamified"));
const Subscription          = lazy(() => import("./pages/Subscription"));
const QuizExplore           = lazy(() => import("./pages/QuizExplore"));
const Profile               = lazy(() => import("./pages/Profile"));
const TalentikaJuniorLanding  = lazy(() => import("./pages/TalentikaJuniorLanding"));
const TalentikaJuniorDashboard = lazy(() => import("./pages/TalentikaJuniorDashboard"));
const TalentikaJuniorDiscovery = lazy(() => import("./pages/TalentikaJuniorDiscovery"));
const TalentikaJuniorLearning  = lazy(() => import("./pages/TalentikaJuniorLearning"));
const TalentikaJuniorGames     = lazy(() => import("./pages/TalentikaJuniorGames"));
const TalentikaJuniorRewards   = lazy(() => import("./pages/TalentikaJuniorRewards"));
// MembershipDashboard merged into Profile — kept for lazy import compatibility
const MembershipDashboard   = lazy(() => import("./pages/MembershipDashboard"));
const Settings              = lazy(() => import("./pages/Settings"));
const Articles              = lazy(() => import("./pages/Articles"));
const TalentikaForSchools   = lazy(() => import("./pages/TalentikaForSchools"));
const TentangKami           = lazy(() => import("./pages/TentangKami"));
const TalentikaMitra        = lazy(() => import("./pages/TalentikaMitra"));
const SchoolDashboard       = lazy(() => import("./pages/SchoolDashboard"));

// Named-export components wrapped for lazy()
const ContentDetailView = lazy(() =>
  import("./components/learning/ContentDetailView").then(m => ({ default: m.ContentDetailView }))
);
const CategoryView = lazy(() =>
  import("./components/learning/CategoryView").then(m => ({ default: m.CategoryView }))
);
const ContentEditor = lazy(() =>
  import("./components/admin/ContentEditor").then(m => ({ default: m.ContentEditor }))
);

// Configured with proper stale/gc times to avoid unnecessary refetches
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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

  const RouteFallback = (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
        <p className="text-sm text-muted-foreground">Memuat halaman...</p>
      </div>
    </div>
  );

  return (
    <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <UpgradeModalProvider>
          <ErrorBoundary>
          <Suspense fallback={RouteFallback}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/articles" element={<Articles />} />
            <Route path="/articles/:slug" element={<Articles />} />
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
            <Route path="/settings" element={user ? <Settings /> : <Navigate to="/auth" />} />
            <Route path="/admin" element={user ? <Admin /> : <Navigate to="/auth" />} />
            <Route path="/admin/content/edit/:contentId" element={user ? <ContentEditor /> : <Navigate to="/auth" />} />
            {/* /membership merged into /profile — redirect so old links still work */}
            <Route path="/membership" element={<Navigate to="/profile" replace />} />
            <Route path="/talentika-junior" element={<TalentikaJuniorLanding />} />
            <Route path="/talentika-junior/dashboard" element={user ? <TalentikaJuniorDashboard /> : <Navigate to="/auth" />} />
            <Route path="/talentika-junior/discovery" element={user ? <TalentikaJuniorDiscovery /> : <Navigate to="/auth" />} />
            <Route path="/talentika-junior/learning" element={user ? <TalentikaJuniorLearning /> : <Navigate to="/auth" />} />
            <Route path="/talentika-junior/games" element={user ? <TalentikaJuniorGames /> : <Navigate to="/auth" />} />
            <Route path="/talentika-junior/rewards" element={user ? <TalentikaJuniorRewards /> : <Navigate to="/auth" />} />
            <Route path="/for-schools" element={<TalentikaForSchools />} />
            <Route path="/tentang-kami" element={<TentangKami />} />
            <Route path="/mitra" element={<TalentikaMitra />} />
            <Route path="/school-dashboard" element={user ? <SchoolDashboard /> : <Navigate to="/auth" />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
          </ErrorBoundary>
          </UpgradeModalProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
