import { Button } from "@/components/ui/button";
import { Brain, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const Header = () => {
  const { t } = useTranslation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { label: t('nav.home'), href: "#home" },
    { label: t('nav.features'), href: "#features" },
    { label: t('nav.howItWorks'), href: "#how-it-works" },
    { label: t('nav.pricing'), href: "#pricing" },
    { label: t('nav.testimonials'), href: "#testimonials" },
    { label: "Artikel", href: "/articles" },
    { label: "Talentika Junior", href: "/talentika-junior", highlight: true }
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-primary/10">
      <div className="container px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
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
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className={`transition-colors font-medium ${
                  item.highlight 
                    ? "text-primary hover:text-primary/80 bg-primary/10 px-3 py-1 rounded-lg" 
                    : "text-foreground hover:text-primary"
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <LanguageSwitcher variant="ghost" size="sm" />
            <Button 
              variant="ghost"
              onClick={() => window.location.href = '/auth'}
            >
              {t('nav.login')}
            </Button>
            <Button 
              variant="hero"
              onClick={() => window.location.href = '/auth'}
            >
              {t('nav.getStarted')}
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
                      ? "text-primary hover:text-primary/80 bg-primary/10 px-3 py-1 rounded-lg" 
                      : "text-foreground hover:text-primary"
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              <div className="flex flex-col gap-2 mt-4">
                <LanguageSwitcher variant="ghost" size="default" />
                <Button 
                  variant="ghost" 
                  className="justify-start"
                  onClick={() => window.location.href = '/auth'}
                >
                  {t('nav.login')}
                </Button>
                <Button 
                  variant="hero" 
                  className="justify-start"
                  onClick={() => window.location.href = '/auth'}
                >
                  {t('nav.getStarted')}
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