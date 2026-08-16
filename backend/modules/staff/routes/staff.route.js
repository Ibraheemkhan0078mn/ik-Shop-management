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
    getStaffCommissionData,
    getStaffCommissionAllTimeData,
    getStaffCommissionOrdersData,
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
import {
    createStaffRole,
    getAllStaffRoles,
    deleteStaffRole,
} from "../controllers/staffRole.controller.js";

const router = express.Router();

// Staff Role Routes (must come before /:id)
router.post("/role", createStaffRole);
router.get("/role", getAllStaffRoles);
router.delete("/role", deleteStaffRole);

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

// Staff Routes
router.post("/", upload.single("photo"), createStaffData);
router.get("/", getAllStaffData);

// Staff Salary & Payment Summary Routes (must come after POST/GET but before wildcard /:id)
router.get("/:id/salary-breakdown", getSalaryBreakdownData);
router.get("/:id/payment-summary", getPaymentSummaryData);
router.get("/:id/commission", getStaffCommissionData);
router.get("/:id/commission/all-time", getStaffCommissionAllTimeData);
router.get("/:id/commission/orders", getStaffCommissionOrdersData);

// Wildcard routes for single staff member (must come last)
router.get("/:id", getStaffDataById);
router.put("/:id", upload.single("photo"), updateStaffData);
router.delete("/:id", deleteStaffData);
router.post("/:id/images", upload.array("images", 10), addImagesToStaffData);
router.delete("/:id/images/:imageId", removeImageFromStaffData);

export default router;
