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

export function getApiUrl(path = "") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const baseUrl = import.meta.env.VITE_BACKEND_API_URL;

  if (baseUrl) {
    return `${baseUrl.replace(/\/$/, "")}${normalizedPath}`;
  }

  return normalizedPath;
}

export function applyTheme(colors) {
  const root = document.documentElement;

  if (!colors || typeof colors !== "object") {
    Object.values(cssVarMap).forEach((cssVar) => root.style.removeProperty(cssVar));
    return;
  }

  Object.entries(colors).forEach(([key, value]) => {
    const cssVar = cssVarMap[key];
    if (!cssVar) return;

    if (value === null || value === undefined || value === "") {
      root.style.removeProperty(cssVar);
      return;
    }

    root.style.setProperty(cssVar, value);
  });
}