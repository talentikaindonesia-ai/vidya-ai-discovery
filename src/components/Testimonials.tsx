import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Quote, GraduationCap } from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const Testimonials = () => {
  const testimonials = [
    {
      name: "Sari Wijaya",
      role: "Mahasiswa Teknik Informatika",
      university: "Institut Teknologi Bandung",
      image: "https://images.unsplash.com/photo-1494790108755-2616c4e234d4?w=100&h=100&fit=crop&crop=face",
      content: "Talentika benar-benar membantu saya menemukan passion di bidang teknologi. Sekarang saya lebih percaya diri dengan pilihan jurusan kuliah saya dan punya roadmap yang jelas untuk karir.",
      rating: 5,
      badge: "Teknologi"
    },
    {
      name: "Ahmad Rizki",
      role: "Siswa SMA Kelas 12",
      university: "SMAN 1 Jakarta",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
      content: "Tes minat bakat di Talentika sangat akurat! Saya awalnya bingung mau kuliah dimana, tapi setelah menggunakan Talentika, saya yakin memilih jurusan Psikologi.",
      rating: 5,
      badge: "Psikologi"
    },
    {
      name: "Maya Sari",
      role: "Fresh Graduate",
      university: "Universitas Indonesia",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face",
      content: "Platform yang luar biasa! Rekomendasi kursus dan pelatihan yang diberikan sangat sesuai dengan minat saya. Sekarang saya sudah diterima kerja di perusahaan impian.",
      rating: 5,
      badge: "Bisnis"
    },
    {
      name: "Dr. Bambang Sutrisno",
      role: "Kepala Sekolah",
      university: "SMA Negeri 5 Surabaya",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
      content: "Talentika School Package sangat membantu kami dalam memberikan bimbingan karir yang tepat untuk siswa. Data analytics yang disediakan memberikan insight berharga.",
      rating: 5,
      badge: "Pendidikan"
    },
    {
      name: "Rina Puspitasari",
      role: "Mahasiswa Desain Grafis",
      university: "Institut Seni Budaya Indonesia",
      image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face",
      content: "Fitur portfolio builder di Talentika membantu saya menyusun karya-karya terbaik. Komunitas kreatifnya juga sangat supportive dan inspiring!",
      rating: 5,
      badge: "Seni & Desain"
    },
    {
      name: "Fajar Nugraha",
      role: "Siswa SMK Jurusan Otomotif",
      university: "SMK Negeri 2 Yogyakarta",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face",
      content: "Rekomendasi magang yang diberikan Talentika sangat berkualitas. Saya mendapat pengalaman berharga di bengkel ternama dan skills saya meningkat pesat.",
      rating: 5,
      badge: "Teknik"
    }
  ];

  return (
    <section className="py-24 bg-gradient-to-br from-background to-accent-light/10">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm font-medium">
            <GraduationCap className="w-4 h-4 mr-2" />
            Testimoni Pengguna
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
            Mereka Telah Menemukan Jalannya
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Ribuan pelajar, mahasiswa, dan institusi pendidikan telah mempercayai Talentika untuk mengembangkan potensi mereka
          </p>
        </div>

        <div className="max-w-7xl mx-auto">
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {testimonials.map((testimonial, index) => (
                <CarouselItem key={index} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                  <Card className="relative overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-floating border-0 bg-gradient-card shadow-soft h-full">
                    <CardContent className="p-8">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="relative">
                          <img 
                            src={testimonial.image} 
                            alt={testimonial.name}
                            className="w-16 h-16 rounded-full object-cover border-2 border-primary/20"
                          />
                          <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                            <Quote className="w-3 h-3 text-white" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg">{testimonial.name}</h4>
                          <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                          <p className="text-xs text-primary font-medium">{testimonial.university}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 mb-4">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>

                      <p className="text-foreground/80 leading-relaxed mb-6 italic">
                        "{testimonial.content}"
                      </p>

                      <Badge 
                        variant="outline" 
                        className="bg-primary/10 text-primary border-primary/20 font-medium"
                      >
                        {testimonial.badge}
                      </Badge>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-0" />
            <CarouselNext className="right-0" />
          </Carousel>
        </div>

        <div className="mt-16 text-center">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">10,000+</div>
              <div className="text-sm text-muted-foreground">Siswa Terdaftar</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">500+</div>
              <div className="text-sm text-muted-foreground">Sekolah Partner</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">95%</div>
              <div className="text-sm text-muted-foreground">Tingkat Kepuasan</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">1,000+</div>
              <div className="text-sm text-muted-foreground">Success Stories</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;