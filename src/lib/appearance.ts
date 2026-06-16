export type Appearance = {
  bgColor1: string; // hex
  bgColor2: string;
  accentColor: string; // hex
  intensity: number; // 0-100
  bgAnimation: boolean;
  sidebarAnimation: boolean;
};

const KEY = "appearance.settings.v1";

export const DEFAULT_APPEARANCE: Appearance = {
  bgColor1: "#06b6d4", // cyan blob
  bgColor2: "#3b82f6", // blue blob
  accentColor: "#14b8a6", // teal accent
  intensity: 45,
  bgAnimation: true,
  sidebarAnimation: true,
};

export function getAppearance(): Appearance {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_APPEARANCE;
    return { ...DEFAULT_APPEARANCE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_APPEARANCE;
  }
}

export function saveAppearance(a: Appearance) {
  localStorage.setItem(KEY, JSON.stringify(a));
  applyAppearance(a);
  window.dispatchEvent(new CustomEvent("appearance:change", { detail: a }));
}

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  const v = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const num = parseInt(v, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

export function applyAppearance(a: Appearance) {
  const root = document.documentElement;
  const { r: r1, g: g1, b: b1 } = hexToRgb(a.bgColor1);
  const { r: r2, g: g2, b: b2 } = hexToRgb(a.bgColor2);
  const { r: ra, g: ga, b: ba } = hexToRgb(a.accentColor);
  const opacity = (a.intensity / 100) * 0.8 + 0.1;

  root.style.setProperty("--bg-blob-1", `rgba(${r1}, ${g1}, ${b1}, ${opacity})`);
  root.style.setProperty("--bg-blob-2", `rgba(${r2}, ${g2}, ${b2}, ${opacity})`);
  root.style.setProperty("--accent-custom", `rgb(${ra}, ${ga}, ${ba})`);
  root.style.setProperty("--accent-custom-soft", `rgba(${ra}, ${ga}, ${ba}, 0.35)`);
  root.style.setProperty("--accent-custom-glow", `rgba(${ra}, ${ga}, ${ba}, 0.6)`);

  root.classList.toggle("no-bg-anim", !a.bgAnimation);
  root.classList.toggle("no-sidebar-anim", !a.sidebarAnimation);
}