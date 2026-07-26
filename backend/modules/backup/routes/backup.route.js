import express from "express";
import { getStorageInfo, syncAll, syncRequired, stopSync, getSyncStatus } from "../controllers/backup.controller.js";
import { protect } from "../../auth/middlewares/auth.middleware.js";

const router = express.Router();

router.get("/storage-info", protect, getStorageInfo);
router.post("/sync-all", protect, syncAll);
router.post("/sync-required", protect, syncRequired);
router.post("/stop-sync", protect, stopSync);
router.get("/sync-status", protect, getSyncStatus);

export default router;
