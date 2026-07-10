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
    getAttendanceByDateData,
    createOrUpdateAttendanceData,
    getAttendanceHistoryData,
    getActiveStaffData,
    getSalaryBreakdownData,
    getPaymentSummaryData,
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

// Staff Attendance Routes (must come before /:id)
router.get("/attendance/by-date", getAttendanceByDateData);
router.post("/attendance", createOrUpdateAttendanceData);
router.get("/attendance/history", getAttendanceHistoryData);
router.get("/active", getActiveStaffData);

// Staff Salary & Payment Summary Routes (must come before /:id)
router.get("/:id/salary-breakdown", getSalaryBreakdownData);
router.get("/:id/payment-summary", getPaymentSummaryData);

// Staff Routes
router.post("/", upload.single("photo"), createStaffData);
router.get("/", getAllStaffData);
router.get("/:id", getStaffDataById);
router.put("/:id", upload.single("photo"), updateStaffData);
router.delete("/:id", deleteStaffData);
router.post("/:id/images", upload.array("images", 10), addImagesToStaffData);
router.delete("/:id/images/:imageId", removeImageFromStaffData);

export default router;
