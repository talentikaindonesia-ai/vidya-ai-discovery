import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Clock, Star, Users, ArrowRight, Lock } from "lucide-react";
import { FreeLimitReached, LockedContent } from "./dashboard/LockedContent";
import { UpgradePrompt } from "./dashboard/UpgradePrompt";
import { useNavigate } from "react-router-dom";

interface CoursesPreviewProps {
  profile?: any;
}

const CoursesPreview = ({ profile }: CoursesPreviewProps) => {
  const navigate = useNavigate();
  const isFreeUser = profile?.subscription_type === 'free';
  const maxCoursesForFree = 3;
  const viewedCourses = 0; // This would come from actual user data
  const recommendedCourses = [
    {
      id: 1,
      title: "Dasar-dasar Programming",
      description: "Pelajari konsep fundamental programming dengan Python",
      duration: "4 minggu",
      level: "Pemula",
      rating: 4.8,
      students: 2456,
      image: "/lovable-uploads/029928be-11a9-49ba-9a70-7dd69aff1316.png"
    },
    {
      id: 2,
      title: "UI/UX Design Fundamentals",
      description: "Menguasai prinsip dasar desain antarmuka pengguna",
      duration: "6 minggu",
      level: "Pemula",
      rating: 4.7,
      students: 1823,
      image: "/lovable-uploads/95b023ea-1670-4b3c-bf9d-caf7b5c2cef1.png"
    },
    {
      id: 3,
      title: "Digital Marketing Strategy",
      description: "Strategi pemasaran digital untuk era modern",
      duration: "5 minggu",
      level: "Menengah",
      rating: 4.9,
      students: 3241,
      image: "/lovable-uploads/9e67a8cf-6f81-4abc-898b-bc665dee2b57.png"
    }
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container px-4">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <BookOpen className="w-8 h-8 text-primary" />
            <h2 className="text-3xl md:text-4xl font-bold">
              Kursus Direkomendasikan
            </h2>
          </div>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Kursus pilihan yang disesuaikan dengan minat dan tujuan kariermu
          </p>
        </div>

        {/* Free User Limit Reached */}
        {isFreeUser && viewedCourses >= maxCoursesForFree && (
          <FreeLimitReached 
            type="courses"
            current={viewedCourses}
            limit={maxCoursesForFree}
            className="mb-6"
          />
        )}

        {/* Desktop Grid */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {/* Show limited courses for free users */}
          {recommendedCourses.slice(0, isFreeUser && viewedCourses >= maxCoursesForFree ? 0 : (isFreeUser ? maxCoursesForFree : recommendedCourses.length)).map((course, index) => {
            const isBlurred = isFreeUser && index >= 1; // First course free, rest blurred
            return (
            <Card key={course.id} className="group hover:shadow-card transition-all duration-300 hover:-translate-y-1 bg-card border-primary/10 relative overflow-hidden">
              <div className="relative overflow-hidden rounded-t-lg">
                <img 
                  src={course.image} 
                  alt={course.title}
                  className={`w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300 ${isBlurred ? 'blur-sm' : ''}`}
                />
                <div className="absolute top-3 right-3 bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs font-medium">
                  {course.level}
                </div>
                {isFreeUser && !isBlurred && (
                  <div className="absolute top-3 left-3 bg-green-600 text-white px-2 py-1 rounded-full text-xs font-medium">
                    Free
                  </div>
                )}
              </div>
              <CardHeader className={`pb-3 ${isBlurred ? 'blur-sm' : ''}`}>
                <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2">
                  {course.title}
                </CardTitle>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {course.description}
                </p>
              </CardHeader>
              <CardContent className={`pt-0 ${isBlurred ? 'blur-sm' : ''}`}>
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{course.duration}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span>{course.rating}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="w-3 h-3" />
                    <span>{course.students.toLocaleString()} siswa</span>
                  </div>
                  <Button variant="outline" size="sm" className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    Lihat Detail
                  </Button>
                </div>
              </CardContent>
              
              {/* Lock overlay for blurred content */}
              {isBlurred && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                  <div className="text-center p-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Lock className="w-6 h-6 text-primary" />
                    </div>
                    <p className="font-medium text-foreground mb-2">Konten Premium</p>
                    <p className="text-sm text-muted-foreground mb-3">Upgrade untuk mengakses</p>
                    <Button size="sm" onClick={() => navigate('/subscription')}>
                      Buka Kunci
                    </Button>
                  </div>
                </div>
              )}
            </Card>
            );
          })}

          {/* Show locked courses for free users */}
          {isFreeUser && (
            <LockedContent
              type="courses"
              title="Kursus Premium"
              description="Akses unlimited ke ribuan kursus berkualitas tinggi"
              features={[
                "Video pembelajaran HD",
                "Sertifikat resmi",
                "Project-based learning",
                "Mentoring 1-on-1"
              ]}
            />
          )}
        </div>

        {/* Mobile Carousel */}
        <div className="md:hidden">
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory px-4 -mx-4 mb-8">
            {recommendedCourses.map((course) => (
              <Card key={course.id} className="min-w-[280px] w-[280px] flex-shrink-0 snap-start group hover:shadow-card transition-all duration-300 bg-card border-primary/10">
                <div className="relative overflow-hidden rounded-t-lg">
                  <img 
                    src={course.image} 
                    alt={course.title}
                    className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 right-2 bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs font-medium">
                    {course.level}
                  </div>
                </div>
                <CardHeader className="pb-2 pt-3">
                  <CardTitle className="text-base group-hover:text-primary transition-colors line-clamp-2">
                    {course.title}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {course.description}
                  </p>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{course.duration}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <span>{course.rating}</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    Lihat Detail
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground mb-8">← Geser untuk melihat kursus lainnya →</p>
        </div>

        <div className="text-center">
          <Button 
            size="lg" 
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium shadow-lg hover:shadow-xl transition-all duration-300 group"
            onClick={() => window.location.href = '/learning'}
          >
            <BookOpen className="w-5 h-5 mr-2" />
            Jelajahi Semua Kursus
            <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default CoursesPreview;