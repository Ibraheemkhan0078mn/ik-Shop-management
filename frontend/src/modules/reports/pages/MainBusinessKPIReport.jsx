import React, { useMemo, useState } from "react";
import { Activity, AlertCircle, BarChart3, Calendar, DollarSign, Package, RefreshCw, ShoppingCart, Truck, Users, Wallet } from "lucide-react";
import { useGetMainBusinessKPIOnlyReportQuery } from "../services/reports.service.js";
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

    if (error) showError(error?.data?.message || "Failed to load main business KPI report");

    const summary = data?.summary || {};
    const { sales = {}, purchases = {}, inventory = {}, customers = {}, staff = {}, suppliers = {}, expenses = {}, creditsDebits: accounts = {}, analysis = {} } = summary;
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
                        <KpiCard label="Purchases" value={currency(purchases.totalAmountPurchased || purchases.totalPurchases)} sub={`${number(purchases.totalPurchaseOrders || purchases.totalBills)} bills`} icon={Package} color={COLORS.purchases} />
                        <KpiCard label="Net Profit" value={currency(analysis.netProfit)} sub={`${analysis.netMarginPercentage || 0}% margin after returns`} icon={BarChart3} color={analysis.netProfit >= 0 ? COLORS.analysis : COLORS.expenses} />
                        <KpiCard label="Expenses" value={currency(expenses.totalExpenses)} sub={`${number(expenses.expenseCount)} transactions`} icon={DollarSign} color={COLORS.expenses} />
                        <KpiCard label="Inventory Stock" value={number(inventory.currentStock)} sub={`${number(inventory.totalProducts)} products`} icon={Package} color={COLORS.inventory} />
                        <KpiCard label="Net Operating" value={currency(analysis.netOperatingResult)} sub={`${analysis.expenseToSalesRatio || 0}% expense ratio`} icon={Activity} color={analysis.netOperatingResult >= 0 ? COLORS.analysis : COLORS.expenses} />
                    </div>

                    <div className="flex flex-wrap gap-3 sm:gap-4 mb-4 sm:mb-6">
                        <MetricSection title="Sales and Returns" icon={ShoppingCart} color={COLORS.sales}>
                            <KpiCard label="Net Sales" value={currency(sales.netSales)} sub={`Gross: ${currency(sales.totalSales)}`} icon={ShoppingCart} color={COLORS.sales} />
                            <KpiCard label="Net Profit" value={currency(sales.netProfit)} sub={`${sales.netMarginPercentage || 0}% margin`} icon={BarChart3} color={sales.netProfit >= 0 ? COLORS.analysis : COLORS.expenses} />
                            <KpiCard label="Orders" value={number(sales.salesCount)} sub={`Average: ${currency(sales.avgOrderValue)}`} icon={Package} color={COLORS.sales} />
                            <KpiCard label="Net COGS" value={currency(sales.netCOGS)} sub={`Returned COGS: ${currency(sales.returnedCOGS)}`} icon={BarChart3} color={COLORS.purchases} />
                            <KpiCard label="Returns" value={currency(sales.totalReturnRefunds)} sub={`${number(sales.returnCount)} documents / ${number(sales.totalReturnedQuantity)} items`} icon={RefreshCw} color={COLORS.expenses} />
                            <KpiCard label="Discount" value={currency(sales.totalDiscount)} sub="Order discounts" icon={Wallet} color={COLORS.sales} />
                        </MetricSection>
                        <MetricSection title="Purchasing and Suppliers" icon={Truck} color={COLORS.purchases}>
                            <KpiCard label="Purchase Returns" value={currency(purchases.totalPurchaseReturns || purchases.totalReturns)} icon={RefreshCw} color={COLORS.expenses} />
                            <KpiCard label="Outstanding" value={currency(purchases.totalUnpaid)} icon={Wallet} color={COLORS.purchases} />
                            <KpiCard label="Active Suppliers" value={number(suppliers.activeSuppliers)} icon={Truck} color={COLORS.suppliers} />
                            <KpiCard label="Purchase Trend" value={`${purchases.purchaseTrend || 0}%`} icon={Activity} color={COLORS.purchases} />
                        </MetricSection>
                    </div>

                    <div className="flex flex-wrap gap-3 sm:gap-4">
                        <MetricSection title="Inventory" icon={Package} color={COLORS.inventory}>
                            <KpiCard label="Purchased Qty" value={number(inventory.purchasedQuantity)} icon={Package} color={COLORS.inventory} />
                            <KpiCard label="Low Stock Signals" value={number(inventory.orderReturnQuantity)} icon={AlertCircle} color={COLORS.expenses} />
                            <KpiCard label="Wastage Qty" value={number(inventory.wastageQuantity)} icon={AlertCircle} color={COLORS.expenses} />
                            <KpiCard label="Sales Revenue" value={currency(inventory.totalRevenue)} icon={DollarSign} color={COLORS.analysis} />
                        </MetricSection>
                        <MetricSection title="People" icon={Users} color={COLORS.customers}>
                            <KpiCard label="Customers" value={number(customers.totalCustomers)} icon={Users} color={COLORS.customers} />
                            <KpiCard label="Active Customers" value={number(customers.activeCustomers)} icon={Users} color={COLORS.customers} />
                            <KpiCard label="Staff" value={number(staff.totalStaff)} icon={Users} color={COLORS.staff} />
                            <KpiCard label="Salary Paid" value={currency(staff.totalPaid)} icon={Wallet} color={COLORS.staff} />
                        </MetricSection>
                        <MetricSection title="Suppliers and Expenses" icon={Truck} color={COLORS.suppliers}>
                            <KpiCard label="Total Suppliers" value={number(suppliers.totalSuppliers)} icon={Truck} color={COLORS.suppliers} />
                            <KpiCard label="Expense Average" value={currency(expenses.averageExpense)} icon={DollarSign} color={COLORS.expenses} />
                            <KpiCard label="Highest Expense" value={currency(expenses.highestExpense)} icon={AlertCircle} color={COLORS.expenses} />
                            <KpiCard label="Expense Trend" value={`${number(expenses.expenseCount)} txns`} icon={Activity} color={COLORS.expenses} />
                        </MetricSection>
                        <MetricSection title="Credits and Debits" icon={Wallet} color={COLORS.accounts}>
                            <KpiCard label="To Receive" value={currency(accounts.totalToReceive)} icon={Wallet} color={COLORS.analysis} />
                            <KpiCard label="To Give" value={currency(accounts.totalToGive)} icon={Wallet} color={COLORS.expenses} />
                            <KpiCard label="Accounts" value={number(accounts.totalAccounts)} icon={Users} color={COLORS.accounts} />
                            <KpiCard label="Account Balance" value={currency(accounts.totalBalance)} icon={DollarSign} color={COLORS.accounts} />
                        </MetricSection>
                    </div>
                </>
            )}
        </div>
    );
}