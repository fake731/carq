import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { normalizePhone, phonesMatch } from "./phone-utils";
import { arabicNamesMatch, getMatchScore, normalizeArabic } from "./arabic-utils";
import { Permission, getPermissionsForRole } from "./permissions";

export interface Profile {
  id: string;
  username: string;
  password: string;
  full_name: string;
  phone: string;
  role: string;
  garage_id: string | null;
  garage_name: string | null;
  is_premium: boolean | null;
  approved: boolean;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: Profile | null;
  permissions: Permission[];
  hasPermission: (p: Permission) => boolean;
  login: (identifier: string, password: string) => Promise<{ success: boolean; suggestions?: Profile[]; error?: string }>;
  loginWithProfile: (profile: Profile) => void;
  register: (fullName: string, phone: string) => Promise<{ success: boolean; username: string; password: string } | { success: false; error: string }>;
  logout: () => void;
  recoverAccount: (identifier: string, verifyCode: string) => Promise<{ success: boolean; profile?: Profile; error?: string }>;
  isAuthenticated: boolean;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Admin credentials
const ADMIN_USERNAME = "bmw5555";
const ADMIN_PASSWORD = "123456789@#$";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const permissions = user ? getPermissionsForRole(user.role) : [];
  const checkPermission = (p: Permission) => permissions.includes(p);

