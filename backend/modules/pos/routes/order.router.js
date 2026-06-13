import { Router } from "express";
import { protect, authorize }           from "../../auth/middlewares/auth.middleware.js";
import { generateOrderNumber, getOrders, addOrder, deleteOrder } from "../controllers/order.controller.js";

const router = Router();

// All order routes require a logged-in user
router.use(protect);

router.get("/generate-number",          generateOrderNumber);   // GET  /orders/generate-number
router.get("/",                         getOrders);             // GET  /orders
router.post("/", authorize("admin", "staff"), addOrder);        // POST /orders
router.delete("/:id", authorize("admin"),     deleteOrder);     // DELETE /orders/:id

export default router;
