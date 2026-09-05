import React, { useEffect, useMemo, useState } from "react";
import { Palette, Save, RotateCcw } from "lucide-react";
import { applyTheme, getApiUrl } from "../../../shared/utilities/themeApplier.js";

const THEME_PRESETS = [
    {
        id: "classic-warm",
        title: "Classic Warm",
        description: "Soft warm tones with natural contrast for comfortable daily use.",
        colors: {
            appBg: "#f7f3ee",
            appBg2: "#ece0d5",
            surface: "#fff8f0",
            surfaceMuted: "#f5ece3",
            ink: "#2d1d12",
            muted: "#837060",
            accent: "#b45309",
            accent2: "#0f766e",
            border: "#e7d6c5",
        },
    },
    {
        id: "navy-blue",
        title: "Navy Blue",
        description: "Clean navy surfaces with crisp blue accents and bright text.",
        colors: {
            appBg: "#e9f2fd",
            appBg2: "#d7e7fb",
            surface: "#f4f8ff",
            surfaceMuted: "#dbe5f2",
            ink: "#10203b",
            muted: "#5a6a80",
            accent: "#2563eb",
            accent2: "#1d4ed8",
            border: "#cdd8ee",
        },
    },
    {
        id: "midnight-navy",
        title: "Midnight Navy",
        description: "A bold dark layout with polished navy and crisp highlights.",
        colors: {
            appBg: "#0f172a",
            appBg2: "#111f2f",
            surface: "#14213d",
            surfaceMuted: "#1f2c43",
            ink: "#eff5ff",
            muted: "#9ab7d2",
            accent: "#5b7be3",
            accent2: "#3f5ec7",
            border: "#3b4a6a",
        },
    },
    {
        id: "modern-mint",
        title: "Modern Mint",
        description: "Fresh mint tones with warm paper-like surfaces and dark text.",
        colors: {
            appBg: "#f2fbf8",
            appBg2: "#dff2ec",
            surface: "#ffffff",
            surfaceMuted: "#e8f5ef",
            ink: "#142927",
            muted: "#5c7b74",
            accent: "#2d9c81",
            accent2: "#16a085",
            border: "#cde3dd",
        },
    },
    {
        id: "atelier-nocturne",
        title: "Atelier Nocturne",
        description: "A premium charcoal and champagne workspace with editorial contrast.",
        colors: {
            appBg: "#171719",
            appBg2: "#282426",
            surface: "#211f21",
            surfaceMuted: "#302b2d",
            ink: "#f7efe2",
            muted: "#b9aa9b",
            accent: "#d39b5f",
            accent2: "#e8b878",
            border: "#51463f",
            fontBody: "\"Aptos\", \"Segoe UI\", sans-serif",
            fontDisplay: "\"Bodoni 72\", \"Didot\", Georgia, serif",
            radiusCard: "0.55rem",
            shadowCard: "0 18px 45px rgba(0, 0, 0, 0.24)",
            canvasGradient: "linear-gradient(135deg, #171719 0%, #282426 100%)",
            sidebarGradient: "linear-gradient(135deg, #8f6038, #d39b5f)",
            buttonGradient: "linear-gradient(135deg, #b77b43, #e8b878)",
            letterSpacing: "0.01em",
        },
    },
    {
        id: "nordic-fjord",
        title: "Nordic Fjord",
        description: "Quiet blue-grey surfaces, clean spacing, and a calm Scandinavian rhythm.",
        colors: {
            appBg: "#edf3f5",
            appBg2: "#d7e4e8",
            surface: "#fbfdfc",
            surfaceMuted: "#e4eef0",
            ink: "#18323a",
            muted: "#66818a",
            accent: "#247b87",
            accent2: "#2e9eaa",
            border: "#c5d8dc",
            fontBody: "\"Trebuchet MS\", \"Segoe UI\", sans-serif",
            fontDisplay: "\"Gill Sans\", \"Trebuchet MS\", sans-serif",
            radiusCard: "1.15rem",
            shadowCard: "0 12px 30px rgba(46, 87, 99, 0.12)",
            canvasGradient: "linear-gradient(145deg, #edf3f5 0%, #d7e4e8 100%)",
            sidebarGradient: "linear-gradient(135deg, #1e6570, #2e9eaa)",
            buttonGradient: "linear-gradient(135deg, #247b87, #2e9eaa)",
            letterSpacing: "0.005em",
        },
    },
    {
        id: "terracotta-ledger",
        title: "Terracotta Ledger",
        description: "A tactile Mediterranean palette that makes routine work feel crafted.",
        colors: {
            appBg: "#f5eee6",
            appBg2: "#ead6c5",
            surface: "#fffaf4",
            surfaceMuted: "#f3e3d4",
            ink: "#3d2921",
            muted: "#866d5c",
            accent: "#bd5b3c",
            accent2: "#2e7d72",
            border: "#dfc5b2",
            fontBody: "\"Palatino Linotype\", Palatino, Georgia, serif",
            fontDisplay: "\"Palatino Linotype\", Palatino, Georgia, serif",
            radiusCard: "0.35rem",
            shadowCard: "0 10px 24px rgba(91, 54, 36, 0.13)",
            canvasGradient: "linear-gradient(135deg, #f5eee6 0%, #ead6c5 100%)",
            sidebarGradient: "linear-gradient(135deg, #8f3f2f, #bd5b3c)",
            buttonGradient: "linear-gradient(135deg, #a94a32, #d16b48)",
            letterSpacing: "0.01em",
        },
    },
    {
        id: "forest-archive",
        title: "Forest Archive",
        description: "Deep botanical greens and parchment neutrals for a grounded, durable feel.",
        colors: {
            appBg: "#e9eee7",
            appBg2: "#d2dfd0",
            surface: "#f9fbf6",
            surfaceMuted: "#e0eadd",
            ink: "#1e3327",
            muted: "#607566",
            accent: "#316b4b",
            accent2: "#4f8b5f",
            border: "#c3d3c1",
            fontBody: "\"Verdana\", \"Segoe UI\", sans-serif",
            fontDisplay: "\"Baskerville\", \"Times New Roman\", serif",
            radiusCard: "0.7rem",
            shadowCard: "0 14px 32px rgba(37, 76, 48, 0.14)",
            canvasGradient: "linear-gradient(145deg, #e9eee7 0%, #d2dfd0 100%)",
            sidebarGradient: "linear-gradient(135deg, #24523a, #4f8b5f)",
            buttonGradient: "linear-gradient(135deg, #316b4b, #4f8b5f)",
            letterSpacing: "0.005em",
        },
    },
    {
        id: "cobalt-studio",
        title: "Cobalt Studio",
        description: "Confident cobalt, warm white, and sharp geometry for a modern operations desk.",
        colors: {
            appBg: "#eef2f8",
            appBg2: "#d7e0f0",
            surface: "#ffffff",
            surfaceMuted: "#e8edf6",
            ink: "#17213a",
            muted: "#66728d",
            accent: "#3158c9",
            accent2: "#4c78e8",
            border: "#c8d3e8",
            fontBody: "\"Arial\", \"Helvetica Neue\", sans-serif",
            fontDisplay: "\"Arial Narrow\", \"Arial\", sans-serif",
            radiusCard: "0.25rem",
            shadowCard: "0 8px 22px rgba(37, 66, 139, 0.13)",
            canvasGradient: "linear-gradient(135deg, #eef2f8 0%, #d7e0f0 100%)",
            sidebarGradient: "linear-gradient(135deg, #2949a5, #4c78e8)",
            buttonGradient: "linear-gradient(135deg, #3158c9, #4c78e8)",
            letterSpacing: "0.015em",
        },
    },
    {
        id: "y2k-pop",
        title: "Y2K Pop",
        description: "A colorful early-2000s revival with chrome neutrals, candy accents, and playful energy.",
        colors: {
            appBg: "#e8e1f5",
            appBg2: "#c9e9ed",
            surface: "#fffaff",
            surfaceMuted: "#f6dff0",
            ink: "#252044",
            muted: "#776b98",
            accent: "#ed4fa3",
            accent2: "#19a7c7",
            border: "#d4b9e8",
            fontBody: "\"Trebuchet MS\", \"Arial Rounded MT Bold\", sans-serif",
            fontDisplay: "\"Arial Rounded MT Bold\", \"Trebuchet MS\", sans-serif",
            radiusCard: "1.35rem",
            shadowCard: "6px 8px 0 rgba(37, 32, 68, 0.12), 0 16px 28px rgba(237, 79, 163, 0.12)",
            canvasGradient: "linear-gradient(135deg, #e8e1f5 0%, #c9e9ed 48%, #f8dbe9 100%)",
            sidebarGradient: "linear-gradient(135deg, #7549c6, #ed4fa3 52%, #19a7c7)",
            buttonGradient: "linear-gradient(135deg, #ed4fa3, #7549c6)",
            letterSpacing: "0.02em",
        },
    },
    {
        id: "y2k-blue",
        title: "Y2K Blue",
        description: "A blue-led 2000s interface with icy chrome, electric blue, and glassy contrast.",
        colors: {
            appBg: "#dbe9f7",
            appBg2: "#b5d5ef",
            surface: "#f8fcff",
            surfaceMuted: "#d9ebf8",
            ink: "#102d50",
            muted: "#5f7e9e",
            accent: "#1476d4",
            accent2: "#35a8e8",
            border: "#a9c9e4",
            fontBody: "\"Tahoma\", \"Segoe UI\", sans-serif",
            fontDisplay: "\"Arial Rounded MT Bold\", \"Tahoma\", sans-serif",
            radiusCard: "1.1rem",
            shadowCard: "0 8px 0 rgba(20, 118, 212, 0.1), 0 18px 30px rgba(28, 93, 151, 0.14)",
            canvasGradient: "linear-gradient(135deg, #dbe9f7 0%, #b5d5ef 50%, #eaf6ff 100%)",
            sidebarGradient: "linear-gradient(135deg, #0f4ea3, #35a8e8)",
            buttonGradient: "linear-gradient(135deg, #1476d4, #35a8e8)",
            letterSpacing: "0.015em",
        },
    },
    {
        id: "rose-editorial",
        title: "Rose Editorial",
        description: "Soft blush, ink, and plum accents with a confident magazine-like hierarchy.",
        colors: {
            appBg: "#f8eef0",
            appBg2: "#efd9df",
            surface: "#fffaf9",
            surfaceMuted: "#f4e4e8",
            ink: "#38242c",
            muted: "#896b76",
            accent: "#a9466d",
            accent2: "#7c3f68",
            border: "#e5c8d2",
            fontBody: "\"Georgia\", \"Times New Roman\", serif",
            fontDisplay: "\"Bodoni 72\", \"Didot\", Georgia, serif",
            radiusCard: "0.45rem",
            shadowCard: "0 14px 30px rgba(117, 55, 79, 0.12)",
            canvasGradient: "linear-gradient(135deg, #f8eef0 0%, #efd9df 100%)",
            sidebarGradient: "linear-gradient(135deg, #7c3f68, #a9466d)",
            buttonGradient: "linear-gradient(135deg, #943b61, #c35b82)",
            letterSpacing: "0.008em",
        },
    },
    {
        id: "solar-market",
        title: "Solar Market",
        description: "Bright saffron, ink blue, and clean paper for an optimistic, high-visibility workspace.",
        colors: {
            appBg: "#fff7dc",
            appBg2: "#ffe5a6",
            surface: "#fffdf5",
            surfaceMuted: "#fff0bf",
            ink: "#263452",
            muted: "#7b725a",
            accent: "#d97706",
            accent2: "#1769aa",
            border: "#efd28a",
            fontBody: "\"Segoe UI\", \"Trebuchet MS\", sans-serif",
            fontDisplay: "\"Gill Sans\", \"Trebuchet MS\", sans-serif",
            radiusCard: "0.85rem",
            shadowCard: "0 12px 28px rgba(166, 111, 18, 0.15)",
            canvasGradient: "linear-gradient(135deg, #fff7dc 0%, #ffe5a6 100%)",
            sidebarGradient: "linear-gradient(135deg, #13558b, #1769aa)",
            buttonGradient: "linear-gradient(135deg, #c15d05, #ed9b13)",
            letterSpacing: "0.01em",
        },
    },
    {
        id: "obsidian-gold",
        title: "Obsidian Gold",
        description: "A focused dark luxury theme with brass highlights and restrained geometry.",
        colors: {
            appBg: "#101112",
            appBg2: "#1b1d20",
            surface: "#17191b",
            surfaceMuted: "#25282b",
            ink: "#f1eee6",
            muted: "#a9a69c",
            accent: "#b98b3d",
            accent2: "#d4aa5b",
            border: "#454039",
            fontBody: "\"Segoe UI\", \"Helvetica Neue\", sans-serif",
            fontDisplay: "\"Baskerville\", \"Times New Roman\", serif",
            radiusCard: "0.2rem",
            shadowCard: "0 18px 42px rgba(0, 0, 0, 0.3)",
            canvasGradient: "linear-gradient(135deg, #101112 0%, #1b1d20 100%)",
            sidebarGradient: "linear-gradient(135deg, #6f5021, #d4aa5b)",
            buttonGradient: "linear-gradient(135deg, #8f6829, #d4aa5b)",
            letterSpacing: "0.012em",
        },
    },
    {
        id: "retro-pos-classic",
        title: "Retro POS Classic",
        description: "A colorful early-2000s point-of-sale look with cyan panels, orange actions, and cobalt controls.",
        colors: {
            appBg: "#dfe9ee",
            appBg2: "#b9d2dc",
            surface: "#f8fbfc",
            surfaceMuted: "#d7e7ed",
            ink: "#17334a",
            muted: "#5d7480",
            accent: "#e28b24",
            accent2: "#08a9bd",
            border: "#8eb5c1",
            fontBody: "Tahoma, \"Segoe UI\", sans-serif",
            fontDisplay: "\"Arial Rounded MT Bold\", Tahoma, sans-serif",
            radiusCard: "0.2rem",
            shadowCard: "3px 3px 0 rgba(23, 51, 74, 0.16), 0 8px 16px rgba(46, 92, 110, 0.12)",
            canvasGradient: "linear-gradient(135deg, #dfe9ee 0%, #b9d2dc 100%)",
            sidebarGradient: "linear-gradient(90deg, #078ca5, #0cc4c5)",
            buttonGradient: "linear-gradient(90deg, #078ca5, #0cc4c5)",
            letterSpacing: "0",
        },
    },
];

