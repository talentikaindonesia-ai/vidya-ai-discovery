import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { 
  Wrench, 
  Microscope, 
  Palette, 
  Users, 
  Briefcase, 
  Calculator
} from "lucide-react";

// RIASEC Personality Types Data
const riasecTypes = {
  realistic: {
    name: "Realistic",
    icon: Wrench,
    color: "from-yellow-500 to-orange-500",
    description: "Cenderung suka pekerjaan yang berorientasi dengan penerapan dari skill yang dimiliki, keterampilan fisik & minim keterampilan sosial",
    characteristics: ["Praktis", "Teknis", "Suka bekerja dengan tangan", "Oriented pada hasil nyata"],
    careers: ["Insinyur Mesin", "Teknisi", "Arsitek", "Ahli Konstruksi", "Pilot", "Chef"]
  },
  investigative: {
    name: "Investigative", 
    icon: Microscope,
    color: "from-green-500 to-teal-500",
    description: "Lebih suka pekerjaan yang mengandalkan analisa, pemahaman cara berpikir secara kreatif dan abstrak",
    characteristics: ["Analitis", "Intelektual", "Suka riset", "Problem solver"],
    careers: ["Peneliti", "Dokter", "Scientist", "Psikolog", "Data Scientist", "Ahli Forensik"]
  },
  artistic: {
    name: "Artistic",
    icon: Palette, 
    color: "from-purple-500 to-pink-500",
    description: "Tipikal orang yang suka bekerja sama dengan orang lain untuk menghasilkan suatu hal yang dianggap 'Karya Seni'",
    characteristics: ["Kreatif", "Imajinatif", "Ekspresif", "Inovatif"],
    careers: ["Desainer Grafis", "Penulis", "Musisi", "Fotografer", "Animator", "Content Creator"]
  },
  social: {
    name: "Social",
    icon: Users,
    color: "from-blue-500 to-cyan-500", 
    description: "Lebih suka pekerjaan yang bersifat membantu sesama. Punya karakter yang supel dan friendly. Sangat menikmati pekerjaan yang rutin dan teratur",
    characteristics: ["Empatis", "Komunikatif", "Suka membantu", "Team oriented"],
    careers: ["Guru", "Konselor", "Perawat", "Pekerja Sosial", "HR Manager", "Terapis"]
  },
  enterprising: {
    name: "Enterprising",
    icon: Briefcase,
    color: "from-red-500 to-rose-500",
    description: "Suka bergaul dan berbicara dengan orang banyak, jago merangkai kata dan meyakinkan orang, mudah untuk mempresentasikan sesuatu",
    characteristics: ["Persuasif", "Ambisius", "Leadership", "Goal oriented"],
    careers: ["Entrepreneur", "Sales Manager", "Marketing Director", "CEO", "Business Consultant", "Lawyer"]
  },
  conventional: {
    name: "Conventional",
    icon: Calculator,
    color: "from-gray-500 to-slate-500",
    description: "Karakternya formal banget, terus juga sangat setia, tipikal tim player yang baik. Suka pekerjaan yang rutin, terstruktur dan sistematis",
    characteristics: ["Terorganisir", "Detail oriented", "Sistematis", "Reliable"],
    careers: ["Akuntan", "Administrasi", "Sekretaris", "Auditor", "Perpustakaan", "Data Entry"]
  }
};

interface RiasecPersonalityTypesProps {
  showButton?: boolean;
  title?: string;
  subtitle?: string;
}

const RiasecPersonalityTypes = ({ 
  showButton = true, 
  title = "Tipe Kepribadian Berdasarkan RIASEC",
  subtitle = "6 kepribadian ini bisa bantu kamu menentukan jurusan yang sesuai dengan minat dan karaktermu" 
}: RiasecPersonalityTypesProps) => {
  const navigate = useNavigate();

  return (
    <div className="py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-primary mb-4">
            {title}
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            {subtitle}
          </p>
        </div>

        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          className="w-full mb-12"
        >
          <CarouselContent className="-ml-2 md:-ml-4">
            {Object.entries(riasecTypes).map(([key, type]) => {
              const Icon = type.icon;
              return (
                <CarouselItem key={key} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                  <Card className="group hover:shadow-lg transition-all duration-300 border-2 hover:border-primary/30 h-full">
                    <CardHeader className="text-center">
                      <div className={`w-20 h-20 mx-auto rounded-full bg-gradient-to-br ${type.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="w-10 h-10 text-white" />
                      </div>
                      <CardTitle className="text-xl font-bold">{type.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col">
                      <p className="text-sm text-muted-foreground mb-4 leading-relaxed flex-1">
                        {type.description}
                      </p>
                      <div className="space-y-3">
                        <div>
                          <h4 className="font-semibold text-sm mb-2">Karakteristik:</h4>
                          <div className="flex flex-wrap gap-1">
                            {type.characteristics.map((char, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {char}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold text-sm mb-2">Contoh Karier:</h4>
                          <div className="flex flex-wrap gap-1">
                            {type.careers.slice(0, 3).map((career, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {career}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              );
            })}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>

        {showButton && (
          <div className="text-center">
            <Card className="max-w-md mx-auto">
              <CardContent className="pt-6">
                <h3 className="text-xl font-semibold mb-2">Temukan Tipe Kepribadianmu!</h3>
                <p className="text-muted-foreground mb-6">
                  Ikuti tes minat bakat berdasarkan teori RIASEC untuk mengetahui kepribadian dan potensi kariermu.
                </p>
                <Button onClick={() => navigate("/assessment")} className="w-full" size="lg">
                  Mulai Tes Minat Bakat
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default RiasecPersonalityTypes;