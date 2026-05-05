// return.routes.js
import { Router } from "express";
import {
    getReturns, getPaginatedReturns, getReturn,
    createReturn, updateReturn, deleteReturn,
    submitReturn, approveReturn, rejectReturn,
} from "../controllers/return.controller.js";
import { protect, authorize } from "../../auth/middlewares/auth.middleware.js";

const router = Router();
router.use(protect);

router.get("/", getReturns);
router.get("/paginate", getPaginatedReturns);
router.get("/:id", getReturn);
router.post("/", authorize("admin", "staff"), createReturn);
router.put("/updateReturn/:id", authorize("admin", "staff"), updateReturn);
router.delete("/:id", authorize("admin"), deleteReturn);

router.patch("/:id/submit", authorize("admin", "staff"), submitReturn);
router.patch("/:id/approve", authorize("admin"), approveReturn);
router.patch("/:id/reject", authorize("admin"), rejectReturn);

export default router;