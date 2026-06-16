import express from "express";
import {
    getPurchaseReturns,
    getPaginatedPurchaseReturns,
    getPurchaseReturnById,
    createPurchaseReturn,
    updatePurchaseReturn,
    deletePurchaseReturn,
    submitPurchaseReturn,
    approvePurchaseReturn,
    rejectPurchaseReturn,
    generatePurchaseReturnNumber,
} from "../controllers/purchaseReturn.controller.js";

const router = express.Router();

router.get("/generate-number", generatePurchaseReturnNumber);
router.get("/", getPurchaseReturns);
router.get("/paginate", getPaginatedPurchaseReturns);
router.get("/:id", getPurchaseReturnById);
router.post("/", createPurchaseReturn);
router.put("/:id", updatePurchaseReturn);
router.delete("/:id", deletePurchaseReturn);
router.put("/:id/submit", submitPurchaseReturn);
router.put("/:id/approve", approvePurchaseReturn);
router.put("/:id/reject", rejectPurchaseReturn);

export default router;
