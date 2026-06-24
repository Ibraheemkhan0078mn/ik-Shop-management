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
import { upload } from "../../../common/middlewares/multer.middleware.js";

const router = Router();

router.use(protect);

router.get("/", getCustomers);
router.get("/pagination", getPaginatedCustomers);
router.get("/:id", getCustomerById);
router.post("/", authorize("admin"), upload.single("image"), createCustomer);
router.put("/:id", authorize("admin"), upload.single("image"), updateCustomer);
router.delete("/:id", authorize("admin"), deleteCustomer);

export default router;
