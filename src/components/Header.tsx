import { Button } from "@/components/ui/button";
import { Brain, Menu, X } from "lucide-react";
import { useState } from "react";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { label: "Beranda", href: "#home" },
    { label: "Fitur", href: "#features" },
    { label: "Cara Kerja", href: "#how-it-works" },
    { label: "Harga", href: "#pricing" },
    { label: "Testimoni", href: "#testimonials" },
    { label: "Talentika Junior", href: "#talentika-junior", highlight: true }
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-primary/10">
      <div className="container px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden shadow-soft">
              <img 
                src="/lovable-uploads/ce4aabf2-d425-472e-ada0-d085a2b285b9.png" 
                alt="Talentika Logo" 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Talentika</h1>
              <p className="text-xs text-muted-foreground">Discover your full potential</p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className={`transition-colors font-medium ${
                  item.highlight 
                    ? "bg-yellow-400/20 text-yellow-700 hover:bg-yellow-400/30 hover:text-yellow-800 px-3 py-1.5 rounded-lg" 
                    : "text-foreground hover:text-primary"
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <Button 
              variant="ghost"
              onClick={() => window.location.href = '/auth'}
            >
              Masuk
            </Button>
            <Button 
              variant="hero"
              onClick={() => window.location.href = '/auth'}
            >
              Daftar Gratis
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-primary/10">
            <nav className="flex flex-col gap-4 mt-4">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className={`transition-colors font-medium ${
                    item.highlight 
                      ? "bg-yellow-400/20 text-yellow-700 hover:bg-yellow-400/30 hover:text-yellow-800 px-3 py-1.5 rounded-lg" 
                      : "text-foreground hover:text-primary"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              <div className="flex flex-col gap-2 mt-4">
                <Button 
                  variant="ghost" 
                  className="justify-start"
                  onClick={() => window.location.href = '/auth'}
                >
                  Masuk
                </Button>
                <Button 
                  variant="hero" 
                  className="justify-start"
                  onClick={() => window.location.href = '/auth'}
                >
                  Daftar Gratis
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;