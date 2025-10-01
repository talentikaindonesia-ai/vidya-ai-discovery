import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './i18n/config'
import { useLanguageSync } from './hooks/useLanguageSync'

// Initialize language sync
const AppWithLanguageSync = () => {
  useLanguageSync();
  return <App />;
};

createRoot(document.getElementById("root")!).render(<AppWithLanguageSync />);
