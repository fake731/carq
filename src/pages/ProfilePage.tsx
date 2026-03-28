import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { Navigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { User, Download, Save, Loader2, Camera } from "lucide-react";
import { toast } from "sonner";

const ProfilePage = () => {
  const { user, isAuthenticated, loading, refreshUser } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  if (loading) return null;
  if (!isAuthenticated || !user) return <Navigate to="/" replace />;

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName.trim(), phone: phone.trim(), username: fullName.trim() })
      .eq("id", user.id);

    if (!error) {
      await refreshUser();
      toast.success("تم حفظ التعديلات");
    } else {
      toast.error("حدث خطأ");
    }
    setSaving(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const path = `avatars/${user.id}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("car-images").upload(path, file);
    if (error) { toast.error("فشل رفع الصورة"); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("car-images").getPublicUrl(path);
    await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id);
    await refreshUser();
    toast.success("تم تحديث الصورة");
    setUploading(false);
  };

  const exportCredentials = () => {
    const content = `
═══════════════════════════════════════
       الكراج الذكي - بيانات الدخول
═══════════════════════════════════════

  اسم المستخدم: ${user.full_name}
  كلمة المرور: ${user.phone}

═══════════════════════════════════════
`;
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `smart-garage-credentials.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout title="الملف الشخصي">
      <div className="max-w-md mx-auto space-y-6 animate-slide-up">
        {/* Avatar */}
        <div className="ios-card p-8 text-center">
          <div className="relative inline-block">
            <div className="w-24 h-24 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center mx-auto overflow-hidden">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-primary" />
              )}
            </div>
            <label className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center cursor-pointer shadow-lg">
              {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
              <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" disabled={uploading} />
            </label>
          </div>
          <h2 className="text-xl font-bold text-foreground mt-4">{user.full_name}</h2>
          <p className="text-muted-foreground text-sm">
            {user.role === "admin" ? "مطور" : user.role === "garage" ? "كراج" : "عميل"}
          </p>
        </div>

        {/* Edit Form */}
        <div className="ios-card p-6 space-y-4">
          <h3 className="font-bold text-foreground">تعديل البيانات</h3>
          <div>
            <label className="block text-sm text-muted-foreground mb-2">الاسم الرباعي</label>
            <input value={fullName} onChange={e => setFullName(e.target.value)} className="ios-input" />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-2">رقم الهاتف</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} className="ios-input" dir="ltr" />
          </div>
          <button onClick={handleSave} disabled={saving} className="ios-btn-primary flex items-center justify-center gap-2">
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> حفظ التعديلات</>}
          </button>
        </div>

        {/* Export */}
        <div className="ios-card p-6">
          <button onClick={exportCredentials} className="ios-btn-secondary flex items-center justify-center gap-2">
            <Download className="w-5 h-5" /> تصدير بيانات الدخول
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
