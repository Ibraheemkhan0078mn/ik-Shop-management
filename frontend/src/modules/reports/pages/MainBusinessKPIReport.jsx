import React, { useMemo, useState } from "react";
import { Activity, AlertCircle, BarChart3, Calendar, Check, DollarSign, Package, RefreshCw, ShoppingCart, Truck, Users, Wallet, XCircle } from "lucide-react";
import {
    useGetMainBusinessKPIOnlyReportQuery,
    useGetPurchaseReportQuery,
    useGetInventoryKPIReportQuery,
    useGetSupplierKPIReportQuery,
    useGetCustomerKPIReportQuery,
    useGetExpenseKPIReportQuery,
    useGetStaffKPIReportQuery,
    useGetCreditsDebitsAccountDataQuery,
} from "../services/reports.service.js";
import { showError } from "../../../shared/utilities/toastHelpers.js";
import { useSettings } from "../../settings/hooks/useSettings.js";
import { getReportsLabels } from "../labels/reportsLabels.js";

const COLORS = { sales: "#0f766e", purchases: "#2563eb", inventory: "#b45309", customers: "#7c3aed", staff: "#be185d", suppliers: "#0369a1", expenses: "#dc2626", accounts: "#475569", analysis: "#15803d" };

const currency = (value) => `Rs ${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const number = (value) => Number(value || 0).toLocaleString();

const card = { background: "var(--surface)", borderColor: "var(--border)" };

function KpiCard({ label, value, sub, icon: Icon, color }) {
    return (
        <div className="rounded-2xl border p-3 sm:p-4 flex-1" style={{ ...card, flex: "1 1 180px" }}>
            <div className="flex items-start justify-between gap-2 sm:gap-3">
                <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wide truncate" style={{ color: "var(--muted)" }}>{label}</p>
                    <p className="text-lg sm:text-xl font-bold tabular-nums mt-1 sm:mt-2 truncate" style={{ color: "var(--ink)" }}>{value}</p>
                    {sub && <p className="text-[10px] sm:text-xs mt-1 truncate" style={{ color: "var(--muted)" }}>{sub}</p>}
                </div>
                <div className="rounded-xl p-2 sm:p-2.5 shrink-0" style={{ background: `${color}17` }}><Icon className="w-4 h-4 sm:w-4.75 sm:h-4.75" style={{ color }} /></div>
            </div>
        </div>
    );
}

function MetricSection({ title, icon: Icon, color, children }) {
    return (
        <section className="rounded-2xl border p-4 sm:p-5" style={{ ...card, flex: "1 1 480px" }}>
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <div className="rounded-xl p-1.5 sm:p-2" style={{ background: `${color}17` }}><Icon className="w-4 h-4 sm:w-4.5 sm:h-4.5" style={{ color }} /></div>
                <h2 className="font-semibold text-sm sm:text-base" style={{ color: "var(--ink)" }}>{title}</h2>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3">{children}</div>
        </section>
    );
}

export default function MainBusinessKPIReport() {
    const { settings } = useSettings();
    const labels = getReportsLabels(settings?.language || "en");
    const [period, setPeriod] = useState("all");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const filters = useMemo(() => ({ period, ...(period === "custom" && fromDate && toDate ? { fromDate, toDate } : {}) }), [period, fromDate, toDate]);
    const { data, isLoading, isFetching, error, refetch } = useGetMainBusinessKPIOnlyReportQuery(filters);
    const { data: purchaseReport } = useGetPurchaseReportQuery(filters);
    const { data: inventoryReport } = useGetInventoryKPIReportQuery(filters);
    const { data: supplierReport } = useGetSupplierKPIReportQuery(filters);
    const { data: customerReport } = useGetCustomerKPIReportQuery(filters);
    const { data: expenseReport } = useGetExpenseKPIReportQuery(filters);
    const { data: staffReport } = useGetStaffKPIReportQuery(filters);
    const { data: creditDebitReport } = useGetCreditsDebitsAccountDataQuery({ accountTypes: ['customer', 'supplier', 'general'] });

    if (error) showError(error?.data?.message || "Failed to load main business KPI report");

    const summary = data?.summary || {};
    const { sales = {}, customers = {}, staff = {}, suppliers = {}, creditsDebits: accounts = {}, analysis = {} } = summary;
    const purchaseSummary = purchaseReport?.summary || {};
    const purchaseRows = purchaseReport?.data || [];
    const purchaseReturns = purchaseRows.flatMap((purchase) => purchase.purchaseReturns || []);
    const totalPurchaseReturns = purchaseReturns.reduce((sum, purchaseReturn) => sum + (Number(purchaseReturn.totalAmount) || 0), 0);
    const newStockPrice = purchaseRows.reduce((sum, purchase) => sum + (purchase.items || []).reduce((itemSum, item) => itemSum + ((Number(item.costPrice) || 0) * (Number(item.quantity) || 0)), 0), 0);
    const topSupplier = purchaseReport?.supplierBreakdown?.[0]?.supplierName || "—";
    const inventoryKpi = inventoryReport?.data || {};
    const supplierKpi = supplierReport?.data?.summary || {};
    const customerKpi = customerReport?.data?.data?.summary || {};
    const expenseKpi = expenseReport?.data?.summary || {};
    const staffKpi = staffReport?.data?.data?.summary || {};
    const creditDebitKpi = creditDebitReport?.summary || {};
    const periodOptions = [["all", "All time"], ["today", labels.today], ["month", labels.thisMonth], ["3month", labels.last3Months], ["year", labels.thisYear], ["custom", labels.customRange]];
    const loading = isLoading || isFetching;

    return (
        <div className="p-3 sm:p-6 min-h-screen" style={{ background: "var(--app-bg)" }}>
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4 sm:mb-5">
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider" style={{ color: "var(--accent-2)" }}>Executive Analytics</p>
                    <h1 className="text-lg sm:text-2xl font-bold font-display truncate" style={{ color: "var(--ink)" }}>{labels.mainBusinessReport}</h1>
                    <p className="text-xs sm:text-sm" style={{ color: "var(--muted)" }}>KPI overview across every business area</p>
                </div>
                <button onClick={() => refetch()} className="px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl border flex items-center gap-2 text-sm shrink-0" style={card}>
                    <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${loading ? "animate-spin" : ""}`} style={{ color: "var(--ink)" }} />
                    <span className="hidden sm:inline" style={{ color: "var(--ink)" }}>{labels.refresh}</span>
                </button>
            </div>

            <div className="rounded-2xl border p-3 sm:p-4 mb-4 sm:mb-6" style={card}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
                    <div className="flex items-center gap-2 mr-1 shrink-0" style={{ color: "var(--ink)" }}>
                        <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: "var(--accent-2)" }} />
                        <span className="text-xs sm:text-sm font-semibold">{labels.periodFilter}</span>
                    </div>
                    <div className="flex gap-1 p-1 rounded-xl flex-wrap w-full sm:w-auto" style={{ background: "var(--app-bg)" }}>
                        {periodOptions.map(([value, label]) => (
                            <button key={value} onClick={() => setPeriod(value)} className="px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm rounded-lg font-medium whitespace-nowrap" style={{ background: period === value ? "var(--accent-2)" : "transparent", color: period === value ? "white" : "var(--muted)" }}>{label}</button>
                        ))}
                    </div>
                </div>
                {period === "custom" && (
                    <div className="flex flex-col sm:flex-row gap-2 mt-3 sm:mt-4 pt-3 sm:pt-4 border-t" style={{ borderColor: "var(--border)" }}>
                        <input aria-label="From date" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="px-3 py-2 rounded-lg border text-xs sm:text-sm w-full sm:w-auto" style={{ borderColor: "var(--border)", background: "var(--app-bg)", color: "var(--ink)" }} />
                        <input aria-label="To date" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="px-3 py-2 rounded-lg border text-xs sm:text-sm w-full sm:w-auto" style={{ borderColor: "var(--border)", background: "var(--app-bg)", color: "var(--ink)" }} />
                    </div>
                )}
            </div>

            {loading ? (
                <div className="flex flex-wrap justify-center py-12 sm:py-16"><div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2" style={{ borderColor: "var(--accent-2)" }} /></div>
            ) : error ? (
                <div className="rounded-2xl border p-6 sm:p-8 text-center" style={card}>
                    <AlertCircle className="mx-auto mb-3 w-6 h-6 sm:w-8 sm:h-8" style={{ color: "#dc2626" }} />
                    <p className="text-sm sm:text-base" style={{ color: "var(--ink)" }}>Unable to load KPI report.</p>
                </div>
            ) : (
                <>
                    <div className="flex flex-wrap gap-2 sm:gap-3 md:gap-4 mb-4 sm:mb-6">
                        <KpiCard label="Net Sales" value={currency(analysis.netSales || sales.netSales || sales.totalSales)} sub={`${number(sales.salesCount)} orders after returns`} icon={ShoppingCart} color={COLORS.sales} />
                        <KpiCard label="Purchases" value={currency(purchaseSummary.totalPurchases)} sub={`${number(purchaseSummary.totalBills)} bills`} icon={Package} color={COLORS.purchases} />
                        <KpiCard label="Net Profit" value={currency(analysis.netProfit)} sub={`${analysis.netMarginPercentage || 0}% margin after returns`} icon={BarChart3} color={analysis.netProfit >= 0 ? COLORS.analysis : COLORS.expenses} />
                        <KpiCard label="Expenses" value={currency(expenseKpi.totalExpenses)} sub={`${number(expenseKpi.expenseCount)} transactions`} icon={DollarSign} color={COLORS.expenses} />
                        <KpiCard label="Inventory Stock" value={number(inventoryKpi.currentStock)} sub={`${number(inventoryKpi.totalProducts)} products`} icon={Package} color={COLORS.inventory} />
                        <KpiCard label="Net Operating" value={currency(analysis.netOperatingResult)} sub={`${analysis.expenseToSalesRatio || 0}% expense ratio`} icon={Activity} color={analysis.netOperatingResult >= 0 ? COLORS.analysis : COLORS.expenses} />
                    </div>

                    <div className="flex flex-wrap gap-3 sm:gap-4 mb-4 sm:mb-6">
                        <MetricSection title="Sales and Returns" icon={ShoppingCart} color={COLORS.sales}>
                            <KpiCard label="Net Sales" value={currency(sales.netSales)} sub={`Gross: ${currency(sales.totalSales)}`} icon={ShoppingCart} color={COLORS.sales} />
                            <KpiCard label="Net Profit" value={currency(sales.netProfit)} sub={`${sales.netMarginPercentage || 0}% margin`} icon={BarChart3} color={sales.netProfit >= 0 ? COLORS.analysis : COLORS.expenses} />
                            <KpiCard label="Orders" value={number(sales.salesCount)} sub={`Average: ${currency(sales.avgOrderValue)}`} icon={Package} color={COLORS.sales} />
                            <KpiCard label="Net COGS" value={currency(sales.netCOGS)} sub={`Returned COGS: ${currency(sales.returnedCOGS)}`} icon={BarChart3} color={COLORS.purchases} />
                            <KpiCard label="Returns" value={currency(sales.totalReturnRefunds)} sub={`${number(sales.returnCount)} documents / ${number(sales.totalReturnedQuantity)} items`} icon={RefreshCw} color={COLORS.expenses} />
                            <KpiCard label="Top Customer" value={customerKpi.topCustomer || "—"} sub={currency(customerKpi.topCustomerAmount)} icon={Users} color={COLORS.customers} />
                            <KpiCard label="Discount" value={currency(sales.totalDiscount)} sub="Order discounts" icon={Wallet} color={COLORS.sales} />
                        </MetricSection>
                        <MetricSection title="Purchasing and Suppliers" icon={Truck} color={COLORS.purchases}>
                            <KpiCard label="Total Purchases" value={number(purchaseSummary.totalBills || purchaseSummary.totalPurchases)} sub={currency(purchaseSummary.totalPurchases)} icon={Package} color={COLORS.purchases} />
                            <KpiCard label="Total Returns" value={number(purchaseReturns.length)} sub={currency(totalPurchaseReturns)} icon={RefreshCw} color={COLORS.expenses} />
                            <KpiCard label="New Stock Price" value={currency(newStockPrice)} icon={DollarSign} color={COLORS.inventory} />
                            <KpiCard label="Top Supplier" value={topSupplier} icon={Truck} color={COLORS.suppliers} />
                            <KpiCard label="Total Delivered" value={number(purchaseSummary.totalDeliveredCount)} icon={Check} color={COLORS.analysis} />
                            <KpiCard label="Total Rejected" value={number(purchaseSummary.totalRejectedCount)} icon={XCircle} color={COLORS.expenses} />
                        </MetricSection>
                    </div>

                    <div className="flex flex-wrap gap-3 sm:gap-4">
                        <MetricSection title="Inventory" icon={Package} color={COLORS.inventory}>
                            <KpiCard label="Products" value={number(inventoryKpi.totalProducts)} icon={Package} color={COLORS.inventory} />
                            <KpiCard label="Current Stock" value={number(inventoryKpi.currentStock)} icon={Package} color={COLORS.inventory} />
                            <KpiCard label="Purchased Qty" value={number(inventoryKpi.purchasedQuantity)} icon={Package} color={COLORS.inventory} />
                            <KpiCard label="Purchase Returns" value={number(inventoryKpi.purchaseReturnQuantity)} icon={RefreshCw} color={COLORS.expenses} />
                            <KpiCard label="Orders" value={number(inventoryKpi.orderQuantity)} icon={ShoppingCart} color={COLORS.sales} />
                            <KpiCard label="Wastage Qty" value={number(inventoryKpi.wastageQuantity)} icon={AlertCircle} color={COLORS.expenses} />
                            <KpiCard label="Sales Revenue" value={currency(inventoryKpi.totalRevenue)} icon={DollarSign} color={COLORS.analysis} />
                        </MetricSection>
                        <MetricSection title="Customers" icon={Users} color={COLORS.customers}>
                            <KpiCard label="Customers" value={number(customerKpi.totalCustomers)} icon={Users} color={COLORS.customers} />
                            <KpiCard label="Total Sales" value={currency(customerKpi.totalSales)} icon={DollarSign} color={COLORS.sales} />
                            <KpiCard label="Average Order" value={currency(customerKpi.avgOrderValue)} icon={ShoppingCart} color={COLORS.sales} />
                            <KpiCard label="Total Due" value={currency(customerKpi.totalDue)} icon={AlertCircle} color={COLORS.expenses} />
                            <KpiCard label="Top Customer" value={customerKpi.topCustomer || "—"} sub={currency(customerKpi.topCustomerAmount)} icon={Users} color={COLORS.customers} />
                            <KpiCard label="New Customers" value={number(customerKpi.newCustomers)} icon={Users} color={COLORS.customers} />
                        </MetricSection>
                        <MetricSection title="Suppliers" icon={Truck} color={COLORS.suppliers}>
                            <KpiCard label="Total Suppliers" value={number(supplierKpi.totalSuppliers)} icon={Truck} color={COLORS.suppliers} />
                            <KpiCard label="Active Suppliers" value={number(supplierKpi.activeSuppliers)} icon={Truck} color={COLORS.suppliers} />
                            <KpiCard label="Purchase Orders" value={number(supplierKpi.totalPurchaseOrders)} icon={Package} color={COLORS.purchases} />
                            <KpiCard label="Purchase Amount" value={currency(supplierKpi.totalPurchaseAmount)} icon={DollarSign} color={COLORS.purchases} />
                            <KpiCard label="Unpaid Amount" value={currency(supplierKpi.totalUnpaid)} icon={AlertCircle} color={COLORS.expenses} />
                            <KpiCard label="Purchase Returns" value={currency(supplierKpi.totalReturns)} icon={RefreshCw} color={COLORS.expenses} />
                        </MetricSection>
                        <MetricSection title="Expenses" icon={DollarSign} color={COLORS.expenses}>
                            <KpiCard label="Expense Average" value={currency(expenseKpi.averageExpense)} icon={DollarSign} color={COLORS.expenses} />
                            <KpiCard label="Highest Expense" value={currency(expenseKpi.highestExpense)} icon={AlertCircle} color={COLORS.expenses} />
                            <KpiCard label="Expense Trend" value={`${number(expenseKpi.expenseCount)} txns`} icon={Activity} color={COLORS.expenses} />
                        </MetricSection>
                        <MetricSection title="Staff" icon={Users} color={COLORS.staff}>
                            <KpiCard label="Staff" value={number(staffKpi.totalStaff)} icon={Users} color={COLORS.staff} />
                            <KpiCard label="Expected Salary" value={currency(staffKpi.totalExpectedSalary)} icon={DollarSign} color={COLORS.staff} />
                            <KpiCard label="Salary Paid" value={currency(staffKpi.totalSalariesPaid)} icon={Wallet} color={COLORS.staff} />
                            <KpiCard label="Remaining Salary" value={currency(staffKpi.remainingSalary)} icon={AlertCircle} color={COLORS.expenses} />
                            <KpiCard label="Advances" value={currency(staffKpi.totalAdvances)} icon={Wallet} color={COLORS.expenses} />
                        </MetricSection>
                        <MetricSection title="Credits and Debits" icon={Wallet} color={COLORS.accounts}>
                            <KpiCard label="To Receive" value={currency(creditDebitKpi.totalToReceive)} icon={Wallet} color={COLORS.analysis} />
                            <KpiCard label="To Give" value={currency(creditDebitKpi.totalToGive)} icon={Wallet} color={COLORS.expenses} />
                            <KpiCard label="Accounts" value={number(creditDebitKpi.totalAccounts)} icon={Users} color={COLORS.accounts} />
                            <KpiCard label="Account Balance" value={currency(creditDebitKpi.totalBalance)} icon={DollarSign} color={COLORS.accounts} />
                        </MetricSection>
                    </div>
                </>
            )}
        </div>
    );
}