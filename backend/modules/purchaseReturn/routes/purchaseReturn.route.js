import express from "express";
import {
    createPurchaseReturnData,
    getPurchaseReturnsData,
    getPaginatedPurchaseReturnsData,
    getPurchaseReturnDataById,
    updatePurchaseReturnData,
    deletePurchaseReturnData,
    getPurchaseDetailsForReturn,
    generatePurchaseReturnNumberData,
} from "../controllers/purchaseReturn.controller.js";

const router = express.Router();

router.get("/purchase/:purchaseId", getPurchaseDetailsForReturn);
router.get("/generate-number", generatePurchaseReturnNumberData);
router.get("/", getPurchaseReturnsData);
router.get("/paginate", getPaginatedPurchaseReturnsData);
router.get("/pagination", getPaginatedPurchaseReturnsData);
router.post("/", createPurchaseReturnData);
router.get("/:id", getPurchaseReturnDataById);
router.put("/:id", updatePurchaseReturnData);
router.delete("/:id", deletePurchaseReturnData);

export default router;
