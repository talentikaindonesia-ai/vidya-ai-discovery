import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "light" | "dark";
type ThemeMode = Theme | "system";

interface ThemeContextValue {
  /** Resolved theme actually applied to the page (system resolves to light/dark) */
  theme: Theme;
  /** User's stored preference, including "system" */
  themeMode: ThemeMode;
  /** Quick flip — escapes "system" into an explicit choice */
  toggleTheme: () => void;
  /** Explicit 3-way setter, used by the Settings page */
  setThemeMode: (mode: ThemeMode) => void;
}

const systemPrefersDark = () => window.matchMedia("(prefers-color-scheme: dark)").matches;

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  themeMode: "system",
  toggleTheme: () => {},
  setThemeMode: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem("themeMode");
    if (stored === "light" || stored === "dark" || stored === "system") return stored;
    // Migrate from the old binary-only storage key
    const legacy = localStorage.getItem("theme");
    if (legacy === "dark" || legacy === "light") return legacy;
    return "system";
  });

  const [theme, setTheme] = useState<Theme>(() =>
    themeMode === "system" ? (systemPrefersDark() ? "dark" : "light") : themeMode
  );

  // Resolve + apply whenever the mode changes
  useEffect(() => {
    const resolved = themeMode === "system" ? (systemPrefersDark() ? "dark" : "light") : themeMode;
    setTheme(resolved);
    localStorage.setItem("themeMode", themeMode);
    localStorage.setItem("theme", resolved); // keep legacy key in sync for any stray readers
  }, [themeMode]);

  // Track OS preference live while in "system" mode
  useEffect(() => {
    if (themeMode !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => setTheme(mq.matches ? "dark" : "light");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [themeMode]);

  // Apply the resolved theme to <html>
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, [theme]);

  const toggleTheme = () => setThemeModeState(theme === "dark" ? "light" : "dark");
  const setThemeMode = (mode: ThemeMode) => setThemeModeState(mode);

  return (
    <ThemeContext.Provider value={{ theme, themeMode, toggleTheme, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  return useContext(ThemeContext);
}
