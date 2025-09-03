import { Brain, Mail, Phone, MapPin, Instagram, Facebook, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";

const Footer = () => {
  return (
    <footer className="bg-foreground text-white">
      <div className="container px-4 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-soft p-1">
                <img src="/lovable-uploads/9e67a8cf-6f81-4abc-898b-bc665dee2b57.png" alt="Talentika Logo" className="w-8 h-8 object-contain" />
              </div>
              <div>
                <h3 className="text-xl font-bold">Talentika</h3>
                <p className="text-sm text-white/80">Discover Your Full Potential</p>
              </div>
            </div>
            <p className="text-white/80 leading-relaxed">
              Membantu pelajar dan mahasiswa menemukan passion mereka melalui tes psikometri yang fun dan rekomendasi yang personal.
            </p>
            <div className="flex gap-3">
              <Button variant="ghost" size="icon" className="hover:bg-white/10 text-white">
                <Instagram className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="hover:bg-white/10 text-white">
                <Facebook className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="icon" className="hover:bg-white/10 text-white">
                <Twitter className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Tautan Cepat</h4>
            <ul className="space-y-2">
              {["Beranda", "Fitur", "Cara Kerja", "Tentang Kami", "FAQ"].map((link) => (
                <li key={link}>
                  <a href="#" className="text-white/80 hover:text-white transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Layanan</h4>
            <ul className="space-y-2">
              {["Tes Minat & Bakat", "Eksplorasi Karir", "Rekomendasi Skill", "Komunitas Belajar", "Progress Tracking"].map((service) => (
                <li key={service}>
                  <a href="#" className="text-white/80 hover:text-white transition-colors">
                    {service}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Kontak</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-primary" />
                <span className="text-white/80">Discover@Talentika.id</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-primary" />
                <span className="text-white/80">+62 851 6286 3108</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-primary" />
                <span className="text-white/80">Jakarta, Indonesia</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/60 text-sm">
              © 2024 Talentika. Semua hak dilindungi undang-undang.
            </p>
            <div className="flex gap-6 text-sm">
              <a href="#" className="text-white/60 hover:text-white transition-colors">
                Kebijakan Privasi
              </a>
              <a href="#" className="text-white/60 hover:text-white transition-colors">
                Syarat & Ketentuan
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;