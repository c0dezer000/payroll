"use client";
import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
  forcedTheme?: Theme | null;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children, forcedTheme = null }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    if (forcedTheme) return forcedTheme;
    const saved = typeof window !== "undefined" ? localStorage.getItem("theme") : null;
    return saved === "dark" ? "dark" : "light";
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("theme", theme);
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Helper: Route-level theme wrapper component
export const RouteTheme: React.FC<{ theme: Theme; children: React.ReactNode }> = ({ theme, children }) => {
  return <ThemeProvider forcedTheme={theme}>{children}</ThemeProvider>;
};
