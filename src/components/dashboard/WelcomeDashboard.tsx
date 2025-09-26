import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock, Target, TrendingUp, Play, Star, Calendar, Award, Trophy, Briefcase, Crown, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { AssessmentResultsCard } from "./AssessmentResultsCard";
import { UpgradePrompt } from "./UpgradePrompt";

interface WelcomeDashboardProps {
  user: User | null;
  profile: any;
}
export const WelcomeDashboard = ({
  user,
  profile
}: WelcomeDashboardProps) => {
  const [stats, setStats] = useState({
    coursesEnrolled: 0,
    coursesCompleted: 0,
    totalLearningTime: 0,
    achievements: 0
  });
  const [recentCourses, setRecentCourses] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [userInterests, setUserInterests] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [assessmentResults, setAssessmentResults] = useState(null);
  useEffect(() => {
    if (user?.id) {
      loadDashboardData();
    }
  }, [user?.id]);
  const loadDashboardData = async () => {
    try {
      // Load user progress stats
      const {
        data: progressData
      } = await supabase.from('user_progress').select('*').eq('user_id', user?.id);

      // Load achievements
      const {
        data: achievementsData
      } = await supabase.from('achievements').select('*').eq('user_id', user?.id);

      // Load user interests
      const {
        data: interestsData
      } = await supabase.from('user_interests').select('*, interest_categories(*)').eq('user_id', user?.id);

      // Load personalized course recommendations based on interests
      const categoryIds = interestsData?.map(i => i.category_id) || [];
      const {
        data: coursesData
      } = await supabase.from('courses').select('*, interest_categories(*)').in('category_id', categoryIds.length > 0 ? categoryIds : []).limit(6);

      // Mock challenges (would come from challenges table)
      const mockChallenges = [{
        id: '1',
        title: 'Data Science Challenge',
        description: 'Analisis dataset e-commerce',
        deadline: '2024-12-31',
        participants: 156,
        prize: 'Rp 5,000,000'
      }, {
        id: '2',
        title: 'UI/UX Design Contest',
        description: 'Redesign aplikasi mobile',
        deadline: '2024-12-25',
        participants: 89,
        prize: 'Rp 3,000,000'
      }];

      // Mock opportunities (would come from opportunities table)
      const mockOpportunities = [{
        id: '1',
        title: 'Internship at Tech Startup',
        company: 'InnovateTech',
        type: 'Internship',
        location: 'Jakarta',
        deadline: '2024-12-20'
      }, {
        id: '2',
        title: 'LPDP Scholarship 2025',
        company: 'LPDP',
        type: 'Scholarship',
        location: 'Global',
        deadline: '2024-12-15'
      }];

      // Load assessment results
      const {
        data: assessmentData
      } = await supabase.from('assessment_results').select('*').eq('user_id', user?.id).order('created_at', {
        ascending: false
      }).limit(1).single();
      setStats({
        coursesEnrolled: progressData?.length || 0,
        coursesCompleted: progressData?.filter(p => p.progress_percentage === 100).length || 0,
        totalLearningTime: progressData?.reduce((total, p) => total + (p.time_spent_minutes || 0), 0) || 0,
        achievements: achievementsData?.length || 0
      });
      setUserInterests(interestsData || []);
      setRecommendations(coursesData || []);
      setChallenges(mockChallenges);
      setOpportunities(mockOpportunities);
      setAssessmentResults(assessmentData || null);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Selamat Pagi';
    if (hour < 17) return 'Selamat Siang';
    return 'Selamat Malam';
  };
  const displayName = profile?.full_name || user?.email?.split('@')[0] || 'Pembelajar';
  const isFreeUser = profile?.subscription_type === 'free';
  const isPremiumUser = profile?.subscription_type === 'premium_individual' || profile?.subscription_type === 'individual';

  return <div className="space-y-4">
      {/* Greeting Section - Mobile First */}
      <div className={`rounded-2xl p-4 text-white relative overflow-hidden mx-2 sm:mx-0 ${
        isFreeUser ? 'bg-gradient-to-r from-slate-600 to-slate-700' : 'bg-gradient-primary'
      }`}>
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg sm:text-xl font-bold mb-1">
                {getGreeting()}, {displayName}! 👋
              </h1>
              <p className="text-white/90 text-sm leading-relaxed">
                {isFreeUser 
                  ? 'Selamat datang di Talentika Free! Upgrade untuk akses penuh'
                  : 'Mari lanjutkan perjalanan pembelajaran Anda hari ini'
                }
              </p>
            </div>
            {isFreeUser && (
              <div className="flex items-center gap-1 bg-white/20 px-2 py-1 rounded-full">
                <Lock className="w-3 h-3" />
                <span className="text-xs font-medium">FREE</span>
              </div>
            )}
          </div>
          {userInterests.length > 0 && <div className="flex flex-wrap gap-1 mt-3">
              {userInterests.slice(0, 3).map(interest => <Badge key={interest.id} className="text-xs bg-white/20 text-white border-white/30">
                  {interest.interest_categories?.name}
                </Badge>)}
            </div>}
        </div>
      </div>

      {/* Free User Upgrade Prompt */}
      {isFreeUser && (
        <UpgradePrompt
          title="Unlock Premium Learning"
          description="Dapatkan akses unlimited ke semua kursus, mentoring, dan peluang karier premium"
          feature="Unlimited akses • Mentoring 1-on-1 • Sertifikat resmi • Priority support"
          className="mx-2 sm:mx-0"
        />
      )}

      {/* Assessment Results */}
      <AssessmentResultsCard assessmentResults={assessmentResults} />

      {/* Limited Progress Stats for Free Users */}
      {isFreeUser && (
        <Card className="mx-2 sm:mx-0 border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardHeader>
            <CardTitle className="text-amber-900 dark:text-amber-100 flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Progress Terbatas (Free Plan)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">3</div>
                <div className="text-xs text-amber-600 dark:text-amber-400">Kursus Tersisa</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-amber-700 dark:text-amber-300">5</div>
                <div className="text-xs text-amber-600 dark:text-amber-400">Peluang Tersisa</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

    </div>;
};