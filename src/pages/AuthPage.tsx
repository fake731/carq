import { useState } from "react";
import { useAuth, Profile } from "@/lib/auth-context";
import { useNavigate } from "react-router-dom";
import { Wrench, Loader2, Shield, HelpCircle, Download, CheckCircle2, AlertCircle } from "lucide-react";

const AuthPage = () => {
  const [mode, setMode] = useState<"login" | "register" | "recover">("login");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Profile[]>([]);
  const [credentials, setCredentials] = useState<{ username: string; password: string } | null>(null);
  const [recoveredProfile, setRecoveredProfile] = useState<Profile | null>(null);
  const [pendingApproval, setPendingApproval] = useState(false);
  const [verifyCode, setVerifyCode] = useState("");
  const [recoverStep, setRecoverStep] = useState<"search" | "verify">("search");
  const [recoverIdentifier, setRecoverIdentifier] = useState("");
  const { login, loginWithProfile, register, recoverAccount } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuggestions([]);
    setIsLoading(true);
    try {
      const result = await login(identifier, password);
      if (result.success) {
        navigate("/لوحة-التحكم");
      } else {
        if (result.suggestions && result.suggestions.length > 0) {
          setSuggestions(result.suggestions);
        }
        setError(result.error || "");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSuggestion = (profile: Profile) => {
    if (!profile.approved) {
      setError("حسابك قيد المراجعة من قبل الإدارة");
      return;
    }
    loginWithProfile(profile);
    navigate("/لوحة-التحكم");
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
      const result = await register(fullName, phone);
      if (result.success && 'username' in result) {
        setCredentials({ username: result.username, password: result.password });
        setPendingApproval(true);
      } else if (!result.success && 'error' in result) {
        setError(result.error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecoverSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!identifier.trim()) { setError("الرجاء إدخال الاسم أو رقم الهاتف"); return; }
    setRecoverIdentifier(identifier.trim());
    setRecoverStep("verify");
  };

  const handleRecoverVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const result = await recoverAccount(recoverIdentifier, verifyCode);
      if (result.success && result.profile) {
        setRecoveredProfile(result.profile);
      } else {
        setError(result.error || "فشل التحقق");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const exportCredentials = (username: string, pwd: string) => {
    const content = `
═══════════════════════════════════════
       الكراج الذكي - بيانات الدخول
       Smart Garage - Login Credentials
═══════════════════════════════════════

  اسم المستخدم: ${username}
  كلمة المرور: ${pwd}

═══════════════════════════════════════
  احتفظ بهذا الملف في مكان آمن
  Keep this file in a safe place
═══════════════════════════════════════
`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `smart-garage-credentials-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background relative flex items-center justify-center p-4">
      <div className="relative z-10 w-full max-w-md animate-slide-up">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-primary/10 border border-primary/20 mb-4 shadow-lg shadow-primary/10">
            <Wrench className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">الكراج الذكي</h1>
          <p className="text-muted-foreground mt-1 text-sm">تتبع سيارتك بكل سهولة</p>
        </div>

        {/* Credentials Display */}
        {credentials && (
          <div className="ios-card p-8 text-center space-y-5 animate-slide-up">
            <div className="w-16 h-16 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto">
              {pendingApproval ? <AlertCircle className="w-8 h-8 text-neon-orange" /> : <Shield className="w-8 h-8 text-accent" />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">
                {pendingApproval ? "تم إرسال طلب التسجيل" : "تم التسجيل بنجاح"}
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                {pendingApproval
                  ? "سيتم مراجعة حسابك من قبل الإدارة وتفعيله"
                  : "احفظ بياناتك للدخول لاحقاً"}
              </p>
            </div>
            <div className="space-y-3 bg-surface-2 rounded-2xl p-5">
              <div className="flex justify-between items-center">
                <span className="text-primary font-bold text-lg">{credentials.username}</span>
                <span className="text-muted-foreground text-xs">الاسم</span>
              </div>
              <div className="border-t border-border" />
              <div className="flex justify-between items-center">
                <span className="text-primary font-bold text-lg" dir="ltr">{credentials.password}</span>
                <span className="text-muted-foreground text-xs">كلمة المرور</span>
              </div>
            </div>
            <button
              onClick={() => exportCredentials(credentials.username, credentials.password)}
              className="ios-btn-secondary flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" /> تصدير البيانات إلى جهازك
            </button>
            <button
              onClick={() => { setCredentials(null); setPendingApproval(false); setMode("login"); }}
              className="ios-btn-primary"
            >
              الذهاب لتسجيل الدخول
            </button>
          </div>
        )}

        {/* Recovered Profile */}
        {recoveredProfile && !credentials && (
          <div className="ios-card p-8 text-center space-y-5 animate-slide-up">
            <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground">تم العثور على حسابك</h2>
            <div className="space-y-3 bg-surface-2 rounded-2xl p-5">
              <div className="flex justify-between items-center">
                <span className="text-foreground font-bold">{recoveredProfile.full_name}</span>
                <span className="text-muted-foreground text-xs">الاسم</span>
              </div>
              <div className="border-t border-border" />
              <div className="flex justify-between items-center">
                <span className="text-foreground font-bold" dir="ltr">{recoveredProfile.phone}</span>
                <span className="text-muted-foreground text-xs">رقم الهاتف / كلمة المرور</span>
              </div>
            </div>
            <button
              onClick={() => exportCredentials(recoveredProfile.full_name, recoveredProfile.phone)}
              className="ios-btn-secondary flex items-center justify-center gap-2"
            >
              <Download className="w-5 h-5" /> تصدير البيانات
            </button>
            <button
              onClick={() => { setRecoveredProfile(null); setRecoverStep("search"); setVerifyCode(""); setMode("login"); }}
              className="ios-btn-primary"
            >
              الذهاب لتسجيل الدخول
            </button>
          </div>
        )}

        {/* Auth Forms */}
        {!credentials && !recoveredProfile && (
          <div className="ios-card p-6 space-y-5">
            {/* Tabs */}
            <div className="flex gap-1 bg-surface-2 rounded-2xl p-1">
              {[
                { id: "login" as const, label: "تسجيل الدخول" },
                { id: "register" as const, label: "حساب جديد" },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => { setMode(t.id); setError(""); setSuggestions([]); }}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${
                    mode === t.id
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Red Notice */}
            <div className="flex items-start gap-2 bg-destructive/8 border border-destructive/20 rounded-2xl px-4 py-3">
              <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-destructive text-xs leading-relaxed">
                الرجاء إدخال المعلومات كما تم تسجيلها أو إدخال معلومات جديدة وسيتم مراجعتها من قبل الإدارة
              </p>
            </div>

            {mode === "login" && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">الاسم الرباعي أو اسم المستخدم</label>
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="ios-input"
                    placeholder="أدخل اسمك الرباعي"
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">كلمة المرور</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="ios-input"
                    placeholder="أدخل كلمة المرور"
                    dir="ltr"
                  />
                </div>

                {/* Suggestions */}
                {suggestions.length > 0 && (
                  <div className="space-y-2 animate-slide-up">
                    <p className="text-sm text-muted-foreground">هل تقصد أحد هؤلاء؟</p>
                    {suggestions.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => handleSelectSuggestion(s)}
                        className="w-full flex items-center justify-between bg-surface-2 hover:bg-surface-3 rounded-2xl p-4 transition-all"
                      >
                        <span className="text-foreground font-bold">{s.full_name}</span>
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      </button>
                    ))}
                  </div>
                )}

                {error && <p className="text-destructive text-sm text-center">{error}</p>}

                <button type="submit" disabled={isLoading} className="ios-btn-primary flex items-center justify-center gap-2">
                  {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> جاري الدخول...</> : "دخول"}
                </button>

                <button
                  type="button"
                  onClick={() => { setMode("recover"); setError(""); setRecoverStep("search"); setVerifyCode(""); }}
                  className="w-full text-center text-sm text-primary hover:underline flex items-center justify-center gap-1"
                >
                  <HelpCircle className="w-4 h-4" /> نسيت بياناتك؟
                </button>
              </form>
            )}

            {mode === "register" && (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">الاسم الرباعي</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="ios-input"
                    placeholder="مثال: أحمد بن سعيد بن خالد الحارثي"
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">رقم الهاتف (سيكون كلمة المرور)</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="ios-input"
                    placeholder="مثال: 96812345 أو +96896812345"
                    dir="ltr"
                  />
                </div>
                {error && <p className="text-destructive text-sm text-center">{error}</p>}
                <button type="submit" disabled={isLoading} className="ios-btn-primary flex items-center justify-center gap-2">
                  {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> جاري التسجيل...</> : "تسجيل"}
                </button>
              </form>
            )}

            {mode === "recover" && recoverStep === "search" && (
              <form onSubmit={handleRecoverSearch} className="space-y-4 animate-slide-up">
                <p className="text-sm text-muted-foreground text-center">أدخل اسمك أو رقم هاتفك لاسترجاع بياناتك</p>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="ios-input"
                  placeholder="الاسم أو رقم الهاتف"
                />
                {error && <p className="text-destructive text-sm text-center">{error}</p>}
                <button type="submit" className="ios-btn-primary">التالي</button>
                <button type="button" onClick={() => { setMode("login"); setError(""); }} className="w-full text-center text-sm text-primary hover:underline">
                  الرجوع لتسجيل الدخول
                </button>
              </form>
            )}

            {mode === "recover" && recoverStep === "verify" && (
              <form onSubmit={handleRecoverVerify} className="space-y-4 animate-slide-up">
                <p className="text-sm text-muted-foreground text-center">للتأكد من هويتك، أدخل أول 4 أرقام من كلمة المرور أو رقم الهاتف</p>
                <input
                  type="text"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value)}
                  className="ios-input text-center text-2xl tracking-widest"
                  placeholder="_ _ _ _"
                  dir="ltr"
                  maxLength={4}
                />
                {error && <p className="text-destructive text-sm text-center">{error}</p>}
                <button type="submit" disabled={isLoading} className="ios-btn-primary flex items-center justify-center gap-2">
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "تحقق"}
                </button>
                <button type="button" onClick={() => { setRecoverStep("search"); setError(""); }} className="w-full text-center text-sm text-primary hover:underline">
                  رجوع
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthPage;
