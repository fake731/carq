import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { normalizePhone, phonesMatch } from "./phone-utils";
import { arabicNamesMatch, getMatchScore, normalizeArabic } from "./arabic-utils";

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
  login: (identifier: string, password: string) => Promise<{ success: boolean; suggestions?: Profile[]; error?: string }>;
  loginWithProfile: (profile: Profile) => void;
  register: (fullName: string, phone: string) => Promise<{ success: boolean; username: string; password: string } | { success: false; error: string }>;
  logout: () => void;
  recoverAccount: (identifier: string) => Promise<Profile | null>;
  isAuthenticated: boolean;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

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
      if (phonesMatch(exactMatch.password, password)) {
        if (!exactMatch.approved) return { success: false, error: "حسابك قيد المراجعة من قبل الإدارة" };
        setUser(exactMatch as Profile);
        localStorage.setItem("smart_garage_user", JSON.stringify(exactMatch));
        return { success: true };
      }
      return { success: false, error: "كلمة المرور غير صحيحة" };
    }

    // 2. Smart Arabic name matching - match first 2 names or first name + partial
    const smartMatches = allProfiles.filter(p => arabicNamesMatch(identifier.trim(), p.full_name));
    
    if (smartMatches.length > 0) {
      // Sort by match score
      smartMatches.sort((a, b) => getMatchScore(identifier, b.full_name) - getMatchScore(identifier, a.full_name));
      
      // Check password for matches
      const passwordMatches = smartMatches.filter(p => phonesMatch(p.password, password));
      
      if (passwordMatches.length === 1) {
        if (!passwordMatches[0].approved) return { success: false, error: "حسابك قيد المراجعة من قبل الإدارة" };
        // Auto-login with the matched profile
        setUser(passwordMatches[0] as Profile);
        localStorage.setItem("smart_garage_user", JSON.stringify(passwordMatches[0]));
        return { success: true };
      }
      
      if (passwordMatches.length > 1) {
        return { success: false, suggestions: passwordMatches as Profile[] };
      }
      
      // Password doesn't match but names found - show suggestions
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

  const recoverAccount = async (identifier: string): Promise<Profile | null> => {
    const { data: all } = await supabase.from("profiles").select("*");
    if (!all) return null;
    
    const byPhone = all.find(p => phonesMatch(p.phone, identifier));
    if (byPhone) return byPhone as Profile;
    
    // Smart Arabic name match
    const nameMatches = all.filter(p => arabicNamesMatch(identifier.trim(), p.full_name));
    if (nameMatches.length > 0) {
      nameMatches.sort((a, b) => getMatchScore(identifier, b.full_name) - getMatchScore(identifier, a.full_name));
      return nameMatches[0] as Profile;
    }

    const byUsername = all.find(p => p.username === identifier.trim());
    if (byUsername) return byUsername as Profile;

    return null;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("smart_garage_user");
  };

  return (
    <AuthContext.Provider value={{ user, login, loginWithProfile, register, logout, recoverAccount, isAuthenticated: !!user, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};
