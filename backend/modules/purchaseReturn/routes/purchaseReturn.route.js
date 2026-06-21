import express from "express";
import {
    getPurchaseReturnsData,
    getPaginatedPurchaseReturnsData,
    getPurchaseReturnDataById,
    createPurchaseReturnData,
    updatePurchaseReturnData,
    deletePurchaseReturnData,
    submitPurchaseReturnData,
    approvePurchaseReturnData,
    rejectPurchaseReturnData,
    generatePurchaseReturnNumberData,
} from "../controllers/purchaseReturn.controller.js";

const router = express.Router();

router.get("/generate-number", generatePurchaseReturnNumberData);
router.get("/", getPurchaseReturnsData);
router.get("/paginate", getPaginatedPurchaseReturnsData);
router.get("/:id", getPurchaseReturnDataById);
router.post("/", createPurchaseReturnData);
router.put("/:id", updatePurchaseReturnData);
router.delete("/:id", deletePurchaseReturnData);
router.put("/:id/submit", submitPurchaseReturnData);
router.put("/:id/approve", approvePurchaseReturnData);
router.put("/:id/reject", rejectPurchaseReturnData);

export default router;
