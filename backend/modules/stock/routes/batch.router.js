import { Router } from "express";
import {
    getBatches,
    createBatch,
    updateBatch,
    deleteBatch,
} from "../controllers/batch.controller.js";
import { protect, authorize } from "../../auth/middlewares/auth.middleware.js";

const router = Router();

router.use(protect);

router.post("/", authorize("admin"), createBatch);
router.put("/:id", authorize("admin"), updateBatch);
router.delete("/:id", authorize("admin"), deleteBatch);
router.get("/:productId", getBatches);


export default router;