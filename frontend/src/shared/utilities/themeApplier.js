// utils/applyTheme.js
const cssVarMap = {
  appBg: "--app-bg",
  appBg2: "--app-bg-2",
  surface: "--surface",
  surfaceMuted: "--surface-muted",
  ink: "--ink",
  muted: "--muted",
  accent: "--accent",
  accent2: "--accent-2",
  border: "--border",
};

export function applyTheme(colors) {
  if (!colors) return; // fallback to CSS defaults, do nothing
  const root = document.documentElement;
  Object.entries(colors).forEach(([key, value]) => {
    const cssVar = cssVarMap[key];
    if (cssVar && value) root.style.setProperty(cssVar, value);
  });
}