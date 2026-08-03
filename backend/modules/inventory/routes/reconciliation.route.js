import express from "express";
import {
    reconcileInventory,
    validateBatchStock,
    getProductInventoryStatus,
} from "../controllers/reconciliation.controller.js";

const router = express.Router();

router.get("/reconcile", reconcileInventory);
router.get("/validate-batches", validateBatchStock);
router.get("/product-status/:productId", getProductInventoryStatus);

export default router;
