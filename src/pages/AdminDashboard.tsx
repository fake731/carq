import { useState, useEffect } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { statusLabels, statusColors, CarStatus } from "@/lib/mock-data";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import {
  Users, Car, Building2, Bell, Send, Trash2, Shield, Activity, Star, Loader2, X,
  Search, RefreshCw, Phone, Clock, Plus, Edit, Check, XCircle, ChevronDown, Save, 
  MessageSquare, Download, Ban, Settings, Eye, UserPlus, Wrench
} from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";

type Tab = "overview" | "users" | "garages" | "cars" | "notifications" | "approvals" | "settings";
type ProfileRow = Tables<"profiles">;
type CarRow = Tables<"cars">;
type NotificationRow = Tables<"notifications">;

const AdminDashboard = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");
  const [users, setUsers] = useState<ProfileRow[]>([]);
  const [cars, setCars] = useState<CarRow[]>([]);
  const [garagesList, setGaragesList] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Forms
  const [showNotifForm, setShowNotifForm] = useState(false);
  const [notifTitle, setNotifTitle] = useState("");
  const [notifMessage, setNotifMessage] = useState("");
  const [notifTarget, setNotifTarget] = useState<"all" | "specific">("all");
  const [notifRecipientId, setNotifRecipientId] = useState("");

  const [showAddGarage, setShowAddGarage] = useState(false);
  const [newGarage, setNewGarage] = useState({ name: "", phone: "", address: "", isPremium: false, ownerName: "", ownerPhone: "" });

  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ fullName: "", phone: "", role: "customer" as string, garageName: "", garageId: "" });

  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ full_name: "", phone: "", password: "", role: "" });

  const [showAddCar, setShowAddCar] = useState(false);
  const [newCar, setNewCar] = useState({ make: "", model: "", year: 2024, plateNumber: "", color: "", ownerName: "", ownerPhone: "", notes: "", estimatedCost: 0, estimatedTime: "", garageId: "" });

  const tabs: { id: Tab; label: string; icon: typeof Users }[] = [
    { id: "overview", label: "نظرة عامة", icon: Activity },
    { id: "approvals", label: "الموافقات", icon: Check },
    { id: "users", label: "المستخدمين", icon: Users },
    { id: "garages", label: "الكراجات", icon: Building2 },
    { id: "cars", label: "السيارات", icon: Car },
    { id: "notifications", label: "الإشعارات", icon: Bell },
  ];

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    const [usersRes, carsRes, notifsRes, garagesRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("cars").select("*").order("created_at", { ascending: false }),
      supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("garages").select("*").order("created_at", { ascending: false }),
    ]);
    setUsers(usersRes.data || []);
    setCars(carsRes.data || []);
    setNotifications(notifsRes.data || []);
    setGaragesList(garagesRes.data || []);
    setLoading(false);
  };

  const pendingUsers = users.filter(u => !(u as any).approved && u.role !== "admin");
  const pendingCars = cars.filter(c => c.status === "pending");

  const approveUser = async (id: string) => {
    await supabase.from("profiles").update({ approved: true } as any).eq("id", id);
    await supabase.from("notifications").insert({
      recipient_id: id, sender_id: user?.id,
      title: "تم تفعيل حسابك", message: "مرحباً! تم تفعيل حسابك بنجاح. يمكنك الآن تسجيل الدخول.",
      type: "system",
    });
    toast.success("تم تفعيل الحساب");
    loadAll();
  };

  const rejectUser = async (id: string) => {
    await supabase.from("profiles").delete().eq("id", id);
    toast.success("تم رفض الحساب");
    loadAll();
  };

  const deleteUser = async (id: string) => {
    if (id === user?.id) { toast.error("لا يمكنك حذف نفسك"); return; }
    await supabase.from("profiles").delete().eq("id", id);
    toast.success("تم حذف المستخدم");
    loadAll();
  };

  const updateUser = async (id: string) => {
    await supabase.from("profiles").update({
      full_name: editForm.full_name,
      username: editForm.full_name,
      phone: editForm.phone,
      password: editForm.phone,
      role: editForm.role,
    }).eq("id", id);
    toast.success("تم تحديث البيانات");
    setEditingUser(null);
    loadAll();
  };

  const createUser = async () => {
    if (!newUser.fullName || !newUser.phone) { toast.error("الرجاء تعبئة البيانات"); return; }
    const insertData: any = {
      full_name: newUser.fullName, username: newUser.fullName,
      phone: newUser.phone, password: newUser.phone,
      role: newUser.role, approved: true,
    };
    if (newUser.role === "garage" && newUser.garageName) {
      insertData.garage_name = newUser.garageName;
      insertData.garage_id = newUser.garageName.replace(/\s/g, "_").toLowerCase();
    }
    const { error } = await supabase.from("profiles").insert(insertData);
    if (error) { toast.error("خطأ: " + error.message); return; }

    // If garage role, also create in garages table
    if (newUser.role === "garage" && newUser.garageName) {
      await supabase.from("garages").insert({
        id: insertData.garage_id,
        name: newUser.garageName,
        phone: newUser.phone,
      });
    }
    toast.success("تم إنشاء المستخدم");
    setShowAddUser(false);
    setNewUser({ fullName: "", phone: "", role: "customer", garageName: "", garageId: "" });
    loadAll();
  };

  const createGarage = async () => {
    if (!newGarage.name) { toast.error("الرجاء إدخال اسم الكراج"); return; }
    const garageId = newGarage.name.replace(/\s/g, "_").toLowerCase();
    await supabase.from("garages").insert({
      id: garageId, name: newGarage.name, phone: newGarage.phone,
      address: newGarage.address, is_premium: newGarage.isPremium,
    });

    // Create garage profile if owner info provided
    if (newGarage.ownerName && newGarage.ownerPhone) {
      await supabase.from("profiles").insert({
        full_name: newGarage.ownerName, username: newGarage.ownerName,
        phone: newGarage.ownerPhone, password: newGarage.ownerPhone,
        role: "garage", garage_id: garageId, garage_name: newGarage.name, approved: true,
      });
    }
    toast.success("تم إنشاء الكراج");
    setShowAddGarage(false);
    setNewGarage({ name: "", phone: "", address: "", isPremium: false, ownerName: "", ownerPhone: "" });
    loadAll();
  };

  const deleteGarage = async (id: string) => {
    await supabase.from("garages").delete().eq("id", id);
    toast.success("تم حذف الكراج");
    loadAll();
  };

  const addCarByAdmin = async () => {
    if (!newCar.make || !newCar.ownerName || !newCar.ownerPhone) { toast.error("الرجاء تعبئة الحقول المطلوبة"); return; }
    const { error } = await supabase.from("cars").insert({
      make: newCar.make, model: newCar.model, year: newCar.year,
      plate_number: newCar.plateNumber, color: newCar.color,
      owner_name: newCar.ownerName, owner_phone: newCar.ownerPhone,
      notes: newCar.notes, estimated_cost: newCar.estimatedCost,
      estimated_time: newCar.estimatedTime, garage_id: newCar.garageId || null,
      status: "received",
    });
    if (error) { toast.error("خطأ"); return; }
    toast.success("تم إضافة السيارة");
    setShowAddCar(false);
    setNewCar({ make: "", model: "", year: 2024, plateNumber: "", color: "", ownerName: "", ownerPhone: "", notes: "", estimatedCost: 0, estimatedTime: "", garageId: "" });
    loadAll();
  };

  const updateCarStatus = async (carId: string, newStatus: string) => {
    await supabase.from("cars").update({ status: newStatus }).eq("id", carId);
    const car = cars.find(c => c.id === carId);
    if (car) {
      await supabase.from("car_updates").insert({ car_id: carId, status: newStatus, message: `تحديث الحالة: ${statusLabels[newStatus as CarStatus] || newStatus}` });
      const { data: ownerProfile } = await supabase.from("profiles").select("id").eq("phone", car.owner_phone).maybeSingle();
      if (ownerProfile) {
        await supabase.from("notifications").insert({
          recipient_id: ownerProfile.id, sender_id: user?.id,
          title: "تحديث حالة السيارة", message: `${car.make} ${car.model}: ${statusLabels[newStatus as CarStatus] || newStatus}`,
          type: "status",
        });
      }
    }
    toast.success("تم تحديث الحالة");
    loadAll();
  };

  const deleteCar = async (id: string) => {
    await supabase.from("cars").delete().eq("id", id);
    toast.success("تم حذف السيارة");
    loadAll();
  };

  const sendNotification = async () => {
    if (!notifTitle.trim() || !notifMessage.trim()) { toast.error("الرجاء تعبئة البيانات"); return; }
    if (notifTarget === "all") {
      const allUsers = users.filter(u => u.role !== "admin");
      const inserts = allUsers.map(u => ({
        recipient_id: u.id, sender_id: user?.id || null,
        title: notifTitle, message: notifMessage, type: "system" as const,
      }));
      await supabase.from("notifications").insert(inserts);
      toast.success(`تم الإرسال لـ ${allUsers.length} مستخدم`);
    } else {
      if (!notifRecipientId) { toast.error("اختر المستخدم"); return; }
      await supabase.from("notifications").insert({
        recipient_id: notifRecipientId, sender_id: user?.id || null,
        title: notifTitle, message: notifMessage, type: "system",
      });
      toast.success("تم الإرسال");
    }
    setNotifTitle(""); setNotifMessage(""); setShowNotifForm(false);
    loadAll();
  };

  const customers = users.filter(u => u.role === "customer");
  const garageUsers = users.filter(u => u.role === "garage");
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
        <div className="flex items-center justify-between ios-card px-5 py-3">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-destructive" />
            <span className="text-destructive font-bold text-sm">وضع المطور – صلاحيات كاملة</span>
          </div>
          <div className="flex items-center gap-2">
            {pendingUsers.length > 0 && (
              <span className="px-2 py-1 rounded-full bg-neon-orange/10 text-neon-orange text-xs font-bold">
                {pendingUsers.length} بانتظار الموافقة
              </span>
            )}
            <button onClick={loadAll} className="text-muted-foreground hover:text-foreground transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-surface-2 rounded-2xl p-1 overflow-x-auto">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
              tab === id ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-foreground"
            }`}>
              <Icon className="w-4 h-4" /> {label}
              {id === "approvals" && pendingUsers.length > 0 && (
                <span className="w-5 h-5 bg-destructive text-destructive-foreground text-[10px] rounded-full flex items-center justify-center">{pendingUsers.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* OVERVIEW */}
        {tab === "overview" && (
          <div className="space-y-6 animate-slide-up">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "المستخدمين", value: users.length, icon: Users, color: "text-primary" },
                { label: "الكراجات", value: garagesList.length, icon: Building2, color: "text-neon-orange" },
                { label: "السيارات", value: cars.length, icon: Car, color: "text-accent" },
                { label: "العملاء", value: customers.length, icon: Users, color: "text-neon-blue" },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="ios-card p-5">
                  <Icon className={`w-6 h-6 ${color} mb-3`} />
                  <p className="text-3xl font-bold text-foreground">{value}</p>
                  <p className="text-sm text-muted-foreground mt-1">{label}</p>
                </div>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button onClick={() => { setShowNotifForm(true); setNotifTarget("all"); }} className="ios-card p-5 flex items-center gap-3 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center"><Bell className="w-6 h-6 text-primary" /></div>
                <div className="text-right"><p className="font-bold text-foreground">إشعار عام</p><p className="text-xs text-muted-foreground">لجميع المستخدمين</p></div>
              </button>
              <button onClick={() => setShowAddUser(true)} className="ios-card p-5 flex items-center gap-3 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center"><UserPlus className="w-6 h-6 text-accent" /></div>
                <div className="text-right"><p className="font-bold text-foreground">إضافة مستخدم</p><p className="text-xs text-muted-foreground">إنشاء حساب يدوياً</p></div>
              </button>
              <button onClick={() => setShowAddGarage(true)} className="ios-card p-5 flex items-center gap-3 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-2xl bg-neon-orange/10 flex items-center justify-center"><Building2 className="w-6 h-6 text-neon-orange" /></div>
                <div className="text-right"><p className="font-bold text-foreground">إضافة كراج</p><p className="text-xs text-muted-foreground">كراج جديد</p></div>
              </button>
            </div>

            {/* Recent Users */}
            <div className="ios-card p-5">
              <h3 className="font-bold text-foreground text-lg mb-4">آخر التسجيلات</h3>
              <div className="space-y-3">
                {customers.slice(0, 5).map(u => (
                  <div key={u.id} className="flex items-center justify-between bg-surface-2 rounded-2xl p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-primary font-bold text-sm">{u.full_name[0]}</span>
                      </div>
                      <div>
                        <p className="text-foreground font-bold text-sm">{u.full_name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" /> {u.phone}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] px-2 py-1 rounded-full ${(u as any).approved ? "bg-accent/10 text-accent" : "bg-neon-orange/10 text-neon-orange"}`}>
                      {(u as any).approved ? "مفعّل" : "بانتظار"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* APPROVALS */}
        {tab === "approvals" && (
          <div className="space-y-4 animate-slide-up">
            <h3 className="font-bold text-foreground text-lg">طلبات الموافقة ({pendingUsers.length})</h3>
            {pendingUsers.length === 0 ? (
              <div className="ios-card p-12 text-center">
                <Check className="w-12 h-12 text-accent mx-auto mb-3" />
                <p className="text-muted-foreground">لا توجد طلبات بانتظار الموافقة</p>
              </div>
            ) : pendingUsers.map(u => (
              <div key={u.id} className="ios-card p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-neon-orange/10 flex items-center justify-center">
                      <Users className="w-6 h-6 text-neon-orange" />
                    </div>
                    <div>
                      <p className="text-foreground font-bold">{u.full_name}</p>
                      <p className="text-sm text-muted-foreground">{u.phone}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(u.created_at).toLocaleString("ar-OM")}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => approveUser(u.id)} className="w-10 h-10 rounded-xl bg-accent/10 text-accent flex items-center justify-center hover:bg-accent/20 transition-colors">
                      <Check className="w-5 h-5" />
                    </button>
                    <button onClick={() => rejectUser(u.id)} className="w-10 h-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center hover:bg-destructive/20 transition-colors">
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* USERS TAB */}
        {tab === "users" && (
          <div className="space-y-4 animate-slide-up">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input placeholder="بحث..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="ios-input pr-10" />
              </div>
              <button onClick={() => setShowAddUser(true)} className="px-4 py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-sm flex items-center gap-2 shadow-lg shadow-primary/20">
                <Plus className="w-4 h-4" /> إضافة
              </button>
            </div>

            {filteredUsers.map(u => (
              <div key={u.id} className="ios-card p-4">
                {editingUser === u.id ? (
                  <div className="space-y-3">
                    <input value={editForm.full_name} onChange={e => setEditForm({ ...editForm, full_name: e.target.value })} className="ios-input" placeholder="الاسم" />
                    <input value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} className="ios-input" placeholder="الهاتف" dir="ltr" />
                    <select value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })} className="ios-input">
                      <option value="customer">عميل</option>
                      <option value="garage">كراج</option>
                      <option value="admin">أدمن</option>
                    </select>
                    <div className="flex gap-2">
                      <button onClick={() => updateUser(u.id)} className="flex-1 py-2 rounded-xl bg-accent text-accent-foreground font-bold text-sm">حفظ</button>
                      <button onClick={() => setEditingUser(null)} className="flex-1 py-2 rounded-xl bg-surface-2 text-foreground font-bold text-sm">إلغاء</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${u.role === "garage" ? "bg-neon-orange/10" : u.role === "admin" ? "bg-destructive/10" : "bg-primary/10"}`}>
                        <span className={`font-bold text-sm ${u.role === "garage" ? "text-neon-orange" : u.role === "admin" ? "text-destructive" : "text-primary"}`}>{u.full_name[0]}</span>
                      </div>
                      <div>
                        <p className="text-foreground font-bold text-sm flex items-center gap-2">
                          {u.full_name}
                          {u.is_premium && <Star className="w-3.5 h-3.5 text-neon-orange" />}
                        </p>
                        <p className="text-xs text-muted-foreground">{u.phone}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${
                        u.role === "garage" ? "bg-neon-orange/10 text-neon-orange" :
                        u.role === "admin" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"
                      }`}>{u.role === "garage" ? "كراج" : u.role === "admin" ? "أدمن" : "عميل"}</span>
                      {u.role !== "admin" && (
                        <>
                          <button onClick={() => { setEditingUser(u.id); setEditForm({ full_name: u.full_name, phone: u.phone, password: u.password, role: u.role }); }} className="w-8 h-8 rounded-xl bg-surface-2 flex items-center justify-center text-muted-foreground hover:text-primary transition-colors">
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => deleteUser(u.id)} className="w-8 h-8 rounded-xl bg-surface-2 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* GARAGES TAB */}
        {tab === "garages" && (
          <div className="space-y-4 animate-slide-up">
            <button onClick={() => setShowAddGarage(true)} className="w-full ios-card p-4 flex items-center justify-center gap-2 border-2 border-dashed border-primary/30 hover:border-primary/60 text-primary font-bold">
              <Plus className="w-5 h-5" /> إضافة كراج جديد
            </button>

            {garagesList.length === 0 ? (
              <div className="ios-card p-12 text-center">
                <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">لا توجد كراجات. أضف كراج من الزر أعلاه</p>
              </div>
            ) : garagesList.map(g => {
              const garageCars = cars.filter(c => c.garage_id === g.id);
              return (
                <div key={g.id} className="ios-card p-5">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-foreground font-bold text-lg flex items-center gap-2">
                        {g.name}
                        {g.is_premium && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neon-orange/10 text-neon-orange flex items-center gap-1"><Star className="w-3 h-3" /> بريميوم</span>}
                      </p>
                      {g.phone && <p className="text-sm text-muted-foreground">{g.phone}</p>}
                      {g.address && <p className="text-xs text-muted-foreground">{g.address}</p>}
                    </div>
                    <button onClick={() => deleteGarage(g.id)} className="w-8 h-8 rounded-xl bg-surface-2 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex gap-3">
                    {[
                      { label: "السيارات", value: garageCars.length },
                      { label: "قيد التصليح", value: garageCars.filter(c => c.status === "repairing").length },
                      { label: "جاهزة", value: garageCars.filter(c => c.status === "ready").length },
                    ].map(s => (
                      <div key={s.label} className="bg-surface-2 rounded-xl px-4 py-3">
                        <p className="text-xs text-muted-foreground">{s.label}</p>
                        <p className="text-foreground font-bold text-xl">{s.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CARS TAB */}
        {tab === "cars" && (
          <div className="space-y-4 animate-slide-up">
            <button onClick={() => setShowAddCar(true)} className="w-full ios-card p-4 flex items-center justify-center gap-2 border-2 border-dashed border-primary/30 hover:border-primary/60 text-primary font-bold">
              <Plus className="w-5 h-5" /> إضافة سيارة
            </button>
            <p className="text-muted-foreground text-sm">{cars.length} سيارة في النظام</p>
            {cars.map(car => (
              <div key={car.id} className="ios-card p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-surface-2 flex items-center justify-center">
                      <Car className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-foreground font-bold">{car.make} {car.model} {car.year}</p>
                      <p className="text-xs text-muted-foreground">{car.owner_name} • {car.plate_number}</p>
                      {car.color && <p className="text-[10px] text-muted-foreground">اللون: {car.color}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={car.status}
                      onChange={e => updateCarStatus(car.id, e.target.value)}
                      className="text-xs bg-surface-2 border border-border rounded-xl px-2 py-1.5 text-foreground focus:outline-none focus:border-primary"
                    >
                      {(["received", "inspecting", "repairing", "waiting_parts", "ready"] as CarStatus[]).map(s => (
                        <option key={s} value={s}>{statusLabels[s]}</option>
                      ))}
                    </select>
                    <button onClick={() => deleteCar(car.id)} className="w-8 h-8 rounded-xl bg-surface-2 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* NOTIFICATIONS TAB */}
        {tab === "notifications" && (
          <div className="space-y-4 animate-slide-up">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button onClick={() => { setShowNotifForm(true); setNotifTarget("all"); }} className="ios-card p-4 flex items-center justify-center gap-2 text-primary font-bold hover:shadow-md transition-shadow">
                <Bell className="w-5 h-5" /> إشعار عام
              </button>
              <button onClick={() => { setShowNotifForm(true); setNotifTarget("specific"); }} className="ios-card p-4 flex items-center justify-center gap-2 text-accent font-bold hover:shadow-md transition-shadow">
                <Send className="w-5 h-5" /> رسالة خاصة
              </button>
            </div>
            {notifications.slice(0, 30).map(n => {
              const recipient = users.find(u => u.id === n.recipient_id);
              return (
                <div key={n.id} className="ios-card p-4">
                  <p className="text-foreground font-bold text-sm">{n.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{n.message}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] text-muted-foreground">إلى: {recipient?.full_name || "—"}</span>
                    <span className="text-[10px] text-muted-foreground">{new Date(n.created_at).toLocaleString("ar-OM")}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${n.read ? "bg-accent/10 text-accent" : "bg-neon-orange/10 text-neon-orange"}`}>
                      {n.read ? "مقروء" : "غير مقروء"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* MODALS */}
        {/* Notification Form */}
        {showNotifForm && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-foreground/10 backdrop-blur-sm p-4" onClick={() => setShowNotifForm(false)}>
            <div className="ios-card p-6 w-full max-w-md space-y-4 animate-slide-up" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className="text-foreground font-bold text-lg">{notifTarget === "all" ? "إشعار عام" : "رسالة خاصة"}</h3>
                <button onClick={() => setShowNotifForm(false)} className="text-muted-foreground"><X className="w-5 h-5" /></button>
              </div>
              {notifTarget === "specific" && (
                <select value={notifRecipientId} onChange={e => setNotifRecipientId(e.target.value)} className="ios-input">
                  <option value="">اختر المستخدم</option>
                  {users.filter(u => u.role !== "admin").map(u => (
                    <option key={u.id} value={u.id}>{u.full_name} ({u.phone})</option>
                  ))}
                </select>
              )}
              <input placeholder="العنوان" value={notifTitle} onChange={e => setNotifTitle(e.target.value)} className="ios-input" />
              <textarea placeholder="الرسالة..." value={notifMessage} onChange={e => setNotifMessage(e.target.value)} rows={3} className="ios-input resize-none" />
              <button onClick={sendNotification} className="ios-btn-primary flex items-center justify-center gap-2">
                <Send className="w-5 h-5" /> إرسال
              </button>
            </div>
          </div>
        )}

        {/* Add User Modal */}
        {showAddUser && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-foreground/10 backdrop-blur-sm p-4" onClick={() => setShowAddUser(false)}>
            <div className="ios-card p-6 w-full max-w-md space-y-4 animate-slide-up" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className="text-foreground font-bold text-lg">إضافة مستخدم</h3>
                <button onClick={() => setShowAddUser(false)} className="text-muted-foreground"><X className="w-5 h-5" /></button>
              </div>
              <input placeholder="الاسم الرباعي" value={newUser.fullName} onChange={e => setNewUser({ ...newUser, fullName: e.target.value })} className="ios-input" />
              <input placeholder="رقم الهاتف" dir="ltr" value={newUser.phone} onChange={e => setNewUser({ ...newUser, phone: e.target.value })} className="ios-input" />
              <select value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })} className="ios-input">
                <option value="customer">عميل</option>
                <option value="garage">كراج</option>
                <option value="admin">أدمن</option>
              </select>
              {newUser.role === "garage" && (
                <input placeholder="اسم الكراج" value={newUser.garageName} onChange={e => setNewUser({ ...newUser, garageName: e.target.value })} className="ios-input" />
              )}
              <button onClick={createUser} className="ios-btn-primary flex items-center justify-center gap-2">
                <UserPlus className="w-5 h-5" /> إنشاء الحساب
              </button>
            </div>
          </div>
        )}

        {/* Add Garage Modal */}
        {showAddGarage && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-foreground/10 backdrop-blur-sm p-4" onClick={() => setShowAddGarage(false)}>
            <div className="ios-card p-6 w-full max-w-md space-y-4 animate-slide-up" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className="text-foreground font-bold text-lg">إضافة كراج</h3>
                <button onClick={() => setShowAddGarage(false)} className="text-muted-foreground"><X className="w-5 h-5" /></button>
              </div>
              <input placeholder="اسم الكراج *" value={newGarage.name} onChange={e => setNewGarage({ ...newGarage, name: e.target.value })} className="ios-input" />
              <input placeholder="رقم هاتف الكراج" dir="ltr" value={newGarage.phone} onChange={e => setNewGarage({ ...newGarage, phone: e.target.value })} className="ios-input" />
              <input placeholder="العنوان" value={newGarage.address} onChange={e => setNewGarage({ ...newGarage, address: e.target.value })} className="ios-input" />
              <label className="flex items-center gap-3 cursor-pointer bg-surface-2 rounded-2xl p-3">
                <input type="checkbox" checked={newGarage.isPremium} onChange={e => setNewGarage({ ...newGarage, isPremium: e.target.checked })} className="w-5 h-5 rounded accent-neon-orange" />
                <span className="text-foreground text-sm font-bold">كراج بريميوم ⭐</span>
              </label>
              <div className="border-t border-border pt-3">
                <p className="text-muted-foreground text-xs mb-3">صاحب الكراج (اختياري)</p>
                <input placeholder="اسم المالك" value={newGarage.ownerName} onChange={e => setNewGarage({ ...newGarage, ownerName: e.target.value })} className="ios-input mb-3" />
                <input placeholder="هاتف المالك" dir="ltr" value={newGarage.ownerPhone} onChange={e => setNewGarage({ ...newGarage, ownerPhone: e.target.value })} className="ios-input" />
              </div>
              <button onClick={createGarage} className="ios-btn-primary flex items-center justify-center gap-2">
                <Building2 className="w-5 h-5" /> إنشاء الكراج
              </button>
            </div>
          </div>
        )}

        {/* Add Car Modal */}
        {showAddCar && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-foreground/10 backdrop-blur-sm p-4" onClick={() => setShowAddCar(false)}>
            <div className="ios-card p-6 w-full max-w-md space-y-4 animate-slide-up max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <h3 className="text-foreground font-bold text-lg">إضافة سيارة</h3>
                <button onClick={() => setShowAddCar(false)} className="text-muted-foreground"><X className="w-5 h-5" /></button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="الماركة *" value={newCar.make} onChange={e => setNewCar({ ...newCar, make: e.target.value })} className="ios-input" />
                <input placeholder="الموديل" value={newCar.model} onChange={e => setNewCar({ ...newCar, model: e.target.value })} className="ios-input" />
                <input type="number" placeholder="السنة" value={newCar.year} onChange={e => setNewCar({ ...newCar, year: parseInt(e.target.value) })} className="ios-input" />
                <input placeholder="رقم اللوحة" value={newCar.plateNumber} onChange={e => setNewCar({ ...newCar, plateNumber: e.target.value })} className="ios-input" />
              </div>
              <input placeholder="اللون (مثال: أزرق فاتح)" value={newCar.color} onChange={e => setNewCar({ ...newCar, color: e.target.value })} className="ios-input" />
              <input placeholder="اسم المالك *" value={newCar.ownerName} onChange={e => setNewCar({ ...newCar, ownerName: e.target.value })} className="ios-input" />
              <input placeholder="هاتف المالك *" dir="ltr" value={newCar.ownerPhone} onChange={e => setNewCar({ ...newCar, ownerPhone: e.target.value })} className="ios-input" />
              <select value={newCar.garageId} onChange={e => setNewCar({ ...newCar, garageId: e.target.value })} className="ios-input">
                <option value="">اختر الكراج</option>
                {garagesList.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-3">
                <input type="number" placeholder="التكلفة (ر.ع)" value={newCar.estimatedCost || ""} onChange={e => setNewCar({ ...newCar, estimatedCost: parseFloat(e.target.value) || 0 })} className="ios-input" />
                <input placeholder="الوقت المتوقع" value={newCar.estimatedTime} onChange={e => setNewCar({ ...newCar, estimatedTime: e.target.value })} className="ios-input" />
              </div>
              <textarea placeholder="ملاحظات..." value={newCar.notes} onChange={e => setNewCar({ ...newCar, notes: e.target.value })} rows={2} className="ios-input resize-none" />
              <button onClick={addCarByAdmin} className="ios-btn-primary flex items-center justify-center gap-2">
                <Save className="w-5 h-5" /> حفظ السيارة
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
