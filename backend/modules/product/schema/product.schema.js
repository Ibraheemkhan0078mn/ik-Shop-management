import * as yup from "yup";

export const createProductSchema = yup.object({
    // ─── Basic Info ───────────────────────────────────────────────
    name:                   yup.string().required("Product name is required"),
    genericName:            yup.string().nullable(),
    brandName:              yup.string().nullable(),
    hotKeySku:              yup.string().required("SKU is required"),
    productCode:            yup.string().nullable(),
    barcode:                yup.string().nullable(),
    description:            yup.string().nullable(),

    // ─── Classification ───────────────────────────────────────────
    category:               yup.string().required("Category is required"),
    subCategory:            yup.string().nullable(),
    form:                   yup.string().nullable(),
    strength:               yup.string().nullable(),
    drugType:               yup.string().nullable(),
    scheduleType:           yup.string().nullable(),
    isNarcotic:             yup.boolean().default(false),

    // ─── Units ────────────────────────────────────────────────────
    unit:                   yup.string().default("Units"),
    purchaseUnit:           yup.string().default("Box"),

    // ─── Manufacturer & Supplier ──────────────────────────────────
    manufacturer:           yup.string().nullable(),
    defaultSupplier:        yup.string().nullable(),
    countryOfOrigin:        yup.string().nullable(),

    // ─── Pricing Defaults ─────────────────────────────────────────
    defaultSalePrice:       yup.number().default(0),
    defaultPurchasePrice:   yup.number().default(0),
    taxPercent:             yup.number().default(0),
    isDiscountAllowed:      yup.boolean().default(true),

    // ─── Stock Settings ───────────────────────────────────────────
    minStockLevel:          yup.number().default(0),
    maxStockLevel:          yup.number().default(0),
    allowNegativeStock:     yup.boolean().default(false),
    rackLocation:           yup.string().nullable(),
    storageCondition:       yup.string().nullable(),

    // ─── Medical Info ─────────────────────────────────────────────
    drugInteractionWarning: yup.string().nullable(),

    // ─── Status ───────────────────────────────────────────────────
    isActive:               yup.boolean().default(true),
});

export const updateProductSchema = yup.object({
    // ─── Basic Info ───────────────────────────────────────────────
    name:                   yup.string(),
    genericName:            yup.string().nullable(),
    brandName:              yup.string().nullable(),
    hotKeySku:              yup.string(),
    productCode:            yup.string().nullable(),
    barcode:                yup.string().nullable(),
    description:            yup.string().nullable(),

    // ─── Classification ───────────────────────────────────────────
    category:               yup.string(),
    subCategory:            yup.string().nullable(),
    form:                   yup.string().nullable(),
    strength:               yup.string().nullable(),
    drugType:               yup.string().nullable(),
    scheduleType:           yup.string().nullable(),
    isNarcotic:             yup.boolean(),

    // ─── Units ────────────────────────────────────────────────────
    unit:                   yup.string(),
    purchaseUnit:           yup.string().nullable(),

    // ─── Manufacturer & Supplier ──────────────────────────────────
    manufacturer:           yup.string().nullable(),
    defaultSupplier:        yup.string().nullable(),
    countryOfOrigin:        yup.string().nullable(),

    // ─── Pricing Defaults ─────────────────────────────────────────
    defaultSalePrice:       yup.number(),
    defaultPurchasePrice:   yup.number().nullable(),
    taxPercent:             yup.number().nullable(),
    isDiscountAllowed:      yup.boolean(),

    // ─── Stock Settings ───────────────────────────────────────────
    minStockLevel:          yup.number().nullable(),
    maxStockLevel:          yup.number().nullable(),
    allowNegativeStock:     yup.boolean(),
    rackLocation:           yup.string().nullable(),
    storageCondition:       yup.string().nullable(),

    // ─── Medical Info ─────────────────────────────────────────────
    drugInteractionWarning: yup.string().nullable(),

    // ─── Status ───────────────────────────────────────────────────
    isActive:               yup.boolean(),
});