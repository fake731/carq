import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { statusLabels, statusColors, CarStatus } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Car, Plus, Camera, Send, Clock, DollarSign, Users, Wrench, ChevronDown, Star, Loader2, X, Save, Image as ImageIcon } from "lucide-react";
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
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);

  const [newCar, setNewCar] = useState({ make: "", model: "", year: 2024, plateNumber: "", color: "", ownerName: "", ownerPhone: "", notes: "", estimatedCost: 0, estimatedTime: "" });

  // Custom status
  const [customStatusCar, setCustomStatusCar] = useState<string | null>(null);
  const [customStatusText, setCustomStatusText] = useState("");

  const allStatuses = [
    { value: "received", label: "تم الاستلام" },
    { value: "inspecting", label: "قيد الفحص" },
    { value: "repairing", label: "قيد التصليح" },
    { value: "waiting_parts", label: "بانتظار قطع" },
    { value: "ready", label: "جاهزة" },
    { value: "week_wait", label: "باقي أسبوع" },
    { value: "two_weeks", label: "باقي أسبوعين" },
    { value: "needs_time", label: "تحتاج وقت" },
    { value: "not_started", label: "لم تبدأ" },
    { value: "testing", label: "قيد التجربة" },
    { value: "delivered", label: "تم التسليم" },
  ];

  useEffect(() => { loadCars(); }, [user]);

  const loadCars = async () => {
    if (!user?.garage_id) return;
    setLoading(true);
    const { data } = await supabase.from("cars").select("*").eq("garage_id", user.garage_id).order("created_at", { ascending: false });
    setCars(data || []);
    setLoading(false);
  };

  const addCar = async () => {
    if (!newCar.make || !newCar.ownerName || !newCar.ownerPhone) { toast.error("الرجاء تعبئة الحقول المطلوبة"); return; }
    const { data, error } = await supabase.from("cars").insert({
      make: newCar.make, model: newCar.model, year: newCar.year,
      plate_number: newCar.plateNumber, color: newCar.color,
      owner_name: newCar.ownerName, owner_phone: newCar.ownerPhone,
      notes: newCar.notes, estimated_cost: newCar.estimatedCost,
      estimated_time: newCar.estimatedTime, garage_id: user?.garage_id || "",
      status: "received",
    }).select().single();

    if (data && !error) {
      await supabase.from("car_updates").insert({ car_id: data.id, status: "received", message: "تم استلام السيارة" });
      // إشعار صاحب السيارة
      const { data: ownerProfile } = await supabase.from("profiles").select("id").eq("phone", newCar.ownerPhone).maybeSingle();
      if (ownerProfile) {
        await supabase.from("notifications").insert({
          recipient_id: ownerProfile.id, sender_id: user?.id,
          title: "سيارة جديدة", message: `تم استلام سيارتك ${newCar.make} ${newCar.model}`,
          type: "status",
        });
      }
      // إشعار المطور (admin)
      const { data: admins } = await supabase.from("profiles").select("id").eq("role", "admin");
      if (admins) {
        for (const admin of admins) {
          if (admin.id !== user?.id) {
            await supabase.from("notifications").insert({
              recipient_id: admin.id, sender_id: user?.id,
              title: "سيارة جديدة من الكراج", message: `تم إضافة سيارة ${newCar.make} ${newCar.model} - صاحبها: ${newCar.ownerName}`,
              type: "system",
            });
          }
        }
      }
      toast.success("تم إضافة السيارة");
      setShowAddCar(false);
      setNewCar({ make: "", model: "", year: 2024, plateNumber: "", color: "", ownerName: "", ownerPhone: "", notes: "", estimatedCost: 0, estimatedTime: "" });
      loadCars();
    }
  };

  const updateCarStatus = async (carId: string, newStatus: string, car: CarRow) => {
    await supabase.from("cars").update({ status: newStatus }).eq("id", carId);
    await supabase.from("car_updates").insert({ car_id: carId, status: newStatus, message: `تحديث الحالة: ${statusLabels[newStatus] || newStatus}` });
    const { data: ownerProfile } = await supabase.from("profiles").select("id").eq("phone", car.owner_phone).maybeSingle();
    if (ownerProfile) {
      await supabase.from("notifications").insert({
        recipient_id: ownerProfile.id, sender_id: user?.id,
        title: "تحديث حالة السيارة", message: `${car.make} ${car.model}: ${statusLabels[newStatus] || newStatus}`,
        type: "status",
      });
    }
    toast.success(`تم تحديث الحالة`);
    setCustomStatusCar(null);
    setCustomStatusText("");
    loadCars();
  };

  const uploadCarImages = async (carId: string, files: FileList) => {
    setUploadingFor(carId);
    const car = cars.find(c => c.id === carId);
    const currentImages = car?.images || [];
    const newUrls: string[] = [];

    for (let i = 0; i < Math.min(files.length, 10); i++) {
      const file = files[i];
      const path = `cars/${carId}/${Date.now()}-${i}-${file.name}`;
      const { error } = await supabase.storage.from("car-images").upload(path, file);
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from("car-images").getPublicUrl(path);
        newUrls.push(publicUrl);
      }
    }

    if (newUrls.length > 0) {
      await supabase.from("cars").update({ images: [...currentImages, ...newUrls] }).eq("id", carId);
      toast.success(`تم رفع ${newUrls.length} صورة`);
    }
    setUploadingFor(null);
    loadCars();
  };

  const sendNotification = async () => {
    if (!notifMessage.trim() || !notifRecipientPhone.trim()) { toast.error("الرجاء كتابة الرسالة والرقم"); return; }
    const { data: recipient } = await supabase.from("profiles").select("id").eq("phone", notifRecipientPhone).maybeSingle();
    if (!recipient) { toast.error("لم يتم العثور على المستخدم"); return; }
    await supabase.from("notifications").insert({
      recipient_id: recipient.id, sender_id: user?.id,
      title: `رسالة من ${user?.garage_name || "الكراج"}`, message: notifMessage,
      type: "message",
    });
    toast.success("تم إرسال الرسالة");
    setNotifMessage(""); setNotifRecipientPhone(""); setShowNotifForm(false);
  };

  const stats = [
    { label: "السيارات", value: cars.length, icon: Car, color: "text-primary" },
    { label: "قيد التصليح", value: cars.filter(c => c.status === "repairing").length, icon: Wrench, color: "text-neon-orange" },
    { label: "جاهزة", value: cars.filter(c => c.status === "ready").length, icon: Car, color: "text-accent" },
    { label: "العملاء", value: new Set(cars.map(c => c.owner_phone)).size, icon: Users, color: "text-neon-blue" },
  ];

  if (loading) {
    return <DashboardLayout title={user?.garage_name || "الكراج"}><div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div></DashboardLayout>;
  }

  return (
    <DashboardLayout title={user?.garage_name || "لوحة تحكم الكراج"}>
      <div className="space-y-6">
        {isPremium && (
          <div className="flex items-center gap-2 ios-card px-4 py-3">
            <Star className="w-5 h-5 text-neon-orange" />
            <span className="text-neon-orange font-bold text-sm">كراج بريميوم</span>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="ios-card p-4">
              <Icon className={`w-5 h-5 ${color} mb-2`} />
              <p className="text-2xl font-bold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button onClick={() => setShowAddCar(true)} className="ios-card p-4 flex items-center justify-center gap-2 border-2 border-dashed border-primary/30 hover:border-primary/60 text-primary font-bold transition-colors">
            <Plus className="w-5 h-5" /> إضافة سيارة
          </button>
          <button onClick={() => setShowNotifForm(true)} className="ios-card p-4 flex items-center justify-center gap-2 border-2 border-dashed border-accent/30 hover:border-accent/60 text-accent font-bold transition-colors">
            <Send className="w-5 h-5" /> إرسال رسالة
          </button>
        </div>

        {showNotifForm && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-foreground/10 backdrop-blur-sm p-4" onClick={() => setShowNotifForm(false)}>
            <div className="ios-card p-6 w-full max-w-md space-y-4 animate-slide-up" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className="text-foreground font-bold text-lg">إرسال رسالة</h3>
                <button onClick={() => setShowNotifForm(false)} className="text-muted-foreground"><X className="w-5 h-5" /></button>
              </div>
              <input type="tel" placeholder="رقم هاتف العميل" dir="ltr" value={notifRecipientPhone} onChange={e => setNotifRecipientPhone(e.target.value)} className="ios-input" />
              <textarea placeholder="الرسالة..." value={notifMessage} onChange={e => setNotifMessage(e.target.value)} rows={3} className="ios-input resize-none" />
              <button onClick={sendNotification} className="ios-btn-primary flex items-center justify-center gap-2"><Send className="w-4 h-4" /> إرسال</button>
            </div>
          </div>
        )}

        {showAddCar && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-foreground/10 backdrop-blur-sm p-4" onClick={() => setShowAddCar(false)}>
            <div className="ios-card p-6 w-full max-w-md space-y-4 animate-slide-up max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className="text-foreground font-bold text-lg">سيارة جديدة</h3>
                <button onClick={() => setShowAddCar(false)} className="text-muted-foreground"><X className="w-5 h-5" /></button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="الماركة *" value={newCar.make} onChange={e => setNewCar({ ...newCar, make: e.target.value })} className="ios-input" />
                <input placeholder="الموديل" value={newCar.model} onChange={e => setNewCar({ ...newCar, model: e.target.value })} className="ios-input" />
                <input type="number" placeholder="السنة" value={newCar.year} onChange={e => setNewCar({ ...newCar, year: parseInt(e.target.value) })} className="ios-input" />
                <input placeholder="رقم اللوحة" value={newCar.plateNumber} onChange={e => setNewCar({ ...newCar, plateNumber: e.target.value })} className="ios-input" />
              </div>
              <input placeholder="اللون" value={newCar.color} onChange={e => setNewCar({ ...newCar, color: e.target.value })} className="ios-input" />
              <input placeholder="اسم المالك *" value={newCar.ownerName} onChange={e => setNewCar({ ...newCar, ownerName: e.target.value })} className="ios-input" />
              <input placeholder="هاتف المالك *" dir="ltr" value={newCar.ownerPhone} onChange={e => setNewCar({ ...newCar, ownerPhone: e.target.value })} className="ios-input" />
              <div className="grid grid-cols-2 gap-3">
                <input type="number" placeholder="التكلفة (ر.ع)" value={newCar.estimatedCost || ""} onChange={e => setNewCar({ ...newCar, estimatedCost: parseFloat(e.target.value) || 0 })} className="ios-input" />
                <input placeholder="الوقت المتوقع" value={newCar.estimatedTime} onChange={e => setNewCar({ ...newCar, estimatedTime: e.target.value })} className="ios-input" />
              </div>
              <textarea placeholder="ملاحظات..." value={newCar.notes} onChange={e => setNewCar({ ...newCar, notes: e.target.value })} rows={2} className="ios-input resize-none" />
              <button onClick={addCar} className="ios-btn-primary flex items-center justify-center gap-2"><Save className="w-5 h-5" /> حفظ</button>
            </div>
          </div>
        )}

        {/* Cars List */}
        <div className="space-y-4">
          <h3 className="text-foreground font-bold text-lg">السيارات ({cars.length})</h3>
          {cars.map((car) => (
            <div key={car.id} className={`ios-card overflow-hidden transition-all ${selectedCar === car.id ? "shadow-md ring-1 ring-primary/20" : ""}`}>
              <button onClick={() => setSelectedCar(selectedCar === car.id ? null : car.id)} className="w-full flex items-center justify-between p-4 hover:bg-surface-2/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-surface-2 flex items-center justify-center">
                    <Car className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-right">
                    <p className="text-foreground font-bold">{car.make} {car.model}</p>
                    <p className="text-xs text-muted-foreground">{car.owner_name} • {car.plate_number}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${statusColors[car.status] || "status-received"}`}>
                    {statusLabels[car.status] || car.status}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${selectedCar === car.id ? "rotate-180" : ""}`} />
                </div>
              </button>

              {selectedCar === car.id && (
                <div className="border-t border-border p-4 space-y-4 animate-slide-up">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-surface-2 rounded-2xl p-3">
                      <p className="text-xs text-muted-foreground">التكلفة</p>
                      <p className="text-foreground font-bold flex items-center gap-1"><DollarSign className="w-4 h-4 text-primary" /> {car.estimated_cost || 0} ر.ع</p>
                    </div>
                    <div className="bg-surface-2 rounded-2xl p-3">
                      <p className="text-xs text-muted-foreground">الوقت</p>
                      <p className="text-foreground font-bold flex items-center gap-1"><Clock className="w-4 h-4 text-neon-orange" /> {car.estimated_time || "—"}</p>
                    </div>
                  </div>

                  {/* Status Selection */}
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">تحديث الحالة:</p>
                    <div className="flex flex-wrap gap-2">
                      {allStatuses.map((status) => (
                        <button key={status.value} onClick={() => updateCarStatus(car.id, status.value, car)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                            car.status === status.value ? (statusColors[status.value] || "status-received") + " shadow-md" : "border-border text-muted-foreground hover:border-primary/30"
                          }`}>
                          {status.label}
                        </button>
                      ))}
                    </div>
                    {/* Custom status */}
                    <div className="mt-2 flex gap-2">
                      <input 
                        placeholder="حالة مخصصة..." 
                        value={customStatusCar === car.id ? customStatusText : ""} 
                        onChange={e => { setCustomStatusCar(car.id); setCustomStatusText(e.target.value); }} 
                        className="ios-input flex-1 text-sm" 
                      />
                      {customStatusCar === car.id && customStatusText && (
                        <button onClick={() => updateCarStatus(car.id, customStatusText, car)} className="px-3 py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold">
                          تطبيق
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Multi Image Upload */}
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">صور السيارة:</p>
                    {car.images && car.images.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {car.images.map((img, i) => (
                          <img key={i} src={img} alt="" className="rounded-xl w-full h-24 object-cover border border-border" />
                        ))}
                      </div>
                    )}
                    <label className="flex items-center justify-center gap-2 bg-surface-2 hover:bg-surface-3 rounded-2xl p-3 cursor-pointer transition-colors text-muted-foreground text-sm">
                      {uploadingFor === car.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
                      {uploadingFor === car.id ? "جاري الرفع..." : "رفع صور (يمكنك اختيار أكثر من صورة)"}
                      <input type="file" accept="image/*" multiple onChange={e => e.target.files && uploadCarImages(car.id, e.target.files)} className="hidden" />
                    </label>
                  </div>

                  {car.notes && (
                    <div className="bg-surface-2 rounded-2xl p-3">
                      <p className="text-xs text-muted-foreground mb-1">ملاحظات:</p>
                      <p className="text-sm text-foreground">{car.notes}</p>
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
