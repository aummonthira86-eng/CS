import { useSyncExternalStore } from "react";

export type ThemeMode = "light" | "dark" | "system";
export type ColorPreset = "teal" | "blue" | "emerald" | "violet" | "amber" | "rose";
export type RadiusPreset = "sm" | "md" | "lg" | "xl";

export interface FontOption {
  id: string;
  name: string;
  labelTh: string;
  family: string;
  category: "sans" | "display" | "mono";
}

export const FONT_OPTIONS: FontOption[] = [
  {
    id: "ibm-plex",
    name: "IBM Plex Sans Thai",
    labelTh: "IBM Plex Sans Thai (มาตรฐาน สะอาดตา)",
    family: '"IBM Plex Sans Thai", ui-sans-serif, system-ui, sans-serif',
    category: "sans",
  },
  {
    id: "bai-jamjuree",
    name: "Bai Jamjuree",
    labelTh: "Bai Jamjuree (โมเดิร์น กระชับ ทันสมัย)",
    family: '"Bai Jamjuree", "IBM Plex Sans Thai", sans-serif',
    category: "display",
  },
  {
    id: "prompt",
    name: "Prompt",
    labelTh: "Prompt (นุ่มนวล เรียบหรู ชัดเจน)",
    family: '"Prompt", "IBM Plex Sans Thai", sans-serif',
    category: "sans",
  },
  {
    id: "kanit",
    name: "Kanit",
    labelTh: "Kanit (คมชัด หนักแน่น เป็นสากล)",
    family: '"Kanit", "IBM Plex Sans Thai", sans-serif',
    category: "sans",
  },
  {
    id: "sarabun",
    name: "Sarabun",
    labelTh: "Sarabun (ทางการ อ่านง่าย มาตรฐาน)",
    family: '"Sarabun", "IBM Plex Sans Thai", sans-serif',
    category: "sans",
  },
  {
    id: "inter",
    name: "Inter",
    labelTh: "Inter (สากล เรียบเท่ คมชัดสูง)",
    family: '"Inter", "IBM Plex Sans Thai", system-ui, sans-serif',
    category: "sans",
  },
  {
    id: "mono",
    name: "JetBrains Mono",
    labelTh: "JetBrains Mono (แบบพิมพ์ / รหัสคำสั่ง)",
    family: '"JetBrains Mono", ui-monospace, monospace',
    category: "mono",
  },
];

export interface ColorPresetOption {
  id: ColorPreset;
  name: string;
  labelTh: string;
  hex: string;
  previewBg: string;
}

export const COLOR_PRESETS: ColorPresetOption[] = [
  {
    id: "teal",
    name: "Emerald Teal",
    labelTh: "มรกตคลาสสิก (ดั้งเดิม)",
    hex: "#10b981",
    previewBg: "bg-emerald-600",
  },
  {
    id: "blue",
    name: "Cyber Blue",
    labelTh: "ไซเบอร์บลู (ฟ้าคราม)",
    hex: "#0ea5e9",
    previewBg: "bg-sky-500",
  },
  {
    id: "emerald",
    name: "Forest Green",
    labelTh: "ป่าสนเขียวชอุ่ม",
    hex: "#059669",
    previewBg: "bg-emerald-600",
  },
  {
    id: "violet",
    name: "Royal Violet",
    labelTh: "รอยัลไวโอเล็ต (ม่วงหลวง)",
    hex: "#8b5cf6",
    previewBg: "bg-violet-600",
  },
  {
    id: "amber",
    name: "Sunset Amber",
    labelTh: "พระอาทิตย์อัสดง (ส้มทอง)",
    hex: "#f59e0b",
    previewBg: "bg-amber-500",
  },
  {
    id: "rose",
    name: "Crimson Rose",
    labelTh: "กุหลาบสด (แดงชมพู)",
    hex: "#f43f5e",
    previewBg: "bg-rose-500",
  },
];

export interface ThemeConfig {
  mode: ThemeMode;
  colorPreset: ColorPreset;
  fontSans: string;
  fontDisplay: string;
  radius: RadiusPreset;
}

export const DEFAULT_THEME_CONFIG: ThemeConfig = {
  mode: "light",
  colorPreset: "teal",
  fontSans: '"IBM Plex Sans Thai", ui-sans-serif, system-ui, sans-serif',
  fontDisplay: '"Bai Jamjuree", "IBM Plex Sans Thai", sans-serif',
  radius: "lg",
};

const THEME_STORAGE_KEY = "faq-mgmt:theme-config:v1";

let currentConfig: ThemeConfig = { ...DEFAULT_THEME_CONFIG };
const listeners = new Set<() => void>();

function getStoredConfig(): ThemeConfig {
  if (typeof window === "undefined") return DEFAULT_THEME_CONFIG;
  try {
    const raw = window.localStorage.getItem(THEME_STORAGE_KEY);
    if (!raw) return DEFAULT_THEME_CONFIG;
    const parsed = JSON.parse(raw) as Partial<ThemeConfig>;
    return {
      ...DEFAULT_THEME_CONFIG,
      ...parsed,
    };
  } catch {
    return DEFAULT_THEME_CONFIG;
  }
}

export function applyThemeToDocument(config: ThemeConfig) {
  if (typeof window === "undefined" || !document?.documentElement) return;
  const root = document.documentElement;

  // 1. Theme mode (dark / light / system)
  let isDark = config.mode === "dark";
  if (config.mode === "system") {
    isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  if (isDark) {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }

  // 2. Color Preset attribute
  root.setAttribute("data-theme", config.colorPreset);

  // 3. Fonts custom property
  root.style.setProperty("--font-sans", config.fontSans);
  root.style.setProperty("--font-display", config.fontDisplay);

  // 4. Radius
  const radiusMap: Record<RadiusPreset, string> = {
    sm: "0.375rem",
    md: "0.5rem",
    lg: "0.75rem",
    xl: "1rem",
  };
  root.style.setProperty("--radius", radiusMap[config.radius] ?? "0.75rem");
}

function notify() {
  listeners.forEach((l) => l());
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(currentConfig));
    } catch {
      // ignore
    }
    applyThemeToDocument(currentConfig);
  }
}

export const themeStore = {
  getSnapshot() {
    return currentConfig;
  },
  getServerSnapshot() {
    return DEFAULT_THEME_CONFIG;
  },
  subscribe(callback: () => void) {
    listeners.add(callback);
    return () => listeners.delete(callback);
  },
  init() {
    if (typeof window === "undefined") return;
    currentConfig = getStoredConfig();
    applyThemeToDocument(currentConfig);
    // Listen for system dark mode changes if mode === "system"
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => {
      if (currentConfig.mode === "system") {
        applyThemeToDocument(currentConfig);
      }
    };
    media.addEventListener("change", listener);
  },
  update(patch: Partial<ThemeConfig>) {
    currentConfig = { ...currentConfig, ...patch };
    notify();
  },
  setMode(mode: ThemeMode) {
    this.update({ mode });
  },
  setColorPreset(colorPreset: ColorPreset) {
    this.update({ colorPreset });
  },
  setFontSans(fontSans: string) {
    this.update({ fontSans });
  },
  setFontDisplay(fontDisplay: string) {
    this.update({ fontDisplay });
  },
  setRadius(radius: RadiusPreset) {
    this.update({ radius });
  },
  reset() {
    currentConfig = { ...DEFAULT_THEME_CONFIG };
    notify();
  },
};

export function useTheme(): ThemeConfig {
  return useSyncExternalStore(
    themeStore.subscribe,
    themeStore.getSnapshot,
    themeStore.getServerSnapshot,
  );
}
