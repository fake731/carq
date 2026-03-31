import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const applyGlobalTheme = (c: { primary_color: string; accent_color: string; font_scale: number; border_radius: number }) => {
  const root = document.documentElement;
  root.style.setProperty("--primary", c.primary_color);
  root.style.setProperty("--ring", c.primary_color);
  root.style.setProperty("--accent", c.accent_color);
  root.style.setProperty("--neon-cyan", c.primary_color);
  root.style.setProperty("--sidebar-primary", c.primary_color);
  root.style.setProperty("--sidebar-ring", c.primary_color);
  root.style.fontSize = `${Number(c.font_scale) * 16}px`;
  root.style.setProperty("--radius", `${Number(c.border_radius)}rem`);
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem("smart_garage_theme");
    return (saved === "light" ? "light" : "dark") as Theme;
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("smart_garage_theme", theme);
  }, [theme]);

  // Load global theme from DB and listen for realtime changes
  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await supabase
          .from("global_theme")
          .select("*")
          .eq("id", "default")
          .maybeSingle();
        if (data) applyGlobalTheme(data as any);
      } catch {}
    };
    load();

    const channel = supabase
      .channel("theme-realtime")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "global_theme" }, (payload) => {
        applyGlobalTheme(payload.new as any);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const toggleTheme = () => setThemeState(prev => prev === "dark" ? "light" : "dark");
  const setTheme = (t: Theme) => setThemeState(t);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be inside ThemeProvider");
  return ctx;
};
