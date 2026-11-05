import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const DOMAIN = 'https://talentika.id';
const DEFAULT_OG_IMAGE = `${DOMAIN}/og-talentika.jpg`;

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
  imageWidth?: number;
  imageHeight?: number;
  type?: 'website' | 'article';
  canonical?: string;
  noindex?: boolean;
  structuredData?: object;
  /** Article-specific: ISO date string */
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
}

const SEO = ({
  title = "Talentika — Tes Minat Bakat RIASEC Gratis & Jalur Karier Pelajar",
  description = "Tes minat bakat RIASEC gratis, jalur karier, beasiswa, kompetisi, dan magang untuk pelajar SMP, SMA/SMK, dan mahasiswa Indonesia.",
  keywords = "tes minat bakat, tes RIASEC, holland test indonesia, pilih jurusan kuliah, eksplorasi karier, beasiswa pelajar, kompetisi pelajar, magang",
  image = DEFAULT_OG_IMAGE,
  imageWidth = 1200,
  imageHeight = 630,
  type = "website",
  canonical,
  noindex = false,
  structuredData,
  publishedTime,
  modifiedTime,
  author = "Tim Talentika",
}: SEOProps) => {
  const location = useLocation();
  const currentUrl = `${DOMAIN}${location.pathname}`;
  const canonicalUrl = canonical || currentUrl;
  const fullTitle = title.includes("Talentika") ? title : `${title} — Talentika`;
  // Gambar relatif ("/x.png") jadi absolut — perayap media sosial butuh URL penuh
  const imageUrl = /^https?:\/\//.test(image) ? image : `${DOMAIN}${image.startsWith("/") ? "" : "/"}${image}`;

  useEffect(() => {
    document.title = fullTitle;

    const setMeta = (attr: string, val: string, key: 'property' | 'name' = 'name') => {
      let el = document.querySelector(`meta[${key}="${attr}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(key, attr);
        document.head.appendChild(el);
      }
      el.setAttribute('content', val);
    };

    // ── Core ──────────────────────────────────────────────────────────
    setMeta('description', description);
    setMeta('keywords', keywords);
    setMeta('robots', noindex ? 'noindex,nofollow' : 'index,follow,max-image-preview:large');
    setMeta('language', 'Indonesian');

    // ── Open Graph ────────────────────────────────────────────────────
    setMeta('og:title',       fullTitle,           'property');
    setMeta('og:description', description,          'property');
    setMeta('og:image',       imageUrl,             'property');
    setMeta('og:image:width', String(imageWidth),   'property');
    setMeta('og:image:height',String(imageHeight),  'property');
    setMeta('og:image:alt',   fullTitle,            'property');
    setMeta('og:url',         currentUrl,           'property');
    setMeta('og:type',        type,                 'property');
    setMeta('og:site_name',   'Talentika',          'property');
    setMeta('og:locale',      'id_ID',              'property');

    // Article-specific OG
    if (type === 'article') {
      if (publishedTime) setMeta('article:published_time', publishedTime, 'property');
      if (modifiedTime)  setMeta('article:modified_time',  modifiedTime,  'property');
      if (author)        setMeta('article:author',         author,        'property');
      setMeta('article:publisher', 'https://www.facebook.com/talentikaid', 'property');
    }

    // ── Twitter / X ───────────────────────────────────────────────────
    setMeta('twitter:card',        'summary_large_image');
    setMeta('twitter:site',        '@talentikaid');
    setMeta('twitter:creator',     '@talentikaid');
    setMeta('twitter:title',       fullTitle);
    setMeta('twitter:description', description);
    setMeta('twitter:image',       imageUrl);
    setMeta('twitter:image:alt',   fullTitle);

    // ── Canonical ─────────────────────────────────────────────────────
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalUrl);

    // ── Hreflang ─────────────────────────────────────────────────────
    const ensureHreflang = (lang: string, href: string) => {
      let el = document.querySelector(`link[rel="alternate"][hreflang="${lang}"]`);
      if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', 'alternate');
        el.setAttribute('hreflang', lang);
        document.head.appendChild(el);
      }
      el.setAttribute('href', href);
    };
    ensureHreflang('id',        canonicalUrl);
    ensureHreflang('x-default', canonicalUrl);

    // ── Page-specific structured data ─────────────────────────────────
    // Data terstruktur halaman sebelumnya tidak boleh tertinggal saat pindah halaman (SPA)
    if (!structuredData) document.querySelector('script[type="application/ld+json"][data-dynamic="page"]')?.remove();
    if (location.pathname === '/') document.querySelector('script[type="application/ld+json"][data-dynamic="breadcrumb"]')?.remove();
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

    // ── BreadcrumbList ────────────────────────────────────────────────
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
  }, [fullTitle, description, keywords, imageUrl, imageWidth, imageHeight, type, currentUrl, canonicalUrl, noindex, structuredData, publishedTime, modifiedTime, author, location.pathname]);

  return null;
};

export default SEO;
