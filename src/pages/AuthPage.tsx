import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useNavigate } from "react-router-dom";
import garageBg from "@/assets/garage-bg.jpg";
import { Car, Wrench, Shield, Loader2 } from "lucide-react";

const AuthPage = () => {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [credentials, setCredentials] = useState<{ username: string; password: string } | null>(null);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const success = await login(username, password);
      if (success) {
        navigate("/dashboard");
      } else {
        setError("اسم المستخدم أو كلمة المرور غلط");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!fullName.trim() || !phone.trim()) {
      setError("الرجاء تعبئة جميع الحقول");
      return;
    }
    setIsLoading(true);
    try {
      const creds = await register(fullName, phone);
      if (creds) {
        setCredentials(creds);
      } else {
        setError("حدث خطأ أثناء التسجيل");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    setCredentials(null);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <img src={garageBg} alt="" className="w-full h-full object-cover" width={1920} height={1080} />
        <div className="absolute inset-0 bg-background/85 backdrop-blur-sm" />
      </div>

      <div className="relative z-10 w-full max-w-md mx-4 animate-slide-up">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center neon-glow">
              <Wrench className="w-7 h-7 text-primary" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-foreground neon-text">الكراج الذكي</h1>
          <p className="text-muted-foreground mt-2">تتبع سيارتك بكل سهولة</p>
        </div>

        {credentials && (
          <div className="glass-strong rounded-2xl p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center mx-auto neon-glow-green">
              <Shield className="w-8 h-8 text-accent" />
            </div>
            <h2 className="text-xl font-bold text-foreground">تم التسجيل بنجاح!</h2>
            <p className="text-muted-foreground text-sm">احفظ بياناتك للدخول لاحقاً</p>
            <div className="space-y-3 bg-surface-2 rounded-xl p-4">
              <div className="flex justify-between items-center">
                <span className="text-primary font-mono text-lg">{credentials.username}</span>
                <span className="text-muted-foreground text-sm">اسم المستخدم</span>
              </div>
              <div className="border-t border-border" />
              <div className="flex justify-between items-center">
                <span className="text-primary font-mono text-lg">{credentials.password}</span>
                <span className="text-muted-foreground text-sm">كلمة المرور</span>
              </div>
            </div>
            <button onClick={handleContinue} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-lg hover:opacity-90 transition-opacity neon-glow">
              متابعة
            </button>
          </div>
        )}

        {!credentials && (
          <div className="glass-strong rounded-2xl p-8">
            <div className="flex gap-1 mb-6 bg-surface-2 rounded-xl p-1">
              <button onClick={() => { setMode("login"); setError(""); }} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${mode === "login" ? "bg-primary text-primary-foreground neon-glow" : "text-muted-foreground hover:text-foreground"}`}>
                تسجيل الدخول
              </button>
              <button onClick={() => { setMode("register"); setError(""); }} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${mode === "register" ? "bg-primary text-primary-foreground neon-glow" : "text-muted-foreground hover:text-foreground"}`}>
                حساب جديد
              </button>
            </div>

            {mode === "login" ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">اسم المستخدم</label>
                  <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all" placeholder="أدخل اسم المستخدم" />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">كلمة المرور</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all" placeholder="أدخل كلمة المرور" />
                </div>
                {error && <p className="text-destructive text-sm">{error}</p>}
                <button type="submit" disabled={isLoading} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-lg hover:opacity-90 transition-opacity neon-glow disabled:opacity-50 flex items-center justify-center gap-2">
                  {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> جاري الدخول...</> : "دخول"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">الاسم الرباعي</label>
                  <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all" placeholder="مثال: أحمد بن سعيد بن خالد الحارثي" />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">رقم الهاتف</label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all" placeholder="مثال: 96812345" dir="ltr" />
                </div>
                {error && <p className="text-destructive text-sm">{error}</p>}
                <button type="submit" disabled={isLoading} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-lg hover:opacity-90 transition-opacity neon-glow disabled:opacity-50 flex items-center justify-center gap-2">
                  {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> جاري التسجيل...</> : "تسجيل"}
                </button>
              </form>
            )}
          </div>
        )}

        <div className="flex justify-center gap-6 mt-6">
          {[
            { icon: Car, label: "تتبع مباشر" },
            { icon: Wrench, label: "تحديثات فورية" },
            { icon: Shield, label: "آمن ومحمي" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 text-muted-foreground text-xs">
              <Icon className="w-3.5 h-3.5 text-primary" />
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
