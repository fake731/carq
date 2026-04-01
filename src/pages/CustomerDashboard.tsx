import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { statusLabels, statusColors, CarStatus } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Car, Clock, DollarSign, Wrench, CheckCircle2, Eye, Package, Bell, Loader2, Plus, X, Send, Image as ImageIcon, Trash2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";

type CarRow = Tables<"cars">;
type CarUpdateRow = Tables<"car_updates">;
type NotificationRow = Tables<"notifications">;

const statusIcons: Record<string, typeof Car> = {
  received: CheckCircle2,
  inspecting: Eye,
  repairing: Wrench,
  waiting_parts: Package,
  ready: CheckCircle2,
};

const CustomerDashboard = () => {
  const { user } = useAuth();
  const [cars, setCars] = useState<CarRow[]>([]);
  const [updates, setUpdates] = useState<Record<string, CarUpdateRow[]>>({});
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCar, setSelectedCar] = useState<string | null>(null);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [newRequest, setNewRequest] = useState({ make: "", model: "", year: 2024, plateNumber: "", color: "", notes: "" });

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    const [carsRes, notifsRes] = await Promise.all([
      supabase.from("cars").select("*").eq("owner_phone", user.phone).order("created_at", { ascending: false }),
      supabase.from("notifications").select("*").eq("recipient_id", user.id).order("created_at", { ascending: false }).limit(20),
    ]);

    const carsData = carsRes.data || [];
    setCars(carsData);
    setNotifications(notifsRes.data || []);

    if (carsData.length > 0) {
      const carIds = carsData.map(c => c.id);
      const { data: allUpdates } = await supabase
        .from("car_updates").select("*").in("car_id", carIds).order("created_at", { ascending: true });
      const grouped: Record<string, CarUpdateRow[]> = {};
      (allUpdates || []).forEach(u => {
        if (!grouped[u.car_id]) grouped[u.car_id] = [];
        grouped[u.car_id].push(u);
      });
      setUpdates(grouped);
      setSelectedCar(carsData[0].id);
    }
    setLoading(false);
  };

  const submitCarRequest = async () => {
    if (!newRequest.make || !user) { toast.error("الرجاء إدخال نوع السيارة"); return; }
    await supabase.from("cars").insert({
      make: newRequest.make, model: newRequest.model, year: newRequest.year,
      plate_number: newRequest.plateNumber, color: newRequest.color,
      owner_name: user.full_name, owner_phone: user.phone,
      notes: newRequest.notes, status: "pending",
      owner_id: user.id,
    });
    // إرسال إشعار للمطور (admin)
    const { data: admins } = await supabase.from("profiles").select("id").eq("role", "admin");
    if (admins) {
      for (const admin of admins) {
        await supabase.from("notifications").insert({
          recipient_id: admin.id, sender_id: user.id,
          title: "طلب سيارة جديد", message: `${user.full_name} أرسل طلب سيارة: ${newRequest.make} ${newRequest.model}`,
          type: "system",
        });
      }
    }
    toast.success("تم إرسال الطلب وسيتم مراجعته من الإدارة");
    setShowRequestForm(false);
    setNewRequest({ make: "", model: "", year: 2024, plateNumber: "", color: "", notes: "" });
    loadData();
  };

  const markNotifRead = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const deleteNotif = async (id: string) => {
    await supabase.from("notifications").delete().eq("id", id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const standardSteps: CarStatus[] = ["received", "inspecting", "repairing", "waiting_parts", "ready"];
  const activeCar = cars.find(c => c.id === selectedCar);
  const unreadNotifs = notifications.filter(n => !n.read).length;

  if (loading) {
    return <DashboardLayout title="لوحة التحكم"><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div></DashboardLayout>;
  }

  return (
    <DashboardLayout title="لوحة التحكم">
      <div className="space-y-6">
        <div className="ios-card p-6">
          <h2 className="text-2xl font-bold text-foreground mb-1">مرحباً، {user?.full_name} 👋</h2>
          <p className="text-muted-foreground text-sm">عندك {cars.filter(c => c.status !== "pending").length} سيارة في النظام</p>
        </div>

        <button onClick={() => setShowRequestForm(true)} className="w-full ios-card p-4 flex items-center justify-center gap-2 border-2 border-dashed border-primary/30 hover:border-primary/60 text-primary font-bold transition-colors">
          <Plus className="w-5 h-5" /> إرسال طلب سيارة جديدة
        </button>

        {showRequestForm && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-foreground/10 backdrop-blur-sm p-4" onClick={() => setShowRequestForm(false)}>
            <div className="ios-card p-6 w-full max-w-md space-y-4 animate-slide-up" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className="text-foreground font-bold text-lg">طلب سيارة جديدة</h3>
                <button onClick={() => setShowRequestForm(false)} className="text-muted-foreground"><X className="w-5 h-5" /></button>
              </div>
              <p className="text-xs text-muted-foreground">سيتم مراجعة طلبك من قبل الإدارة</p>
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="نوع السيارة *" value={newRequest.make} onChange={e => setNewRequest({ ...newRequest, make: e.target.value })} className="ios-input" />
                <input placeholder="الموديل" value={newRequest.model} onChange={e => setNewRequest({ ...newRequest, model: e.target.value })} className="ios-input" />
                <input type="number" placeholder="السنة" value={newRequest.year} onChange={e => setNewRequest({ ...newRequest, year: parseInt(e.target.value) })} className="ios-input" />
                <input placeholder="رقم اللوحة" value={newRequest.plateNumber} onChange={e => setNewRequest({ ...newRequest, plateNumber: e.target.value })} className="ios-input" />
              </div>
              <input placeholder="لون السيارة (مثال: أزرق فاتح)" value={newRequest.color} onChange={e => setNewRequest({ ...newRequest, color: e.target.value })} className="ios-input" />
              <textarea placeholder="ملاحظات (مثال: كم مدة التصليح؟)" value={newRequest.notes} onChange={e => setNewRequest({ ...newRequest, notes: e.target.value })} rows={3} className="ios-input resize-none" />
              <button onClick={submitCarRequest} className="ios-btn-primary flex items-center justify-center gap-2">
                <Send className="w-5 h-5" /> إرسال الطلب
              </button>
            </div>
          </div>
        )}

        {cars.filter(c => c.status !== "pending").length > 1 && (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {cars.filter(c => c.status !== "pending").map(car => (
              <button
                key={car.id}
                onClick={() => setSelectedCar(car.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl border whitespace-nowrap transition-all ${
                  selectedCar === car.id ? "ios-card shadow-md border-primary/30" : "ios-card hover:shadow-md"
                }`}
              >
                <Car className={`w-5 h-5 ${selectedCar === car.id ? "text-primary" : "text-muted-foreground"}`} />
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">{car.make} {car.model}</p>
                  <p className="text-[10px] text-muted-foreground">{car.plate_number}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {activeCar && activeCar.status !== "pending" && (
          <>
            <div className="ios-card p-6 shadow-md">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-foreground">{activeCar.make} {activeCar.model} {activeCar.year}</h2>
                  <p className="text-muted-foreground text-sm mt-1">رقم اللوحة: {activeCar.plate_number}</p>
                  {activeCar.color && <p className="text-muted-foreground text-xs mt-0.5">اللون: {activeCar.color}</p>}
                </div>
                <span className={`px-4 py-1.5 rounded-full text-sm font-bold border ${statusColors[activeCar.status] || "status-received"}`}>
                  {statusLabels[activeCar.status] || activeCar.status}
                </span>
              </div>

              {/* Progress Steps - only show for standard statuses */}
              {standardSteps.includes(activeCar.status as CarStatus) && (
                <div className="flex items-center gap-1">
                  {standardSteps.map((step, i) => {
                    const Icon = statusIcons[step] || Car;
                    const currentIdx = standardSteps.indexOf(activeCar.status as CarStatus);
                    const isActive = i <= currentIdx;
                    const isCurrent = i === currentIdx;
                    return (
                      <div key={step} className="flex-1 flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                          isCurrent ? "border-primary bg-primary/15 shadow-lg shadow-primary/20" :
                          isActive ? "border-accent bg-accent/10" : "border-border bg-surface-2"
                        }`}>
                          <Icon className={`w-5 h-5 ${isCurrent ? "text-primary" : isActive ? "text-accent" : "text-muted-foreground"}`} />
                        </div>
                        <span className={`text-[10px] mt-1.5 text-center ${isCurrent ? "text-primary font-bold" : isActive ? "text-accent" : "text-muted-foreground"}`}>
                          {statusLabels[step]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: DollarSign, label: "التكلفة", value: `${activeCar.estimated_cost || 0} ر.ع`, color: "text-primary" },
                { icon: Clock, label: "الوقت المتوقع", value: activeCar.estimated_time || "غير محدد", color: "text-neon-orange" },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="ios-card p-4">
                  <Icon className={`w-5 h-5 ${color} mb-2`} />
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-foreground font-bold mt-1">{value}</p>
                </div>
              ))}
            </div>

            {activeCar.images && activeCar.images.length > 0 && (
              <div className="ios-card p-5">
                <h3 className="text-foreground font-bold mb-3 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-primary" /> صور السيارة
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {activeCar.images.map((img, i) => (
                    <img key={i} src={img} alt="" className="rounded-2xl w-full h-32 object-cover border border-border" />
                  ))}
                </div>
              </div>
            )}

            {(updates[activeCar.id] || []).length > 0 && (
              <div className="ios-card p-5">
                <h3 className="text-foreground font-bold mb-4">سجل التحديثات</h3>
                <div className="space-y-4">
                  {(updates[activeCar.id] || []).map((update, i, arr) => (
                    <div key={update.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${i === arr.length - 1 ? "bg-primary animate-pulse-soft" : "bg-accent"}`} />
                        {i < arr.length - 1 && <div className="w-0.5 flex-1 bg-border mt-1" />}
                      </div>
                      <div className="pb-4">
                        <p className="text-sm font-bold text-foreground">{update.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">{new Date(update.created_at).toLocaleString("ar-OM")}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {cars.filter(c => c.status === "pending").length > 0 && (
          <div className="ios-card p-5">
            <h3 className="text-foreground font-bold mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-neon-orange" /> طلبات بانتظار الموافقة
            </h3>
            {cars.filter(c => c.status === "pending").map(car => (
              <div key={car.id} className="bg-surface-2 rounded-2xl p-4 mt-3">
                <p className="text-foreground font-bold">{car.make} {car.model}</p>
                <p className="text-xs text-muted-foreground">{car.plate_number} • {car.color}</p>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-neon-orange/10 text-neon-orange mt-2 inline-block">بانتظار الموافقة</span>
              </div>
            ))}
          </div>
        )}

        {cars.filter(c => c.status !== "pending").length === 0 && (
          <div className="ios-card p-12 text-center">
            <Car className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">لا توجد سيارات حالياً</h3>
            <p className="text-muted-foreground">أرسل طلب سيارة أو انتظر حتى يضيفها الكراج</p>
          </div>
        )}

        {/* Notifications */}
        <div className="ios-card p-5">
          <h3 className="text-foreground font-bold mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" /> الإشعارات
            {unreadNotifs > 0 && <span className="px-2 py-0.5 rounded-full bg-destructive text-destructive-foreground text-xs font-bold">{unreadNotifs}</span>}
          </h3>
          {notifications.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">لا توجد إشعارات</p>
          ) : (
            <div className="space-y-3">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`rounded-2xl p-4 transition-all ${
                    notif.read ? "bg-surface-2" : "bg-primary/5 border border-primary/15"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {!notif.read && <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0 animate-pulse-soft" />}
                    <div className="flex-1">
                      <p className="text-sm font-bold text-foreground">{notif.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{notif.message}</p>
                      <span className="text-[10px] text-muted-foreground">{new Date(notif.created_at).toLocaleString("ar-OM")}</span>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      {!notif.read && (
                        <button onClick={() => markNotifRead(notif.id)} className="text-[10px] text-primary hover:underline">قراءة</button>
                      )}
                      <button onClick={() => deleteNotif(notif.id)} className="text-[10px] text-destructive hover:underline">حذف</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CustomerDashboard;
