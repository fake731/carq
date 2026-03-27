import DashboardLayout from "@/components/DashboardLayout";
import { mockCars, mockUsers, statusLabels, statusColors } from "@/lib/mock-data";
import { Users, Car, Building2, Bell, Send, Trash2, Edit, Shield, Activity, Star, Eye } from "lucide-react";
import { useState } from "react";

type Tab = "overview" | "users" | "garages" | "cars";

const AdminDashboard = () => {
  const [tab, setTab] = useState<Tab>("overview");

  const tabs: { id: Tab; label: string; icon: typeof Users }[] = [
    { id: "overview", label: "نظرة عامة", icon: Activity },
    { id: "users", label: "المستخدمين", icon: Users },
    { id: "garages", label: "الكراجات", icon: Building2 },
    { id: "cars", label: "السيارات", icon: Car },
  ];

  const customers = mockUsers.filter((u) => u.role === "customer");
  const garages = mockUsers.filter((u) => u.role === "garage");

  return (
    <DashboardLayout title="لوحة تحكم المطور">
      <div className="space-y-6">
        {/* Admin Badge */}
        <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-2.5">
          <Shield className="w-5 h-5 text-destructive" />
          <span className="text-destructive font-bold text-sm">وضع المطور – صلاحيات كاملة</span>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-surface-2 rounded-xl p-1 overflow-x-auto">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${
                tab === id ? "bg-primary text-primary-foreground neon-glow" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === "overview" && (
          <div className="space-y-6 animate-slide-up">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "إجمالي المستخدمين", value: mockUsers.length, icon: Users, color: "text-primary" },
                { label: "الكراجات", value: garages.length, icon: Building2, color: "text-neon-orange" },
                { label: "السيارات", value: mockCars.length, icon: Car, color: "text-accent" },
                { label: "العملاء", value: customers.length, icon: Users, color: "text-neon-blue" },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="glass rounded-xl p-4">
                  <Icon className={`w-5 h-5 ${color} mb-2`} />
                  <p className="text-2xl font-bold text-foreground">{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button className="glass rounded-xl p-4 flex items-center gap-3 hover:border-primary/30 transition-colors group">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:neon-glow transition-all">
                  <Bell className="w-5 h-5 text-primary" />
                </div>
                <div className="text-right">
                  <p className="text-foreground font-bold">إرسال إشعار عام</p>
                  <p className="text-xs text-muted-foreground">لجميع المستخدمين</p>
                </div>
              </button>
              <button className="glass rounded-xl p-4 flex items-center gap-3 hover:border-accent/30 transition-colors group">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center group-hover:neon-glow-green transition-all">
                  <Send className="w-5 h-5 text-accent" />
                </div>
                <div className="text-right">
                  <p className="text-foreground font-bold">إرسال رسالة خاصة</p>
                  <p className="text-xs text-muted-foreground">لمستخدم محدد</p>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {tab === "users" && (
          <div className="space-y-3 animate-slide-up">
            {mockUsers.map((u) => (
              <div key={u.id} className="glass rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    u.role === "garage" ? "bg-neon-orange/10" : "bg-primary/10"
                  }`}>
                    {u.role === "garage" ? <Building2 className="w-5 h-5 text-neon-orange" /> : <Users className="w-5 h-5 text-primary" />}
                  </div>
                  <div>
                    <p className="text-foreground font-bold flex items-center gap-2">
                      {u.fullName}
                      {u.isPremium && <Star className="w-3.5 h-3.5 text-neon-orange" />}
                    </p>
                    <p className="text-xs text-muted-foreground">@{u.username} • {u.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-md text-[10px] font-bold border ${
                    u.role === "garage" ? "border-neon-orange/30 text-neon-orange bg-neon-orange/10" :
                    "border-primary/30 text-primary bg-primary/10"
                  }`}>
                    {u.role === "garage" ? "كراج" : "عميل"}
                  </span>
                  <button className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center hover:text-primary transition-colors text-muted-foreground">
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center hover:text-destructive transition-colors text-muted-foreground">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Garages Tab */}
        {tab === "garages" && (
          <div className="space-y-3 animate-slide-up">
            {garages.map((g) => (
              <div key={g.id} className="glass rounded-xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-foreground font-bold text-lg flex items-center gap-2">
                      {g.garageName}
                      {g.isPremium && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold border border-neon-orange/30 text-neon-orange bg-neon-orange/10 flex items-center gap-1">
                          <Star className="w-3 h-3" /> بريميوم
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">@{g.username} • {g.phone}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center hover:text-primary text-muted-foreground"><Eye className="w-4 h-4" /></button>
                    <button className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center hover:text-primary text-muted-foreground"><Edit className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="bg-surface-2 rounded-lg px-3 py-2">
                    <p className="text-xs text-muted-foreground">سيارات</p>
                    <p className="text-foreground font-bold">{mockCars.filter((c) => c.garageId === g.garageId).length}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Cars Tab */}
        {tab === "cars" && (
          <div className="space-y-3 animate-slide-up">
            {mockCars.map((car) => (
              <div key={car.id} className="glass rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-surface-2 flex items-center justify-center">
                    <Car className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-foreground font-bold">{car.make} {car.model} {car.year}</p>
                    <p className="text-xs text-muted-foreground">{car.ownerName} • {car.plateNumber}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusColors[car.status]}`}>
                  {statusLabels[car.status]}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
