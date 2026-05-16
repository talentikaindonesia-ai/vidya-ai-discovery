// Lineal, consistent-stroke icon set matching Talentika's iconography style
const Icon = ({ d, size = 18, fill = "none", stroke = "currentColor", sw = 1.8, children, ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" {...props}>
    {d ? <path d={d} /> : children}
  </svg>
);

const I = {
  Home: (p) => <Icon {...p}><path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/></Icon>,
  Book: (p) => <Icon {...p}><path d="M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2V5z"/><path d="M19 19H6"/></Icon>,
  Trophy: (p) => <Icon {...p}><path d="M7 4h10v4a5 5 0 01-10 0V4z"/><path d="M5 4H3v3a3 3 0 003 3M19 4h2v3a3 3 0 01-3 3M9 14h6l-1 6h-4l-1-6z"/></Icon>,
  Gift: (p) => <Icon {...p}><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M5 12v9h14v-9M12 8a3 3 0 100-6 3 3 0 000 6zM12 8a3 3 0 110-6"/></Icon>,
  Chart: (p) => <Icon {...p}><path d="M3 3v18h18"/><path d="M7 14l4-4 3 3 5-6"/></Icon>,
  Shield: (p) => <Icon {...p}><path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z"/><path d="M9 12l2 2 4-4"/></Icon>,
  Users: (p) => <Icon {...p}><circle cx="9" cy="8" r="3.5"/><path d="M2 21c0-3.5 3.1-6 7-6s7 2.5 7 6"/><circle cx="17" cy="9" r="2.5"/><path d="M22 19c0-2.5-2-4-5-4"/></Icon>,
  Clock: (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></Icon>,
  User: (p) => <Icon {...p}><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></Icon>,
  Settings: (p) => <Icon {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/></Icon>,
  Search: (p) => <Icon {...p}><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></Icon>,
  Bell: (p) => <Icon {...p}><path d="M6 8a6 6 0 1112 0c0 7 3 7 3 9H3c0-2 3-2 3-9z"/><path d="M10 21a2 2 0 004 0"/></Icon>,
  Sun: (p) => <Icon {...p}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></Icon>,
  Moon: (p) => <Icon {...p}><path d="M21 13A9 9 0 1111 3a7 7 0 0010 10z"/></Icon>,
  Chevron: (p) => <Icon {...p}><path d="M9 18l6-6-6-6"/></Icon>,
  ChevronLeft: (p) => <Icon {...p}><path d="M15 18l-6-6 6-6"/></Icon>,
  ChevronDown: (p) => <Icon {...p}><path d="M6 9l6 6 6-6"/></Icon>,
  Arrow: (p) => <Icon {...p}><path d="M5 12h14M13 5l7 7-7 7"/></Icon>,
  ArrowDown: (p) => <Icon {...p}><path d="M12 5v14M5 13l7 7 7-7"/></Icon>,
  Plus: (p) => <Icon {...p}><path d="M12 5v14M5 12h14"/></Icon>,
  Check: (p) => <Icon {...p}><path d="M5 12l5 5L20 7"/></Icon>,
  X: (p) => <Icon {...p}><path d="M6 6l12 12M18 6L6 18"/></Icon>,
  Star: (p) => <Icon {...p}><path d="M12 2l3 7 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-7z"/></Icon>,
  Sparkle: (p) => <Icon {...p}><path d="M12 3l1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5z"/></Icon>,
  Heart: (p) => <Icon {...p}><path d="M20.8 6.6a5.5 5.5 0 00-9-1.6 5.5 5.5 0 00-9 1.6c-1.5 4.4 5 8.6 9 12.4 4-3.8 10.5-8 9-12.4z"/></Icon>,
  Bookmark: (p) => <Icon {...p}><path d="M6 3h12v18l-6-4-6 4V3z"/></Icon>,
  MapPin: (p) => <Icon {...p}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1118 0z"/><circle cx="12" cy="10" r="3"/></Icon>,
  Target: (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/></Icon>,
  Brain: (p) => <Icon {...p}><path d="M9.5 3A3.5 3.5 0 006 6.5c0 .8.3 1.6.8 2.2A3.5 3.5 0 005 12a3.5 3.5 0 002 3.2A3.5 3.5 0 005 18.5 3.5 3.5 0 008.5 22a3.5 3.5 0 003.5-3.5V4.5A3.5 3.5 0 008.5 1z" transform="translate(2 1)"/></Icon>,
  Bolt: (p) => <Icon {...p}><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/></Icon>,
  Flag: (p) => <Icon {...p}><path d="M4 21V4M4 4h13l-2 4 2 4H4"/></Icon>,
  Rocket: (p) => <Icon {...p}><path d="M14 11a2 2 0 100-4 2 2 0 000 4z"/><path d="M19 14c-1 4-7 7-7 7s-3-1-5-3-3-5-3-5 3-6 7-7 8 0 8 0 1 4 0 8z"/><path d="M9 15l-3 3M14 19c-2 1-3 3-3 3l-3-3s2-1 3-3"/></Icon>,
  Crown: (p) => <Icon {...p}><path d="M3 18h18M3 18l2-10 5 5 2-7 2 7 5-5 2 10"/></Icon>,
  Diamond: (p) => <Icon {...p}><path d="M2 9l4-5h12l4 5-10 13L2 9z"/><path d="M2 9h20M9 4l-2 5 5 13M15 4l2 5-5 13"/></Icon>,
  Question: (p) => <Icon {...p}><circle cx="12" cy="12" r="10"/><path d="M9 9a3 3 0 016 0c0 2-3 2-3 4M12 17h.01"/></Icon>,
  Code: (p) => <Icon {...p}><path d="M16 18l6-6-6-6M8 6l-6 6 6 6"/></Icon>,
  Pen: (p) => <Icon {...p}><path d="M14 3l7 7-11 11H3v-7L14 3z"/></Icon>,
  Bulb: (p) => <Icon {...p}><path d="M9 18h6M10 21h4M12 3a6 6 0 014 10.5c-.7.7-1 1.7-1 2.5H9c0-.8-.3-1.8-1-2.5A6 6 0 0112 3z"/></Icon>,
  Megaphone: (p) => <Icon {...p}><path d="M3 11v4l11 5V6L3 11zM14 9a3 3 0 010 6"/></Icon>,
  Trend: (p) => <Icon {...p}><path d="M3 17l6-6 4 4 8-8M14 7h7v7"/></Icon>,
  Calendar: (p) => <Icon {...p}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></Icon>,
  Briefcase: (p) => <Icon {...p}><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2M3 13h18"/></Icon>,
  Camera: (p) => <Icon {...p}><path d="M3 7h4l2-3h6l2 3h4v13H3V7z"/><circle cx="12" cy="13" r="4"/></Icon>,
  Globe: (p) => <Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18"/></Icon>,
  Paint: (p) => <Icon {...p}><path d="M19 11a8 8 0 10-8 8c1 0 1-1 1-2s-1-1-1-2 1-1 2-1c2 0 6-1 6-3z"/><circle cx="7" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="14" cy="7" r="1"/></Icon>,
  Activity: (p) => <Icon {...p}><path d="M3 12h4l3-9 4 18 3-9h4"/></Icon>,
  ChatBubble: (p) => <Icon {...p}><path d="M21 12a8 8 0 11-3-6l3-1-1 3a8 8 0 011 4z"/></Icon>,
  Plane: (p) => <Icon {...p}><path d="M2 13l8 1 4 8 2-7 7-2-7-2-2-7-4 8-8 1z"/></Icon>,
  Eye: (p) => <Icon {...p}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></Icon>,
  Mail: (p) => <Icon {...p}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 7 9-7"/></Icon>,
  Lock: (p) => <Icon {...p}><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/></Icon>,
  Dots: (p) => <Icon {...p}><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></Icon>,
  Logo: ({ size = 32, ...p }) => (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" {...p}>
      <rect width="32" height="32" rx="9" fill="#1D4ED8"/>
      <path d="M16 7l1.6 5.4L23 14l-5.4 1.6L16 21l-1.6-5.4L9 14l5.4-1.6z" fill="#fff"/>
      <circle cx="23" cy="8" r="1.6" fill="#FFC107"/>
    </svg>
  ),
};

window.I = I;
window.Icon = Icon;
