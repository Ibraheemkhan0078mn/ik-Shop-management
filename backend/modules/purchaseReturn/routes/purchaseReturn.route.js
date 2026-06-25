import express from "express";
import {
    createPurchaseReturnData,
    getPurchaseReturnsData,
    getPaginatedPurchaseReturnsData,
    getPurchaseReturnDataById,
    updatePurchaseReturnData,
    deletePurchaseReturnData,
    submitPurchaseReturnData,
    approvePurchaseReturnData,
    rejectPurchaseReturnData,
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
router.put("/:id/submit", submitPurchaseReturnData);
router.put("/:id/approve", approvePurchaseReturnData);
router.put("/:id/reject", rejectPurchaseReturnData);

export default router;
