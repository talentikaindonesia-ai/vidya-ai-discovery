import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  type?: string;
  canonical?: string;
  structuredData?: object;
}

const SEO = ({
  title = "Talentika - Temukan Minat & Bakat Mu | Eksplorasi Karir",
  description = "Platform terlengkap untuk menemukan minat, bakat, dan potensi diri. Tes psikometri RIASEC, Holland Test, MBTI, panduan karir untuk generasi muda Indonesia.",
  keywords = "tes minat bakat, eksplorasi karir, psikometri online, holland test indonesia, RIASEC test, MBTI indonesia, pelajar, mahasiswa, talent discovery",
  image = "https://storage.googleapis.com/gpt-engineer-file-uploads/Pr4m0t7zzfYISYtpn8KntqUZdFB3/social-images/social-1759226878798-Talentika.id (1).png",
  type = "website",
  canonical,
  structuredData
}: SEOProps) => {
  const location = useLocation();
  const currentUrl = `https://talentika.id${location.pathname}`;
  const canonicalUrl = canonical || currentUrl;

  useEffect(() => {
    // Update title
    document.title = title;

    // Update or create meta tags
    const updateMetaTag = (property: string, content: string, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${property}"]`);
      
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, property);
        document.head.appendChild(element);
      }
      
      element.setAttribute('content', content);
    };

    // Basic meta tags
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords);

    // Open Graph tags
    updateMetaTag('og:title', title, true);
    updateMetaTag('og:description', description, true);
    updateMetaTag('og:image', image, true);
    updateMetaTag('og:url', currentUrl, true);
    updateMetaTag('og:type', type, true);
    updateMetaTag('og:site_name', 'Talentika', true);

    // Twitter tags
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', image);
    updateMetaTag('twitter:card', 'summary_large_image');

    // Update canonical link
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalUrl);

    // Update structured data if provided
    if (structuredData) {
      let script = document.querySelector('script[type="application/ld+json"][data-dynamic="true"]');
      
      if (!script) {
        script = document.createElement('script');
        script.setAttribute('type', 'application/ld+json');
        script.setAttribute('data-dynamic', 'true');
        document.head.appendChild(script);
      }
      
      script.textContent = JSON.stringify(structuredData);
    }
  }, [title, description, keywords, image, type, currentUrl, canonicalUrl, structuredData]);

  return null;
};

export default SEO;
