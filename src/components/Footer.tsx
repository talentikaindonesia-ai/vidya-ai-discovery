import { Mail, Phone, MapPin, Instagram, Youtube } from "lucide-react";
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
              Talentika membantu generasi muda menemukan passion dan mengembangkan talenta melalui assessment yang komprehensif dan panduan karir yang personal.
            </p>
            <div className="flex gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                className="hover:bg-white/10 text-white"
                onClick={() => window.open('https://www.instagram.com/talentika.id/', '_blank')}
                aria-label="Instagram Talentika"
              >
                <Instagram className="w-5 h-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="hover:bg-white/10 text-white"
                onClick={() => window.open('https://www.youtube.com/@talentikaid', '_blank')}
                aria-label="YouTube Talentika"
              >
                <Youtube className="w-5 h-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="hover:bg-white/10 text-white"
                onClick={() => window.open('https://www.tiktok.com/@talentika.id', '_blank')}
                aria-label="TikTok Talentika"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
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
                <span className="text-white/80">+62 851 4843 4141</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-primary" />
                <span className="text-white/80">Jalan Kuningan Mulia Lot 9 B, Kota Adm. Jakarta Selatan, DKI Jakarta</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/60 text-sm">
              © 2025 Talentika by PT. Invisi Karya Indonesia. Semua hak dilindungi undang-undang.
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