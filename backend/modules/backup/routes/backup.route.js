import express from "express";
import { getStorageInfo, syncAll, syncRequired, stopSync, getSyncStatus } from "../controllers/backup.controller.js";
import { authenticate } from "../../auth/middlewares/auth.middleware.js";

const router = express.Router();

router.get("/storage-info", authenticate, getStorageInfo);
router.post("/sync-all", authenticate, syncAll);
router.post("/sync-required", authenticate, syncRequired);
router.post("/stop-sync", authenticate, stopSync);
router.get("/sync-status", authenticate, getSyncStatus);

export default router;
