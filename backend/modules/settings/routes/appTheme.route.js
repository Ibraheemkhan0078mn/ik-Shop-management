import { Router } from "express";
import {
    getActiveTheme,
    getAllThemes,
    getThemeById,
    putActiveTheme,
    putTheme,
} from "../controllers/appTheme.controller.js";

const router = Router();

router.get("/", getAllThemes);
router.get("/active", getActiveTheme);
router.put("/active", putActiveTheme);
router.get("/:id", getThemeById);
router.put("/:id", putTheme);

export default router;