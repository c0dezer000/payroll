
"use client";
"use client";
import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string;
  email: string;
  role: "Owner" | "Admin";
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const users: Record<string, { password: string; user: User }> = {
  "owner@bayanisolutions.com": {
    password: "owner123",
    user: {
      id: "1",
      name: "Owner (Bayani)",
      email: "owner@bayanisolutions.com",
      role: "Owner",
    },
  },
  "admin@bayanisolutions.com": {
    password: "admin123",
    user: {
      id: "2",
      name: "Admin (Bayani)",
      email: "admin@bayanisolutions.com",
      role: "Admin",
    },
  },
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const savedUser = typeof window !== "undefined" ? localStorage.getItem("user") : null;
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    // First, try server-side authentication so DB users can log in
    try {
      const res = await fetch(`/api/auth`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      if (res.ok) {
        const payload = await res.json();
        if (payload && payload.user) {
          const mapped = { id: payload.user.id, name: payload.user.name, email: payload.user.email, role: payload.user.role };
          setUser(mapped);
          if (typeof window !== "undefined") localStorage.setItem("user", JSON.stringify(mapped));
          setIsLoading(false);
          router.push("/dashboard");
          return true;
        }
      }
    } catch (err) {
      console.warn("Server auth failed", err);
    }

    // Fallback: Check localStorage 'appUsers' (demo convenience) then built-in demo users
    try {
      if (typeof window !== "undefined") {
        const raw = localStorage.getItem("appUsers");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const found = parsed.find((u: any) => u.email === email && u.password === password);
            if (found) {
              const mapped = { id: found.id, name: found.name, email: found.email, role: found.role };
              setUser(mapped);
              localStorage.setItem("user", JSON.stringify(mapped));
              setIsLoading(false);
              router.push("/dashboard");
              return true;
            }
          }
        }
      }
    } catch (err) {
      console.error("Error reading appUsers for login", err);
    }

    const userRecord = users[email];
    if (userRecord && userRecord.password === password) {
      setUser(userRecord.user);
      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(userRecord.user));
      }
      setIsLoading(false);
      router.push("/dashboard");
      return true;
    }

    setIsLoading(false);
    return false;
  };

  const logout = () => {
    setUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("user");
    }
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
