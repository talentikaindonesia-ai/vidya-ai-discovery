import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import Pricing from "@/components/Pricing";
import Testimonials from "@/components/Testimonials";
import PartnershipCTA from "@/components/PartnershipCTA";
import Footer from "@/components/Footer";
import WelcomePopup from "@/components/WelcomePopup";
import WhatsAppButton from "@/components/WhatsAppButton";
import ArticlesPreview from "@/components/ArticlesPreview";
import SEO from "@/components/SEO";

const Index = () => {
  return (
    <div className="min-h-screen">
      <SEO
        title="Talentika - Temukan Minat & Bakat Mu | Eksplorasi Karir & Potensi Diri"
        description="Platform terlengkap untuk menemukan minat, bakat, dan potensi diri. Tes psikometri RIASEC, Holland Test, panduan karir, beasiswa & kompetisi untuk pelajar dan mahasiswa Indonesia."
        keywords="tes minat bakat, eksplorasi karir, psikometri online, holland test indonesia, RIASEC test, pelajar, mahasiswa, talent discovery, beasiswa indonesia, magang indonesia, kompetisi pelajar"
        canonical="https://talentika.id/"
      />
      <WelcomePopup />
      <WhatsAppButton />
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
        <section id="articles">
          <ArticlesPreview />
        </section>
        <section id="partnership">
          <PartnershipCTA />
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
