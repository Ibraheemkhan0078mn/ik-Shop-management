import { Router } from "express";
import {
    getPurchasesData,
    createPurchaseData,
    getPaginatedPurchasesData,
    getPurchaseDataById,
    updatePurchaseData,
    deletePurchaseData,
    getPurchaseDataByInvoiceNumber,
} from "../controllers/purchase.controller.js";
import { protect, authorize } from "../../auth/middlewares/auth.middleware.js";

const router = Router();
 
router.use(protect);

router.get("/", getPurchasesData);
router.get("/getPurchaseById/:id", getPurchaseDataById);
router.post("/getPurchaseByInvoiceNumber", getPurchaseDataByInvoiceNumber);
router.get("/pagination", getPaginatedPurchasesData);
router.post("/", authorize("admin"), createPurchaseData);
router.put("/updatePurchase/:id", authorize("admin"), updatePurchaseData);
router.delete("/:id", authorize("admin"), deletePurchaseData);
export default router;
