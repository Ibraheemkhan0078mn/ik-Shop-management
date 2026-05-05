import { FINANCE_REGISTRY } from "./AccountFinance/Registry";
import { INVENTORY_REGISTRY } from "./Inventory/Registry";
import { PNL_REGISTRY } from "./ProfitLoss/Registry";
import { PURCHASE_REGISTRY } from "./Purchases/Registry";
import { SALES_REGISTRY } from "./Sales/Registry";

export const REPORT_MODULE_REGISTRY = {
    sales: SALES_REGISTRY,
    purchases: PURCHASE_REGISTRY,
    inventory: INVENTORY_REGISTRY,
    finance: FINANCE_REGISTRY,
    profitLoss: PNL_REGISTRY,
};
