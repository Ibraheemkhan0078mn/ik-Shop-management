import express from "express";
import {
    createStaffData,
    getAllStaffData,
    getStaffDataById,
    updateStaffData,
    deleteStaffData,
    addDocumentToStaffData,
    removeDocumentFromStaffData,
} from "../controllers/staff.controller.js";
import {
    createSalaryPaymentData,
    getSalaryPaymentsByStaffData,
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
router.post("/:id/documents", addDocumentToStaffData);
router.delete("/:id/documents/:docId", removeDocumentFromStaffData);

export default router;
