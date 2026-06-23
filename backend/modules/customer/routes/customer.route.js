import { Router } from "express";
import {
    getCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    getPaginatedCustomers,
    getCustomerById,
} from "../controllers/customer.controller.js";
import { protect, authorize } from "../../auth/middlewares/auth.middleware.js";

const router = Router();

router.use(protect);

router.get("/", getCustomers);
router.get("/pagination", getPaginatedCustomers);
router.get("/:id", getCustomerById);
router.post("/", authorize("admin"), createCustomer);
router.put("/:id", authorize("admin"), updateCustomer);
router.delete("/:id", authorize("admin"), deleteCustomer);

export default router;
