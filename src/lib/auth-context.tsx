import { createContext, useContext, useState, ReactNode } from "react";
import { User, UserRole, mockUsers } from "./mock-data";

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => boolean;
  register: (fullName: string, phone: string) => { username: string; password: string } | null;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = (username: string, password: string): boolean => {
    // Admin login
    if (username === "bmw555" && password === "123456789") {
      setUser({
        id: "admin",
        fullName: "المطور",
        phone: "00000000",
        username: "bmw555",
        role: "admin",
      });
      return true;
    }

    // Mock login - find user by username
    const found = mockUsers.find((u) => u.username === username);
    if (found) {
      setUser(found);
      return true;
    }
    return false;
  };

  const register = (fullName: string, phone: string) => {
    const username = fullName.split(" ")[0].toLowerCase() + "_" + Math.floor(Math.random() * 1000);
    const password = Math.random().toString(36).slice(-8);
    const newUser: User = {
      id: "new_" + Date.now(),
      fullName,
      phone,
      username,
      role: "customer",
    };
    setUser(newUser);
    return { username, password };
  };

  const logout = () => setUser(null);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};
