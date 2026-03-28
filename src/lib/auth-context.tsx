import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { normalizePhone, phonesMatch } from "./phone-utils";

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
        // Refresh from DB
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
    const normalizedPassword = normalizePhone(password);
    
    // Try exact username match first
    const { data: exactMatch } = await supabase
      .from("profiles")
      .select("*")
      .eq("username", identifier.trim())
      .maybeSingle();
    
    if (exactMatch) {
      if (phonesMatch(exactMatch.password, password)) {
        if (!exactMatch.approved) {
          return { success: false, error: "حسابك قيد المراجعة من قبل الإدارة" };
        }
        setUser(exactMatch as Profile);
        localStorage.setItem("smart_garage_user", JSON.stringify(exactMatch));
        return { success: true };
      }
    }

    // Try matching by full_name exact
    const { data: nameMatch } = await supabase
      .from("profiles")
      .select("*")
      .eq("full_name", identifier.trim())
      .maybeSingle();

    if (nameMatch) {
      if (phonesMatch(nameMatch.password, password)) {
        if (!nameMatch.approved) {
          return { success: false, error: "حسابك قيد المراجعة من قبل الإدارة" };
        }
        setUser(nameMatch as Profile);
        localStorage.setItem("smart_garage_user", JSON.stringify(nameMatch));
        return { success: true };
      }
    }

    // Fuzzy: match by first name and show suggestions
    const firstName = identifier.trim().split(" ")[0];
    if (firstName.length >= 2) {
      const { data: fuzzy } = await supabase
        .from("profiles")
        .select("*")
        .ilike("full_name", `${firstName}%`);
      
      if (fuzzy && fuzzy.length > 0) {
        // Check if any match the password
        const passwordMatches = fuzzy.filter(p => phonesMatch(p.password, password));
        if (passwordMatches.length === 1) {
          if (!passwordMatches[0].approved) {
            return { success: false, error: "حسابك قيد المراجعة من قبل الإدارة" };
          }
          setUser(passwordMatches[0] as Profile);
          localStorage.setItem("smart_garage_user", JSON.stringify(passwordMatches[0]));
          return { success: true };
        }
        if (passwordMatches.length > 1) {
          return { success: false, suggestions: passwordMatches as Profile[] };
        }
        // No password match but names found
        return { success: false, suggestions: fuzzy as Profile[], error: "كلمة المرور غير صحيحة" };
      }
    }

    return { success: false, error: "اسم المستخدم أو كلمة المرور غير صحيحة" };
  };

  const loginWithProfile = (profile: Profile) => {
    setUser(profile);
    localStorage.setItem("smart_garage_user", JSON.stringify(profile));
  };

  const register = async (fullName: string, phone: string) => {
    const normalizedPhone = normalizePhone(phone);
    
    // Check if phone already exists
    const { data: existing } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    const phoneExists = (existing || []).find(p => phonesMatch(p.phone, phone));
    if (phoneExists) {
      return { success: false as const, error: "رقم الهاتف مسجل مسبقاً" };
    }

    const username = fullName.trim();
    const password = normalizedPhone;

    const { data, error } = await supabase
      .from("profiles")
      .insert({
        username,
        password,
        full_name: fullName.trim(),
        phone: normalizedPhone,
        role: "customer",
        approved: false, // Needs admin approval
      })
      .select()
      .single();

    if (data && !error) {
      // Don't set as user yet - needs approval
      return { success: true as const, username, password: normalizedPhone };
    }
    return { success: false as const, error: "حدث خطأ أثناء التسجيل" };
  };

  const recoverAccount = async (identifier: string): Promise<Profile | null> => {
    // Try phone
    const { data: all } = await supabase.from("profiles").select("*");
    if (!all) return null;
    
    const byPhone = all.find(p => phonesMatch(p.phone, identifier));
    if (byPhone) return byPhone as Profile;
    
    // Try name
    const byName = all.find(p => p.full_name === identifier.trim() || p.username === identifier.trim());
    if (byName) return byName as Profile;

    // Fuzzy first name
    const firstName = identifier.trim().split(" ")[0];
    const fuzzy = all.find(p => p.full_name.startsWith(firstName));
    return fuzzy ? (fuzzy as Profile) : null;
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