  useEffect(() => {
    const saved = localStorage.getItem("smart_garage_user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUser(parsed);
        supabase.from("profiles").select("*").eq("id", parsed.id).maybeSingle().then(({ data }) => {
          if (data) {
            setUser(data as Profile);
            localStorage.setItem("smart_garage_user", JSON.stringify(data));
          }
        });
      } catch {}
    }
    setLoading(false);
  }, []);

  const refreshUser = async () => {
    if (!user) return;
    const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
    if (data) {
      setUser(data as Profile);
      localStorage.setItem("smart_garage_user", JSON.stringify(data));
    }
  };

  const login = async (identifier: string, password: string) => {
    // Check admin credentials first
    if (normalizeArabic(identifier.trim()) === ADMIN_USERNAME && password.trim() === ADMIN_PASSWORD) {
      // Find or create admin profile
      const { data: adminProfile } = await supabase.from("profiles").select("*").eq("username", ADMIN_USERNAME).maybeSingle();
      if (adminProfile) {
        setUser(adminProfile as Profile);
        localStorage.setItem("smart_garage_user", JSON.stringify(adminProfile));
        return { success: true };
      }
      // Create admin if not exists
      const { data: newAdmin } = await supabase.from("profiles").insert({
        username: ADMIN_USERNAME, password: ADMIN_PASSWORD,
        full_name: "المطور الرئيسي", phone: ADMIN_PASSWORD,
        role: "admin", approved: true,
      }).select().single();
      if (newAdmin) {
        setUser(newAdmin as Profile);
        localStorage.setItem("smart_garage_user", JSON.stringify(newAdmin));
        return { success: true };
      }
    }

    // Get all profiles for smart matching
    const { data: allProfiles } = await supabase.from("profiles").select("*");
    if (!allProfiles || allProfiles.length === 0) {
      return { success: false, error: "لا توجد حسابات مسجلة" };
    }

    // 1. Exact username match
    const exactMatch = allProfiles.find(p => 
      normalizeArabic(p.username) === normalizeArabic(identifier.trim()) ||
      normalizeArabic(p.full_name) === normalizeArabic(identifier.trim())
    );

    if (exactMatch) {
      if (exactMatch.password === password.trim() || phonesMatch(exactMatch.password, password)) {
        if (!exactMatch.approved) return { success: false, error: "حسابك قيد المراجعة من قبل الإدارة" };
        setUser(exactMatch as Profile);
        localStorage.setItem("smart_garage_user", JSON.stringify(exactMatch));
        return { success: true };
      }
      return { success: false, error: "كلمة المرور غير صحيحة" };
    }

    // 2. Smart Arabic name matching
    const smartMatches = allProfiles.filter(p => arabicNamesMatch(identifier.trim(), p.full_name));
    
    if (smartMatches.length > 0) {
      smartMatches.sort((a, b) => getMatchScore(identifier, b.full_name) - getMatchScore(identifier, a.full_name));
      
      const passwordMatches = smartMatches.filter(p => p.password === password.trim() || phonesMatch(p.password, password));
      
      if (passwordMatches.length === 1) {
        if (!passwordMatches[0].approved) return { success: false, error: "حسابك قيد المراجعة من قبل الإدارة" };
        setUser(passwordMatches[0] as Profile);
        localStorage.setItem("smart_garage_user", JSON.stringify(passwordMatches[0]));
        return { success: true };
      }
      
      if (passwordMatches.length > 1) {
        return { success: false, suggestions: passwordMatches as Profile[] };
      }
      
      return { success: false, suggestions: smartMatches.slice(0, 5) as Profile[], error: "كلمة المرور غير صحيحة" };
    }

    return { success: false, error: "اسم المستخدم أو كلمة المرور غير صحيحة" };
  };

  const loginWithProfile = (profile: Profile) => {
    setUser(profile);
    localStorage.setItem("smart_garage_user", JSON.stringify(profile));
  };

  const register = async (fullName: string, phone: string) => {
    const normalizedPhone = normalizePhone(phone);
    
    const { data: existing } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    const phoneExists = (existing || []).find(p => phonesMatch(p.phone, phone));
    if (phoneExists) return { success: false as const, error: "رقم الهاتف مسجل مسبقاً" };

    const username = fullName.trim();
    const password = normalizedPhone;

    const { data, error } = await supabase
      .from("profiles")
      .insert({ username, password, full_name: fullName.trim(), phone: normalizedPhone, role: "customer", approved: false })
      .select()
      .single();

    if (data && !error) {
      return { success: true as const, username, password: normalizedPhone };
    }
    return { success: false as const, error: "حدث خطأ أثناء التسجيل" };
  };

  const recoverAccount = async (identifier: string, verifyCode: string): Promise<{ success: boolean; profile?: Profile; error?: string }> => {
    const { data: all } = await supabase.from("profiles").select("*");
    if (!all) return { success: false, error: "لم يتم العثور على حسابات" };
    
    // Find profile
    let found: Profile | undefined;
    
    const byPhone = all.find(p => phonesMatch(p.phone, identifier));
    if (byPhone) found = byPhone as Profile;
    
    if (!found) {
      const nameMatches = all.filter(p => arabicNamesMatch(identifier.trim(), p.full_name));
      if (nameMatches.length > 0) {
        nameMatches.sort((a, b) => getMatchScore(identifier, b.full_name) - getMatchScore(identifier, a.full_name));
        found = nameMatches[0] as Profile;
      }
    }

    if (!found) {
      const byUsername = all.find(p => p.username === identifier.trim());
      if (byUsername) found = byUsername as Profile;
    }

    if (!found) return { success: false, error: "لم يتم العثور على حساب بهذه البيانات" };

    // Verify: first 4 chars of password or phone must match
    const passFirst4 = found.password.replace(/\D/g, '').slice(0, 4);
    const phoneFirst4 = found.phone.replace(/\D/g, '').slice(0, 4);
    const codeClean = verifyCode.replace(/\D/g, '').slice(0, 4);

    if (codeClean.length < 4) {
      return { success: false, error: "الرجاء إدخال أول 4 أرقام من كلمة المرور أو الهاتف" };
    }

    if (codeClean !== passFirst4 && codeClean !== phoneFirst4) {
      return { success: false, error: "رمز التحقق غير صحيح" };
    }

    return { success: true, profile: found };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("smart_garage_user");
  };

  return (
    <AuthContext.Provider value={{ user, permissions, hasPermission: checkPermission, login, loginWithProfile, register, logout, recoverAccount, isAuthenticated: !!user, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};
