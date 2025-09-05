import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  Clock, 
  Target, 
  TrendingUp, 
  Play,
  Star,
  Calendar,
  Award,
  Trophy,
  Briefcase
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { AssessmentResultsCard } from "./AssessmentResultsCard";

interface WelcomeDashboardProps {
  user: User | null;
  profile: any;
}

export const WelcomeDashboard = ({ user, profile }: WelcomeDashboardProps) => {
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
      const { data: progressData } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user?.id);

      // Load achievements
      const { data: achievementsData } = await supabase
        .from('achievements')
        .select('*')
        .eq('user_id', user?.id);

      // Load user interests
      const { data: interestsData } = await supabase
        .from('user_interests')
        .select('*, interest_categories(*)')
        .eq('user_id', user?.id);

      // Load personalized course recommendations based on interests
      const categoryIds = interestsData?.map(i => i.category_id) || [];
      const { data: coursesData } = await supabase
        .from('courses')
        .select('*, interest_categories(*)')
        .in('category_id', categoryIds.length > 0 ? categoryIds : [])
        .limit(6);

      // Mock challenges (would come from challenges table)
      const mockChallenges = [
        {
          id: '1',
          title: 'Data Science Challenge',
          description: 'Analisis dataset e-commerce',
          deadline: '2024-12-31',
          participants: 156,
          prize: 'Rp 5,000,000'
        },
        {
          id: '2', 
          title: 'UI/UX Design Contest',
          description: 'Redesign aplikasi mobile',
          deadline: '2024-12-25',
          participants: 89,
          prize: 'Rp 3,000,000'
        }
      ];

      // Mock opportunities (would come from opportunities table)
      const mockOpportunities = [
        {
          id: '1',
          title: 'Internship at Tech Startup',
          company: 'InnovateTech',
          type: 'Internship',
          location: 'Jakarta',
          deadline: '2024-12-20'
        },
        {
          id: '2',
          title: 'LPDP Scholarship 2025',
          company: 'LPDP',
          type: 'Scholarship',
          location: 'Global',
          deadline: '2024-12-15'
        }
      ];

      // Load assessment results
      const { data: assessmentData } = await supabase
        .from('assessment_results')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

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

  return (
    <div className="space-y-4">
      {/* Greeting Section - Mobile First */}
      <div className="bg-gradient-primary rounded-2xl p-4 text-white relative overflow-hidden mx-2 sm:mx-0">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative z-10">
          <h1 className="text-lg sm:text-xl font-bold mb-1">
            {getGreeting()}, {displayName}! 👋
          </h1>
          <p className="text-white/90 text-sm leading-relaxed">
            Mari lanjutkan perjalanan pembelajaran Anda hari ini
          </p>
          {userInterests.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {userInterests.slice(0, 3).map((interest) => (
                <Badge key={interest.id} className="text-xs bg-white/20 text-white border-white/30">
                  {interest.interest_categories?.name}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Assessment Results */}
      <AssessmentResultsCard assessmentResults={assessmentResults} />

      {/* Course Recommendations Section */}
      <div className="bg-white rounded-2xl border mx-2 sm:mx-0">
        <div className="p-4 pb-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              Kursus Direkomendasikan
            </h2>
          </div>
          
          {/* Course Grid - Mobile Optimized */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {recommendations.slice(0, 4).map((course: any, index: number) => (
              <div key={course.id} className={`
                ${index === 0 ? 'col-span-2' : 'col-span-1'} 
                bg-blue-600 rounded-xl p-3 text-white min-h-[100px] flex flex-col justify-center items-center
              `}>
                <BookOpen className="w-6 h-6 mb-2" />
                <h3 className="font-medium text-sm text-center line-clamp-2">
                  {course.title || `Kursus ${index + 1}`}
                </h3>
              </div>
            ))}
          </div>
          
          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white mb-2"
            onClick={() => window.location.href = '/learning'}
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Jelajahi Semua Kursus
          </Button>
        </div>
      </div>

      {/* Opportunities Section */}
      <div className="bg-white rounded-2xl border mx-2 sm:mx-0">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-orange-600" />
              Opportunity for you
            </h2>
          </div>
          
          {/* Category Filter Buttons */}
          <div className="flex gap-2 mb-4 flex-wrap">
            <Button 
              size="sm" 
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-4"
            >
              Semua
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="rounded-full px-3 text-sm"
            >
              Beasiswa <span className="ml-1 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">3</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="rounded-full px-3 text-sm"
            >
              Kompetisi <span className="ml-1 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">3</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="rounded-full px-3 text-sm"
            >
              Magang <span className="ml-1 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">2</span>
            </Button>
          </div>

          {/* Opportunity Placeholder Cards */}
          <div className="space-y-3 mb-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div 
                key={index} 
                className="w-full h-20 bg-gray-100 rounded-xl flex items-center justify-center"
              >
                <div className="text-gray-400 text-sm">Opportunity {index + 1}</div>
              </div>
            ))}
          </div>
          
          <Button 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => window.location.href = '/opportunities'}
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Explore Opportunity for you
          </Button>
        </div>
      </div>
    </div>
  );
};