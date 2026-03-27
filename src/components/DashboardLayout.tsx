import { ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";
import { useNavigate } from "react-router-dom";
import { Bell, LogOut, Wrench, User, Settings, Car, LayoutDashboard } from "lucide-react";
import { mockNotifications } from "@/lib/mock-data";

interface Props {
  children: ReactNode;
  title: string;
}

const DashboardLayout = ({ children, title }: Props) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const unreadCount = mockNotifications.filter((n) => !n.read).length;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const roleLabel = user?.role === "admin" ? "المطور" : user?.role === "garage" ? "كراج" : "عميل";

  return (
    <div className="min-h-screen bg-background">
      {/* Top Nav */}
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
            {/* Notifications */}
            <button className="relative w-9 h-9 rounded-lg bg-surface-2 border border-border flex items-center justify-center hover:border-primary/30 transition-colors">
              <Bell className="w-4 h-4 text-muted-foreground" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* User info */}
            <div className="hidden sm:flex items-center gap-2 bg-surface-2 border border-border rounded-lg px-3 py-1.5">
              <User className="w-4 h-4 text-primary" />
              <span className="text-sm text-foreground">{user?.fullName}</span>
            </div>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-9 h-9 rounded-lg bg-surface-2 border border-border flex items-center justify-center hover:border-destructive/30 hover:text-destructive transition-colors text-muted-foreground"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="container px-4 py-6">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
