import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import Pricing from "@/components/Pricing";
import Testimonials from "@/components/Testimonials";
import TalentikaJunior from "@/components/TalentikaJunior";
import PartnershipCTA from "@/components/PartnershipCTA";
import Footer from "@/components/Footer";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <section id="home">
          <Hero />
        </section>
        <section id="features">
          <Features />
        </section>
        <section id="how-it-works">
          <HowItWorks />
        </section>
        <section id="pricing">
          <Pricing />
        </section>
        <section id="testimonials">
          <Testimonials />
        </section>
        {/* <section id="talentika-junior">
          <TalentikaJunior />
        </section> */}
        <section id="partnership">
          <PartnershipCTA />
        </section>
        
        {/* Membership CTA Section */}
        <section className="py-16 bg-gradient-to-r from-primary/5 to-secondary/5">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Siap Mengembangkan Karir?</h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Bergabung dengan sistem membership Talentika untuk akses penuh ke fitur assessment, mentorship, dan networking profesional
            </p>
            <Button 
              className="bg-gradient-to-r from-primary to-primary-dark hover:shadow-glow transition-all duration-300 transform hover:scale-105"
              size="lg"
              onClick={() => navigate('/membership')}
            >
              Akses Membership Dashboard
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
