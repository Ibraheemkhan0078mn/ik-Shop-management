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

export default router;
