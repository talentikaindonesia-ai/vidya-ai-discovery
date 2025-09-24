import { MessageCircle, Users, Building2, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

const PartnershipCTA = () => {
  const handleWhatsAppClick = () => {
    const phoneNumber = "6285148434141";
    const message = encodeURIComponent("Halo Talentika, saya ingin bergabung sebagai mitra.");
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  const stats = [
    {
      icon: Users,
      value: "95%",
      label: "Tingkat Kepuasan",
      color: "text-primary"
    },
    {
      icon: Building2,
      value: "1,000+",
      label: "Sekolah Partner",
      color: "text-secondary"
    },
    {
      icon: Trophy,
      value: "10,000+",
      label: "Siswa Terdaftar",
      color: "text-accent"
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-muted/30 to-muted/60 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Stats Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {stats.map((stat, index) => (
            <div key={index} className="text-center group">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-background shadow-soft mb-4 group-hover:shadow-floating transition-all duration-300 ${stat.color}`}>
                <stat.icon className="w-8 h-8" />
              </div>
              <div className={`text-4xl md:text-5xl font-bold mb-2 ${stat.color}`}>
                {stat.value}
              </div>
              <p className="text-muted-foreground font-medium">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="bg-card rounded-3xl p-8 md:p-12 shadow-floating border border-primary/10 text-center max-w-4xl mx-auto">
          <div className="mb-8">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
              Bergabung Menjadi Mitra Talentika
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Memberikan kemudahan bagi sekolah, brand, atau komunitas yang ingin bermitra dengan Talentika 
              untuk mengembangkan potensi generasi muda Indonesia.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Respon cepat dalam 1x24 jam</span>
            </div>
            <div className="hidden sm:block w-1 h-1 bg-muted-foreground rounded-full"></div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MessageCircle className="w-4 h-4 text-green-500" />
              <span>Langsung terhubung ke WhatsApp</span>
            </div>
          </div>

          <Button 
            onClick={handleWhatsAppClick}
            size="hero"
            variant="hero"
            className="group relative overflow-hidden"
          >
            <MessageCircle className="w-5 h-5 mr-2 group-hover:rotate-12 transition-transform" />
            Hubungi Kami Sekarang
            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12"></div>
          </Button>

          <p className="text-xs text-muted-foreground mt-4">
            * Dengan mengklik tombol di atas, Anda akan diarahkan ke WhatsApp untuk memulai percakapan
          </p>
        </div>
      </div>
    </section>
  );
};

export default PartnershipCTA;