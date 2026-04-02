"use client";

import { useEffect, useState } from "react";

type Theme = "dark" | "light";

/**
 * Manages the global theme (dark / light) and persists it to localStorage.
 * Applies `data-theme` attribute to `<html>` so CSS vars respond immediately.
 */
export function useTheme(defaultTheme: Theme = "dark"): [Theme, () => void] {
  const [theme, setTheme] = useState<Theme>(defaultTheme);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("limitrum-theme") as Theme | null;
    if (stored === "dark" || stored === "light") {
      setTheme(stored);
    }
  }, []);

  // Apply to DOM whenever theme changes
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("limitrum-theme", theme);
  }, [theme]);

  const toggle = () => setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  return [theme, toggle];
}
