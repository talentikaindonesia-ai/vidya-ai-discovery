import { Mail, Phone, MapPin, Instagram, Youtube } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

// H-01: Map all footer links to real routes/anchors — no more dead href="#"
const QUICK_LINKS = [
  { label: "Beranda",      href: "/" },
  { label: "Fitur",        href: "/#fitur" },
  { label: "Cara Kerja",   href: "/#cara-kerja" },
  { label: "Harga",        href: "/#harga" },
  { label: "Kontak",       href: "mailto:Discover@Talentika.id" },
];

const SERVICE_LINKS = [
  { label: "Tes Minat & Bakat",  href: "/assessment" },
  { label: "Eksplorasi Karir",   href: "/opportunities" },
  { label: "Learning Hub",       href: "/learning-hub" },
  { label: "Komunitas Belajar",  href: "/community" },
  { label: "Portfolio Builder",  href: "/portfolio" },
];

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
              {QUICK_LINKS.map(({ label, href }) => (
                <li key={label}>
                  {href.startsWith("mailto:") ? (
                    <a href={href} className="text-white/80 hover:text-white transition-colors">
                      {label}
                    </a>
                  ) : href.startsWith("/") && !href.includes("#") ? (
                    <Link to={href} className="text-white/80 hover:text-white transition-colors">
                      {label}
                    </Link>
                  ) : (
                    <a href={href} className="text-white/80 hover:text-white transition-colors">
                      {label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Layanan</h4>
            <ul className="space-y-2">
              {SERVICE_LINKS.map(({ label, href }) => (
                <li key={label}>
                  <Link to={href} className="text-white/80 hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Kontak</h4>
            <div className="space-y-3">
              <a href="mailto:Discover@Talentika.id" className="flex items-center gap-3 hover:text-white/100 transition-colors">
                <Mail className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-white/80">Discover@Talentika.id</span>
              </a>
              <a href="https://wa.me/6285148434141" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-white/100 transition-colors">
                <Phone className="w-5 h-5 text-primary flex-shrink-0" />
                <span className="text-white/80">+62 851 4843 4141</span>
              </a>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
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
              <a
                href="https://wa.me/6285148434141?text=Halo%20Talentika%2C%20saya%20ingin%20menanyakan%20Kebijakan%20Privasi"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/60 hover:text-white transition-colors"
              >
                Kebijakan Privasi
              </a>
              <a
                href="https://wa.me/6285148434141?text=Halo%20Talentika%2C%20saya%20ingin%20menanyakan%20Syarat%20%26%20Ketentuan"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/60 hover:text-white transition-colors"
              >
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