import { Router } from "express";
import { protect, authorize } from "../../auth/middlewares/auth.middleware.js";
import { 
    getAllPaymentMethods, 
    getPaymentMethodById, 
    createPaymentMethod, 
    updatePaymentMethod, 
    deletePaymentMethod 
} from "../controllers/paymentMethod.controller.js";

const router = Router();

// All payment method routes require a logged-in user
router.use(protect);

router.get("/",                    getAllPaymentMethods);          // GET  /payment-methods
router.get("/:id",                getPaymentMethodById);          // GET  /payment-methods/:id
router.post("/", authorize("admin"), createPaymentMethod);        // POST /payment-methods
router.put("/:id", authorize("admin"), updatePaymentMethod);      // PUT  /payment-methods/:id
router.delete("/:id", authorize("admin"), deletePaymentMethod);   // DELETE /payment-methods/:id

export default router;
