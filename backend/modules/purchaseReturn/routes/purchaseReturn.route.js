import express from "express";
import {
    createPurchaseReturnData,
    getPurchaseReturnDataById,
    updatePurchaseReturnData,
    deletePurchaseReturnData,
    getPurchaseDetailsForReturn,
} from "../controllers/purchaseReturn.controller.js";

const router = express.Router();

router.get("/purchase/:purchaseId", getPurchaseDetailsForReturn);
router.post("/", createPurchaseReturnData);
router.get("/:id", getPurchaseReturnDataById);
router.put("/:id", updatePurchaseReturnData);
router.delete("/:id", deletePurchaseReturnData);

export default router;
