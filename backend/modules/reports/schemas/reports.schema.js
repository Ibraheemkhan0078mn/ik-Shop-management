import Joi from "joi";

// Common filter validation
export const reportFilterSchema = Joi.object({
    fromDate: Joi.date().iso(),
    toDate: Joi.date().iso().greater(Joi.ref("fromDate")),
    productId: Joi.string().hex().length(24),
    categoryId: Joi.string().hex().length(24),
    subCategoryId: Joi.string().hex().length(24),
    supplierId: Joi.string().hex().length(24),
    memberId: Joi.string().hex().length(24),
    paymentMethod: Joi.string().valid("cash", "online", "credit", "hybrid"),
    employeeId: Joi.string().hex().length(24),
    search: Joi.string().max(100),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    lowStock: Joi.boolean(),
    nearExpiry: Joi.boolean(),
    type: Joi.string().valid("receivable", "payable"),
    action: Joi.string(),
});

// Dashboard summary validation
export const dashboardSummarySchema = Joi.object({
    // No specific filters for dashboard summary
});

// Sales report validation
export const salesReportSchema = reportFilterSchema.keys({
    paymentMethod: Joi.string().valid("cash", "online", "credit", "hybrid"),
});

// Purchase report validation
export const purchaseReportSchema = reportFilterSchema.keys({
    supplierId: Joi.string().hex().length(24),
});

// Inventory report validation
export const inventoryReportSchema = reportFilterSchema.keys({
    categoryId: Joi.string().hex().length(24),
    subCategoryId: Joi.string().hex().length(24),
    lowStock: Joi.boolean(),
    nearExpiry: Joi.boolean(),
});

// Financial report validation
export const financialReportSchema = reportFilterSchema.keys({
    fromDate: Joi.date().iso().required(),
    toDate: Joi.date().iso().required(),
});

// Credit/Debit report validation
export const creditDebitReportSchema = reportFilterSchema.keys({
    type: Joi.string().valid("receivable", "payable"),
});

// Expense report validation
export const expenseReportSchema = reportFilterSchema.keys({
    categoryId: Joi.string().hex().length(24),
});

// Supplier report validation
export const supplierReportSchema = reportFilterSchema.keys({
    search: Joi.string().max(100),
});

// Member report validation
export const memberReportSchema = reportFilterSchema.keys({
    search: Joi.string().max(100),
});

// Wastage report validation
export const wastageReportSchema = reportFilterSchema.keys({
    productId: Joi.string().hex().length(24),
});

// Activity report validation
export const activityReportSchema = reportFilterSchema.keys({
    userId: Joi.string().hex().length(24),
    action: Joi.string(),
});

// Dashboard components validation
export const dashboardComponentsSchema = Joi.object({
    limit: Joi.number().integer().min(1).max(50).default(10),
    fromDate: Joi.date().iso(),
    toDate: Joi.date().iso().greater(Joi.ref("fromDate")),
});
