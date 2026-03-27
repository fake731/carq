import { ReactNode, useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Bell, LogOut, Wrench, User, Car } from "lucide-react";

interface Props {
  children: ReactNode;
  title: string;
}

const DashboardLayout = ({ children, title }: Props) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const loadUnread = async () => {
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("recipient_id", user.id)
        .eq("read", false);
      setUnreadCount(count || 0);
    };
    loadUnread();
    const interval = setInterval(loadUnread, 15000);
    return () => clearInterval(interval);
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const roleLabel = user?.role === "admin" ? "المطور" : user?.role === "garage" ? "كراج" : "عميل";
  const roleIcon = user?.role === "garage" ? Car : user?.role === "admin" ? Wrench : User;
  const RoleIcon = roleIcon;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 glass-strong border-b border-border/50">
        <div className="container flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center">
              <Wrench className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">{title}</h2>
              <span className="text-xs text-muted-foreground">{roleLabel}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative w-9 h-9 rounded-lg bg-surface-2 border border-border flex items-center justify-center hover:border-primary/30 transition-colors">
              <Bell className="w-4 h-4 text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            <div className="hidden sm:flex items-center gap-2 bg-surface-2 border border-border rounded-lg px-3 py-1.5">
              <RoleIcon className="w-4 h-4 text-primary" />
              <span className="text-sm text-foreground">{user?.full_name}</span>
            </div>

            <button onClick={handleLogout} className="w-9 h-9 rounded-lg bg-surface-2 border border-border flex items-center justify-center hover:border-destructive/30 hover:text-destructive transition-colors text-muted-foreground">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
