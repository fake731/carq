import { Wrench } from "lucide-react";

const NotFound = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background relative z-10" dir="rtl">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto">
          <Wrench className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-4xl font-bold text-foreground">404</h1>
        <p className="text-muted-foreground">الصفحة غير موجودة</p>
        <a href="/" className="inline-block px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-sm">
          العودة للرئيسية
        </a>
      </div>
    </div>
  );
};

export default NotFound;
