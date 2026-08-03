import { Router } from "express";
import {
    getWastages,
    getPaginatedWastages,
    getWastage,
    createWastage,
    updateWastage,
    deleteWastage,
    submitWastage,
    approveWastage,
    rejectWastage,
} from "../controllers/wastage.controller.js";
import { protect, authorize } from "../../auth/middlewares/auth.middleware.js";

const router = Router();

router.use(protect);

router.get("/", getWastages);
router.get("/paginate", getPaginatedWastages);
router.get("/:id", getWastage);
router.post("/", authorize("admin", "staff"), createWastage);
router.put("/:id", authorize("admin", "staff"), updateWastage);
router.delete("/:id", authorize("admin"), deleteWastage);

// Status transitions
router.patch("/:id/submit", authorize("admin", "staff"), submitWastage);
router.patch("/:id/approve", authorize("admin"), approveWastage);
router.patch("/:id/reject", authorize("admin"), rejectWastage);

export default router;
