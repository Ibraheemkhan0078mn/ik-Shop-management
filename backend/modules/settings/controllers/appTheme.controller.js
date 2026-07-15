import mongoose from "mongoose";
import {
    getActiveTheme as getActiveThemeService,
    getAllThemes as getAllThemesService,
    getThemeById as getThemeByIdService,
    putActiveTheme as putActiveThemeService,
    putTheme as putThemeService,
} from "../services/appTheme.service.js";

// GET /api/theme/active
export const getActiveTheme = async (req, res) => {
    try {
        const theme = await getActiveThemeService();
        return res.status(200).json(theme);
    } catch (err) {
        console.error("getActiveTheme error:", err);
        return res.status(500).json({ message: "Failed to fetch active theme" });
    }
};

// GET /api/theme
export const getAllThemes = async (req, res) => {
    try {
        const { shopId } = req.query;
        if (shopId && !mongoose.Types.ObjectId.isValid(shopId)) {
            return res.status(400).json({ message: "Invalid shopId" });
        }
        const themes = await getAllThemesService({ shopId });
        return res.status(200).json(themes);
    } catch (err) {
        console.error("getAllThemes error:", err);
        return res.status(500).json({ message: "Failed to fetch themes" });
    }
};

// GET /api/theme/:id
export const getThemeById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid theme id" });
        }
        const theme = await getThemeByIdService(id);
        if (!theme) return res.status(404).json({ message: "Theme not found" });
        return res.status(200).json(theme);
    } catch (err) {
        console.error("getThemeById error:", err);
        return res.status(500).json({ message: "Failed to fetch theme" });
    }
};

// PUT /api/theme/active
export const putActiveTheme = async (req, res) => {
    try {
        const { name, colors } = req.body;
        const theme = await putActiveThemeService({ name, colors });
        return res.status(200).json(theme);
    } catch (err) {
        console.error("putActiveTheme error:", err);
        return res.status(400).json({ message: err.message || "Failed to save active theme" });
    }
};

// PUT /api/theme/:id  -> update if exists, create (upsert) if not
export const putTheme = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, colors, shop, isActive } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid theme id" });
        }

        const theme = await putThemeService(id, { name, colors, shop, isActive });
        return res.status(200).json(theme);
    } catch (err) {
        console.error("putTheme error:", err);
        return res.status(400).json({ message: err.message || "Failed to save theme" });
    }
};