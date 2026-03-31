import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Wrench, Car, Shield, MessageSquare, Bell, LogIn } from "lucide-react";
import AuthPage from "./AuthPage";

const VisitorLanding = () => {
  const navigate = useNavigate();
  const [showLogin, setShowLogin] = useState(false);

  if (showLogin) {
    return <AuthPage />;
  }

  const features = [
    { icon: Car, title: "تتبع سيارتك", desc: "تابع حالة سيارتك لحظة بلحظة" },
    { icon: Shield, title: "نظام آمن", desc: "بياناتك محمية بالكامل" },
    { icon: MessageSquare, title: "تواصل مباشر", desc: "تحدث مع الكراج مباشرة" },
    { icon: Bell, title: "إشعارات فورية", desc: "تنبيهات عند أي تحديث" },
  ];

  return (
    <div className="min-h-screen bg-background relative">
      <div className="relative z-10">
        {/* Header */}
        <header className="sticky top-0 z-50 glass-strong border-b border-border/30">
          <div className="container flex items-center justify-between h-14 px-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
                <Wrench className="w-4 h-4 text-primary" />
              </div>
              <h1 className="text-sm font-bold text-foreground">الكراج الذكي</h1>
            </div>
            <button
              onClick={() => setShowLogin(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-opacity"
            >
              <LogIn className="w-4 h-4" /> تسجيل الدخول
            </button>
          </div>
        </header>

        {/* Hero */}
        <div className="container px-4 py-16 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 mb-6 shadow-lg shadow-primary/10">
            <Wrench className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">الكراج الذكي</h1>
          <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">نظام متكامل لإدارة وتتبع سيارتك في الكراج بكل سهولة واحترافية</p>
          <button
            onClick={() => setShowLogin(true)}
            className="ios-btn-primary max-w-xs mx-auto flex items-center justify-center gap-2"
          >
            <LogIn className="w-5 h-5" /> ابدأ الآن
          </button>
        </div>

        {/* Features */}
        <div className="container px-4 pb-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="ios-card p-6 flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-foreground font-bold mb-1">{title}</h3>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Login prompt */}
        <div className="container px-4 pb-16">
          <div className="ios-card p-8 text-center max-w-md mx-auto border-2 border-dashed border-primary/30">
            <p className="text-foreground font-bold text-lg mb-2">يجب تسجيل الدخول للمتابعة</p>
            <p className="text-muted-foreground text-sm mb-4">سجّل دخولك أو أنشئ حساب جديد للوصول إلى جميع الخدمات</p>
            <button
              onClick={() => setShowLogin(true)}
              className="ios-btn-primary flex items-center justify-center gap-2"
            >
              <LogIn className="w-5 h-5" /> تسجيل الدخول
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisitorLanding;
