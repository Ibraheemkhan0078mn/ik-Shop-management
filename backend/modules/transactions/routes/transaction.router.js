import { Router } from "express";
import {
    getAllTransactions,
    getTransactionDataById,
    createTransactionData,
    updateTransactionData,
    deleteTransactionData,
} from "../controllers/transaction.controller.js";
import { protect, authorize } from "../../auth/middlewares/auth.middleware.js";

const router = Router();

router.use(protect);

router.post("/filter", getAllTransactions);
router.get("/:id", getTransactionDataById);
router.post("/", authorize("admin"), createTransactionData);
router.put("/:id", authorize("admin"), updateTransactionData);
router.delete("/:id", authorize("admin"), deleteTransactionData);

export default router;
