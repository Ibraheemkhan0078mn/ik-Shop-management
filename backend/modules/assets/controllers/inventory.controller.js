import { getLocalInventoryModel, getLocalInventoryCategoryModel } from "../../../configs/connect.db.js";
import { ApiError } from "../../../common/services/apiResponses.js";
import { changeTrackDocsCreationFunc } from "../../../common/ikSync/changeTrackModelCreation.js";
import {
    inventoryCreate as inventoryCreateService,
    inventoryUpdate as inventoryUpdateService,
    inventoryDelete as inventoryDeleteService,
    getAllInventory as getAllInventoryService,
    getInventoryById as getInventoryByIdService,
    countInventory as countInventoryService,
} from "../services/inventory.service.js";
import {
    inventoryCategoryCreate as inventoryCategoryCreateService,
    inventoryCategoryUpdate as inventoryCategoryUpdateService,
    inventoryCategoryDelete as inventoryCategoryDeleteService,
    getAllInventoryCategories as getAllInventoryCategoriesService,
    getInventoryCategoryById as getInventoryCategoryByIdService,
    checkDuplicateCategoryName as checkDuplicateCategoryNameService,
} from "../services/inventoryCategory.service.js";

// ── GET ALL — with infinite scroll + optional category/status filter ─────────
export const getAllInventory = async (req, res) => {
    try {
        const skip = parseInt(req.params.skip) || 0;
        const limit = parseInt(req.params.limit) || 20;
        const { category, status, search } = req.body || {};

        let query = {};

        if (category && category !== "all") query.category = category;
        if (status && status !== "all") query.status = status;
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { itemCode: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
                { assignedTo: { $regex: search, $options: "i" } },
                { vendor: { $regex: search, $options: "i" } },
            ];
        }

        const totalInventory = await countInventoryService(query);

        let allInventory = await getAllInventoryService(query);
        allInventory = allInventory.skip(skip).limit(limit);

        if (!allInventory || allInventory.length < 1) {
            return res.json({
                success: false,
                reason: "No inventory items found yet"
            });
        }

        return res.json({
            success: true,
            msg: "All inventory items found",
            inventory: allInventory,
            hasMore: (skip + limit) < totalInventory,
            totalInventory: totalInventory
        });

    } catch (error) {
        console.log(error);
        return ApiError(error, res);
    }
};

// ── CREATE ───────────────────────────────────────────────────────────────────
export const createInventory = async (req, res) => {
    try {
        const {
            name, itemCode, category, type, description,
            totalQuantity, availableQuantity, inUseQuantity, damagedQuantity, minimumThreshold,
            location, assignedTo,
            purchaseDate, vendor, purchasePrice, totalCost, invoiceNumber, warrantyExpiry,
            condition, lastInspectionDate, nextMaintenanceDate,
            status, disposalDate, disposalReason,
        } = req.body;

        if (!name || !category) {
            return res.json({ success: false, reason: "Name and category are required" });
        }

        const itemData = {
            name, itemCode, category, type, description,
            totalQuantity: totalQuantity || 0,
            availableQuantity: availableQuantity || 0,
            inUseQuantity: inUseQuantity || 0,
            damagedQuantity: damagedQuantity || 0,
            minimumThreshold: minimumThreshold || 0,
            location, assignedTo,
            purchaseDate, vendor,
            purchasePrice: purchasePrice || 0,
            totalCost: totalCost || 0,
            invoiceNumber, warrantyExpiry,
            condition: condition || "new",
            lastInspectionDate, nextMaintenanceDate,
            status: status || "active",
            disposalDate, disposalReason,
            addedBy: req.user?._id || null,
        };

        const newItem = await inventoryCreateService(itemData);

        await changeTrackDocsCreationFunc("create", "inventory", newItem._id, req.user?._id);

        return res.json({
            success: true,
            msg: "Inventory item created successfully",
            item: newItem
        });

    } catch (error) {
        console.log(error);
        return ApiError(error, res);
    }
};

// ── UPDATE ───────────────────────────────────────────────────────────────────
export const updateInventory = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) return res.json({ success: false, reason: "Item ID is required" });

        const updatedItem = await inventoryUpdateService(id, { ...req.body });

        if (!updatedItem) return res.json({ success: false, reason: "Item not found" });

        await changeTrackDocsCreationFunc("update", "inventory", id, req.user?._id);

        return res.json({
            success: true,
            msg: "Inventory item updated successfully",
            item: updatedItem
        });

    } catch (error) {
        console.log(error);
        return ApiError(error, res);
    }
};

// ── DELETE ───────────────────────────────────────────────────────────────────
export const deleteInventory = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) return res.json({ success: false, reason: "Item ID is required" });

        const deletedItem = await inventoryDeleteService(id);

        if (!deletedItem) return res.json({ success: false, reason: "Item not found" });

        await changeTrackDocsCreationFunc("delete", "inventory", id, req.user?._id);

        return res.json({
            success: true,
            msg: "Inventory item deleted successfully"
        });

    } catch (error) {
        console.log(error);
        return ApiError(error, res);
    }
};

































// ── GET ALL ──────────────────────────────────────────────────────────────────
export const getAllInventoryCategories = async (req, res) => {
    try {
        let allCategories = await getAllInventoryCategoriesService();

        if (!allCategories || allCategories.length < 1) {
            return res.json({
                success: false,
                reason: "No inventory categories found yet"
            });
        }

        return res.json({
            success: true,
            msg: "All inventory categories found",
            categories: allCategories,
        });

    } catch (error) {
        console.log(error);
        return ApiError(error, res);
    }
};

// ── CREATE ───────────────────────────────────────────────────────────────────
export const createInventoryCategory = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name || !name.trim()) {
            return res.json({ success: false, reason: "Category name is required" });
        }

        // duplicate check
        const existing = await checkDuplicateCategoryNameService(name);
        if (existing) {
            return res.json({ success: false, reason: "Category with this name already exists" });
        }

        const categoryData = {
            name: name.trim(),
            createdBy: req.user?._id || null,
        };

        const newCategory = await inventoryCategoryCreateService(categoryData);

        await changeTrackDocsCreationFunc("create", "inventoryCategory", newCategory._id, req.user?._id);

        return res.json({
            success: true,
            msg: "Inventory category created successfully",
            category: newCategory
        });

    } catch (error) {
        console.log(error);
        return ApiError(error, res);
    }
};

// ── UPDATE ───────────────────────────────────────────────────────────────────
export const updateInventoryCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        if (!id) return res.json({ success: false, reason: "Category ID is required" });
        if (!name?.trim()) return res.json({ success: false, reason: "Category name is required" });

        const updatedCategory = await inventoryCategoryUpdateService(id, { name: name.trim() });

        if (!updatedCategory) return res.json({ success: false, reason: "Category not found" });

        await changeTrackDocsCreationFunc("update", "inventoryCategory", id, req.user?._id);

        return res.json({
            success: true,
            msg: "Inventory category updated successfully",
            category: updatedCategory
        });

    } catch (error) {
        console.log(error);
        return ApiError(error, res);
    }
};

// ── DELETE ───────────────────────────────────────────────────────────────────
export const deleteInventoryCategory = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id) return res.json({ success: false, reason: "Category ID is required" });

        const deleted = await inventoryCategoryDeleteService(id);

        if (!deleted) return res.json({ success: false, reason: "Category not found" });

        await changeTrackDocsCreationFunc("delete", "inventoryCategory", id, req.user?._id);

        return res.json({
            success: true,
            msg: "Inventory category deleted successfully"
        });

    } catch (error) {
        console.log(error);
        return ApiError(error, res);
    }
};