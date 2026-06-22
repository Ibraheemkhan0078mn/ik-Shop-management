// backend/modules/productPurchases/controllers/purchaseReturn.controller.js
import asyncHandler from "express-async-handler";
import { createPurchaseReturn, getPurchaseReturnById, updatePurchaseReturn, deletePurchaseReturn } from "../services/purchaseReturn.service.js";
import { getPurchaseById } from "../services/purchase.service.js"; // to fetch purchase details

// @desc    Create a purchase return
// @route   POST /api/purchase-returns
// @access  Private (assume auth middleware elsewhere)
export const createPurchaseReturnData = asyncHandler(async (req, res) => {
  const result = await createPurchaseReturn(req.body);
  res.status(201).json({ success: true, message: "Purchase return created", data: result });
});

// @desc    Get purchase return by ID
// @route   GET /api/purchase-returns/:id
export const getPurchaseReturnDataById = asyncHandler(async (req, res) => {
  const result = await getPurchaseReturnById(req.params.id);
  res.status(200).json({ success: true, data: result });
});

// @desc    Update purchase return
// @route   PUT /api/purchase-returns/:id
export const updatePurchaseReturnData = asyncHandler(async (req, res) => {
  const result = await updatePurchaseReturn(req.params.id, req.body);
  res.status(200).json({ success: true, message: "Purchase return updated", data: result });
});

// @desc    Delete purchase return
// @route   DELETE /api/purchase-returns/:id
export const deletePurchaseReturnData = asyncHandler(async (req, res) => {
  await deletePurchaseReturn(req.params.id);
  res.status(200).json({ success: true, message: "Purchase return deleted" });
});

// @desc    Get purchase details for return UI (by purchase ID)
// @route   GET /api/purchase-returns/purchase/:purchaseId
export const getPurchaseDetailsForReturn = asyncHandler(async (req, res) => {
  const purchase = await getPurchaseById(req.params.purchaseId);
  if (!purchase) return res.status(404).json({ success: false, message: "Purchase not found" });
  res.status(200).json({ success: true, data: purchase });
});
