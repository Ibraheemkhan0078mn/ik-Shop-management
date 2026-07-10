import { Router } from "express";
import { getAllThemes, getThemeById, putTheme } from "../controllers/appTheme.controller.js";

const router = Router();

router.get("/", getAllThemes);
router.get("/:id", getThemeById);
router.put("/:id", putTheme);

export default router;