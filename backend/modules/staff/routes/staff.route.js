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
    getPercentageBreakdownData,
    searchStaffData,
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
import {
    createSalaryChangeData,
    getSalaryChangesByStaffData,
    getSalaryChangeByIdData,
    updateSalaryChangeData,
    deleteSalaryChangeData,
} from "../controllers/staffSalaryChange.controller.js";
import {
    createPercentageChangeData,
    getPercentageChangesByStaffData,
    getPercentageChangeByIdData,
    updatePercentageChangeData,
    deletePercentageChangeData,
} from "../controllers/staffPercentageChange.controller.js";

const router = express.Router();

// Staff Role Routes (must come before /:id)
router.post("/role", createStaffRole);
router.get("/role", getAllStaffRoles);
router.delete("/role", upload.none(), deleteStaffRole);

// Staff Salary Payment Routes (must come before /:id)
router.post("/salary-payment", createSalaryPaymentData);
router.get("/salary-payment/:staffId", getSalaryPaymentsByStaffData);
router.delete("/salary-payment/:id", deleteSalaryPaymentData);

// Staff Salary Change Routes (must come before /:id)
router.post("/salary-change", createSalaryChangeData);
router.get("/salary-change/staff/:staffId", getSalaryChangesByStaffData);
router.get("/salary-change/:id", getSalaryChangeByIdData);
router.put("/salary-change/:id", updateSalaryChangeData);
router.delete("/salary-change/:id", deleteSalaryChangeData);

// Staff Percentage Change Routes (must come before /:id)
router.post("/percentage-change", createPercentageChangeData);
router.get("/percentage-change/staff/:staffId", getPercentageChangesByStaffData);
router.get("/percentage-change/:id", getPercentageChangeByIdData);
router.put("/percentage-change/:id", updatePercentageChangeData);
router.delete("/percentage-change/:id", deletePercentageChangeData);

// Staff Sale Bill Routes (must come before /:id)
router.post("/sale-bill", createSaleBillData);
router.get("/sale-bill/:staffId", getSaleBillsByStaffData);
router.put("/sale-bill/:id/pay", markSaleBillAsPaidData);

// Staff Attendance Routes (must come before /:id)
router.get("/attendance/by-date", getAttendanceByDateData);
router.post("/attendance", createOrUpdateAttendanceData);
router.get("/attendance/history", getAttendanceHistoryData);
router.get("/active", getActiveStaffData);
router.get("/search", searchStaffData);

// Staff Routes
router.post("/", upload.any(), createStaffData);
router.get("/", getAllStaffData);

// Staff Salary & Payment Summary Routes (must come after POST/GET but before wildcard /:id)
router.get("/:id/salary-breakdown", getSalaryBreakdownData);
router.get("/:id/payment-summary", getPaymentSummaryData);
router.get("/:id/commission", getStaffCommissionData);
router.get("/:id/commission/all-time", getStaffCommissionAllTimeData);
router.get("/:id/commission/orders", getStaffCommissionOrdersData);
router.get("/:id/percentage-breakdown", getPercentageBreakdownData);

// Wildcard routes for single staff member (must come last)
router.get("/:id", getStaffDataById);
router.put("/:id", upload.any(), updateStaffData);
router.delete("/:id", deleteStaffData);
router.post("/:id/images", upload.array("images", 10), addImagesToStaffData);
router.delete("/:id/images/:imageId", removeImageFromStaffData);

export default router;
