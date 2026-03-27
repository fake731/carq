import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Profile = Tables<"profiles">;

interface AuthContextType {
  user: Profile | null;
  login: (username: string, password: string) => Promise<boolean>;
  register: (fullName: string, phone: string) => Promise<{ username: string; password: string } | null>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check localStorage for saved session
    const saved = localStorage.getItem("smart_garage_user");
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch {}
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("username", username)
      .eq("password", password)
      .maybeSingle();

    if (data && !error) {
      setUser(data);
      localStorage.setItem("smart_garage_user", JSON.stringify(data));
      return true;
    }
    return false;
  };

  const register = async (fullName: string, phone: string) => {
    const username = fullName.split(" ")[0].toLowerCase() + "_" + Math.floor(Math.random() * 1000);
    const password = Math.random().toString(36).slice(-8);

    const { data, error } = await supabase
      .from("profiles")
      .insert({ username, password, full_name: fullName, phone, role: "customer" })
      .select()
      .single();

    if (data && !error) {
      setUser(data);
      localStorage.setItem("smart_garage_user", JSON.stringify(data));
      return { username, password };
    }
    return null;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("smart_garage_user");
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated: !!user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};
