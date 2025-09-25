import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, 
  Clock, 
  Play, 
  Search,
  Filter,
  Star,
  Users,
  Target,
  Trophy,
  Briefcase,
  Heart,
  Video,
  FileText,
  Headphones
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const CoursesSection = () => {
  const [learningContent, setLearningContent] = useState([]);
  const [enrolledContent, setEnrolledContent] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [categories, setCategories] = useState([]);
  const [personalizedContent, setPersonalizedContent] = useState([]);
  const [userInterests, setUserInterests] = useState([]);
  const [assessmentResults, setAssessmentResults] = useState(null);
  const [personalizedChallenges, setPersonalizedChallenges] = useState([]);
  const [personalizedOpportunities, setPersonalizedOpportunities] = useState([]);

  useEffect(() => {
    loadUserData();
    loadLearningContent();
    loadCategories();
    loadEnrolledContent();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load user interests
      const { data: interests, error: interestsError } = await supabase
        .from('user_interests')
        .select(`
          *,
          interest_categories(*)
        `)
        .eq('user_id', user.id);

      if (interestsError) throw interestsError;
      setUserInterests(interests || []);

      // Load latest assessment results
      const { data: assessment, error: assessmentError } = await supabase
        .from('assessment_results')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (assessment) {
        setAssessmentResults(assessment);
      }

      // Load personalized content after getting user data
      await loadPersonalizedContent(interests, assessment);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const loadPersonalizedContent = async (interests: any[], assessment: any) => {
    try {
      // Get user's interest category IDs
      const interestCategoryIds = interests?.map(i => i.category_id) || [];
      const talentAreas = assessment?.talent_areas || [];
      const personalityType = assessment?.personality_type;
      const careerRecommendations = assessment?.career_recommendations || [];

      // Load personalized learning content based on interests, assessment and personality type
      let contentQuery = supabase
        .from('learning_content')
        .select(`
          *,
          learning_categories(name, icon, color)
        `);

      // Filter by interest categories if available
      if (interestCategoryIds.length > 0) {
        contentQuery = contentQuery.in('category_id', interestCategoryIds);
      } else if (careerRecommendations.length > 0) {
        // Fallback to career recommendations from assessment
        const { data: categoryData } = await supabase
          .from('learning_categories')
          .select('id, name')
          .ilike('name', `%${careerRecommendations.join('%|%')}%`);
        
        if (categoryData && categoryData.length > 0) {
          const categoryIds = categoryData.map(c => c.id);
          contentQuery = contentQuery.in('category_id', categoryIds);
        }
      }

      const { data: personalizedContentData, error: contentError } = await contentQuery
        .eq('is_featured', true)
        .eq('is_active', true)
        .limit(8);

      if (contentError) throw contentError;
      setPersonalizedContent(personalizedContentData || []);

      // Load personalized challenges based on user profile
      loadPersonalizedChallenges(interests, talentAreas, personalityType);
      
      // Load personalized opportunities based on user profile  
      loadPersonalizedOpportunities(interests, talentAreas, personalityType, careerRecommendations);
    } catch (error) {
      console.error('Error loading personalized content:', error);
    }
  };

  const loadPersonalizedChallenges = (interests: any[], talentAreas: string[], personalityType?: string) => {
    // Personalized challenges based on RIASEC personality type and interests
    const riasecChallenges = {
      realistic: [
        { title: 'Engineering Design Challenge', category: 'Teknik', reason: 'Sesuai dengan kepribadian Realistic Anda' },
        { title: 'Robotics Competition', category: 'Teknologi', reason: 'Cocok untuk yang suka hands-on projects' }
      ],
      investigative: [
        { title: 'Data Science Challenge', category: 'Data Science', reason: 'Sesuai dengan kepribadian Investigative Anda' },
        { title: 'Research Innovation Contest', category: 'Penelitian', reason: 'Cocok untuk analytical thinking' }
      ],
      artistic: [
        { title: 'UI/UX Design Sprint', category: 'Design', reason: 'Sesuai dengan kepribadian Artistic Anda' },
        { title: 'Creative Content Challenge', category: 'Media', reason: 'Cocok untuk creative expression' }
      ],
      social: [
        { title: 'Community Impact Challenge', category: 'Sosial', reason: 'Sesuai dengan kepribadian Social Anda' },
        { title: 'Education Innovation Contest', category: 'Pendidikan', reason: 'Cocok untuk helping others' }
      ],
      enterprising: [
        { title: 'Startup Pitch Competition', category: 'Bisnis', reason: 'Sesuai dengan kepribadian Enterprising Anda' },
        { title: 'Marketing Strategy Challenge', category: 'Marketing', reason: 'Cocok untuk leadership skills' }
      ],
      conventional: [
        { title: 'Financial Analysis Challenge', category: 'Keuangan', reason: 'Sesuai dengan kepribadian Conventional Anda' },
        { title: 'Operations Optimization Contest', category: 'Administrasi', reason: 'Cocok untuk systematic thinking' }
      ]
    };

    const personalizedChallenges = personalityType && riasecChallenges[personalityType as keyof typeof riasecChallenges] 
      ? riasecChallenges[personalityType as keyof typeof riasecChallenges]
      : riasecChallenges.investigative; // default

    const challenges = personalizedChallenges.map((challenge, index) => ({
      id: (index + 1).toString(),
      ...challenge,
      deadline: '2024-12-31',
      participants: 45 + index * 10,
      prize: `Rp ${(5 - index)},000,000`,
      isPersonalized: true
    }));

    setPersonalizedChallenges(challenges);
  };

  const loadPersonalizedOpportunities = (interests: any[], talentAreas: string[], personalityType?: string, careerRecommendations?: string[]) => {
    // Personalized opportunities based on RIASEC personality type and career recommendations
    const riasecOpportunities = {
      realistic: [
        { title: 'Engineering Intern - Manufacturing', company: 'TechCorp', type: 'internship', field: 'Teknik' },
        { title: 'Civil Engineering Scholarship', company: 'Infrastructure Fund', type: 'scholarship', field: 'Konstruksi' }
      ],
      investigative: [
        { title: 'Data Analyst Intern - Tech Startup', company: 'DataCorp', type: 'internship', field: 'Data Science' },
        { title: 'Research Assistant Position', company: 'National Research Lab', type: 'job', field: 'Penelitian' }
      ],
      artistic: [
        { title: 'UI/UX Designer Intern', company: 'Creative Studio', type: 'internship', field: 'Design' },
        { title: 'Graphic Design Competition', company: 'Art Foundation', type: 'competition', field: 'Seni' }
      ],
      social: [
        { title: 'Education Program Coordinator', company: 'NGO Foundation', type: 'job', field: 'Pendidikan' },
        { title: 'Community Development Intern', company: 'Social Impact Org', type: 'internship', field: 'Sosial' }
      ],
      enterprising: [
        { title: 'Business Development Intern', company: 'Growth Corp', type: 'internship', field: 'Bisnis' },
        { title: 'Startup Accelerator Program', company: 'Venture Capital', type: 'competition', field: 'Kewirausahaan' }
      ],
      conventional: [
        { title: 'Financial Analyst Intern', company: 'Finance Corp', type: 'internship', field: 'Keuangan' },
        { title: 'Administrative Excellence Award', company: 'Government Org', type: 'scholarship', field: 'Administrasi' }
      ]
    };

    const personalizedOpps = personalityType && riasecOpportunities[personalityType as keyof typeof riasecOpportunities] 
      ? riasecOpportunities[personalityType as keyof typeof riasecOpportunities]
      : riasecOpportunities.investigative; // default

    const opportunities = personalizedOpps.map((opp, index) => ({
      id: (index + 1).toString(),
      ...opp,
      location: ['Jakarta', 'Bandung', 'Surabaya'][index % 3],
      deadline: '2024-12-30',
      isPersonalized: true,
      reason: `Sesuai dengan kepribadian ${personalityType} dan minat di bidang ${opp.field}`
    }));

    setPersonalizedOpportunities(opportunities);
  };

  const loadLearningContent = async () => {
    try {
      const { data, error } = await supabase
        .from('learning_content')
        .select(`
          *,
          learning_categories(name, icon, color)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLearningContent(data || []);
    } catch (error) {
      console.error('Error loading learning content:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('learning_categories')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadEnrolledContent = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('learning_progress')
        .select(`
          *,
          learning_content(
            *,
            learning_categories(name, icon, color)
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      setEnrolledContent(data || []);
    } catch (error) {
      console.error('Error loading enrolled content:', error);
    }
  };

  const filteredContent = learningContent.filter((content: any) => {
    const matchesSearch = content.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         content.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || content.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const startLearning = async (contentId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('learning_progress')
        .upsert({
          user_id: user.id,
          content_id: contentId,
          progress_percentage: 0,
          status: 'in_progress'
        });

      if (error) throw error;
      loadEnrolledContent();
    } catch (error) {
      console.error('Error starting learning:', error);
    }
  };

  const getContentIcon = (contentType: string) => {
    switch (contentType) {
      case 'video': return Video;
      case 'article': return FileText;
      case 'audio': case 'podcast': return Headphones;
      case 'course': return BookOpen;
      default: return BookOpen;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Konten Pembelajaran</h1>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input 
              placeholder="Cari konten..." 
              className="pl-10 w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="personalized" className="w-full">
        <TabsList>
          <TabsTrigger value="personalized">Rekomendasi Personal</TabsTrigger>
          <TabsTrigger value="all-courses">Semua Konten</TabsTrigger>
          <TabsTrigger value="my-courses">Konten Saya</TabsTrigger>
          <TabsTrigger value="completed">Selesai</TabsTrigger>
        </TabsList>

        <TabsContent value="personalized" className="space-y-6">
          {/* Personalized Header */}
          <Card className="bg-gradient-subtle border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-4">
                <Target className="w-6 h-6 text-primary" />
                <h2 className="text-xl font-semibold">Rekomendasi Personal Anda</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Berdasarkan hasil assessment dan minat Anda: {userInterests.map(i => i.interest_categories?.name).join(', ')}
              </p>
              {assessmentResults && (
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-xs">
                    <Heart className="w-3 h-3 mr-1" />
                    Tipe: {assessmentResults.personality_type}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Gaya Belajar: {assessmentResults.learning_style}
                  </Badge>
                  {assessmentResults.talent_areas?.map((talent: string, idx: number) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {talent}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Personalized Content */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Konten yang Direkomendasikan
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {personalizedContent.map((content: any) => (
                <Card key={content.id} className="overflow-hidden hover:shadow-lg transition-shadow border-primary/20">
                  <div className="aspect-video bg-gradient-primary relative">
                    <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground">
                      Rekomendasi
                    </Badge>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center text-white">
                        <span className="text-4xl mb-2 block">
                          {content.learning_categories?.icon || '📚'}
                        </span>
                        <Badge variant="secondary" className="bg-white/20 text-white">
                          {content.difficulty_level}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold text-lg line-clamp-2">{content.title}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {content.description}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{Math.round(content.duration_minutes / 60)}h {content.duration_minutes % 60}m</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span>4.8</span>
                        </div>
                      </div>
                      
                      <Button 
                        className="w-full" 
                        onClick={() => startLearning(content.id)}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Mulai Belajar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Personalized Challenges */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Tantangan untuk Anda
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {personalizedChallenges.map((challenge: any) => (
                <Card key={challenge.id} className="hover:shadow-lg transition-shadow border-orange-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <Trophy className="w-6 h-6 text-orange-500" />
                      <Badge className="bg-orange-100 text-orange-800">Rekomendasi</Badge>
                    </div>
                    <h4 className="font-semibold mb-2">{challenge.title}</h4>
                    <p className="text-xs text-muted-foreground mb-3">{challenge.reason}</p>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{challenge.participants} peserta</span>
                      <span className="font-semibold text-orange-600">{challenge.prize}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Personalized Opportunities */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Peluang untuk Anda
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {personalizedOpportunities.map((opportunity: any) => (
                <Card key={opportunity.id} className="hover:shadow-lg transition-shadow border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <Briefcase className="w-6 h-6 text-blue-500" />
                      <Badge className="bg-blue-100 text-blue-800">
                        {opportunity.type === 'job' ? 'Pekerjaan' : 
                         opportunity.type === 'internship' ? 'Magang' : 
                         opportunity.type === 'scholarship' ? 'Beasiswa' : 'Kompetisi'}
                      </Badge>
                    </div>
                    <h4 className="font-semibold mb-1">{opportunity.title}</h4>
                    <p className="text-sm text-muted-foreground mb-2">{opportunity.company}</p>
                    <p className="text-xs text-muted-foreground mb-3">{opportunity.reason}</p>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{opportunity.location}</span>
                      <span>{opportunity.field}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="all-courses" className="space-y-4">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge 
              variant={selectedCategory === "all" ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedCategory("all")}
            >
              Semua
            </Badge>
            {categories.map((category: any) => (
              <Badge 
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name}
              </Badge>
            ))}
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredContent.map((content: any) => {
              const ContentIcon = getContentIcon(content.content_type);
              
              return (
                <Card key={content.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-video bg-muted relative flex items-center justify-center">
                    <ContentIcon className="w-12 h-12 text-muted-foreground" />
                    <div className="absolute top-3 left-3">
                      <Badge variant="secondary">
                        {content.content_type}
                      </Badge>
                    </div>
                    <div className="absolute top-3 right-3">
                      <Badge variant="outline">
                        {content.difficulty_level}
                      </Badge>
                    </div>
                  </div>
                  
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold line-clamp-2">{content.title}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {content.description}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{content.duration_minutes}m</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{content.total_enrollments || 0}</span>
                        </div>
                      </div>
                      
                      <Button 
                        className="w-full" 
                        onClick={() => startLearning(content.id)}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Mulai Belajar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="my-courses" className="space-y-4">
          <div className="grid gap-4">
            {enrolledContent.map((enrollment: any) => (
              <Card key={enrollment.id} className="overflow-hidden">
                <div className="flex">
                  <div className="w-24 h-24 bg-muted flex items-center justify-center">
                    <span className="text-2xl">
                      {enrollment.learning_content?.learning_categories?.icon || '📚'}
                    </span>
                  </div>
                  <div className="flex-1 p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold">
                          {enrollment.learning_content?.title}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {enrollment.learning_content?.description}
                        </p>
                      </div>
                      <Badge variant="outline">
                        {enrollment.status || 'in_progress'}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progress</span>
                        <span>{enrollment.progress_percentage}%</span>
                      </div>
                      <Progress value={enrollment.progress_percentage} className="h-2" />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <div className="grid gap-4">
            {enrolledContent
              .filter((enrollment: any) => enrollment.status === 'completed')
              .map((enrollment: any) => (
              <Card key={enrollment.id} className="overflow-hidden">
                <div className="flex">
                  <div className="w-24 h-24 bg-muted flex items-center justify-center">
                    <span className="text-2xl">
                      {enrollment.learning_content?.learning_categories?.icon || '📚'}
                    </span>
                  </div>
                  <div className="flex-1 p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-semibold">
                          {enrollment.learning_content?.title}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Diselesaikan pada {new Date(enrollment.completed_at).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-100 text-green-800">
                          Selesai
                        </Badge>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm">{enrollment.rating || 'Belum dinilai'}</span>
                        </div>
                      </div>
                    </div>
                    <Progress value={100} className="h-2" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};