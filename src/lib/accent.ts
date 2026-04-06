export const ACCENT_COLORS = [
  { name: "Indigo", value: "#6366F1", light: "#818CF8" },
  { name: "Esmeralda", value: "#10B981", light: "#34D399" },
  { name: "Rosa", value: "#F43F5E", light: "#FB7185" },
  { name: "Ambar", value: "#F59E0B", light: "#FBBF24" },
  { name: "Cyan", value: "#06B6D4", light: "#22D3EE" },
  { name: "Purpura", value: "#8B5CF6", light: "#A78BFA" },
];

export function getAccentColor(): { value: string; light: string } {
  if (typeof window === "undefined") return ACCENT_COLORS[0];
  const stored = localStorage.getItem("mifinanzas_accent");
  return ACCENT_COLORS.find(c => c.value === stored) || ACCENT_COLORS[0];
}

export function applyAccentColor(color: string) {
  const accent = ACCENT_COLORS.find(c => c.value === color);
  if (!accent) return;
  document.documentElement.style.setProperty("--color-accent", accent.value);
  document.documentElement.style.setProperty("--color-accent-light", accent.light);
  localStorage.setItem("mifinanzas_accent", accent.value);
}
