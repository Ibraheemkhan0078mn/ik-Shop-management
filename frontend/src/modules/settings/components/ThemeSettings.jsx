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
        id: "pro-slate",
        title: "Slate Professional",
        description: "Neutral slate with subtle blue-green accents for refined workflows.",
        colors: {
            appBg: "#f4f5f7",
            appBg2: "#e7e9ed",
            surface: "#ffffff",
            surfaceMuted: "#eff2f6",
            ink: "#1f2937",
            muted: "#6b7280",
            accent: "#0f766e",
            accent2: "#2563eb",
            border: "#d1d5db",
        },
    },
    {
        id: "pro-teal",
        title: "Teal Executive",
        description: "Soft neutrals with a cool teal accent for polished styling.",
        colors: {
            appBg: "#eefcf9",
            appBg2: "#d5f1ec",
            surface: "#ffffff",
            surfaceMuted: "#e5f5f0",
            ink: "#0f3940",
            muted: "#4f6b6f",
            accent: "#0d9488",
            accent2: "#14b8a6",
            border: "#c9e5de",
        },
    },
    {
        id: "pro-charcoal",
        title: "Charcoal Executive",
        description: "Minimalist charcoal with strong typography and soft dividers.",
        colors: {
            appBg: "#f1f3f6",
            appBg2: "#dde2e8",
            surface: "#ffffff",
            surfaceMuted: "#eef1f5",
            ink: "#111827",
            muted: "#475569",
            accent: "#0f172a",
            accent2: "#334155",
            border: "#cbd5e1",
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
        id: "sunset-coral",
        title: "Sunset Coral",
        description: "Warm coral accents with soft ivory and smooth grey grounds.",
        colors: {
            appBg: "#fff5f1",
            appBg2: "#fde8df",
            surface: "#fff9f5",
            surfaceMuted: "#fce8df",
            ink: "#3f2a22",
            muted: "#8a6b5f",
            accent: "#f97316",
            accent2: "#ef4444",
            border: "#f4d5c8",
        },
    },
    {
        id: "earthy-olive",
        title: "Earthy Olive",
        description: "Grounded olive shades with soft creams and strong forest accents.",
        colors: {
            appBg: "#f4f2ed",
            appBg2: "#e8e4d9",
            surface: "#ffffff",
            surfaceMuted: "#ece8de",
            ink: "#2f3429",
            muted: "#6b6f57",
            accent: "#556b2f",
            accent2: "#3d5a2d",
            border: "#dad7c9",
        },
    },
    {
        id: "corporate-steel",
        title: "Corporate Steel",
        description: "Professional steel tones with blue highlights for enterprise apps.",
        colors: {
            appBg: "#f3f5f8",
            appBg2: "#dce3ec",
            surface: "#ffffff",
            surfaceMuted: "#e7eef8",
            ink: "#101828",
            muted: "#5f6f84",
            accent: "#2563eb",
            accent2: "#0f172a",
            border: "#c4d0e3",
        },
    },
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

export default function ThemeSettings() {
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
                const response = await fetch(getApiUrl("/theme/active"));
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
        setMessage(`${preset.title} selected. Saving active theme...`);

        const persisted = await persistTheme({ name: preset.title, colors: preset.colors });
        if (persisted) {
            setMessage(`${preset.title} selected and saved as active theme.`);
        } else {
            setMessage(`${preset.title} selected. Unable to save active theme. Please save manually.`);
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
            setMessage("Custom theme editor unlocked.");
            return;
        }
        setPasswordError("Incorrect password. Try again.");
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage("");

        try {
            const response = await fetch(getApiUrl("/theme/active"), {
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
            setMessage("Theme saved and applied successfully.");
        } catch (error) {
            console.error("Theme save failed", error);
            setMessage(error.message || "Theme update failed.");
        } finally {
            setSaving(false);
        }
    };

    const resetTheme = () => {
        setSelectedPreset("classic-warm");
        const preset = THEME_PRESETS[0];
        setTheme({ name: preset.title, colors: preset.colors });
        applyTheme(preset.colors);
        setMessage("Reset to the default theme preview. Save to persist.");
    };

    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-(--border) bg-(--surface) p-5">
                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h2 className="flex items-center gap-2 text-lg font-semibold text-(--ink)">
                            <Palette size={18} /> Theme Builder
                        </h2>
                        <p className="text-sm text-(--muted)">
                            Choose a preset, customize colors, and save your active application theme.
                        </p>
                    </div>
                </div>
                {message ? (
                    <div className="mt-4 rounded-lg border border-(--border) bg-(--surface-muted) px-3 py-2 text-sm text-(--ink)">
                        {message}
                    </div>
                ) : null}
            </div>

            <div className="grid gap-4">
                <div className="grid gap-3 md:grid-cols-3">
                    {THEME_PRESETS.map((preset) => (
                        <button
                            key={preset.id}
                            type="button"
                            onClick={() => setPresetTheme(preset.id)}
                            className={`rounded-3xl border p-4 text-left transition-all ${
                                preset.id === selectedPreset
                                    ? "border-(--accent-2) bg-(--surface-muted) shadow-lg"
                                    : "border-(--border) bg-(--surface) hover:border-(--accent-2)"
                            }`}
                        >
                            <div className="mb-3 flex items-center justify-between">
                                <div>
                                    <p className="font-semibold text-(--ink)">{preset.title}</p>
                                    <p className="text-xs text-(--muted)">{preset.description}</p>
                                </div>
                                <span className="rounded-full bg-(--accent) px-2 py-1 text-[10px] font-semibold text-white">
                                    Preset
                                </span>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                                {Object.values(preset.colors).map((color) => (
                                    <span
                                        key={color}
                                        style={{ backgroundColor: color }}
                                        className="h-8 rounded-xl border border-[rgba(0,0,0,0.08)]"
                                    />
                                ))}
                            </div>
                        </button>
                    ))}
                </div>

                <div className="rounded-3xl border border-(--border) bg-(--surface) p-5">
                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h3 className="text-base font-semibold text-(--ink)">Custom Theme Editor</h3>
                            <p className="text-sm text-(--muted)">
                                This section is password protected. Enter the password to unlock custom theme editing.
                            </p>
                        </div>
                    </div>

                    {!customUnlocked ? (
                        <div className="mt-6 grid gap-4 md:grid-cols-2 items-end">
                            <div>
                                <label className="block text-sm font-medium text-(--ink) mb-2">
                                    Unlock password
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    placeholder="Enter password"
                                    className="w-full rounded-2xl border border-(--border) bg-(--surface-muted) px-3 py-2 text-sm text-(--ink) outline-none"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    onClick={handleUnlockCustom}
                                    className="rounded-xl bg-(--accent-2) px-4 py-2 text-sm font-semibold text-white"
                                >
                                    Unlock
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setPassword("");
                                        setPasswordError("");
                                    }}
                                    className="rounded-xl border border-(--border) bg-(--surface) px-4 py-2 text-sm font-medium text-(--ink)"
                                >
                                    Clear
                                </button>
                            </div>
                            {passwordError ? (
                                <div className="col-span-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                                    {passwordError}
                                </div>
                            ) : null}
                        </div>
                    ) : (
                        <>
                            <div className="mt-6 grid gap-3 md:grid-cols-2 md:items-center md:justify-between">
                                <div>
                                    <p className="text-sm text-(--muted)">You have unlocked custom editing. Change colors below and save the theme to persist.</p>
                                </div>
                                <div className="max-w-xs">
                                    <label className="block text-sm font-medium text-(--ink) mb-2">
                                        Theme name
                                    </label>
                                    <input
                                        type="text"
                                        value={theme.name}
                                        onChange={(event) => {
                                            setSelectedPreset("custom");
                                            setTheme((prev) => ({ ...prev, name: event.target.value }));
                                        }}
                                        placeholder="Custom Theme"
                                        className="w-full rounded-2xl border border-(--border) bg-(--surface-muted) px-3 py-2 text-sm text-(--ink) outline-none"
                                    />
                                </div>
                            </div>

                            <div className="mt-6 grid gap-4 lg:grid-cols-2">
                                {FIELD_MAP.map((field) => (
                                    <div key={field.key} className="rounded-2xl border border-(--border) bg-(--surface-muted) p-4">
                                        <div className="mb-3 flex items-center justify-between gap-2">
                                            <div>
                                                <p className="font-medium text-(--ink)">{field.label}</p>
                                                <p className="text-sm text-(--muted)">{field.description}</p>
                                            </div>
                                            <input
                                                type="color"
                                                value={theme.colors[field.key] || "#ffffff"}
                                                onChange={(event) => updateColor(field.key, event.target.value)}
                                                className="h-10 w-10 cursor-pointer rounded-xl border border-(--border) bg-transparent p-0"
                                            />
                                        </div>
                                        <input
                                            type="text"
                                            value={theme.colors[field.key] || ""}
                                            onChange={(event) => updateColor(field.key, event.target.value)}
                                            placeholder="#ffffff"
                                            className="w-full rounded-2xl border border-(--border) bg-white px-3 py-2 text-sm text-(--ink) outline-none"
                                        />
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3">
                <button
                    type="button"
                    onClick={resetTheme}
                    className="flex items-center gap-2 rounded-xl border border-(--border) bg-(--surface) px-4 py-2 text-sm font-medium text-(--ink)"
                >
                    <RotateCcw size={16} /> Reset preset
                </button>
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 rounded-xl bg-(--accent-2) px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
                >
                    <Save size={16} /> {saving ? "Saving..." : "Save Theme"}
                </button>
            </div>
        </div>
    );
}