const PREVIEW_COLOR_KEYS = [
    "appBg", "appBg2", "surface", "surfaceMuted", "ink", "muted", "accent", "accent2", "border",
];

const FIELD_MAP = [
    { key: "appBg", label: "Background", description: "Page background and canvas fill." },
    { key: "appBg2", label: "Section Background", description: "Secondary background for gradients and panels." },
    { key: "surface", label: "Card Background", description: "Main card and panel surface." },
    { key: "surfaceMuted", label: "Secondary Surface", description: "Muted surface for secondary containers." },
    { key: "ink", label: "Primary Text", description: "Main text and icon color." },
    { key: "muted", label: "Secondary Text", description: "Subtle text, hints, and labels." },
    { key: "accent", label: "Primary Accent", description: "Main button and active color." },
    { key: "accent2", label: "Accent Highlight", description: "Stronger accent for badges and highlights." },
    { key: "border", label: "Border", description: "Borders and dividers." },
];

const EMPTY_THEME = {
    name: "Custom Theme",
    colors: {
        appBg: "",
        appBg2: "",
        surface: "",
        surfaceMuted: "",
        ink: "",
        muted: "",
        accent: "",
        accent2: "",
        border: "",
    },
};

export default function ThemeSettings({ labels }) {
    const [theme, setTheme] = useState(EMPTY_THEME);
    const [selectedPreset, setSelectedPreset] = useState("classic-warm");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState("");
    const [customUnlocked, setCustomUnlocked] = useState(false);
    const [password, setPassword] = useState("");
    const [passwordError, setPasswordError] = useState("");

    const currentPreset = useMemo(
        () => THEME_PRESETS.find((item) => item.id === selectedPreset),
        [selectedPreset],
    );

    useEffect(() => {
        let mounted = true;

        const loadActiveTheme = async () => {
            try {
                const response = await fetch(getApiUrl("/api/theme/active"));
                const data = await response.json();

                if (!mounted) return;

                const loadedColors = {
                    ...EMPTY_THEME.colors,
                    ...data.colors,
                };

                const matchedPreset = THEME_PRESETS.find(
                    (preset) =>
                        preset.title === data.name ||
                        JSON.stringify(preset.colors) === JSON.stringify(loadedColors),
                );

                setSelectedPreset(matchedPreset ? matchedPreset.id : "custom");
                setTheme({
                    name: data.name || "Custom Theme",
                    colors: loadedColors,
                });
                applyTheme(loadedColors);
            } catch (error) {
                console.error("Failed to load theme", error);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        loadActiveTheme();

        return () => {
            mounted = false;
        };
    }, []);

    const persistTheme = async (themeData) => {
        try {
            const response = await fetch(getApiUrl("/theme/active"), {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(themeData),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data?.message || "Theme update failed");
            }

            return data;
        } catch (error) {
            console.error("Persist theme failed", error);
            return null;
        }
    };

    const setPresetTheme = async (presetId) => {
        const preset = THEME_PRESETS.find((item) => item.id === presetId);
        if (!preset) return;

        setSelectedPreset(preset.id);
        setTheme({ name: preset.title, colors: preset.colors });
        applyTheme(preset.colors);
        setMessage(`${preset.title} ${labels.themeSelected}`);

        const persisted = await persistTheme({ name: preset.title, colors: preset.colors });
        if (persisted) {
            setMessage(`${preset.title} ${labels.themeSelectedSaved}`);
        } else {
            setMessage(`${preset.title} ${labels.themeSelectedFailed}`);
        }
    };

    const updateColor = (key, value) => {
        setSelectedPreset("custom");
        setTheme((prev) => ({
            ...prev,
            colors: {
                ...prev.colors,
                [key]: value,
            },
        }));
    };

    const handleUnlockCustom = () => {
        if (password === "ikmunibshop") {
            setCustomUnlocked(true);
            setPasswordError("");
            setMessage(labels.customThemeUnlocked);
            return;
        }
        setPasswordError(labels.incorrectPassword);
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage("");

        try {
            const response = await fetch(getApiUrl("/api/theme/active"), {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: theme.name || "Custom Theme",
                    colors: theme.colors,
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data?.message || "Theme update failed");
            }

            const updatedColors = {
                ...EMPTY_THEME.colors,
                ...data.colors,
            };
            applyTheme(updatedColors);
            setTheme((prev) => ({ ...prev, colors: updatedColors }));
            setMessage(labels.themeSaved);
        } catch (error) {
            console.error("Theme save failed", error);
            setMessage(labels.themeUpdateFailed);
        } finally {
            setSaving(false);
        }
    };

    const resetTheme = () => {
        setSelectedPreset("classic-warm");
        const preset = THEME_PRESETS[0];
        setTheme({ name: preset.title, colors: preset.colors });
        applyTheme(preset.colors);
        setMessage(labels.resetToDefault);
    };

    return (
        <div className="space-y-8">
            {/* Header Section */}
            <div className="rounded-2xl border border-(--border) bg-(--surface) p-6">
                <div className="flex items-center gap-3">
                    <Palette size={24} className="text-(--accent-2)" />
                    <div>
                        <h2 className="text-xl font-semibold text-(--ink)">{labels.themeBuilder}</h2>
                        <p className="text-sm text-(--muted)">
                            {labels.themeBuilderDescription}
                        </p>
                    </div>
                </div>
                {message ? (
                    <div className="mt-4 rounded-lg border border-(--border) bg-(--surface-muted) px-4 py-3 text-sm text-(--ink)">
                        {message}
                    </div>
                ) : null}
            </div>

            {/* Preset Themes Section */}
            <div className="rounded-2xl border border-(--border) bg-(--surface) p-6">
                <h3 className="text-lg font-semibold text-(--ink) mb-4">{labels.presetThemes}</h3>
                <div className="grid gap-4 md:grid-cols-3">
                    {THEME_PRESETS.map((preset) => (
                        <button
                            key={preset.id}
                            type="button"
                            onClick={() => setPresetTheme(preset.id)}
                            className={`rounded-2xl border p-4 text-left transition-all ${
                                preset.id === selectedPreset
                                    ? "border-(--accent-2) bg-(--surface-muted) shadow-lg ring-2 ring-(--accent-2)/20"
                                    : "border-(--border) bg-(--surface) hover:border-(--accent-2) hover:shadow-md"
                            }`}
                        >
                            <div className="mb-3 flex items-center justify-between">
                                <div>
                                    <p className="font-semibold text-(--ink)">{preset.title}</p>
                                    <p className="text-xs text-(--muted)">{preset.description}</p>
                                </div>
                                <span className="rounded-full bg-(--accent) px-2 py-1 text-[10px] font-semibold text-white">
                                    {labels.preset}
                                </span>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                                {PREVIEW_COLOR_KEYS.map((key) => (
                                    <span
                                        key={key}
                                        style={{ backgroundColor: preset.colors[key] }}
                                        className="h-8 rounded-lg border border-[rgba(0,0,0,0.08)]"
                                    />
                                ))}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Custom Theme Editor Section */}
            <div className="rounded-2xl border border-(--border) bg-(--surface) p-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-8 w-1 bg-(--accent-2) rounded-full"></div>
                    <h3 className="text-lg font-semibold text-(--ink)">{labels.customThemeEditor}</h3>
                </div>
                <p className="text-sm text-(--muted) mb-6">
                    {labels.customThemeEditorDescription}
                </p>

                {!customUnlocked ? (
                    <div className="rounded-xl border border-(--border) bg-(--surface-muted) p-6">
                        <div className="grid gap-4 md:grid-cols-2 items-end">
                            <div>
                                <label className="block text-sm font-medium text-(--ink) mb-2">
                                    {labels.unlockPassword}
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    placeholder={labels.enterPassword}
                                    className="w-full rounded-xl border border-(--border) bg-white px-4 py-3 text-sm text-(--ink) outline-none focus:ring-2 focus:ring-(--accent-2)"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={handleUnlockCustom}
                                    className="rounded-xl bg-(--accent-2) px-6 py-3 text-sm font-semibold text-white hover:bg-(--accent-2)/90 transition-colors"
                                >
                                    {labels.unlock}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setPassword("");
                                        setPasswordError("");
                                    }}
                                    className="rounded-xl border border-(--border) bg-(--surface) px-6 py-3 text-sm font-medium text-(--ink) hover:bg-(--surface-muted) transition-colors"
                                >
                                    {labels.clear}
                                </button>
                            </div>
                            {passwordError ? (
                                <div className="col-span-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                    {passwordError}
                                </div>
                            ) : null}
                        </div>
                    </div>
                ) : (
                    <div className="rounded-xl border border-(--border) bg-(--surface-muted) p-6">
                        <div className="mb-6 grid gap-4 md:grid-cols-2 md:items-center md:justify-between">
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                                <p className="text-sm text-(--muted)">{labels.customEditingUnlocked}</p>
                            </div>
                            <div className="max-w-xs">
                                <label className="block text-sm font-medium text-(--ink) mb-2">
                                    {labels.themeName}
                                </label>
                                <input
                                    type="text"
                                    value={theme.name}
                                    onChange={(event) => {
                                        setSelectedPreset("custom");
                                        setTheme((prev) => ({ ...prev, name: event.target.value }));
                                    }}
                                    placeholder={labels.customTheme}
                                    className="w-full rounded-xl border border-(--border) bg-white px-4 py-3 text-sm text-(--ink) outline-none focus:ring-2 focus:ring-(--accent-2)"
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 lg:grid-cols-2">
                            {FIELD_MAP.map((field) => (
                                <div key={field.key} className="rounded-xl border border-(--border) bg-white p-4 hover:shadow-sm transition-shadow">
                                    <div className="mb-3 flex items-center justify-between gap-2">
                                        <div>
                                            <p className="font-medium text-(--ink)">{field.label}</p>
                                            <p className="text-xs text-(--muted)">{field.description}</p>
                                        </div>
                                        <input
                                            type="color"
                                            value={theme.colors[field.key] || "#ffffff"}
                                            onChange={(event) => updateColor(field.key, event.target.value)}
                                            className="h-10 w-10 cursor-pointer rounded-lg border border-(--border) bg-transparent p-0"
                                        />
                                    </div>
                                    <input
                                        type="text"
                                        value={theme.colors[field.key] || ""}
                                        onChange={(event) => updateColor(field.key, event.target.value)}
                                        placeholder="#ffffff"
                                        className="w-full rounded-lg border border-(--border) bg-(--surface-muted) px-3 py-2 text-sm text-(--ink) outline-none focus:ring-2 focus:ring-(--accent-2)"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Action Buttons Section */}
            <div className="rounded-2xl border border-(--border) bg-(--surface) p-6">
                <div className="flex flex-wrap items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={resetTheme}
                        className="flex items-center gap-2 rounded-xl border border-(--border) bg-(--surface-muted) px-6 py-3 text-sm font-medium text-(--ink) hover:bg-(--border) transition-colors"
                    >
                        <RotateCcw size={16} /> {labels.resetPreset}
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving}
                        className="flex items-center gap-2 rounded-xl bg-(--accent-2) px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70 hover:bg-(--accent-2)/90 transition-colors"
                    >
                        <Save size={16} /> {saving ? labels.saving : labels.saveTheme}
                    </button>
                </div>
            </div>
        </div>
    );
}
