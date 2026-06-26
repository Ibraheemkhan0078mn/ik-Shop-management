import { Router } from "express";
import {
    getMe,
    loginUser,
    logoutUser,
    registerUser,
} from "../controllers/auth.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = Router();

router.post("/login", loginUser);
router.post("/register", registerUser);
router.get("/me", getMe);
router.post("/logout", logoutUser);

export default router;
