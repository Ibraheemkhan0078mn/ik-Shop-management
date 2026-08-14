import express from "express";
import {
    getReturnNumber,
    getOrderForReturn,
    createProductReturnData,
    getAllProductReturnsData,
    getProductReturnData,
    updateProductReturnData,
    deleteProductReturnData,
    updateReturnStatusData,
    getPaginatedProductReturnsCont,
    approveOrderReturnData,
    addProductReturnPaymentData,
    getProductReturnPaymentsData,
    deleteProductReturnPaymentData,
    recalculateProductReturnData,
} from "../controllers/productReturn.controller.js";

const router = express.Router();

// Generate return number
router.get("/generate-number", getReturnNumber);

// Get order by order number for return
router.get("/order/:orderNumber", getOrderForReturn);

// CRUD operations
router.post("/", createProductReturnData);
router.get("/", getAllProductReturnsData);
router.get("/pagination", getPaginatedProductReturnsCont);
router.get("/:id", getProductReturnData);
router.put("/:id", updateProductReturnData);
router.delete("/:id", deleteProductReturnData);

// Update return status
router.patch("/:id/status", updateReturnStatusData);

// Approve order return
router.patch("/:id/approve", approveOrderReturnData);

// Payment endpoints
router.post("/:id/payments", addProductReturnPaymentData);
router.get("/:id/payments", getProductReturnPaymentsData);
router.delete("/:id/payments/:paymentId", deleteProductReturnPaymentData);
router.patch("/:id/recalculate", recalculateProductReturnData);

export default router;
