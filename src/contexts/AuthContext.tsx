
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
  "owner@enjoydive.com": {
    password: "owner123",
    user: {
      id: "1",
      name: "Made Sutrisno",
      email: "owner@enjoydive.com",
      role: "Owner",
    },
  },
  "admin@enjoydive.com": {
    password: "admin123",
    user: {
      id: "2",
      name: "Kadek Sari Dewi",
      email: "admin@enjoydive.com",
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
    await new Promise((resolve) => setTimeout(resolve, 1000));
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
