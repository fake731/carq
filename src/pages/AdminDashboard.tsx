import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { statusLabels, statusColors, CarStatus } from "@/lib/mock-data";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Users, Car, Building2, Bell, Send, Trash2, Edit, Shield, Activity, Star, Eye, Loader2, X, Search, RefreshCw, MessageSquare, Phone, Clock } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";

type Tab = "overview" | "users" | "garages" | "cars" | "notifications";
type ProfileRow = Tables<"profiles">;
type CarRow = Tables<"cars">;
type NotificationRow = Tables<"notifications">;

const AdminDashboard = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");
  const [users, setUsers] = useState<ProfileRow[]>([]);
  const [cars, setCars] = useState<CarRow[]>([]);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Notification form
  const [showNotifForm, setShowNotifForm] = useState(false);
  const [notifTitle, setNotifTitle] = useState("");
  const [notifMessage, setNotifMessage] = useState("");
  const [notifTarget, setNotifTarget] = useState<"all" | "specific">("all");
  const [notifRecipientId, setNotifRecipientId] = useState("");

  const tabs: { id: Tab; label: string; icon: typeof Users }[] = [
    { id: "overview", label: "نظرة عامة", icon: Activity },
    { id: "users", label: "المستخدمين", icon: Users },
    { id: "garages", label: "الكراجات", icon: Building2 },
    { id: "cars", label: "السيارات", icon: Car },
    { id: "notifications", label: "الإشعارات", icon: Bell },
  ];

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    const [usersRes, carsRes, notifsRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("cars").select("*").order("created_at", { ascending: false }),
      supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(50),
    ]);
    setUsers(usersRes.data || []);
    setCars(carsRes.data || []);
    setNotifications(notifsRes.data || []);
    setLoading(false);
  };

  const deleteUser = async (id: string) => {
    if (id === user?.id) { toast.error("لا يمكنك حذف نفسك"); return; }
    await supabase.from("profiles").delete().eq("id", id);
    toast.success("تم حذف المستخدم");
    loadAll();
  };

  const deleteCar = async (id: string) => {
    await supabase.from("cars").delete().eq("id", id);
    toast.success("تم حذف السيارة");
    loadAll();
  };

  const sendNotification = async () => {
    if (!notifTitle.trim() || !notifMessage.trim()) {
      toast.error("الرجاء تعبئة العنوان والرسالة");
      return;
    }
    if (notifTarget === "all") {
      const allUsers = users.filter(u => u.role !== "admin");
      const inserts = allUsers.map(u => ({
        recipient_id: u.id, sender_id: user?.id || null,
        title: notifTitle, message: notifMessage, type: "system" as const,
      }));
      await supabase.from("notifications").insert(inserts);
      toast.success(`تم إرسال الإشعار لـ ${allUsers.length} مستخدم`);
    } else {
      if (!notifRecipientId) { toast.error("اختر المستخدم"); return; }
      await supabase.from("notifications").insert({
        recipient_id: notifRecipientId, sender_id: user?.id || null,
        title: notifTitle, message: notifMessage, type: "system",
      });
      toast.success("تم إرسال الإشعار");
    }
    setNotifTitle("");
    setNotifMessage("");
    setShowNotifForm(false);
    loadAll();
  };

  const customers = users.filter(u => u.role === "customer");
  const garages = users.filter(u => u.role === "garage");

  const filteredUsers = searchQuery
    ? users.filter(u => u.full_name.includes(searchQuery) || u.username.includes(searchQuery) || u.phone.includes(searchQuery))
    : users;

  if (loading) {
    return <DashboardLayout title="لوحة تحكم المطور"><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div></DashboardLayout>;
  }

  return (
    <DashboardLayout title="لوحة تحكم المطور">
      <div className="space-y-6">
        {/* Admin Badge */}
        <div className="flex items-center justify-between bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-2.5">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-destructive" />
            <span className="text-destructive font-bold text-sm">وضع المطور – صلاحيات كاملة</span>
          </div>
          <button onClick={loadAll} className="text-muted-foreground hover:text-foreground transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-surface-2 rounded-xl p-1 overflow-x-auto">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${tab === id ? "bg-primary text-primary-foreground neon-glow" : "text-muted-foreground hover:text-foreground"}`}>
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {/* Overview */}
        {tab === "overview" && (
          <div className="space-y-6 animate-slide-up">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "إجمالي المستخدمين", value: users.length, icon: Users, color: "text-primary" },
                { label: "الكراجات", value: garages.length, icon: Building2, color: "text-neon-orange" },
                { label: "السيارات", value: cars.length, icon: Car, color: "text-accent" },
                { label: "العملاء", value: customers.length, icon: Users, color: "text-neon-blue" },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="glass rounded-xl p-5">
                  <Icon className={`w-6 h-6 ${color} mb-3`} />
                  <p className="text-3xl font-bold text-foreground">{value}</p>
                  <p className="text-sm text-muted-foreground mt-1">{label}</p>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button onClick={() => { setShowNotifForm(true); setNotifTarget("all"); }} className="glass rounded-xl p-5 flex items-center gap-3 hover:border-primary/30 transition-colors group">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:neon-glow transition-all">
                  <Bell className="w-6 h-6 text-primary" />
                </div>
                <div className="text-right">
                  <p className="text-foreground font-bold text-lg">إرسال إشعار عام</p>
                  <p className="text-sm text-muted-foreground">لجميع المستخدمين</p>
                </div>
              </button>
              <button onClick={() => { setShowNotifForm(true); setNotifTarget("specific"); }} className="glass rounded-xl p-5 flex items-center gap-3 hover:border-accent/30 transition-colors group">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center group-hover:neon-glow-green transition-all">
                  <Send className="w-6 h-6 text-accent" />
                </div>
                <div className="text-right">
                  <p className="text-foreground font-bold text-lg">إرسال رسالة خاصة</p>
                  <p className="text-sm text-muted-foreground">لمستخدم محدد</p>
                </div>
              </button>
            </div>

            {/* Recent registrations */}
            <div className="glass rounded-xl p-5">
              <h3 className="text-foreground font-bold text-lg mb-4">آخر التسجيلات</h3>
              <div className="space-y-3">
                {customers.slice(0, 5).map(u => (
                  <div key={u.id} className="flex items-center justify-between bg-surface-2 rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-foreground font-bold text-sm">{u.full_name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" /> {u.phone}</p>
                      </div>
                    </div>
                    <div className="text-left">
                      <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(u.created_at).toLocaleDateString("ar-OM")}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Notification Form */}
        {showNotifForm && (
          <div className="glass rounded-xl p-5 space-y-4 animate-slide-up">
            <div className="flex items-center justify-between">
              <h3 className="text-foreground font-bold text-lg">{notifTarget === "all" ? "إشعار عام" : "رسالة خاصة"}</h3>
              <button onClick={() => setShowNotifForm(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>
            {notifTarget === "specific" && (
              <select value={notifRecipientId} onChange={e => setNotifRecipientId(e.target.value)} className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:border-primary">
                <option value="">اختر المستخدم</option>
                {users.filter(u => u.role !== "admin").map(u => (
                  <option key={u.id} value={u.id}>{u.full_name} ({u.phone})</option>
                ))}
              </select>
            )}
            <input placeholder="عنوان الإشعار" value={notifTitle} onChange={e => setNotifTitle(e.target.value)} className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary" />
            <textarea placeholder="الرسالة..." value={notifMessage} onChange={e => setNotifMessage(e.target.value)} rows={3} className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary resize-none" />
            <button onClick={sendNotification} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-90 transition-opacity neon-glow flex items-center justify-center gap-2">
              <Send className="w-5 h-5" /> إرسال
            </button>
          </div>
        )}

        {/* Users Tab */}
        {tab === "users" && (
          <div className="space-y-4 animate-slide-up">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input placeholder="بحث بالاسم، اليوزر، أو رقم الهاتف..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-surface-2 border border-border rounded-xl pr-10 pl-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary" />
            </div>
            <p className="text-muted-foreground text-sm">{filteredUsers.length} مستخدم</p>
            {filteredUsers.map(u => (
              <div key={u.id} className="glass rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${u.role === "garage" ? "bg-neon-orange/10" : u.role === "admin" ? "bg-destructive/10" : "bg-primary/10"}`}>
                    {u.role === "garage" ? <Building2 className="w-5 h-5 text-neon-orange" /> : u.role === "admin" ? <Shield className="w-5 h-5 text-destructive" /> : <Users className="w-5 h-5 text-primary" />}
                  </div>
                  <div>
                    <p className="text-foreground font-bold flex items-center gap-2">
                      {u.full_name}
                      {u.is_premium && <Star className="w-3.5 h-3.5 text-neon-orange" />}
                    </p>
                    <p className="text-xs text-muted-foreground">@{u.username} • {u.phone}</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(u.created_at).toLocaleString("ar-OM")}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-md text-[10px] font-bold border ${
                    u.role === "garage" ? "border-neon-orange/30 text-neon-orange bg-neon-orange/10" :
                    u.role === "admin" ? "border-destructive/30 text-destructive bg-destructive/10" :
                    "border-primary/30 text-primary bg-primary/10"
                  }`}>
                    {u.role === "garage" ? "كراج" : u.role === "admin" ? "أدمن" : "عميل"}
                  </span>
                  {u.role !== "admin" && (
                    <button onClick={() => deleteUser(u.id)} className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center hover:text-destructive transition-colors text-muted-foreground">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Garages Tab */}
        {tab === "garages" && (
          <div className="space-y-4 animate-slide-up">
            {garages.map(g => {
              const garageCars = cars.filter(c => c.garage_id === g.garage_id);
              return (
                <div key={g.id} className="glass rounded-xl p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-foreground font-bold text-lg flex items-center gap-2">
                        {g.garage_name || g.full_name}
                        {g.is_premium && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold border border-neon-orange/30 text-neon-orange bg-neon-orange/10 flex items-center gap-1">
                            <Star className="w-3 h-3" /> بريميوم
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">@{g.username} • {g.phone}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="bg-surface-2 rounded-lg px-4 py-3">
                      <p className="text-xs text-muted-foreground">السيارات</p>
                      <p className="text-foreground font-bold text-xl">{garageCars.length}</p>
                    </div>
                    <div className="bg-surface-2 rounded-lg px-4 py-3">
                      <p className="text-xs text-muted-foreground">قيد التصليح</p>
                      <p className="text-foreground font-bold text-xl">{garageCars.filter(c => c.status === "repairing").length}</p>
                    </div>
                    <div className="bg-surface-2 rounded-lg px-4 py-3">
                      <p className="text-xs text-muted-foreground">جاهزة</p>
                      <p className="text-foreground font-bold text-xl">{garageCars.filter(c => c.status === "ready").length}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Cars Tab */}
        {tab === "cars" && (
          <div className="space-y-3 animate-slide-up">
            <p className="text-muted-foreground text-sm">{cars.length} سيارة في النظام</p>
            {cars.map(car => (
              <div key={car.id} className="glass rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-surface-2 flex items-center justify-center">
                    <Car className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-foreground font-bold">{car.make} {car.model} {car.year}</p>
                    <p className="text-xs text-muted-foreground">{car.owner_name} • {car.plate_number}</p>
                    <p className="text-[10px] text-muted-foreground">كراج: {car.garage_id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusColors[car.status as CarStatus]}`}>
                    {statusLabels[car.status as CarStatus]}
                  </span>
                  <button onClick={() => deleteCar(car.id)} className="w-8 h-8 rounded-lg bg-surface-2 flex items-center justify-center hover:text-destructive transition-colors text-muted-foreground">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Notifications Tab */}
        {tab === "notifications" && (
          <div className="space-y-4 animate-slide-up">
            <button onClick={() => { setShowNotifForm(true); setNotifTarget("all"); }} className="w-full glass rounded-xl p-4 flex items-center justify-center gap-2 border-2 border-dashed border-primary/30 hover:border-primary/60 text-primary font-bold">
              <Bell className="w-5 h-5" /> إرسال إشعار جديد
            </button>
            <p className="text-muted-foreground text-sm">{notifications.length} إشعار</p>
            {notifications.map(n => {
              const recipient = users.find(u => u.id === n.recipient_id);
              return (
                <div key={n.id} className="glass rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-foreground font-bold text-sm">{n.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{n.message}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[10px] text-muted-foreground">إلى: {recipient?.full_name || "غير معروف"}</span>
                        <span className="text-[10px] text-muted-foreground">{new Date(n.created_at).toLocaleString("ar-OM")}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${n.read ? "bg-accent/10 text-accent" : "bg-neon-orange/10 text-neon-orange"}`}>
                          {n.read ? "مقروء" : "غير مقروء"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
