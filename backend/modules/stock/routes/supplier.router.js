import { Router } from "express";
import {
    getSuppliers,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    getPaginatedSuppliers,
} from "../controllers/supplier.controller.js";
import { protect, authorize } from "../../auth/middlewares/auth.middleware.js";

const router = Router();

router.use(protect);

router.get("/", getSuppliers);
router.get("/pagination", getPaginatedSuppliers)
router.post("/", authorize("admin"), createSupplier);
router.put("/:id", authorize("admin"), updateSupplier);
router.delete("/:id", authorize("admin"), deleteSupplier);

export default router;
