import React, { useState } from "react";
import { Calendar, Download, Printer, RefreshCw, TrendingUp, TrendingDown, ChevronDown, ChevronUp, DollarSign, ShoppingCart, Package, Receipt, Users, AlertCircle, Info } from "lucide-react";
import { useGetMainBusinessReportQuery } from "../services/reports.service.js";
import { showError } from "../../../shared/utilities/toastHelpers.js";

const PERIOD_OPTIONS = [
    { value: "today", label: "Today" },
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
    { value: "custom", label: "Custom Range" },
];

function SummaryCard({ label, value, icon: Icon, color, description, onToggle, isExpanded, children }) {
    return (
        <div className="rounded-xl border shadow-sm transition-all hover:shadow-md" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Icon size={20} style={{ color }} />
                        <span className="text-sm font-medium" style={{ color: 'var(--muted)' }}>{label}</span>
                    </div>
                    {children && (
                        <button onClick={onToggle} className="p-1 rounded hover:bg-gray-100 transition">
                            {isExpanded ? <ChevronUp size={18} style={{ color: 'var(--muted)' }} /> : <ChevronDown size={18} style={{ color: 'var(--muted)' }} />}
                        </button>
                    )}
                </div>
                <p className="text-2xl font-bold" style={{ color: 'var(--ink)' }}>Rs {value?.toLocaleString() || 0}</p>
                {description && (
                    <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{description}</p>
                )}
            </div>
            {isExpanded && children && (
                <div className="px-5 pb-5 pt-0 border-t" style={{ borderColor: 'var(--border)' }}>
                    {children}
                </div>
            )}
        </div>
    );
}

function BreakdownItem({ label, value, count, percentage, color }) {
    return (
        <div className="flex items-center justify-between py-2 border-b last:border-b-0" style={{ borderColor: 'var(--border)' }}>
            <div className="flex-1">
                <p className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{label}</p>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>{count} transactions</p>
            </div>
            <div className="text-right">
                <p className="text-sm font-bold" style={{ color }}>Rs {value?.toLocaleString() || 0}</p>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>{percentage}%</p>
            </div>
        </div>
    );
}

