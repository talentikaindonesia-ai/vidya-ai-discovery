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
import WelcomePopup from "@/components/WelcomePopup";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <WelcomePopup />
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
      </main>
      <Footer />
    </div>
  );
};

export default Index;
