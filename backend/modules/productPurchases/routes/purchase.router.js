import { Router } from "express";
import {
    getPurchasesData,
    createPurchaseData,
    getPaginatedPurchasesData,
    getPurchaseDataById,
    updatePurchaseData,
    deletePurchaseData,
    getPurchaseDataByInvoiceNumber,
    updatePurchaseStatus,
    createPurchasePaymentData,
    getPurchasePaymentsData,
    getPurchasePaymentStatusData,
    deletePurchasePaymentData,
    recalculatePurchasePaidAmountData,
    generatePurchaseNumberData,
} from "../controllers/purchase.controller.js";
import { protect, authorize } from "../../auth/middlewares/auth.middleware.js";

const router = Router();
 
router.use(protect);

router.get("/generate-number", generatePurchaseNumberData);
router.get("/", getPurchasesData);
router.get("/getPurchaseById/:id", getPurchaseDataById);
router.post("/getPurchaseByInvoiceNumber", getPurchaseDataByInvoiceNumber);
router.get("/pagination", getPaginatedPurchasesData);
router.post("/", authorize("admin"), createPurchaseData);
router.put("/updatePurchase/:id", authorize("admin"), updatePurchaseData);
router.put("/:id/status", authorize("admin"), updatePurchaseStatus);
router.post("/:id/payments", authorize("admin"), createPurchasePaymentData);
router.get("/:id/payments", getPurchasePaymentsData);
router.get("/:id/payment-status", getPurchasePaymentStatusData);
router.post("/:id/recalculate-payment", authorize("admin"), recalculatePurchasePaidAmountData);
router.delete("/payments/:paymentId", authorize("admin"), deletePurchasePaymentData);
router.delete("/:id", authorize("admin"), deletePurchaseData);
export default router;
