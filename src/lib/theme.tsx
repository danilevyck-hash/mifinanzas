"use client";
import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type ThemeContextType = {
  dark: boolean;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextType>({ dark: false, toggle: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("mifinanzas_theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = stored ? stored === "dark" : prefersDark;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggle = () => {
    document.documentElement.classList.add("transitioning");
    const next = !dark;
    setDark(next);
    localStorage.setItem("mifinanzas_theme", next ? "dark" : "light");
    document.documentElement.classList.toggle("dark", next);
    setTimeout(() => document.documentElement.classList.remove("transitioning"), 300);
  };

  return <ThemeContext.Provider value={{ dark, toggle }}>{children}</ThemeContext.Provider>;
}

export function useTheme() { return useContext(ThemeContext); }
