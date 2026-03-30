import { ReactNode, useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Bell, LogOut, Wrench, User, MessageSquare, Home, X, Check, Sun, Moon } from "lucide-react";

interface Props {
  children: ReactNode;
  title: string;
}

const DashboardLayout = ({ children, title }: Props) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const loadNotifs = async () => {
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("recipient_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.read).length || 0);
    };
    loadNotifs();

    const channel = supabase
      .channel("notifs-" + user.id)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `recipient_id=eq.${user.id}` }, () => {
        loadNotifs();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllRead = async () => {
    await supabase.from("notifications").update({ read: true }).eq("recipient_id", user?.id).eq("read", false);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const deleteNotification = async (id: string) => {
    await supabase.from("notifications").delete().eq("id", id);
    setNotifications(prev => prev.filter(n => n.id !== id));
    setUnreadCount(prev => {
      const notif = notifications.find(n => n.id === id);
      return notif && !notif.read ? Math.max(0, prev - 1) : prev;
    });
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const navItems = [
    { path: "/لوحة-التحكم", icon: Home, label: "الرئيسية" },
    { path: "/المحادثات", icon: MessageSquare, label: "الشات" },
    { path: "/الملف-الشخصي", icon: User, label: "الملف" },
  ];

  const isActivePath = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background bg-animated">
      {/* Header */}
      <header className="sticky top-0 z-50 glass-strong border-b border-border/30">
        <div className="container flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <Wrench className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-sm font-bold text-foreground">{title}</h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="w-9 h-9 rounded-xl bg-surface-2 flex items-center justify-center hover:bg-surface-3 transition-colors text-muted-foreground"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setShowNotifs(!showNotifs)}
              className="relative w-9 h-9 rounded-xl bg-surface-2 flex items-center justify-center hover:bg-surface-3 transition-colors"
            >
              <Bell className="w-4 h-4 text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse-soft">
                  {unreadCount}
                </span>
              )}
            </button>

            <div className="hidden sm:flex items-center gap-2 bg-surface-2 rounded-xl px-3 py-1.5">
              <span className="text-sm text-foreground font-bold">{user?.full_name}</span>
            </div>

            <button onClick={handleLogout} className="w-9 h-9 rounded-xl bg-surface-2 flex items-center justify-center hover:bg-destructive/10 hover:text-destructive transition-colors text-muted-foreground">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Notifications Panel */}
      {showNotifs && (
        <div className="fixed inset-0 z-[60] flex justify-end" onClick={() => setShowNotifs(false)}>
          <div className="absolute inset-0 bg-foreground/10 backdrop-blur-sm" />
          <div className="relative w-full max-w-sm h-full bg-background border-r border-border shadow-2xl overflow-y-auto animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-background/95 backdrop-blur-xl border-b border-border p-4 flex items-center justify-between">
              <h3 className="font-bold text-foreground">الإشعارات</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-xs text-primary hover:underline flex items-center gap-1">
                    <Check className="w-3 h-3" /> قراءة الكل
                  </button>
                )}
                <button onClick={() => setShowNotifs(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-3 space-y-2">
              {notifications.length === 0 ? (
                <p className="text-center text-muted-foreground py-8 text-sm">لا توجد إشعارات</p>
              ) : notifications.map(n => (
                <div
                  key={n.id}
                  className={`rounded-2xl p-4 transition-all ${
                    n.read ? "bg-surface-2" : "bg-primary/5 border border-primary/15"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {!n.read && <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0 animate-pulse-soft" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground">{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-2">{new Date(n.created_at).toLocaleString("ar-OM")}</p>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      {!n.read && (
                        <button onClick={() => markRead(n.id)} className="text-[10px] text-primary hover:underline">قراءة</button>
                      )}
                      <button onClick={() => deleteNotification(n.id)} className="text-[10px] text-destructive hover:underline">حذف</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container px-4 py-6 relative z-10 pb-24">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 inset-x-0 z-50 glass-strong border-t border-border/30 pb-safe">
        <div className="container flex items-center justify-around h-16 px-4">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = isActivePath(path);
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-all ${
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-primary" : ""}`} />
                <span className="text-[10px] font-bold">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default DashboardLayout;
