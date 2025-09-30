import { MessageCircle } from "lucide-react";

const WhatsAppButton = () => {
  const handleWhatsAppClick = () => {
    const phoneNumber = "6285148434141"; // +62 851 4843 4141
    const message = encodeURIComponent("Halo Talentika! Saya ingin bertanya tentang layanan Anda.");
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, "_blank");
  };

  return (
    <button
      onClick={handleWhatsAppClick}
      className="fixed bottom-6 right-6 z-50 bg-[#25D366] hover:bg-[#20BA5A] text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group"
      aria-label="Chat WhatsApp"
    >
      <MessageCircle className="w-6 h-6 group-hover:animate-pulse" />
      <span className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-foreground text-background px-3 py-1 rounded-lg text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        Chat dengan Kami
      </span>
    </button>
  );
};

export default WhatsAppButton;
