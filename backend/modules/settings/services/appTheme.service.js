import {
    createAppThemeService,
    findAppThemeService,
    findOneAppThemeService,
    findByIdAppThemeService,
    updateAppThemeService,
    updateManyAppThemeService,
    deleteOneAppThemeService,
    countAppThemeService,
} from "./appTheme.crud.js";

const ALLOWED_COLOR_KEYS = [
    "appBg", "appBg2", "surface", "surfaceMuted",
    "ink", "muted", "accent", "accent2", "border",
];

const isValidCssColor = (value) => {
    if (typeof value !== "string" || value.trim() === "") return false;
    const hex = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/;
    const rgb = /^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+\s*)?\)$/;
    const hsl = /^hsla?\(\s*[\d.]+\s*,\s*[\d.]+%\s*,\s*[\d.]+%\s*(,\s*[\d.]+\s*)?\)$/;
    return hex.test(value) || rgb.test(value) || hsl.test(value);
};

const sanitizeColors = (colors = {}) => {
    const clean = {};
    const errors = [];
    for (const key of Object.keys(colors)) {
        if (!ALLOWED_COLOR_KEYS.includes(key)) continue;
        const value = colors[key];
        if (value === null || value === undefined || value === "") {
            clean[key] = null;
            continue;
        }
        if (!isValidCssColor(value)) {
            errors.push(`Invalid color value for "${key}": ${value}`);
            continue;
        }
        clean[key] = value;
    }
    return { clean, errors };
};

const createDefaultTheme = async () => {
    const defaultTheme = {
        name: "Default Theme",
        isActive: true,
        colors: {
            appBg: null,
            appBg2: null,
            surface: null,
            surfaceMuted: null,
            ink: null,
            muted: null,
            accent: null,
            accent2: null,
            border: null,
        },
    };

    return createAppThemeService(defaultTheme);
};

export const getActiveTheme = async () => {
    let theme = await findOneAppThemeService({ isActive: true });

    if (!theme) {
        const themes = await findAppThemeService();
        const existingTheme = themes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];
        if (existingTheme) {
            theme = existingTheme;
        } else {
            theme = await createDefaultTheme();
        }
    }

    return theme;
};

export const getAllThemes = async (filters = {}) => {
    const { shopId } = filters;
    const filter = {};
    if (shopId) {
        filter.shop = shopId;
    }
    const themes = await findAppThemeService(filter);
    return themes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
};

export const getThemeById = async (id) => {
    return findByIdAppThemeService(id);
};

export const putActiveTheme = async (data) => {
    const { name, colors } = data;
    const { clean, errors } = sanitizeColors(colors || {});

    if (errors.length) {
        throw new Error("Invalid color values: " + errors.join(", "));
    }

    let activeTheme = await findOneAppThemeService({ isActive: true });
    let themeToUpdate = activeTheme;

    if (!themeToUpdate) {
        const themes = await findAppThemeService();
        themeToUpdate = themes.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0];
    }

    if (themeToUpdate) {
        const updateData = { isActive: true };
        if (name && typeof name === "string") updateData.name = name.trim();
        updateData.colors = {
            ...(themeToUpdate.colors?.toObject?.() || themeToUpdate.colors || {}),
            ...clean,
        };

        const updated = await updateAppThemeService(themeToUpdate._id, updateData);

        await updateManyAppThemeService(
            { _id: { $ne: themeToUpdate._id } },
            { $set: { isActive: false } }
        );

        return updated;
    }

    const createdTheme = await createAppThemeService({
        name: name && typeof name === "string" ? name.trim() : "Default Theme",
        isActive: true,
        colors: clean,
    });

    return createdTheme;
};

export const putTheme = async (id, data) => {
    const { name, colors, shop, isActive } = data;

    const { clean, errors } = sanitizeColors(colors);
    if (errors.length) {
        throw new Error("Invalid color values: " + errors.join(", "));
    }

    const existing = await findByIdAppThemeService(id);

    if (existing) {
        const updateData = {};
        if (name && typeof name === "string") updateData.name = name.trim();

        updateData.colors = {
            ...(existing.colors.toObject?.() ?? existing.colors),
            ...clean,
        };

        if (typeof isActive === "boolean") updateData.isActive = isActive;

        return updateAppThemeService(id, updateData);
    }

    const created = await createAppThemeService({
        _id: id,
        name: name && typeof name === "string" ? name.trim() : "Default Theme",
        colors: clean,
        shop: shop || undefined,
        isActive: typeof isActive === "boolean" ? isActive : false,
    });

    return created;
};
