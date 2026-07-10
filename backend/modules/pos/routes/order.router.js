import { Router } from "express";
import { protect, authorize }           from "../../auth/middlewares/auth.middleware.js";
import { generateOrderNumber, getOrders, getPaginatedOrders, getOrdersByCustomer, addOrder, deleteOrder } from "../controllers/order.controller.js";

const router = Router();

// All order routes require a logged-in user
router.use(protect);

router.get("/generate-number",          generateOrderNumber);   // GET  /orders/generate-number
router.get("/",                         getOrders);             // GET  /orders
router.get("/paginated",                getPaginatedOrders);    // GET  /orders/paginated
router.get("/by-customer",              getOrdersByCustomer);   // GET  /orders/by-customer
router.post("/", authorize("admin", "staff"), addOrder);        // POST /orders
router.delete("/:id", authorize("admin"),     deleteOrder);     // DELETE /orders/:id

export default router;
