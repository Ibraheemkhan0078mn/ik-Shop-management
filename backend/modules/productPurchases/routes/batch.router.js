import { Router } from "express";
import {
    getBatchesData,
    createBatchData,
    updateBatchData,
    deleteBatchData,
} from "../controllers/batch.controller.js";
import { protect, authorize } from "../../auth/middlewares/auth.middleware.js";

const router = Router();

router.use(protect);

router.post("/", authorize("admin"), createBatchData);
router.put("/:id", authorize("admin"), updateBatchData);
router.delete("/:id", authorize("admin"), deleteBatchData);
router.get("/:productId", getBatchesData);
router.get("/:productId/getBatchesById", getBatchesData);


export default router;