import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { Navigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Palette, Type, Sun, Moon, Check, RotateCcw } from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import { toast } from "sonner";

interface ThemeConfig {
  primaryColor: string;
  accentColor: string;
  fontScale: number;
  borderRadius: number;
}

const COLOR_PRESETS = [
  { name: "أزرق", value: "211 100% 50%" },
  { name: "بنفسجي", value: "270 80% 55%" },
  { name: "أخضر", value: "145 72% 42%" },
  { name: "برتقالي", value: "30 100% 55%" },
  { name: "أحمر", value: "0 85% 55%" },
  { name: "وردي", value: "330 80% 55%" },
  { name: "سماوي", value: "190 90% 50%" },
  { name: "ذهبي", value: "45 100% 50%" },
  { name: "نيلي", value: "240 70% 55%" },
  { name: "زمردي", value: "160 84% 39%" },
  { name: "فيروزي", value: "174 72% 46%" },
  { name: "كرزي", value: "350 80% 50%" },
];

const ACCENT_PRESETS = [
  { name: "أخضر", value: "145 72% 42%" },
  { name: "برتقالي", value: "30 100% 55%" },
  { name: "أزرق", value: "211 100% 50%" },
  { name: "بنفسجي", value: "270 80% 55%" },
  { name: "وردي", value: "330 80% 55%" },
  { name: "ذهبي", value: "45 100% 50%" },
];

const FONT_SCALES = [
  { label: "صغير", value: 0.85 },
  { label: "عادي", value: 1 },
  { label: "متوسط", value: 1.1 },
  { label: "كبير", value: 1.2 },
  { label: "كبير جداً", value: 1.35 },
];

const RADIUS_OPTIONS = [
  { label: "حاد", value: 0.25 },
  { label: "خفيف", value: 0.5 },
  { label: "عادي", value: 1 },
  { label: "مستدير", value: 1.5 },
  { label: "كامل", value: 2 },
];

const DEFAULT_CONFIG: ThemeConfig = {
  primaryColor: "211 100% 50%",
  accentColor: "145 72% 42%",
  fontScale: 1,
  borderRadius: 1,
};

