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
  Heart
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const CoursesSection = () => {
  const [courses, setCourses] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [categories, setCategories] = useState([]);
  const [personalizedCourses, setPersonalizedCourses] = useState([]);
  const [userInterests, setUserInterests] = useState([]);
  const [assessmentResults, setAssessmentResults] = useState(null);
  const [personalizedChallenges, setPersonalizedChallenges] = useState([]);
  const [personalizedOpportunities, setPersonalizedOpportunities] = useState([]);

  useEffect(() => {
    loadUserData();
    loadCourses();
    loadCategories();
    loadEnrolledCourses();
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

      // Load personalized courses based on interests, assessment and personality type
      let coursesQuery = supabase
        .from('courses')
        .select(`
          *,
          interest_categories(name, icon)
        `);

      // Filter by interest categories if available
      if (interestCategoryIds.length > 0) {
        coursesQuery = coursesQuery.in('category_id', interestCategoryIds);
      } else if (careerRecommendations.length > 0) {
        // Fallback to career recommendations from assessment
        const { data: categoryData } = await supabase
          .from('interest_categories')
          .select('id, name')
          .ilike('name', `%${careerRecommendations.join('%|%')}%`);
        
        if (categoryData && categoryData.length > 0) {
          const categoryIds = categoryData.map(c => c.id);
          coursesQuery = coursesQuery.in('category_id', categoryIds);
        }
      }

      const { data: personalizedCoursesData, error: coursesError } = await coursesQuery
        .eq('is_featured', true)
        .limit(8);

      if (coursesError) throw coursesError;
      setPersonalizedCourses(personalizedCoursesData || []);

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
  const loadCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          interest_categories(name, icon)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error loading courses:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('interest_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadEnrolledCourses = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_progress')
        .select(`
          *,
          courses(
            *,
            interest_categories(name, icon)
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      setEnrolledCourses(data || []);
    } catch (error) {
      console.error('Error loading enrolled courses:', error);
    }
  };

  const filteredCourses = courses.filter((course: any) => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || course.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const startCourse = async (courseId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: user.id,
          course_id: courseId,
          progress_percentage: 0
        });

      if (error) throw error;
      loadEnrolledCourses();
    } catch (error) {
      console.error('Error starting course:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Kursus Pembelajaran</h1>
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input 
              placeholder="Cari kursus..." 
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
          <TabsTrigger value="all-courses">Semua Kursus</TabsTrigger>
          <TabsTrigger value="my-courses">Kursus Saya</TabsTrigger>
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

          {/* Personalized Courses */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Kursus yang Direkomendasikan
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {personalizedCourses.map((course: any) => (
                <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow border-primary/20">
                  <div className="aspect-video bg-gradient-primary relative">
                    <Badge className="absolute top-3 left-3 bg-primary text-primary-foreground">
                      Rekomendasi
                    </Badge>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center text-white">
                        <span className="text-4xl mb-2 block">
                          {course.interest_categories?.icon || '📚'}
                        </span>
                        <Badge variant="secondary" className="bg-white/20 text-white">
                          {course.difficulty_level}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold text-lg line-clamp-2">{course.title}</h4>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {course.description}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{course.duration_hours}h</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span>4.8</span>
                        </div>
                      </div>
                      
                      <Button 
                        className="w-full" 
                        onClick={() => startCourse(course.id)}
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Mulai Kursus
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
                    <div className="flex items-center justify-between text-sm">
                      <span>{challenge.participants} peserta</span>
                      <span className="font-semibold text-orange-600">{challenge.prize}</span>
                    </div>
                    <Button size="sm" className="w-full mt-3">
                      Ikut Tantangan
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Personalized Opportunities */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Briefcase className="w-5 h-5" />
              Peluang Karir untuk Anda
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {personalizedOpportunities.map((opportunity: any) => (
                <Card key={opportunity.id} className="hover:shadow-lg transition-shadow border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <Briefcase className="w-6 h-6 text-blue-500" />
                      <Badge className="bg-blue-100 text-blue-800">Rekomendasi</Badge>
                    </div>
                    <h4 className="font-semibold mb-1">{opportunity.title}</h4>
                    <p className="text-sm text-muted-foreground mb-2">{opportunity.company}</p>
                    <p className="text-xs text-muted-foreground mb-3">{opportunity.reason}</p>
                    <div className="flex items-center justify-between text-sm mb-3">
                      <Badge variant="outline" className="text-xs">
                        {opportunity.type === 'internship' ? 'Magang' : 
                         opportunity.type === 'scholarship' ? 'Beasiswa' : 'Kerja'}
                      </Badge>
                      <span>{opportunity.location}</span>
                    </div>
                    <Button size="sm" className="w-full">
                      Lamar Sekarang
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="all-courses" className="space-y-4">
          {/* Category Filter */}
          <div className="flex space-x-2 overflow-x-auto pb-2">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("all")}
            >
              Semua
            </Button>
            {categories.map((category: any) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="whitespace-nowrap"
              >
                {category.icon} {category.name}
              </Button>
            ))}
          </div>

          {/* Courses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course: any) => (
              <Card key={course.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-gradient-primary relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white">
                      <span className="text-4xl mb-2 block">
                        {course.interest_categories?.icon || '📚'}
                      </span>
                      <Badge variant="secondary" className="bg-white/20 text-white">
                        {course.difficulty_level}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg line-clamp-2">{course.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {course.description}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{course.duration_hours}h</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        <span>120 siswa</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span>4.8</span>
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full" 
                      onClick={() => startCourse(course.id)}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Mulai Kursus
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="my-courses" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrolledCourses.map((enrollment: any) => (
              <Card key={enrollment.id} className="overflow-hidden">
                <div className="aspect-video bg-gradient-primary relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white">
                      <span className="text-4xl mb-2 block">
                        {enrollment.courses?.interest_categories?.icon || '📚'}
                      </span>
                      <Badge variant="secondary" className="bg-white/20 text-white">
                        {enrollment.progress_percentage}% Selesai
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg line-clamp-2">
                        {enrollment.courses?.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {enrollment.courses?.description}
                      </p>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Progress</span>
                        <span>{enrollment.progress_percentage}%</span>
                      </div>
                      <Progress value={enrollment.progress_percentage} className="h-2" />
                    </div>
                    
                    <Button className="w-full">
                      <Play className="w-4 h-4 mr-2" />
                      Lanjutkan Belajar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {enrolledCourses
              .filter((enrollment: any) => enrollment.progress_percentage === 100)
              .map((enrollment: any) => (
                <Card key={enrollment.id} className="overflow-hidden border-green-200">
                  <div className="aspect-video bg-gradient-to-br from-green-500 to-green-600 relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center text-white">
                        <span className="text-4xl mb-2 block">🏆</span>
                        <Badge variant="secondary" className="bg-white/20 text-white">
                          Selesai
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-semibold text-lg line-clamp-2">
                          {enrollment.courses?.title}
                        </h3>
                        <p className="text-sm text-green-600">
                          ✅ Kursus selesai pada {new Date(enrollment.completed_at).toLocaleDateString()}
                        </p>
                      </div>
                      
                      <Button variant="outline" className="w-full">
                        <BookOpen className="w-4 h-4 mr-2" />
                        Lihat Sertifikat
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};