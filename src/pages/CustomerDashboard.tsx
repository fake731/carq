import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { statusLabels, statusColors, CarStatus } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Car, Clock, DollarSign, MessageSquare, CheckCircle2, Wrench, Package, Eye, Bell, Loader2, Send } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type CarRow = Tables<"cars">;
type CarUpdateRow = Tables<"car_updates">;
type NotificationRow = Tables<"notifications">;

const statusIcons: Record<CarStatus, typeof Car> = {
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

    // Load updates for all cars
    if (carsData.length > 0) {
      const carIds = carsData.map(c => c.id);
      const { data: allUpdates } = await supabase
        .from("car_updates")
        .select("*")
        .in("car_id", carIds)
        .order("created_at", { ascending: true });

      const grouped: Record<string, CarUpdateRow[]> = {};
      (allUpdates || []).forEach(u => {
        if (!grouped[u.car_id]) grouped[u.car_id] = [];
        grouped[u.car_id].push(u);
      });
      setUpdates(grouped);
    }

    if (carsData.length > 0) setSelectedCar(carsData[0].id);
    setLoading(false);
  };

  const markNotifRead = async (id: string) => {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const statusSteps: CarStatus[] = ["received", "inspecting", "repairing", "waiting_parts", "ready"];
  const activeCar = cars.find(c => c.id === selectedCar);
  const unreadNotifs = notifications.filter(n => !n.read).length;

  if (loading) {
    return (
      <DashboardLayout title="لوحة التحكم">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="لوحة التحكم">
      <div className="space-y-6">
        {/* Welcome */}
        <div className="glass rounded-2xl p-6">
          <h2 className="text-2xl font-bold text-foreground mb-1">مرحباً، {user?.full_name} 👋</h2>
          <p className="text-muted-foreground">عندك {cars.length} سيارة في النظام</p>
        </div>

        {/* Car Selector */}
        {cars.length > 1 && (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {cars.map(car => (
              <button
                key={car.id}
                onClick={() => setSelectedCar(car.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border whitespace-nowrap transition-all ${
                  selectedCar === car.id ? "glass neon-glow border-primary/50" : "glass border-border hover:border-primary/30"
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

        {/* Active Car Status */}
        {activeCar && (
          <>
            <div className="glass rounded-2xl p-6 neon-glow">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold text-foreground">{activeCar.make} {activeCar.model} {activeCar.year}</h2>
                  <p className="text-muted-foreground text-sm mt-1">رقم اللوحة: {activeCar.plate_number}</p>
                  {activeCar.color && <p className="text-muted-foreground text-xs mt-0.5">اللون: {activeCar.color}</p>}
                </div>
                <span className={`px-4 py-1.5 rounded-full text-sm font-bold border ${statusColors[activeCar.status as CarStatus]}`}>
                  {statusLabels[activeCar.status as CarStatus]}
                </span>
              </div>

              {/* Progress Steps */}
              <div className="flex items-center gap-1">
                {statusSteps.map((step, i) => {
                  const Icon = statusIcons[step];
                  const currentIdx = statusSteps.indexOf(activeCar.status as CarStatus);
                  const isActive = i <= currentIdx;
                  const isCurrent = i === currentIdx;
                  return (
                    <div key={step} className="flex-1 flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                        isCurrent ? "border-primary bg-primary/20 neon-glow" :
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
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: DollarSign, label: "التكلفة المتوقعة", value: `${activeCar.estimated_cost || 0} ر.ع`, color: "text-primary" },
                { icon: Clock, label: "الوقت المتوقع", value: activeCar.estimated_time || "غير محدد", color: "text-neon-orange" },
                { icon: Wrench, label: "الكراج", value: activeCar.garage_id === "g1" ? "كراج النور المتقدم" : "كراج الصقر", color: "text-accent" },
                { icon: Car, label: "رقم اللوحة", value: activeCar.plate_number, color: "text-neon-blue" },
              ].map(({ icon: Icon, label, value, color }) => (
                <div key={label} className="glass rounded-xl p-4">
                  <Icon className={`w-5 h-5 ${color} mb-2`} />
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-foreground font-bold mt-1">{value}</p>
                </div>
              ))}
            </div>

            {/* Notes */}
            {activeCar.notes && (
              <div className="glass rounded-xl p-5">
                <h3 className="text-foreground font-bold mb-2 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  ملاحظات الكراج
                </h3>
                <p className="text-muted-foreground text-sm">{activeCar.notes}</p>
              </div>
            )}

            {/* Timeline */}
            {(updates[activeCar.id] || []).length > 0 && (
              <div className="glass rounded-xl p-5">
                <h3 className="text-foreground font-bold mb-4">سجل التحديثات</h3>
                <div className="space-y-4">
                  {(updates[activeCar.id] || []).map((update, i, arr) => (
                    <div key={update.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-3 h-3 rounded-full ${i === arr.length - 1 ? "bg-primary animate-pulse-neon" : "bg-accent"}`} />
                        {i < arr.length - 1 && <div className="w-0.5 flex-1 bg-border mt-1" />}
                      </div>
                      <div className="pb-4">
                        <p className="text-sm font-bold text-foreground">{update.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">{new Date(update.created_at).toLocaleString("ar-OM")}</p>
                        <span className={`inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full border ${statusColors[update.status as CarStatus]}`}>
                          {statusLabels[update.status as CarStatus]}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {cars.length === 0 && (
          <div className="glass rounded-2xl p-12 text-center">
            <Car className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-bold text-foreground mb-2">لا توجد سيارات حالياً</h3>
            <p className="text-muted-foreground">بمجرد ما الكراج يضيف سيارتك بتظهر هنا</p>
          </div>
        )}

        {/* Notifications */}
        <div className="glass rounded-xl p-5">
          <h3 className="text-foreground font-bold mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            الإشعارات
            {unreadNotifs > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-destructive text-destructive-foreground text-xs font-bold">{unreadNotifs}</span>
            )}
          </h3>
          {notifications.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">لا توجد إشعارات</p>
          ) : (
            <div className="space-y-3">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => !notif.read && markNotifRead(notif.id)}
                  className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all ${notif.read ? "bg-surface-2" : "bg-primary/5 border border-primary/20 hover:bg-primary/10"}`}
                >
                  <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${notif.read ? "bg-muted-foreground" : "bg-primary animate-pulse-neon"}`} />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-foreground">{notif.title}</p>
                    <p className="text-xs text-muted-foreground">{notif.message}</p>
                    <span className="text-[10px] text-muted-foreground">{new Date(notif.created_at).toLocaleString("ar-OM")}</span>
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
