import { Router } from "express";
import { protect, authorize }                                          from "../../auth/middlewares/auth.middleware.js";
import { getHoldOrders, createHoldOrder, updateHoldOrder, deleteHoldOrder } from "../controllers/holdOrder.controller.js";

const router = Router();

// All hold-order routes require a logged-in user
router.use(protect);

router.get("/",                                  getHoldOrders);    // GET    /hold-orders
router.post("/",    authorize("admin", "staff"), createHoldOrder);  // POST   /hold-orders
router.put("/:id",  authorize("admin", "staff"), updateHoldOrder);  // PUT    /hold-orders/:id
router.delete("/:id", authorize("admin", "staff"), deleteHoldOrder); // DELETE /hold-orders/:id

export default router;
