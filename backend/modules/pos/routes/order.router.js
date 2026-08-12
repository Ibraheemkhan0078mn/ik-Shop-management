import { Router } from "express";
import { protect, authorize }           from "../../auth/middlewares/auth.middleware.js";
import { generateOrderNumber, getOrders, getPaginatedOrders, getOrdersByCustomer, getOrderById, addOrder, deleteOrder, getOrderPaymentsData, getOrderPaymentStatusData, recalculateOrderPaidAmountData } from "../controllers/order.controller.js";

const router = Router();

// All order routes require a logged-in user
router.use(protect);

router.get("/generate-number",          generateOrderNumber);   // GET  /orders/generate-number
router.get("/",                         getOrders);             // GET  /orders
router.get("/paginated",                getPaginatedOrders);    // GET  /orders/paginated
router.get("/by-customer",              getOrdersByCustomer);   // GET  /orders/by-customer
router.get("/:id",                      getOrderById);          // GET  /orders/:id
router.get("/:id/payments",             getOrderPaymentsData); // GET  /orders/:id/payments
router.get("/:id/payment-status",       getOrderPaymentStatusData); // GET  /orders/:id/payment-status
router.post("/:id/recalculate-payment", authorize("admin"), recalculateOrderPaidAmountData); // POST /orders/:id/recalculate-payment
router.post("/", authorize("admin", "staff"), addOrder);        // POST /orders
router.delete("/:id", authorize("admin"),     deleteOrder);     // DELETE /orders/:id

export default router;
