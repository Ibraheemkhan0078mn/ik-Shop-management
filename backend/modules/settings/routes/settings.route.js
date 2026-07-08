import express from "express";
import { upload } from "../../../common/middlewares/multer.middleware.js";
import {
    getSettingsData,
    updateSettingsData,
    updateShopSettingsData,
    updatePrinterSettingsData,
    updateCameraSettingsData,
    updateLanguageSettingsData,
    updateModuleSettingsData,
} from "../controllers/settings.controller.js";

const router = express.Router();

// Legacy endpoints for backward compatibility with Generals.jsx
router.get("/get-settings", getSettingsData);
router.put("/update", updateSettingsData);
router.put("/upload-sync", updateSettingsData);
router.put("/update-language", updateLanguageSettingsData);

// New Settings API endpoints
router.get("/", getSettingsData);
router.put("/", updateSettingsData);
router.put("/shop", upload.single("shopImage"), updateShopSettingsData);
router.put("/printer", updatePrinterSettingsData);
router.put("/camera", updateCameraSettingsData);
router.put("/language", updateLanguageSettingsData);
router.put("/modules", updateModuleSettingsData);

export default router;
