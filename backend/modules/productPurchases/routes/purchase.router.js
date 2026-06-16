import { Router } from "express";
import {
    getPurchases,
    createPurchase,
    getPaginatedPurchases,
    getPurchaseById,
    updatePurchase,
    deletePurchase,
    getPurchaseByInvoiceNumber,
} from "../controllers/purchase.controller.js";
import { protect, authorize } from "../../auth/middlewares/auth.middleware.js";

const router = Router();
 
router.use(protect);

router.get("/", getPurchases);
router.get("/getPurchaseById/:id", getPurchaseById);
router.post("/getPurchaseByInvoiceNumber", getPurchaseByInvoiceNumber);
router.get("/pagination", getPaginatedPurchases);
router.post("/", authorize("admin"), createPurchase);
router.put("/updatePurchase/:id", authorize("admin"), updatePurchase);
router.delete("/:id", authorize("admin"), deletePurchase);
export default router;