const ThemesPage = () => {
  const { isAuthenticated, loading, hasPermission } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [config, setConfig] = useState<ThemeConfig>(() => {
    try {
      const saved = localStorage.getItem("smart_garage_theme_config");
      return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
    } catch {
      return DEFAULT_CONFIG;
    }
  });

  useEffect(() => {
    applyTheme(config);
  }, [config]);

  const applyTheme = (c: ThemeConfig) => {
    const root = document.documentElement;
    root.style.setProperty("--primary", c.primaryColor);
    root.style.setProperty("--ring", c.primaryColor);
    root.style.setProperty("--accent", c.accentColor);
    root.style.setProperty("--neon-cyan", c.primaryColor);
    root.style.setProperty("--sidebar-primary", c.primaryColor);
    root.style.setProperty("--sidebar-ring", c.primaryColor);
    root.style.fontSize = `${c.fontScale * 16}px`;
    root.style.setProperty("--radius", `${c.borderRadius}rem`);
    localStorage.setItem("smart_garage_theme_config", JSON.stringify(c));
  };

  const resetTheme = () => {
    setConfig(DEFAULT_CONFIG);
    toast.success("تم إعادة الإعدادات الافتراضية");
  };

  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/تسجيل-الدخول" replace />;
  if (!hasPermission("edit_themes")) return <Navigate to="/لوحة-التحكم" replace />;

  return (
    <DashboardLayout title="الثيمات">
      <div className="max-w-2xl mx-auto space-y-6 animate-slide-up">
        {/* Dark/Light Toggle */}
        <div className="ios-card p-6">
          <h3 className="font-bold text-foreground text-lg mb-4 flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" /> وضع العرض
          </h3>
          <div className="flex gap-3">
            <button
              onClick={() => theme !== "dark" && toggleTheme()}
              className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                theme === "dark" ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              <Moon className={`w-5 h-5 ${theme === "dark" ? "text-primary" : "text-muted-foreground"}`} />
              <span className={`font-bold ${theme === "dark" ? "text-primary" : "text-muted-foreground"}`}>داكن</span>
              {theme === "dark" && <Check className="w-4 h-4 text-primary" />}
            </button>
            <button
              onClick={() => theme !== "light" && toggleTheme()}
              className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                theme === "light" ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              <Sun className={`w-5 h-5 ${theme === "light" ? "text-primary" : "text-muted-foreground"}`} />
              <span className={`font-bold ${theme === "light" ? "text-primary" : "text-muted-foreground"}`}>فاتح</span>
              {theme === "light" && <Check className="w-4 h-4 text-primary" />}
            </button>
          </div>
        </div>

        {/* Primary Color */}
        <div className="ios-card p-6">
          <h3 className="font-bold text-foreground text-lg mb-4 flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" /> اللون الرئيسي
          </h3>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
            {COLOR_PRESETS.map((c) => (
              <button
                key={c.value}
                onClick={() => setConfig({ ...config, primaryColor: c.value })}
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${
                  config.primaryColor === c.value ? "border-primary shadow-lg" : "border-border hover:border-primary/30"
                }`}
              >
                <div
                  className="w-10 h-10 rounded-full shadow-md"
                  style={{ backgroundColor: `hsl(${c.value})` }}
                />
                <span className="text-[10px] text-muted-foreground font-bold">{c.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Accent Color */}
        <div className="ios-card p-6">
          <h3 className="font-bold text-foreground text-lg mb-4">لون التمييز</h3>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {ACCENT_PRESETS.map((c) => (
              <button
                key={c.value}
                onClick={() => setConfig({ ...config, accentColor: c.value })}
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${
                  config.accentColor === c.value ? "border-accent shadow-lg" : "border-border hover:border-accent/30"
                }`}
              >
                <div
                  className="w-10 h-10 rounded-full shadow-md"
                  style={{ backgroundColor: `hsl(${c.value})` }}
                />
                <span className="text-[10px] text-muted-foreground font-bold">{c.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Font Scale */}
        <div className="ios-card p-6">
          <h3 className="font-bold text-foreground text-lg mb-4 flex items-center gap-2">
            <Type className="w-5 h-5 text-primary" /> حجم الخط
          </h3>
          <div className="flex gap-2">
            {FONT_SCALES.map((f) => (
              <button
                key={f.value}
                onClick={() => setConfig({ ...config, fontScale: f.value })}
                className={`flex-1 py-3 rounded-2xl border-2 text-sm font-bold transition-all ${
                  config.fontScale === f.value
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/30"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <p className="text-center mt-3 text-foreground" style={{ fontSize: `${config.fontScale * 16}px` }}>
            معاينة حجم الخط
          </p>
        </div>

        {/* Border Radius */}
        <div className="ios-card p-6">
          <h3 className="font-bold text-foreground text-lg mb-4">استدارة الحواف</h3>
          <div className="flex gap-2">
            {RADIUS_OPTIONS.map((r) => (
              <button
                key={r.value}
                onClick={() => setConfig({ ...config, borderRadius: r.value })}
                className={`flex-1 py-3 border-2 text-sm font-bold transition-all ${
                  config.borderRadius === r.value
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/30"
                }`}
                style={{ borderRadius: `${r.value}rem` }}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Reset */}
        <button
          onClick={resetTheme}
          className="w-full ios-card p-4 flex items-center justify-center gap-2 text-destructive font-bold hover:shadow-md transition-shadow"
        >
          <RotateCcw className="w-5 h-5" /> إعادة الإعدادات الافتراضية
        </button>
      </div>
    </DashboardLayout>
  );
};

export default ThemesPage;
