import mongoose from "mongoose";
import { getLocalAppThemeModel } from "../../../configs/connect.db.js";




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

const createDefaultTheme = async (Theme) => {
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

    return Theme.create(defaultTheme);
};

// GET /api/theme/active
export const getActiveTheme = async (req, res) => {
    const Theme = getLocalAppThemeModel();
    try {
        let theme = await Theme.findOne({ isActive: true }).lean();

        if (!theme) {
            const existingTheme = await Theme.findOne({}).sort({ updatedAt: -1 }).lean();
            if (existingTheme) {
                theme = existingTheme;
            } else {
                theme = await createDefaultTheme(Theme);
            }
        }

        return res.status(200).json(theme);
    } catch (err) {
        console.error("getActiveTheme error:", err);
        return res.status(500).json({ message: "Failed to fetch active theme" });
    }
};

// GET /api/theme
export const getAllThemes = async (req, res) => {
    const Theme = getLocalAppThemeModel();
    try {
        const { shopId } = req.query;
        const filter = {};
        if (shopId) {
            if (!mongoose.Types.ObjectId.isValid(shopId)) {
                return res.status(400).json({ message: "Invalid shopId" });
            }
            filter.shop = shopId;
        }
        const themes = await Theme.find(filter).sort({ updatedAt: -1 }).lean();
        return res.status(200).json(themes);
    } catch (err) {
        console.error("getAllThemes error:", err);
        return res.status(500).json({ message: "Failed to fetch themes" });
    }
};

// GET /api/theme/:id
export const getThemeById = async (req, res) => {
    const Theme = getLocalAppThemeModel();
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid theme id" });
        }
        const theme = await Theme.findById(id).lean();
        if (!theme) return res.status(404).json({ message: "Theme not found" });
        return res.status(200).json(theme);
    } catch (err) {
        console.error("getThemeById error:", err);
        return res.status(500).json({ message: "Failed to fetch theme" });
    }
};

// PUT /api/theme/active
export const putActiveTheme = async (req, res) => {
    const Theme = getLocalAppThemeModel();
    try {
        const { name, colors } = req.body;
        const { clean, errors } = sanitizeColors(colors || {});

        if (errors.length) {
            return res.status(400).json({ message: "Invalid color values", errors });
        }

        let activeTheme = await Theme.findOne({ isActive: true });
        let themeToUpdate = activeTheme;

        if (!themeToUpdate) {
            const existingTheme = await Theme.findOne({}).sort({ updatedAt: -1 });
            themeToUpdate = existingTheme;
        }

        if (themeToUpdate) {
            if (name && typeof name === "string") themeToUpdate.name = name.trim();
            themeToUpdate.colors = {
                ...(themeToUpdate.colors?.toObject?.() || themeToUpdate.colors || {}),
                ...clean,
            };
            themeToUpdate.isActive = true;
            await themeToUpdate.save();

            await Theme.updateMany(
                { _id: { $ne: themeToUpdate._id } },
                { $set: { isActive: false } }
            );

            return res.status(200).json(themeToUpdate);
        }

        const createdTheme = await Theme.create({
            name: name && typeof name === "string" ? name.trim() : "Default Theme",
            isActive: true,
            colors: clean,
        });

        return res.status(201).json(createdTheme);
    } catch (err) {
        console.error("putActiveTheme error:", err);
        return res.status(500).json({ message: "Failed to save active theme" });
    }
};

// PUT /api/theme/:id  -> update if exists, create (upsert) if not
export const putTheme = async (req, res) => {
    const Theme = getLocalAppThemeModel();
    try {
        const { id } = req.params;
        const { name, colors, shop, isActive } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid theme id" });
        }

        const { clean, errors } = sanitizeColors(colors);
        if (errors.length) {
            return res.status(400).json({ message: "Invalid color values", errors });
        }

        const existing = await Theme.findById(id);

        if (existing) {
            // ---- UPDATE ----
            if (name && typeof name === "string") existing.name = name.trim();

            existing.colors = {
                ...(existing.colors.toObject?.() ?? existing.colors),
                ...clean,
            };

            if (typeof isActive === "boolean") existing.isActive = isActive;

            await existing.save();
            return res.status(200).json(existing);
        }

        // ---- CREATE (upsert with client-supplied _id) ----
        const created = await Theme.create({
            _id: id,
            name: name && typeof name === "string" ? name.trim() : "Default Theme",
            colors: clean,
            shop: shop || undefined,
            isActive: typeof isActive === "boolean" ? isActive : false,
        });

        return res.status(201).json(created);
    } catch (err) {
        console.error("putTheme error:", err);
        return res.status(500).json({ message: "Failed to save theme" });
    }
};