function TransactionList({ transactions, type, onToggle, isExpanded }) {
    if (!transactions || transactions.length === 0) {
        return null;
    }

    const renderTransactionRow = (transaction) => {
        switch (type) {
            case 'sales':
                return (
                    <>
                        <td className="px-4 py-2 text-sm" style={{ color: 'var(--ink)' }}>{transaction.orderNumber}</td>
                        <td className="px-4 py-2 text-sm" style={{ color: 'var(--ink)' }}>{transaction.customerName || 'N/A'}</td>
                        <td className="px-4 py-2 text-sm capitalize" style={{ color: 'var(--ink)' }}>{transaction.paymentMethod}</td>
                        <td className="px-4 py-2 text-sm font-medium text-right" style={{ color: '#10b981' }}>Rs {transaction.amount?.toLocaleString() || 0}</td>
                        <td className="px-4 py-2 text-sm text-right" style={{ color: 'var(--muted)' }}>{new Date(transaction.date).toLocaleDateString()}</td>
                    </>
                );
            case 'purchases':
                return (
                    <>
                        <td className="px-4 py-2 text-sm" style={{ color: 'var(--ink)' }}>{transaction.invoiceNumber}</td>
                        <td className="px-4 py-2 text-sm" style={{ color: 'var(--ink)' }}>{transaction.supplierName || 'N/A'}</td>
                        <td className="px-4 py-2 text-sm font-medium text-right" style={{ color: '#3b82f6' }}>Rs {transaction.amount?.toLocaleString() || 0}</td>
                        <td className="px-4 py-2 text-sm text-right" style={{ color: 'var(--muted)' }}>{new Date(transaction.date).toLocaleDateString()}</td>
                    </>
                );
            case 'expenses':
                return (
                    <>
                        <td className="px-4 py-2 text-sm" style={{ color: 'var(--ink)' }}>{transaction.title}</td>
                        <td className="px-4 py-2 text-sm capitalize" style={{ color: 'var(--ink)' }}>{transaction.category}</td>
                        <td className="px-4 py-2 text-sm" style={{ color: 'var(--muted)' }}>{transaction.description || '-'}</td>
                        <td className="px-4 py-2 text-sm font-medium text-right" style={{ color: '#ef4444' }}>Rs {transaction.amount?.toLocaleString() || 0}</td>
                        <td className="px-4 py-2 text-sm text-right" style={{ color: 'var(--muted)' }}>{new Date(transaction.date).toLocaleDateString()}</td>
                    </>
                );
            case 'wastages':
                return (
                    <>
                        <td className="px-4 py-2 text-sm" style={{ color: 'var(--ink)' }}>{transaction.productName}</td>
                        <td className="px-4 py-2 text-sm text-right" style={{ color: 'var(--ink)' }}>{transaction.quantity}</td>
                        <td className="px-4 py-2 text-sm text-right" style={{ color: 'var(--ink)' }}>Rs {transaction.costPrice?.toLocaleString() || 0}</td>
                        <td className="px-4 py-2 text-sm font-medium text-right" style={{ color: '#dc2626' }}>Rs {transaction.totalLoss?.toLocaleString() || 0}</td>
                        <td className="px-4 py-2 text-sm text-right" style={{ color: 'var(--muted)' }}>{new Date(transaction.date).toLocaleDateString()}</td>
                    </>
                );
            case 'purchaseReturns':
                return (
                    <>
                        <td className="px-4 py-2 text-sm" style={{ color: 'var(--ink)' }}>{transaction.returnNumber}</td>
                        <td className="px-4 py-2 text-sm" style={{ color: 'var(--ink)' }}>{transaction.supplierName || 'N/A'}</td>
                        <td className="px-4 py-2 text-sm font-medium text-right" style={{ color: '#06b6d4' }}>Rs {transaction.amount?.toLocaleString() || 0}</td>
                        <td className="px-4 py-2 text-sm text-right" style={{ color: 'var(--muted)' }}>{new Date(transaction.date).toLocaleDateString()}</td>
                    </>
                );
            case 'productReturns':
                return (
                    <>
                        <td className="px-4 py-2 text-sm" style={{ color: 'var(--ink)' }}>{transaction.returnNumber}</td>
                        <td className="px-4 py-2 text-sm" style={{ color: 'var(--ink)' }}>{transaction.customerName || 'N/A'}</td>
                        <td className="px-4 py-2 text-sm font-medium text-right" style={{ color: '#f59e0b' }}>Rs {transaction.amount?.toLocaleString() || 0}</td>
                        <td className="px-4 py-2 text-sm text-right" style={{ color: 'var(--muted)' }}>{new Date(transaction.date).toLocaleDateString()}</td>
                    </>
                );
            case 'salaryPayments':
                return (
                    <>
                        <td className="px-4 py-2 text-sm" style={{ color: 'var(--ink)' }}>{transaction.staffName}</td>
                        <td className="px-4 py-2 text-sm font-medium text-right" style={{ color: '#8b5cf6' }}>Rs {transaction.amount?.toLocaleString() || 0}</td>
                        <td className="px-4 py-2 text-sm text-right" style={{ color: 'var(--muted)' }}>{new Date(transaction.date).toLocaleDateString()}</td>
                    </>
                );
            default:
                return null;
        }
    };

    const getTableHeaders = () => {
        switch (type) {
            case 'sales':
                return ['Order #', 'Customer', 'Payment Method', 'Amount', 'Date'];
            case 'purchases':
                return ['Invoice #', 'Supplier', 'Amount', 'Date'];
            case 'expenses':
                return ['Title', 'Category', 'Description', 'Amount', 'Date'];
            case 'wastages':
                return ['Product', 'Quantity', 'Cost Price', 'Total Loss', 'Date'];
            case 'purchaseReturns':
                return ['Return #', 'Supplier', 'Amount', 'Date'];
            case 'productReturns':
                return ['Return #', 'Customer', 'Amount', 'Date'];
            case 'salaryPayments':
                return ['Staff Name', 'Amount', 'Date'];
            default:
                return [];
        }
    };

    return (
        <div className="mt-4">
            <button
                onClick={onToggle}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition w-full"
                style={{ background: 'var(--surface-muted)', color: 'var(--ink)' }}
            >
                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                <span>View {transactions.length} {type} transactions</span>
            </button>
            {isExpanded && (
                <div className="mt-3 rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead style={{ background: 'var(--surface-muted)' }}>
                                <tr>
                                    {getTableHeaders().map((header, idx) => (
                                        <th key={idx} className="px-4 py-2 text-left text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>
                                            {header}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                                {transactions.slice(0, 50).map((transaction, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50">
                                        {renderTransactionRow(transaction)}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {transactions.length > 50 && (
                        <div className="px-4 py-2 text-xs text-center" style={{ color: 'var(--muted)' }}>
                            Showing first 50 of {transactions.length} transactions
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function MainBusinessReport() {
    const [period, setPeriod] = useState("today");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [expandedSections, setExpandedSections] = useState({});
    const [expandedTransactions, setExpandedTransactions] = useState({});
    const [expandAll, setExpandAll] = useState(false);

    const filters = { period };
    if (period === "custom" && fromDate && toDate) {
        filters.fromDate = fromDate;
        filters.toDate = toDate;
    }

    const { data, isLoading, error, refetch } = useGetMainBusinessReportQuery(filters);

    if (error) {
        showError(error?.data?.message || "Failed to load report");
    }

    const handleRefresh = () => refetch();
    const handlePrint = () => window.print();
    const handleExport = () => console.log("Export functionality to be implemented");

    const toggleSection = (key) => {
        setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const toggleTransactions = (key) => {
        setExpandedTransactions(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleExpandAll = () => {
        setExpandAll(true);
        setExpandedSections({
            sales: true,
            purchases: true,
            expenses: true,
            salaries: true,
            returns: true,
            wastage: true,
            profit: true
        });
        setExpandedTransactions({
            sales: true,
            purchases: true,
            expenses: true,
            salaries: true,
            purchaseReturns: true,
            productReturns: true,
            wastages: true
        });
    };

    const handleCollapseAll = () => {
        setExpandAll(false);
        setExpandedSections({});
        setExpandedTransactions({});
    };

    const summary = data?.summary || {};
    const details = data?.details || {};
    const breakdowns = data?.breakdowns || {};
    const transactions = data?.transactions || {};

    // For print, expand all sections
    const isPrinting = window.matchMedia?.('print')?.matches;

    return (
        <div className="p-6 min-h-screen" style={{ background: 'var(--app-bg)' }}>
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                    .print-expanded { display: block !important; }
                    body { background: white !important; }
                }
            `}</style>

            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--ink)' }}>Main Business Report</h1>
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>Complete business overview with detailed breakdowns</p>
                </div>
                <div className="flex gap-2 no-print">
                    <button
                        onClick={handleRefresh}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg border transition"
                        style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--ink)' }}
                    >
                        <RefreshCw size={16} />
                        Refresh
                    </button>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg border transition"
                        style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--ink)' }}
                    >
                        <Download size={16} />
                        Export
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-white transition"
                        style={{ background: 'var(--accent-2)' }}
                    >
                        <Printer size={16} />
                        Print
                    </button>
                </div>
            </div>

            <div className="rounded-xl border shadow-sm mb-6 no-print" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <div className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-4">
                        <Calendar size={20} style={{ color: 'var(--muted)' }} />
                        <div className="flex gap-2">
                            {PERIOD_OPTIONS.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => setPeriod(opt.value)}
                                    className={`px-4 py-2 rounded-lg transition ${
                                        period === opt.value
                                            ? "text-white"
                                            : ""
                                    }`}
                                    style={{
                                        background: period === opt.value ? 'var(--accent-2)' : 'var(--surface-muted)',
                                        color: period === opt.value ? 'white' : 'var(--ink)'
                                    }}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleExpandAll}
                            className="px-3 py-1 text-sm rounded border transition"
                            style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}
                        >
                            Expand All
                        </button>
                        <button
                            onClick={handleCollapseAll}
                            className="px-3 py-1 text-sm rounded border transition"
                            style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}
                        >
                            Collapse All
                        </button>
                    </div>
                </div>
                {period === "custom" && (
                    <div className="flex gap-2 px-4 pb-4">
                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            className="px-3 py-2 rounded-lg border"
                            style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--ink)' }}
                        />
                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            className="px-3 py-2 rounded-lg border"
                            style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--ink)' }}
                        />
                    </div>
                )}
            </div>

            {isLoading ? (
                <div className="rounded-xl border shadow-sm flex items-center justify-center p-12" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                    <RefreshCw className="animate-spin" size={40} style={{ color: 'var(--accent-2)' }} />
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <SummaryCard
                            label="Total Sales"
                            value={summary.totalSales}
                            icon={ShoppingCart}
                            color="#10b981"
                            description="Revenue from completed orders"
                            onToggle={() => toggleSection('sales')}
                            isExpanded={expandedSections.sales || isPrinting}
                        >
                            <div className="mt-3">
                                <div className="flex items-center gap-2 mb-2" style={{ color: 'var(--muted)' }}>
                                    <Info size={14} />
                                    <span className="text-xs">Source: POS Orders (completed status)</span>
                                </div>
                                <div className="p-2 rounded" style={{ background: 'var(--surface-muted)' }}>
                                    <p className="text-xs" style={{ color: 'var(--muted)' }}>
                                        <strong>Total Orders:</strong> {details.salesCount || 0}
                                    </p>
                                </div>
                            </div>
                        </SummaryCard>

                        <SummaryCard
                            label="Total Purchases"
                            value={summary.totalPurchases}
                            icon={Package}
                            color="#3b82f6"
                            description="Cost of inventory purchases"
                            onToggle={() => toggleSection('purchases')}
                            isExpanded={expandedSections.purchases || isPrinting}
                        >
                            <div className="mt-3">
                                <div className="flex items-center gap-2 mb-2" style={{ color: 'var(--muted)' }}>
                                    <Info size={14} />
                                    <span className="text-xs">Source: Purchase Orders</span>
                                </div>
                                <div className="p-2 rounded" style={{ background: 'var(--surface-muted)' }}>
                                    <p className="text-xs" style={{ color: 'var(--muted)' }}>
                                        <strong>Total Purchases:</strong> {details.purchaseCount || 0}
                                    </p>
                                </div>
                            </div>
                        </SummaryCard>

                        <SummaryCard
                            label="Total Expenses"
                            value={summary.totalExpenses}
                            icon={Receipt}
                            color="#ef4444"
                            description="Operating expenses"
                            onToggle={() => toggleSection('expenses')}
                            isExpanded={expandedSections.expenses || isPrinting}
                        >
                            <div className="mt-3">
                                <div className="flex items-center gap-2 mb-2" style={{ color: 'var(--muted)' }}>
                                    <Info size={14} />
                                    <span className="text-xs">Source: Expense Records</span>
                                </div>
                                <div className="p-2 rounded" style={{ background: 'var(--surface-muted)' }}>
                                    <p className="text-xs" style={{ color: 'var(--muted)' }}>
                                        <strong>Total Expenses:</strong> {details.expenseCount || 0}
                                    </p>
                                </div>
                            </div>
                        </SummaryCard>

                        <SummaryCard
                            label="Total Salaries"
                            value={summary.totalSalaries}
                            icon={Users}
                            color="#8b5cf6"
                            description="Staff salary payments"
                            onToggle={() => toggleSection('salaries')}
                            isExpanded={expandedSections.salaries || isPrinting}
                        >
                            <div className="mt-3">
                                <div className="flex items-center gap-2 mb-2" style={{ color: 'var(--muted)' }}>
                                    <Info size={14} />
                                    <span className="text-xs">Source: Staff Salary Payments</span>
                                </div>
                                <div className="p-2 rounded" style={{ background: 'var(--surface-muted)' }}>
                                    <p className="text-xs" style={{ color: 'var(--muted)' }}>
                                        <strong>Payment Count:</strong> {details.salaryPaymentCount || 0}
                                    </p>
                                </div>
                            </div>
                        </SummaryCard>

                        <SummaryCard
                            label="Purchase Returns"
                            value={summary.totalPurchaseReturns}
                            icon={TrendingUp}
                            color="#06b6d4"
                            description="Returns to suppliers"
                            onToggle={() => toggleSection('returns')}
                            isExpanded={expandedSections.returns || isPrinting}
                        >
                            <div className="mt-3">
                                <div className="flex items-center gap-2 mb-2" style={{ color: 'var(--muted)' }}>
                                    <Info size={14} />
                                    <span className="text-xs">Source: Purchase Return Records</span>
                                </div>
                                <div className="p-2 rounded" style={{ background: 'var(--surface-muted)' }}>
                                    <p className="text-xs" style={{ color: 'var(--muted)' }}>
                                        <strong>Return Count:</strong> {details.purchaseReturnCount || 0}
                                    </p>
                                </div>
                            </div>
                        </SummaryCard>

                        <SummaryCard
                            label="Sale Returns"
                            value={summary.totalProductReturns}
                            icon={TrendingDown}
                            color="#f59e0b"
                            description="Customer product returns"
                            onToggle={() => toggleSection('returns')}
                            isExpanded={expandedSections.returns || isPrinting}
                        >
                            <div className="mt-3">
                                <div className="flex items-center gap-2 mb-2" style={{ color: 'var(--muted)' }}>
                                    <Info size={14} />
                                    <span className="text-xs">Source: Product Return Records</span>
                                </div>
                                <div className="p-2 rounded" style={{ background: 'var(--surface-muted)' }}>
                                    <p className="text-xs" style={{ color: 'var(--muted)' }}>
                                        <strong>Return Count:</strong> {details.productReturnCount || 0}
                                    </p>
                                </div>
                            </div>
                        </SummaryCard>

                        <SummaryCard
                            label="Wastage Loss"
                            value={summary.totalWastage}
                            icon={AlertCircle}
                            color="#dc2626"
                            description="Inventory wastage cost"
                            onToggle={() => toggleSection('wastage')}
                            isExpanded={expandedSections.wastage || isPrinting}
                        >
                            <div className="mt-3">
                                <div className="flex items-center gap-2 mb-2" style={{ color: 'var(--muted)' }}>
                                    <Info size={14} />
                                    <span className="text-xs">Source: Wastage Records (quantity × cost price)</span>
                                </div>
                                <div className="p-2 rounded" style={{ background: 'var(--surface-muted)' }}>
                                    <p className="text-xs" style={{ color: 'var(--muted)' }}>
                                        <strong>Wastage Count:</strong> {details.wastageCount || 0}
                                    </p>
                                </div>
                            </div>
                        </SummaryCard>

                        <SummaryCard
                            label="Net Profit/Loss"
                            value={summary.netProfit}
                            icon={summary.netProfit >= 0 ? DollarSign : AlertCircle}
                            color={summary.netProfit >= 0 ? "#10b981" : "#dc2626"}
                            description={summary.netProfit >= 0 ? "Net profit for period" : "Net loss for period"}
                            onToggle={() => toggleSection('profit')}
                            isExpanded={expandedSections.profit || isPrinting}
                        >
                            <div className="mt-3">
                                <div className="flex items-center gap-2 mb-2" style={{ color: 'var(--muted)' }}>
                                    <Info size={14} />
                                    <span className="text-xs">Calculation: Sales - Purchases - Expenses - Wastage - Salaries - Sale Returns + Purchase Returns</span>
                                </div>
                            </div>
                        </SummaryCard>
                    </div>

                    <div className="rounded-xl border shadow-sm p-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--ink)' }}>Transaction Summary</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                            <div className="p-4 rounded-lg" style={{ background: 'var(--surface-muted)' }}>
                                <p className="text-sm mb-1" style={{ color: 'var(--muted)' }}>Sales Count</p>
                                <p className="text-xl font-bold" style={{ color: 'var(--ink)' }}>{details.salesCount || 0}</p>
                            </div>
                            <div className="p-4 rounded-lg" style={{ background: 'var(--surface-muted)' }}>
                                <p className="text-sm mb-1" style={{ color: 'var(--muted)' }}>Purchase Count</p>
                                <p className="text-xl font-bold" style={{ color: 'var(--ink)' }}>{details.purchaseCount || 0}</p>
                            </div>
                            <div className="p-4 rounded-lg" style={{ background: 'var(--surface-muted)' }}>
                                <p className="text-sm mb-1" style={{ color: 'var(--muted)' }}>Expense Count</p>
                                <p className="text-xl font-bold" style={{ color: 'var(--ink)' }}>{details.expenseCount || 0}</p>
                            </div>
                            <div className="p-4 rounded-lg" style={{ background: 'var(--surface-muted)' }}>
                                <p className="text-sm mb-1" style={{ color: 'var(--muted)' }}>Wastage Count</p>
                                <p className="text-xl font-bold" style={{ color: 'var(--ink)' }}>{details.wastageCount || 0}</p>
                            </div>
                            <div className="p-4 rounded-lg" style={{ background: 'var(--surface-muted)' }}>
                                <p className="text-sm mb-1" style={{ color: 'var(--muted)' }}>Purchase Returns</p>
                                <p className="text-xl font-bold" style={{ color: 'var(--ink)' }}>{details.purchaseReturnCount || 0}</p>
                            </div>
                            <div className="p-4 rounded-lg" style={{ background: 'var(--surface-muted)' }}>
                                <p className="text-sm mb-1" style={{ color: 'var(--muted)' }}>Sale Returns</p>
                                <p className="text-xl font-bold" style={{ color: 'var(--ink)' }}>{details.productReturnCount || 0}</p>
                            </div>
                            <div className="p-4 rounded-lg" style={{ background: 'var(--surface-muted)' }}>
                                <p className="text-sm mb-1" style={{ color: 'var(--muted)' }}>Salary Payments</p>
                                <p className="text-xl font-bold" style={{ color: 'var(--ink)' }}>{details.salaryPaymentCount || 0}</p>
                            </div>
                        </div>
                    </div>

                    {/* Transaction Details Sections */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold" style={{ color: 'var(--ink)' }}>Transaction Details</h2>
                        
                        {transactions.sales && transactions.sales.length > 0 && (
                            <div className="rounded-xl border shadow-sm p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                                <h3 className="text-md font-semibold mb-3" style={{ color: 'var(--ink)' }}>Sales Transactions</h3>
                                <TransactionList
                                    transactions={transactions.sales}
                                    type="sales"
                                    onToggle={() => toggleTransactions('sales')}
                                    isExpanded={expandedTransactions.sales || isPrinting}
                                />
                            </div>
                        )}

                        {transactions.purchases && transactions.purchases.length > 0 && (
                            <div className="rounded-xl border shadow-sm p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                                <h3 className="text-md font-semibold mb-3" style={{ color: 'var(--ink)' }}>Purchase Transactions</h3>
                                <TransactionList
                                    transactions={transactions.purchases}
                                    type="purchases"
                                    onToggle={() => toggleTransactions('purchases')}
                                    isExpanded={expandedTransactions.purchases || isPrinting}
                                />
                            </div>
                        )}

                        {transactions.expenses && transactions.expenses.length > 0 && (
                            <div className="rounded-xl border shadow-sm p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                                <h3 className="text-md font-semibold mb-3" style={{ color: 'var(--ink)' }}>Expense Transactions</h3>
                                <TransactionList
                                    transactions={transactions.expenses}
                                    type="expenses"
                                    onToggle={() => toggleTransactions('expenses')}
                                    isExpanded={expandedTransactions.expenses || isPrinting}
                                />
                            </div>
                        )}

                        {transactions.salaryPayments && transactions.salaryPayments.length > 0 && (
                            <div className="rounded-xl border shadow-sm p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                                <h3 className="text-md font-semibold mb-3" style={{ color: 'var(--ink)' }}>Salary Payment Transactions</h3>
                                <TransactionList
                                    transactions={transactions.salaryPayments}
                                    type="salaryPayments"
                                    onToggle={() => toggleTransactions('salaries')}
                                    isExpanded={expandedTransactions.salaries || isPrinting}
                                />
                            </div>
                        )}

                        {transactions.purchaseReturns && transactions.purchaseReturns.length > 0 && (
                            <div className="rounded-xl border shadow-sm p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                                <h3 className="text-md font-semibold mb-3" style={{ color: 'var(--ink)' }}>Purchase Return Transactions</h3>
                                <TransactionList
                                    transactions={transactions.purchaseReturns}
                                    type="purchaseReturns"
                                    onToggle={() => toggleTransactions('purchaseReturns')}
                                    isExpanded={expandedTransactions.purchaseReturns || isPrinting}
                                />
                            </div>
                        )}

                        {transactions.productReturns && transactions.productReturns.length > 0 && (
                            <div className="rounded-xl border shadow-sm p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                                <h3 className="text-md font-semibold mb-3" style={{ color: 'var(--ink)' }}>Product Return Transactions</h3>
                                <TransactionList
                                    transactions={transactions.productReturns}
                                    type="productReturns"
                                    onToggle={() => toggleTransactions('productReturns')}
                                    isExpanded={expandedTransactions.productReturns || isPrinting}
                                />
                            </div>
                        )}

                        {transactions.wastages && transactions.wastages.length > 0 && (
                            <div className="rounded-xl border shadow-sm p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                                <h3 className="text-md font-semibold mb-3" style={{ color: 'var(--ink)' }}>Wastage Transactions</h3>
                                <TransactionList
                                    transactions={transactions.wastages}
                                    type="wastages"
                                    onToggle={() => toggleTransactions('wastages')}
                                    isExpanded={expandedTransactions.wastages || isPrinting}
                                />
                            </div>
                        )}
                    </div>

                    {/* Breakdown Sections */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold" style={{ color: 'var(--ink)' }}>Detailed Breakdowns</h2>
                        
                        {breakdowns.salesByPaymentMethod && breakdowns.salesByPaymentMethod.length > 0 && (
                            <div className="rounded-xl border shadow-sm p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                                <h3 className="text-md font-semibold mb-3" style={{ color: 'var(--ink)' }}>Sales by Payment Method</h3>
                                <div className="space-y-2">
                                    {breakdowns.salesByPaymentMethod.map((item, idx) => (
                                        <BreakdownItem
                                            key={idx}
                                            label={item.method}
                                            value={item.total}
                                            count={item.count}
                                            percentage={item.percentage}
                                            color="#10b981"
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {breakdowns.expensesByCategory && breakdowns.expensesByCategory.length > 0 && (
                            <div className="rounded-xl border shadow-sm p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                                <h3 className="text-md font-semibold mb-3" style={{ color: 'var(--ink)' }}>Expenses by Category</h3>
                                <div className="space-y-2">
                                    {breakdowns.expensesByCategory.map((item, idx) => (
                                        <BreakdownItem
                                            key={idx}
                                            label={item.category}
                                            value={item.total}
                                            count={item.count}
                                            percentage={item.percentage}
                                            color="#ef4444"
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {breakdowns.productReturnsByReason && breakdowns.productReturnsByReason.length > 0 && (
                            <div className="rounded-xl border shadow-sm p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                                <h3 className="text-md font-semibold mb-3" style={{ color: 'var(--ink)' }}>Product Returns by Reason</h3>
                                <div className="space-y-2">
                                    {breakdowns.productReturnsByReason.map((item, idx) => (
                                        <BreakdownItem
                                            key={idx}
                                            label={item.reason}
                                            value={item.total}
                                            count={item.count}
                                            percentage={item.percentage}
                                            color="#f59e0b"
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {breakdowns.purchaseReturnsBySupplier && breakdowns.purchaseReturnsBySupplier.length > 0 && (
                            <div className="rounded-xl border shadow-sm p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                                <h3 className="text-md font-semibold mb-3" style={{ color: 'var(--ink)' }}>Purchase Returns by Supplier</h3>
                                <div className="space-y-2">
                                    {breakdowns.purchaseReturnsBySupplier.map((item, idx) => (
                                        <BreakdownItem
                                            key={idx}
                                            label={item.supplierName}
                                            value={item.total}
                                            count={item.count}
                                            percentage={item.percentage}
                                            color="#06b6d4"
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {breakdowns.wastagesByProduct && breakdowns.wastagesByProduct.length > 0 && (
                            <div className="rounded-xl border shadow-sm p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                                <h3 className="text-md font-semibold mb-3" style={{ color: 'var(--ink)' }}>Wastage by Product</h3>
                                <div className="space-y-2">
                                    {breakdowns.wastagesByProduct.map((item, idx) => (
                                        <div className="flex items-center justify-between py-2 border-b last:border-b-0" style={{ borderColor: 'var(--border)' }}>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{item.productName}</p>
                                                <p className="text-xs" style={{ color: 'var(--muted)' }}>{item.count} records • {item.totalQuantity} units</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold" style={{ color: '#dc2626' }}>Rs {item.total?.toLocaleString() || 0}</p>
                                                <p className="text-xs" style={{ color: 'var(--muted)' }}>{item.percentage}%</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {breakdowns.salariesByStaff && breakdowns.salariesByStaff.length > 0 && (
                            <div className="rounded-xl border shadow-sm p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                                <h3 className="text-md font-semibold mb-3" style={{ color: 'var(--ink)' }}>Salary Payments by Staff</h3>
                                <div className="space-y-2">
                                    {breakdowns.salariesByStaff.map((item, idx) => (
                                        <BreakdownItem
                                            key={idx}
                                            label={item.staffName}
                                            value={item.total}
                                            count={item.count}
                                            percentage={item.percentage}
                                            color="#8b5cf6"
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="rounded-xl border shadow-sm p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                            <h3 className="text-md font-semibold mb-3" style={{ color: 'var(--ink)' }}>Profit/Loss Calculation</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm" style={{ color: 'var(--ink)' }}>
                                    <span>+ Sales:</span>
                                    <span>Rs {summary.totalSales?.toLocaleString() || 0}</span>
                                </div>
                                <div className="flex justify-between text-sm" style={{ color: 'var(--ink)' }}>
                                    <span>- Purchases:</span>
                                    <span>Rs {summary.totalPurchases?.toLocaleString() || 0}</span>
                                </div>
                                <div className="flex justify-between text-sm" style={{ color: 'var(--ink)' }}>
                                    <span>- Expenses:</span>
                                    <span>Rs {summary.totalExpenses?.toLocaleString() || 0}</span>
                                </div>
                                <div className="flex justify-between text-sm" style={{ color: 'var(--ink)' }}>
                                    <span>- Wastage:</span>
                                    <span>Rs {summary.totalWastage?.toLocaleString() || 0}</span>
                                </div>
                                <div className="flex justify-between text-sm" style={{ color: 'var(--ink)' }}>
                                    <span>- Salaries:</span>
                                    <span>Rs {summary.totalSalaries?.toLocaleString() || 0}</span>
                                </div>
                                <div className="flex justify-between text-sm" style={{ color: 'var(--ink)' }}>
                                    <span>- Sale Returns:</span>
                                    <span>Rs {summary.totalProductReturns?.toLocaleString() || 0}</span>
                                </div>
                                <div className="flex justify-between text-sm" style={{ color: 'var(--ink)' }}>
                                    <span>+ Purchase Returns:</span>
                                    <span>Rs {summary.totalPurchaseReturns?.toLocaleString() || 0}</span>
                                </div>
                                <div className="flex justify-between text-sm font-bold pt-2 border-t" style={{ borderColor: 'var(--border)', color: summary.netProfit >= 0 ? '#10b981' : '#dc2626' }}>
                                    <span>= Net:</span>
                                    <span>Rs {summary.netProfit?.toLocaleString() || 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
