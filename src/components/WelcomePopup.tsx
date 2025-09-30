import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

const WelcomePopup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user has visited before
    const hasVisited = localStorage.getItem("talentika_visited");
    
    if (!hasVisited) {
      // Show popup after a short delay for better UX
      setTimeout(() => {
        setIsOpen(true);
      }, 1000);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem("talentika_visited", "true");
  };

  const handleGetStarted = () => {
    localStorage.setItem("talentika_visited", "true");
    setIsOpen(false);
    navigate("/auth");
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden border-0 bg-gradient-to-br from-primary via-primary to-primary/80">
        <div className="relative p-8 text-center">
          {/* Decorative elements */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-white/10 rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-40 h-40 bg-white/10 rounded-full translate-x-1/3 translate-y-1/3" />
          
          <DialogHeader className="space-y-4 relative z-10">
            <div className="flex justify-center mb-2">
              <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
            </div>
            
            <DialogTitle className="text-3xl md:text-4xl font-bold text-white">
              #MULAIDARI
              <br />
              <span className="text-4xl md:text-5xl">Talentika</span>
            </DialogTitle>
            
            <DialogDescription className="text-white/90 text-base md:text-lg leading-relaxed px-4">
              Temukan <span className="font-semibold text-white">Potensi</span> & <span className="font-semibold text-accent">Bakatmu</span>
              <br />
              <br />
              Talentika membantu generasi muda menemukan passion dan mengembangkan talenta melalui assessment yang komprehensif dan panduan karir yang personal.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-8 space-y-3 relative z-10">
            <Button
              onClick={handleGetStarted}
              size="lg"
              className="w-full bg-white text-primary hover:bg-white/90 text-lg font-semibold py-6 rounded-full shadow-lg hover:shadow-xl transition-all"
            >
              Daftarkan Dirimu Sekarang
            </Button>
            
            <button
              onClick={handleClose}
              className="text-white/80 hover:text-white text-sm transition-colors underline"
            >
              Pelajari Lebih Lanjut
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WelcomePopup;
