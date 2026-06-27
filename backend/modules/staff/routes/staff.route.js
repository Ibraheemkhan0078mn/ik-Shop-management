import express from "express";
import { upload } from "../../../common/middlewares/multer.middleware.js";
import {
    createStaffData,
    getAllStaffData,
    getStaffDataById,
    updateStaffData,
    deleteStaffData,
    addImagesToStaffData,
    removeImageFromStaffData,
} from "../controllers/staff.controller.js";
import {
    createSalaryPaymentData,
    getSalaryPaymentsByStaffData,
    deleteSalaryPaymentData,
} from "../controllers/staffSalaryPayment.controller.js";
import {
    createSaleBillData,
    getSaleBillsByStaffData,
    markSaleBillAsPaidData,
} from "../controllers/staffSaleBill.controller.js";

const router = express.Router();

// Staff Salary Payment Routes (must come before /:id)
router.post("/salary-payment", createSalaryPaymentData);
router.get("/salary-payment/:staffId", getSalaryPaymentsByStaffData);
router.delete("/salary-payment/:id", deleteSalaryPaymentData);

// Staff Sale Bill Routes (must come before /:id)
router.post("/sale-bill", createSaleBillData);
router.get("/sale-bill/:staffId", getSaleBillsByStaffData);
router.put("/sale-bill/:id/pay", markSaleBillAsPaidData);

// Staff Routes
router.post("/", createStaffData);
router.get("/", getAllStaffData);
router.get("/:id", getStaffDataById);
router.put("/:id", updateStaffData);
router.delete("/:id", deleteStaffData);
router.post("/:id/images", upload.array("images", 10), addImagesToStaffData);
router.delete("/:id/images/:imageId", removeImageFromStaffData);

export default router;
