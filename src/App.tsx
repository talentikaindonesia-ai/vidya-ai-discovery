import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
import { ContentViewer } from "./components/dashboard/ContentViewer";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/assessment" element={<Assessment />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/discovery" element={<DiscoveryTimeline />} />
          <Route path="/learning" element={<LearningHub />} />
          <Route path="/learning/content/:contentId" element={<ContentViewer />} />
          <Route path="/portfolio" element={<PortfolioBuilder />} />
          <Route path="/opportunities" element={<OpportunityBoard />} />
          <Route path="/community" element={<CommunityForum />} />
          <Route path="/dashboard-gamified" element={<DashboardGamified />} />
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/admin" element={<Admin />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
