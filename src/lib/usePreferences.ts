"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth";

type Preferences = {
  last_category?: string;
  last_payment_method?: string;
  collapsed_sections?: Record<string, boolean>;
  alerts_dismissed_date?: string;
};

export function usePreferences() {
  const { user, authFetch } = useAuth();
  const [prefs, setPrefs] = useState<Preferences>({});

  useEffect(() => {
    if (!user) return;
    authFetch("/api/user-preferences").then(r => r.ok ? r.json() : null).then(d => { if (d) setPrefs(d); }).catch(() => {});
  }, [user, authFetch]);

  const updatePrefs = useCallback(async (updates: Partial<Preferences>) => {
    const newPrefs = { ...prefs, ...updates };
    setPrefs(newPrefs);
    try {
      await authFetch("/api/user-preferences", { method: "POST", body: JSON.stringify(newPrefs) });
    } catch {}
  }, [prefs, authFetch]);

  return { prefs, updatePrefs };
}
