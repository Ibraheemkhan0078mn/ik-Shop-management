import { FinanceColumnsMap } from "./AccountFinance/Columns/Columns";
import { InventoryColumnsMap } from "./Inventory/Columns/Columns";
import { PurchaseColumnsMap } from "./Purchases/Columns/Columns";
import { SalesColumnsMap } from "./Sales/Columns/Columns";
import { PNLColumnsMap } from "./ProfitLoss/Columns/Columns";

export const REPORT_COLUMNS_REGISTRY = {
    sales: SalesColumnsMap,
    purchases: PurchaseColumnsMap,
    inventory: InventoryColumnsMap,
    finance: FinanceColumnsMap,
    profitLoss: PNLColumnsMap,
};
