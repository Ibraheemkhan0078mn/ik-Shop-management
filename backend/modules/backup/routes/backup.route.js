import express from "express";
import { getStorageInfo, syncAll, syncRequired, stopSync, getSyncStatus, exportExcel, exportFilteredData } from "../controllers/backup.controller.js";
import { protect } from "../../auth/middlewares/auth.middleware.js";

const router = express.Router();

router.get("/storage-info", protect, getStorageInfo);
router.post("/sync-all", protect, syncAll);
router.post("/sync-required", protect, syncRequired);
router.post("/stop-sync", protect, stopSync);
router.get("/sync-status", protect, getSyncStatus);
router.post("/export-excel", protect, exportExcel);
router.post("/export-filtered", protect, exportFilteredData);

export default router;
