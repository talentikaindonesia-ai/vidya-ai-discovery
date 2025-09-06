import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Star, Sparkles, Heart, Palette } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TalentikaJunior = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Star,
      title: "Eksplorasi Minat",
      description: "Membantu anak menemukan passion mereka melalui beragam aktivitas menarik",
      color: "from-purple-400 to-blue-400"
    },
    {
      icon: Sparkles,
      title: "Pengembangan Bakat", 
      description: "Mengasah kemampuan unik setiap anak dengan pendekatan yang menyenangkan",
      color: "from-pink-400 to-purple-400"
    },
    {
      icon: Heart,
      title: "Pendekatan Personal",
      description: "Setiap anak diperlakukan sebagai individu dengan kebutuhan yang berbeda",
      color: "from-red-400 to-pink-400"
    },
    {
      icon: Palette,
      title: "Kreativitas Tanpa Batas",
      description: "Memberikan ruang bebas untuk anak mengekspresikan diri mereka",
      color: "from-orange-400 to-red-400"
    }
  ];

  const handleStartExploration = () => {
    navigate('/talentika-junior');
  };

  return (
    <section className="py-20 relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      {/* Background decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 right-10 w-32 h-32 bg-blue-400/20 rounded-full blur-xl animate-pulse" />
        <div className="absolute bottom-20 left-10 w-24 h-24 bg-yellow-400/30 rounded-full blur-lg animate-bounce delay-1000" />
        <div className="absolute top-1/2 left-20 w-16 h-16 bg-orange-400/25 rounded-full blur-md animate-pulse delay-500" />
        <div className="absolute bottom-40 right-1/4 w-20 h-20 bg-purple-400/20 rounded-full blur-xl animate-bounce delay-300" />
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content Section */}
          <div className="space-y-8">
            <div className="space-y-6">
              <h2 className="text-4xl lg:text-5xl font-bold leading-tight">
                <span className="text-slate-800">Talentika Junior:</span>
                <br />
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Discover
                </span>
                <span className="text-slate-800">, </span>
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Explore
                </span>
                <span className="text-slate-800">, and </span>
                <span className="bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent">
                  Shine!
                </span>
              </h2>
              
              <p className="text-lg text-slate-600 leading-relaxed">
                Talentika Junior hadir untuk menumbuhkan potensi anak sejak dini melalui pendekatan minat, bakat, dan eksplorasi diri. Kami percaya setiap anak punya keunikan, dan dengan ruang yang tepat mereka bisa berkembang menjadi bintang masa depan.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid sm:grid-cols-2 gap-4">
              {features.map((feature, index) => (
                <Card key={index} className="p-6 border-0 bg-white/80 backdrop-blur-sm hover:bg-white transition-all duration-300 group shadow-lg hover:shadow-xl">
                  <div className="flex items-start space-x-4">
                    <div className={`flex-shrink-0 w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-md`}>
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 mb-2">{feature.title}</h3>
                      <p className="text-sm text-slate-600 leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-4 rounded-xl"
                onClick={handleStartExploration}
              >
                Mulai Eksplorasi Gratis
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-2 border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold px-8 py-4 rounded-xl transition-all duration-300"
              >
                Pelajari Lebih Lanjut
              </Button>
            </div>
          </div>

          {/* Image Section */}
          <div className="relative">
            {/* Decorative background shapes */}
            <div className="absolute inset-0 -m-8">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-full opacity-20 animate-pulse" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full opacity-25 animate-bounce delay-1000" />
              <div className="absolute top-1/3 left-1/4 w-24 h-24 bg-gradient-to-br from-pink-400 to-red-400 rounded-full opacity-20 animate-pulse delay-500" />
              <div className="absolute bottom-1/3 right-1/4 w-20 h-20 bg-gradient-to-br from-green-400 to-teal-400 rounded-full opacity-30 animate-bounce delay-300" />
            </div>
            
            {/* Main image container */}
            <div className="relative z-10 rounded-3xl overflow-hidden shadow-2xl transform hover:scale-105 transition-transform duration-500">
              <img 
                src="/lovable-uploads/1940fb3f-5ee5-4ce7-b19c-cf3e0d739720.png" 
                alt="Happy child discovering talents with Talentika Junior"
                className="w-full h-auto object-cover"
              />
              {/* Overlay gradient for better integration */}
              <div className="absolute inset-0 bg-gradient-to-t from-blue-600/10 via-transparent to-purple-600/10" />
            </div>
            
            {/* Floating elements */}
            <div className="absolute -top-4 -left-4 w-8 h-8 bg-blue-500 rounded-full animate-bounce delay-100 shadow-lg" />
            <div className="absolute -bottom-4 -right-4 w-6 h-6 bg-yellow-500 rounded-full animate-bounce delay-300 shadow-md" />
            <div className="absolute top-1/4 -right-6 w-4 h-4 bg-pink-500 rounded-full animate-pulse shadow-sm" />
            <div className="absolute bottom-1/4 -left-6 w-5 h-5 bg-purple-500 rounded-full animate-pulse delay-700 shadow-sm" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default TalentikaJunior;