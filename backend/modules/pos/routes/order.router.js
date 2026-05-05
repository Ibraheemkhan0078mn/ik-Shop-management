import { Router } from "express";
import {
    getOrders,
    addOrder,
    deleteOrder,
    generateOrderNumber,
} from "../controllers/order.controller.js";
import { protect, authorize } from "../../auth/middlewares/auth.middleware.js";

const router = Router();

router.use(protect);

router.get("/generate-number", generateOrderNumber);
router.get("/", getOrders);
router.post("/", authorize("admin", "staff"), addOrder);
router.delete("/:id", authorize("admin"), deleteOrder);

export default router;
