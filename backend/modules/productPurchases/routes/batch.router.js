import { Router } from "express";
import {
    getBatchesData,
    createBatchData,
    updateBatchData,
    deleteBatchData,
    generateBatchNumberData,
    getBatchByIdData,
    getBatchStockData,
} from "../controllers/batch.controller.js";
import { protect, authorize } from "../../auth/middlewares/auth.middleware.js";

const router = Router();

router.use(protect);

router.get("/generate-number", generateBatchNumberData);
router.post("/", authorize("admin"), createBatchData);
router.put("/:id", authorize("admin"), updateBatchData);
router.delete("/:id", authorize("admin"), deleteBatchData);
router.get("/:productId", getBatchesData);
router.get("/:productId/getBatchesById", getBatchesData);
router.get("/by-id/:id", getBatchByIdData);
router.get("/stock/:id", getBatchStockData);


export default router;