import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ROUTE_LABELS: Record<string, string> = {
  articles: "Artikel", dashboard: "Dashboard", learning: "Learning Hub",
  profile: "Profil", assessment: "Assessment", opportunities: "Peluang",
  community: "Komunitas", portfolio: "Portfolio", subscription: "Langganan",
  "for-schools": "Untuk Sekolah", "tentang-kami": "Tentang Kami",
  mitra: "Mitra & Mentor", "school-dashboard": "Dashboard Sekolah",
  "talentika-junior": "Talentika Junior", explore: "Eksplorasi",
};

function buildBreadcrumb(pathname: string) {
  const parts = pathname.split("/").filter(Boolean);
  const items = [{ name: "Beranda", url: "https://talentika.id/" }];
  let cumPath = "";
  parts.forEach(part => {
    cumPath += "/" + part;
    const label = ROUTE_LABELS[part] || part.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    items.push({ name: label, url: "https://talentika.id" + cumPath });
  });
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, i) => ({
      "@type": "ListItem",
      "position": i + 1,
      "name": item.name,
      "item": item.url,
    })),
  };
}

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

    // Page-specific structured data
    if (structuredData) {
      let script = document.querySelector('script[type="application/ld+json"][data-dynamic="page"]');
      if (!script) {
        script = document.createElement('script');
        script.setAttribute('type', 'application/ld+json');
        script.setAttribute('data-dynamic', 'page');
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(structuredData);
    }

    // BreadcrumbList — always injected, updated on route change
    if (location.pathname !== '/') {
      let bcScript = document.querySelector('script[type="application/ld+json"][data-dynamic="breadcrumb"]');
      if (!bcScript) {
        bcScript = document.createElement('script');
        bcScript.setAttribute('type', 'application/ld+json');
        bcScript.setAttribute('data-dynamic', 'breadcrumb');
        document.head.appendChild(bcScript);
      }
      bcScript.textContent = JSON.stringify(buildBreadcrumb(location.pathname));
    }
  }, [title, description, keywords, image, type, currentUrl, canonicalUrl, structuredData, location.pathname]);

  return null;
};

export default SEO;
