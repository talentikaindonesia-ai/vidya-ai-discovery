import { MessageCircle, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";

const PartnershipCTA = () => {
  const { t } = useTranslation();
  
  const handleWhatsAppClick = () => {
    const phoneNumber = "6285148434141";
    const message = encodeURIComponent("Halo Talentika, saya ingin bergabung sebagai mitra.");
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <section className="py-20 bg-gradient-to-br from-muted/30 to-muted/60 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-secondary/10 rounded-full blur-3xl"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        {/* CTA Section */}
        <div className="bg-gradient-to-r from-primary to-primary-dark rounded-3xl p-8 md:p-12 shadow-floating text-center max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            {t('partnership.title')}
          </h2>
          <p className="text-lg text-white/90 mb-8">
            {t('partnership.description')}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 max-w-2xl mx-auto">
            <div className="flex items-center gap-3 text-white">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">{t('partnership.quickResponse')}</h3>
                <p className="text-sm text-white/80">{t('partnership.quickResponseDesc')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-white">
              <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">{t('partnership.directContact')}</h3>
                <p className="text-sm text-white/80">{t('partnership.directContactDesc')}</p>
              </div>
            </div>
          </div>
          
          <Button 
            variant="secondary"
            size="lg"
            className="group hover:scale-105 transition-all duration-300 shadow-floating"
            onClick={handleWhatsAppClick}
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            {t('partnership.cta')}
          </Button>
        </div>
      </div>
    </section>
  );
};

export default PartnershipCTA;