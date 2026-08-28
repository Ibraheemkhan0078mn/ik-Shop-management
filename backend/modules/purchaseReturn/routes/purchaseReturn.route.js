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
    validatePurchaseReturnNumberData,
    generatePurchaseReturnNumberData,
    getSupplierPurchaseReturnsData,
    addPurchaseReturnPaymentData,
    getPurchaseReturnPaymentsData,
    deletePurchaseReturnPaymentData,
    recalculatePurchaseReturnData,
    getPurchaseReturnSummaryData,
} from "../controllers/purchaseReturn.controller.js";

const router = express.Router();

router.get("/purchase/:purchaseId", getPurchaseDetailsForReturn);
router.get("/purchase/:purchaseId/summary", getPurchaseReturnSummaryData);
router.post("/validate-number", validatePurchaseReturnNumberData);
router.get("/generate-number", generatePurchaseReturnNumberData);
router.get("/supplier/:supplierId", getSupplierPurchaseReturnsData);
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
// Payment/Refund endpoints
router.post("/:id/payments", addPurchaseReturnPaymentData);
router.get("/:id/payments", getPurchaseReturnPaymentsData);
router.delete("/:id/payments/:paymentId", deletePurchaseReturnPaymentData);
router.put("/:id/recalculate", recalculatePurchaseReturnData);

export default router;
