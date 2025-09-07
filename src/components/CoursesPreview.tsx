import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Clock, Star, Users, ArrowRight } from "lucide-react";

const CoursesPreview = () => {
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

        {/* Desktop Grid */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {recommendedCourses.map((course) => (
            <Card key={course.id} className="group hover:shadow-card transition-all duration-300 hover:-translate-y-1 bg-card border-primary/10">
              <div className="relative overflow-hidden rounded-t-lg">
                <img 
                  src={course.image} 
                  alt={course.title}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 right-3 bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs font-medium">
                  {course.level}
                </div>
              </div>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2">
                  {course.title}
                </CardTitle>
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {course.description}
                </p>
              </CardHeader>
              <CardContent className="pt-0">
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
            </Card>
          ))}
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
            onClick={() => window.location.href = '/learning-hub'}
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