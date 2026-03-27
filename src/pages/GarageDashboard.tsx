import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { statusLabels, statusColors, CarStatus } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Car, Plus, Camera, Send, Clock, DollarSign, Users, Wrench, ChevronDown, Star, Loader2, Bell, X, Save } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";

type CarRow = Tables<"cars">;

const GarageDashboard = () => {
  const { user } = useAuth();
  const isPremium = user?.is_premium;
  const [cars, setCars] = useState<CarRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCar, setSelectedCar] = useState<string | null>(null);
  const [showAddCar, setShowAddCar] = useState(false);
  const [showNotifForm, setShowNotifForm] = useState(false);
  const [notifMessage, setNotifMessage] = useState("");
  const [notifRecipientPhone, setNotifRecipientPhone] = useState("");

  // Add car form
  const [newCar, setNewCar] = useState({ make: "", model: "", year: 2024, plateNumber: "", color: "", ownerName: "", ownerPhone: "", notes: "", estimatedCost: 0, estimatedTime: "" });

  useEffect(() => {
    loadCars();
  }, [user]);

  const loadCars = async () => {
    if (!user?.garage_id) return;
    setLoading(true);
    const { data } = await supabase.from("cars").select("*").eq("garage_id", user.garage_id).order("created_at", { ascending: false });
    setCars(data || []);
    setLoading(false);
  };

  const addCar = async () => {
    if (!newCar.make || !newCar.ownerName || !newCar.ownerPhone) {
      toast.error("الرجاء تعبئة الحقول المطلوبة");
      return;
    }
    const { data, error } = await supabase.from("cars").insert({
      make: newCar.make, model: newCar.model, year: newCar.year,
      plate_number: newCar.plateNumber, color: newCar.color,
      owner_name: newCar.ownerName, owner_phone: newCar.ownerPhone,
      notes: newCar.notes, estimated_cost: newCar.estimatedCost,
      estimated_time: newCar.estimatedTime, garage_id: user?.garage_id || "",
      status: "received",
    }).select().single();

    if (data && !error) {
      // Add initial update
      await supabase.from("car_updates").insert({ car_id: data.id, status: "received", message: "تم استلام السيارة" });
      // Send notification to owner
      const { data: ownerProfile } = await supabase.from("profiles").select("id").eq("phone", newCar.ownerPhone).maybeSingle();
      if (ownerProfile) {
        await supabase.from("notifications").insert({
          recipient_id: ownerProfile.id, sender_id: user?.id,
          title: "سيارة جديدة", message: `تم استلام سيارتك ${newCar.make} ${newCar.model} في الكراج`,
          type: "status",
        });
      }
      toast.success("تم إضافة السيارة بنجاح");
      setShowAddCar(false);
      setNewCar({ make: "", model: "", year: 2024, plateNumber: "", color: "", ownerName: "", ownerPhone: "", notes: "", estimatedCost: 0, estimatedTime: "" });
      loadCars();
    } else {
      toast.error("حدث خطأ");
    }
  };

  const updateCarStatus = async (carId: string, newStatus: CarStatus, car: CarRow) => {
    await supabase.from("cars").update({ status: newStatus }).eq("id", carId);
    await supabase.from("car_updates").insert({ car_id: carId, status: newStatus, message: `تم تحديث الحالة إلى: ${statusLabels[newStatus]}` });
    // Notify owner
    const { data: ownerProfile } = await supabase.from("profiles").select("id").eq("phone", car.owner_phone).maybeSingle();
    if (ownerProfile) {
      await supabase.from("notifications").insert({
        recipient_id: ownerProfile.id, sender_id: user?.id,
        title: "تحديث حالة السيارة", message: `سيارتك ${car.make} ${car.model} الآن: ${statusLabels[newStatus]}`,
        type: "status",
      });
    }
    toast.success(`تم تحديث الحالة إلى: ${statusLabels[newStatus]}`);
    loadCars();
  };

  const sendNotification = async () => {
    if (!notifMessage.trim() || !notifRecipientPhone.trim()) {
      toast.error("الرجاء كتابة الرسالة ورقم الهاتف");
      return;
    }
    const { data: recipient } = await supabase.from("profiles").select("id").eq("phone", notifRecipientPhone).maybeSingle();
    if (!recipient) {
      toast.error("لم يتم العثور على المستخدم");
      return;
    }
    await supabase.from("notifications").insert({
      recipient_id: recipient.id, sender_id: user?.id,
      title: `رسالة من ${user?.garage_name || "الكراج"}`, message: notifMessage,
      type: "message",
    });
    toast.success("تم إرسال الرسالة");
    setNotifMessage("");
    setNotifRecipientPhone("");
    setShowNotifForm(false);
  };

  const stats = [
    { label: "السيارات الحالية", value: cars.length, icon: Car, color: "text-primary" },
    { label: "قيد التصليح", value: cars.filter(c => c.status === "repairing").length, icon: Wrench, color: "text-neon-orange" },
    { label: "جاهزة", value: cars.filter(c => c.status === "ready").length, icon: Car, color: "text-accent" },
    { label: "العملاء", value: new Set(cars.map(c => c.owner_phone)).size, icon: Users, color: "text-neon-blue" },
  ];

  if (loading) {
    return <DashboardLayout title={user?.garage_name || "لوحة تحكم الكراج"}><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div></DashboardLayout>;
  }

  return (
    <DashboardLayout title={user?.garage_name || "لوحة تحكم الكراج"}>
      <div className="space-y-6">
        {isPremium && (
          <div className="flex items-center gap-2 bg-neon-orange/10 border border-neon-orange/30 rounded-xl px-4 py-2.5">
            <Star className="w-5 h-5 text-neon-orange" />
            <span className="text-neon-orange font-bold text-sm">كراج بريميوم – ميزات متقدمة مفعلة</span>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="glass rounded-xl p-4">
              <Icon className={`w-5 h-5 ${color} mb-2`} />
              <p className="text-2xl font-bold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button onClick={() => setShowAddCar(true)} className="glass rounded-xl p-4 flex items-center justify-center gap-2 border-2 border-dashed border-primary/30 hover:border-primary/60 hover:bg-primary/5 transition-all text-primary font-bold">
            <Plus className="w-5 h-5" /> إضافة سيارة جديدة
          </button>
          <button onClick={() => setShowNotifForm(true)} className="glass rounded-xl p-4 flex items-center justify-center gap-2 border-2 border-dashed border-accent/30 hover:border-accent/60 hover:bg-accent/5 transition-all text-accent font-bold">
            <Send className="w-5 h-5" /> إرسال رسالة لعميل
          </button>
        </div>

        {/* Send Notification Form */}
        {showNotifForm && (
          <div className="glass rounded-xl p-5 space-y-4 animate-slide-up">
            <div className="flex items-center justify-between">
              <h3 className="text-foreground font-bold">إرسال رسالة</h3>
              <button onClick={() => setShowNotifForm(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>
            <input type="tel" placeholder="رقم هاتف العميل" dir="ltr" value={notifRecipientPhone} onChange={e => setNotifRecipientPhone(e.target.value)} className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary" />
            <textarea placeholder="الرسالة..." value={notifMessage} onChange={e => setNotifMessage(e.target.value)} rows={3} className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary resize-none" />
            <button onClick={sendNotification} className="w-full py-3 rounded-xl bg-accent text-accent-foreground font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
              <Send className="w-4 h-4" /> إرسال
            </button>
          </div>
        )}

        {/* Add Car Modal */}
        {showAddCar && (
          <div className="glass rounded-xl p-5 space-y-4 animate-slide-up">
            <div className="flex items-center justify-between">
              <h3 className="text-foreground font-bold text-lg">إضافة سيارة جديدة</h3>
              <button onClick={() => setShowAddCar(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="الماركة *" value={newCar.make} onChange={e => setNewCar({ ...newCar, make: e.target.value })} className="bg-surface-2 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary" />
              <input placeholder="الموديل" value={newCar.model} onChange={e => setNewCar({ ...newCar, model: e.target.value })} className="bg-surface-2 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary" />
              <input type="number" placeholder="السنة" value={newCar.year} onChange={e => setNewCar({ ...newCar, year: parseInt(e.target.value) })} className="bg-surface-2 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary" />
              <input placeholder="رقم اللوحة" value={newCar.plateNumber} onChange={e => setNewCar({ ...newCar, plateNumber: e.target.value })} className="bg-surface-2 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary" />
              <input placeholder="اللون" value={newCar.color} onChange={e => setNewCar({ ...newCar, color: e.target.value })} className="bg-surface-2 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary" />
              <input placeholder="اسم المالك *" value={newCar.ownerName} onChange={e => setNewCar({ ...newCar, ownerName: e.target.value })} className="bg-surface-2 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary" />
              <input placeholder="هاتف المالك *" dir="ltr" value={newCar.ownerPhone} onChange={e => setNewCar({ ...newCar, ownerPhone: e.target.value })} className="bg-surface-2 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary" />
              <input type="number" placeholder="التكلفة (ر.ع)" value={newCar.estimatedCost || ""} onChange={e => setNewCar({ ...newCar, estimatedCost: parseFloat(e.target.value) || 0 })} className="bg-surface-2 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary" />
            </div>
            <input placeholder="الوقت المتوقع (مثال: 3 أيام)" value={newCar.estimatedTime} onChange={e => setNewCar({ ...newCar, estimatedTime: e.target.value })} className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary" />
            <textarea placeholder="ملاحظات..." value={newCar.notes} onChange={e => setNewCar({ ...newCar, notes: e.target.value })} rows={2} className="w-full bg-surface-2 border border-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary resize-none" />
            <button onClick={addCar} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-90 transition-opacity neon-glow flex items-center justify-center gap-2">
              <Save className="w-5 h-5" /> حفظ السيارة
            </button>
          </div>
        )}

        {/* Cars List */}
        <div className="space-y-4">
          <h3 className="text-foreground font-bold text-lg">السيارات في الكراج ({cars.length})</h3>
          {cars.map((car) => (
            <div key={car.id} className={`glass rounded-xl overflow-hidden transition-all ${selectedCar === car.id ? "ring-1 ring-primary/50 neon-glow" : ""}`}>
              <button onClick={() => setSelectedCar(selectedCar === car.id ? null : car.id)} className="w-full flex items-center justify-between p-4 hover:bg-surface-2/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-surface-2 flex items-center justify-center">
                    <Car className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-right">
                    <p className="text-foreground font-bold">{car.make} {car.model}</p>
                    <p className="text-xs text-muted-foreground">{car.owner_name} • {car.plate_number}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusColors[car.status as CarStatus]}`}>
                    {statusLabels[car.status as CarStatus]}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${selectedCar === car.id ? "rotate-180" : ""}`} />
                </div>
              </button>

              {selectedCar === car.id && (
                <div className="border-t border-border p-4 space-y-4 animate-slide-up">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-surface-2 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">التكلفة</p>
                      <p className="text-foreground font-bold flex items-center gap-1"><DollarSign className="w-4 h-4 text-primary" /> {car.estimated_cost || 0} ر.ع</p>
                    </div>
                    <div className="bg-surface-2 rounded-lg p-3">
                      <p className="text-xs text-muted-foreground">الوقت المتوقع</p>
                      <p className="text-foreground font-bold flex items-center gap-1"><Clock className="w-4 h-4 text-neon-orange" /> {car.estimated_time || "غير محدد"}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">تحديث الحالة:</p>
                    <div className="flex flex-wrap gap-2">
                      {(["received", "inspecting", "repairing", "waiting_parts", "ready"] as CarStatus[]).map((status) => (
                        <button
                          key={status}
                          onClick={() => updateCarStatus(car.id, status, car)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                            car.status === status ? statusColors[status] + " neon-glow" : "border-border text-muted-foreground hover:border-primary/30"
                          }`}
                        >
                          {statusLabels[status]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {car.notes && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">ملاحظات:</p>
                      <p className="text-sm text-foreground bg-surface-2 rounded-lg p-3">{car.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default GarageDashboard;
