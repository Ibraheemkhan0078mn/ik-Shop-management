import { Router } from "express";
import {
    getMe,
    loginUser,
    logoutUser,
    registerUser,
    checkAdminRegistrationAllowed,
    checkOnlineConnectionStatus,
    getCleanupPreview,
} from "../controllers/auth.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/login", loginUser);
router.post("/register", registerUser);
router.get("/me", getMe);
router.post("/logout", logoutUser);
router.get("/check-admin-registration", checkAdminRegistrationAllowed);
router.get("/connection-status", checkOnlineConnectionStatus);
router.get("/cleanup-preview", getCleanupPreview);

export default router;
