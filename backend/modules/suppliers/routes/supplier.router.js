import { Router } from "express";
import {
    getSuppliers,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    getPaginatedSuppliers,
    searchSuppliersData,
    getSupplierById,
    getSupplierPurchaseKPIs,
    getSupplierPurchaseReturnKPIs,
} from "../controllers/supplier.controller.js";
import { protect, authorize } from "../../auth/middlewares/auth.middleware.js";
import { upload } from "../../../common/middlewares/multer.middleware.js";

const router = Router();

router.use(protect);

router.get("/", getSuppliers);
router.get("/pagination", getPaginatedSuppliers);
router.get("/search", searchSuppliersData);

// KPI routes (must come before /:id to avoid conflict)
router.get("/:supplierId/purchase-kpis", getSupplierPurchaseKPIs);
router.get("/:supplierId/purchase-return-kpis", getSupplierPurchaseReturnKPIs);

// Standard CRUD routes
router.get("/:id", getSupplierById);
router.post("/", authorize("admin"), upload.single("image"), createSupplier);
router.put("/:id", authorize("admin"), upload.single("image"), updateSupplier);
router.delete("/:id", authorize("admin"), deleteSupplier);

export default router;
