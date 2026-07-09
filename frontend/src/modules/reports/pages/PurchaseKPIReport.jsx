import React, { useState, useRef } from "react";
import {
    DollarSign,
    ShoppingCart,
    Package,
    TrendingUp,
    ArrowUp,
    ArrowDown,
    Filter,
    ToggleLeft,
    ToggleRight,
    RefreshCw,
    Printer,
    Download,
    Truck,
    AlertTriangle,
    CheckCircle,
    Clock,
    XCircle
} from "lucide-react";
import {
    LineChart, Line, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { useGetPurchaseKPIReportQuery } from "../services/reports.service.js";
import { showError } from "../../../shared/utilities/toastHelpers.js";
import PageHeading from "../../../shared/components/PageHeading.jsx";
import ScreenTabButton from "../../../shared/components/ScreenTabButton.jsx";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];

const KPICard = ({ label, value, icon: Icon, color, description, trend, suffix = "" }) => (
    <div className="rounded-xl border shadow-sm p-5" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ background: color }}>
                    <Icon size={20} style={{ color: 'white' }} />
                </div>
                <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--muted)' }}>{label}</p>
                    <p className="text-3xl font-bold mt-1" style={{ color: 'var(--ink)' }}>
                        {suffix}{value?.toLocaleString?.() || value || 0}
                    </p>
                </div>
            </div>
            {trend !== undefined && (
                <div className={`flex items-center gap-1 text-sm font-semibold ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {trend >= 0 ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                    <span>{Math.abs(trend)}% vs last period</span>
                </div>
            )}
        </div>
        {description && (
            <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>{description}</p>
        )}
    </div>
);

export default function PurchaseKPIReport() {
    const contentRef = useRef(null);
    const [period, setPeriod] = useState("today");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [compareWithPrevious, setCompareWithPrevious] = useState(false);

    const filters = { period, compareWithPrevious };
    if (period === "custom" && fromDate && toDate) {
        filters.fromDate = fromDate;
        filters.toDate = toDate;
    }

    const { data, isLoading, error, refetch } = useGetPurchaseKPIReportQuery(filters, {
        refetchOnMountOrArgChange: true,
    });

    if (error) {
        showError(error?.data?.message || "Failed to load purchase report");
    }

    const handleRefresh = () => refetch();
    const handlePrint = () => window.print();
    const handleExport = () => console.log("Export functionality to be implemented");

    const summary = data?.data?.summary || {};
    const breakdowns = data?.data?.breakdowns || {};

    // Prepare chart data
    const trendData = breakdowns.byDate?.map(d => ({
        date: d.date,
        current: d.total,
        previous: breakdowns.previousByDate?.find(p => p.date === d.date)?.total || 0
    })) || [];

    const supplierBarData = breakdowns.bySupplier?.map(item => ({
        name: item.supplierName,
        amount: item.totalAmount
    })) || [];

    return (
        <div className="p-6 min-h-screen" style={{ background: 'var(--app-bg)' }}>
            <style>{`
                @media print {
                    .no-print { display: none !important; }
                }
                .sticky-header {
                    position: sticky;
                    top: 0;
                    z-index: 10;
                }
            `}</style>

            <PageHeading
                heading="Purchase Report"
                subheading="Comprehensive purchase analytics and supplier performance metrics"
                leftActions={
                    <div onClick={handleRefresh}>
                        <ScreenTabButton lucideIcon={RefreshCw} text="Refresh" />
                    </div>
                }
              
            />

            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--primary)' }} />
                </div>
            ) : (
                <div ref={contentRef}>
                    {/* Section 1: Summary Cards (6 cards) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                        <KPICard
                            label="Total Amount Purchased"
                            value={summary.totalAmountPurchased}
                            icon={DollarSign}
                            color="#3b82f6"
                            description="Total spending on purchases"
                            trend={summary.purchaseTrend}
                            suffix="Rs "
                        />
                        <KPICard
                            label="Total Purchase Orders"
                            value={summary.totalPurchaseOrders}
                            icon={ShoppingCart}
                            color="#10b981"
                            description="Number of purchase orders"
                        />
                        <KPICard
                            label="Total Items Received"
                            value={summary.totalItemsReceived}
                            icon={Package}
                            color="#f59e0b"
                            description="Total units received"
                        />
                        <KPICard
                            label="Total Unpaid"
                            value={summary.totalUnpaid}
                            icon={AlertTriangle}
                            color="#ef4444"
                            description="Amount still owed to suppliers"
                            suffix="Rs "
                        />
                        <KPICard
                            label="Avg Order Value"
                            value={summary.averageOrderValue}
                            icon={TrendingUp}
                            color="#8b5cf6"
                            description="Average per purchase order"
                            suffix="Rs "
                        />
                        <KPICard
                            label="Total Purchase Returns"
                            value={summary.totalPurchaseReturns}
                            icon={Truck}
                            color="#06b6d4"
                            description="Goods returned to suppliers"
                            suffix="Rs "
                        />
                    </div>

                    {/* Section 2: Date & Period Filter */}
                    <div className="sticky-header rounded-xl border shadow-sm p-4 mb-6 no-print" style={{ background: 'var(--surface-muted)', borderColor: 'var(--border)' }}>
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex flex-wrap items-center gap-2">
                                <Filter size={18} style={{ color: 'var(--muted)' }} />
                                {["today", "week", "month", "quarter", "year"].map(p => (
                                    <button
                                        key={p}
                                        onClick={() => setPeriod(p)}
                                        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                                            period === p 
                                                ? 'text-white' 
                                                : ''
                                        }`}
                                        style={{ 
                                            background: period === p ? 'var(--primary)' : 'var(--surface)',
                                            color: period === p ? 'white' : 'var(--ink)',
                                            border: period === p ? 'none' : '1px solid var(--border)'
                                        }}
                                    >
                                        {p.charAt(0).toUpperCase() + p.slice(1)}
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center gap-4">
                                {period === "custom" && (
                                    <>
                                        <input
                                            type="date"
                                            value={fromDate}
                                            onChange={(e) => setFromDate(e.target.value)}
                                            className="px-3 py-2 rounded-lg text-sm border"
                                            style={{ background: 'var(--surface)', color: 'var(--ink)', borderColor: 'var(--border)' }}
                                        />
                                        <span style={{ color: 'var(--muted)' }}>to</span>
                                        <input
                                            type="date"
                                            value={toDate}
                                            onChange={(e) => setToDate(e.target.value)}
                                            className="px-3 py-2 rounded-lg text-sm border"
                                            style={{ background: 'var(--surface)', color: 'var(--ink)', borderColor: 'var(--border)' }}
                                        />
                                    </>
                                )}
                                <button
                                    onClick={() => setPeriod("custom")}
                                    className="px-4 py-2 rounded-full text-sm font-medium border"
                                    style={{ background: 'var(--surface)', color: 'var(--ink)', borderColor: 'var(--border)' }}
                                >
                                    Custom Range
                                </button>
                                <div className="flex items-center gap-2">
                                    {compareWithPrevious ? <ToggleRight size={20} color="var(--success)" /> : <ToggleLeft size={20} color="var(--muted)" />}
                                    <label className="text-sm cursor-pointer" style={{ color: 'var(--muted)' }}>
                                        Compare with previous period
                                    </label>
                                    <input
                                        type="checkbox"
                                        checked={compareWithPrevious}
                                        onChange={(e) => setCompareWithPrevious(e.target.checked)}
                                        className="hidden"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Section 3: Purchase Trend Chart */}
                    <div className="rounded-xl border shadow-sm p-6 mb-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--ink)' }}>
                            Purchase Trend — {period.charAt(0).toUpperCase() + period.slice(1)}
                        </h3>
                        <div style={{ height: '300px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={trendData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                    <XAxis dataKey="date" stroke="var(--muted)" />
                                    <YAxis stroke="var(--muted)" />
                                    <Tooltip 
                                        contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                                        itemStyle={{ color: 'var(--ink)' }}
                                    />
                                    <Legend />
                                    {compareWithPrevious && (
                                        <Line 
                                            type="monotone" 
                                            dataKey="previous" 
                                            stroke="var(--muted)" 
                                            strokeDasharray="5 5"
                                            name="Last Period"
                                        />
                                    )}
                                    <Line 
                                        type="monotone" 
                                        dataKey="current" 
                                        stroke="var(--primary)" 
                                        strokeWidth={2}
                                        name="This Period"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Section 4: Purchase Orders List and Status */}
                    <div className="rounded-xl border shadow-sm p-6 mb-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--ink)' }}>
                            Purchase Orders Status
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr style={{ background: 'var(--surface-muted)' }}>
                                        <th className="py-2 px-3 text-left font-semibold" style={{ color: 'var(--ink)' }}>PO Number</th>
                                        <th className="py-2 px-3 text-left font-semibold" style={{ color: 'var(--ink)' }}>Date</th>
                                        <th className="py-2 px-3 text-left font-semibold" style={{ color: 'var(--ink)' }}>Supplier</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>Items</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>Value</th>
                                        <th className="py-2 px-3 text-left font-semibold" style={{ color: 'var(--ink)' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr style={{ background: 'var(--surface)' }}>
                                        <td className="py-2 px-3" colSpan="6" style={{ color: 'var(--muted)', textAlign: 'center' }}>
                                            Purchase orders list will be populated from purchase orders collection
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Section 5: Purchases by Supplier */}
                    <div className="rounded-xl border shadow-sm p-6 mb-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--ink)' }}>
                            Purchases by Supplier
                        </h3>
                        <div style={{ height: '250px', marginBottom: '20px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={supplierBarData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                    <XAxis type="number" stroke="var(--muted)" />
                                    <YAxis dataKey="name" type="category" width={150} stroke="var(--muted)" />
                                    <Tooltip 
                                        contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                                        itemStyle={{ color: 'var(--ink)' }}
                                    />
                                    <Bar dataKey="amount" fill="var(--primary)" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr style={{ background: 'var(--surface-muted)' }}>
                                        <th className="py-2 px-3 text-left font-semibold" style={{ color: 'var(--ink)' }}>Supplier Name</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>Orders</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>Total Amount</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>Items</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>Avg Order Value</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>Outstanding</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {breakdowns.bySupplier?.map((item, idx) => (
                                        <tr key={idx} style={{ background: idx % 2 === 0 ? 'var(--surface)' : 'var(--surface-muted)' }}>
                                            <td className="py-2 px-3 font-medium" style={{ color: 'var(--ink)' }}>{item.supplierName}</td>
                                            <td className="py-2 px-3 text-right">{item.orderCount}</td>
                                            <td className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--primary)' }}>Rs {item.totalAmount?.toLocaleString()}</td>
                                            <td className="py-2 px-3 text-right">{item.totalItems}</td>
                                            <td className="py-2 px-3 text-right">Rs {item.averageOrderValue?.toFixed(0)?.toLocaleString()}</td>
                                            <td className="py-2 px-3 text-right" style={{ color: item.outstandingPayable > 0 ? 'var(--error-text)' : 'var(--success-text)' }}>
                                                Rs {item.outstandingPayable?.toLocaleString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Section 6: Supplier Performance Report */}
                    <div className="rounded-xl border shadow-sm p-6 mb-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--ink)' }}>
                            Supplier Performance Report
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr style={{ background: 'var(--surface-muted)' }}>
                                        <th className="py-2 px-3 text-left font-semibold" style={{ color: 'var(--ink)' }}>Supplier Name</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>Total Orders</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>On Time</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>Late</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>Incomplete</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>Avg Lead Time</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>Rating</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr style={{ background: 'var(--surface)' }}>
                                        <td className="py-2 px-3" colSpan="7" style={{ color: 'var(--muted)', textAlign: 'center' }}>
                                            Supplier performance data requires delivery tracking implementation
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Section 7: Goods Received Note (GRN) Report */}
                    <div className="rounded-xl border shadow-sm p-6 mb-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--ink)' }}>
                            Goods Received Note (GRN) Report
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr style={{ background: 'var(--surface-muted)' }}>
                                        <th className="py-2 px-3 text-left font-semibold" style={{ color: 'var(--ink)' }}>GRN Number</th>
                                        <th className="py-2 px-3 text-left font-semibold" style={{ color: 'var(--ink)' }}>Date</th>
                                        <th className="py-2 px-3 text-left font-semibold" style={{ color: 'var(--ink)' }}>Supplier</th>
                                        <th className="py-2 px-3 text-left font-semibold" style={{ color: 'var(--ink)' }}>PO Number</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>Qty Ordered</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>Qty Received</th>
                                        <th className="py-2 px-3 text-left font-semibold" style={{ color: 'var(--ink)' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr style={{ background: 'var(--surface)' }}>
                                        <td className="py-2 px-3" colSpan="7" style={{ color: 'var(--muted)', textAlign: 'center' }}>
                                            GRN data requires GRN module implementation
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Section 8: Purchase by Product / Category */}
                    <div className="rounded-xl border shadow-sm p-6 mb-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--ink)' }}>
                            Purchase by Product / Category
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr style={{ background: 'var(--surface-muted)' }}>
                                        <th className="py-2 px-3 text-left font-semibold" style={{ color: 'var(--ink)' }}>Product Name</th>
                                        <th className="py-2 px-3 text-left font-semibold" style={{ color: 'var(--ink)' }}>Category</th>
                                        <th className="py-2 px-3 text-left font-semibold" style={{ color: 'var(--ink)' }}>Supplier</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>Units</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>Total Cost</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>Cost/Unit</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>% of Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr style={{ background: 'var(--surface)' }}>
                                        <td className="py-2 px-3" colSpan="7" style={{ color: 'var(--muted)', textAlign: 'center' }}>
                                            Product-level purchase data requires detailed item tracking
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Section 9: Cost of Goods (COGS) Analysis */}
                    <div className="rounded-xl border shadow-sm p-6 mb-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--ink)' }}>
                            Cost of Goods (COGS) Analysis
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr style={{ background: 'var(--surface-muted)' }}>
                                        <th className="py-2 px-3 text-left font-semibold" style={{ color: 'var(--ink)' }}>Product Name</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>Units Sold</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>Sale Price</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>Cost Price</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>Profit/Unit</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>Total Profit</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr style={{ background: 'var(--surface)' }}>
                                        <td className="py-2 px-3" colSpan="6" style={{ color: 'var(--muted)', textAlign: 'center' }}>
                                            COGS analysis requires sales and cost price integration
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Section 10: Supplier Payments Report */}
                    <div className="rounded-xl border shadow-sm p-6 mb-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--ink)' }}>
                            Supplier Payments Report
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="p-4 rounded-lg" style={{ background: 'var(--success-bg)', border: '1px solid var(--success-border)' }}>
                                <p className="text-sm font-medium" style={{ color: 'var(--success-text)' }}>Total Paid to Suppliers</p>
                                <p className="text-2xl font-bold mt-2" style={{ color: 'var(--success-text)' }}>
                                    Rs {summary.totalAmountPurchased?.toLocaleString() || 0}
                                </p>
                            </div>
                            <div className="p-4 rounded-lg" style={{ background: 'var(--error-bg)', border: '1px solid var(--error-border)' }}>
                                <p className="text-sm font-medium" style={{ color: 'var(--error-text)' }}>Total Still Owed</p>
                                <p className="text-2xl font-bold mt-2" style={{ color: 'var(--error-text)' }}>
                                    Rs {summary.totalUnpaid?.toLocaleString() || 0}
                                </p>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr style={{ background: 'var(--surface-muted)' }}>
                                        <th className="py-2 px-3 text-left font-semibold" style={{ color: 'var(--ink)' }}>Supplier</th>
                                        <th className="py-2 px-3 text-left font-semibold" style={{ color: 'var(--ink)' }}>Invoice #</th>
                                        <th className="py-2 px-3 text-left font-semibold" style={{ color: 'var(--ink)' }}>Due Date</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>Invoice Amount</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>Paid</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>Outstanding</th>
                                        <th className="py-2 px-3 text-left font-semibold" style={{ color: 'var(--ink)' }}>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr style={{ background: 'var(--surface)' }}>
                                        <td className="py-2 px-3" colSpan="7" style={{ color: 'var(--muted)', textAlign: 'center' }}>
                                            Payment tracking requires accounts payable module
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Section 11: Purchase Returns Report */}
                    <div className="rounded-xl border shadow-sm p-6 mb-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--ink)' }}>
                            Purchase Returns Report
                        </h3>
                        <div className="p-4 rounded-lg mb-4" style={{ background: 'var(--error-bg)', border: '1px solid var(--error-border)' }}>
                            <p className="text-sm font-medium" style={{ color: 'var(--error-text)' }}>Total Purchase Return Value</p>
                            <p className="text-2xl font-bold mt-2" style={{ color: 'var(--error-text)' }}>
                                Rs {summary.totalPurchaseReturns?.toLocaleString() || 0}
                            </p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr style={{ background: 'var(--surface-muted)' }}>
                                        <th className="py-2 px-3 text-left font-semibold" style={{ color: 'var(--ink)' }}>Return Date</th>
                                        <th className="py-2 px-3 text-left font-semibold" style={{ color: 'var(--ink)' }}>Supplier</th>
                                        <th className="py-2 px-3 text-left font-semibold" style={{ color: 'var(--ink)' }}>Product</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>Qty</th>
                                        <th className="py-2 px-3 text-left font-semibold" style={{ color: 'var(--ink)' }}>Reason</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>Amount</th>
                                        <th className="py-2 px-3 text-left font-semibold" style={{ color: 'var(--ink)' }}>Refund Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {breakdowns.purchaseReturnsBySupplier?.map((item, idx) => (
                                        <tr key={idx} style={{ background: idx % 2 === 0 ? 'var(--surface)' : 'var(--surface-muted)' }}>
                                            <td className="py-2 px-3">-</td>
                                            <td className="py-2 px-3 font-medium" style={{ color: 'var(--ink)' }}>{item.supplierName}</td>
                                            <td className="py-2 px-3">-</td>
                                            <td className="py-2 px-3 text-right">-</td>
                                            <td className="py-2 px-3">-</td>
                                            <td className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--error-text)' }}>Rs {item.total?.toLocaleString()}</td>
                                            <td className="py-2 px-3">-</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Section 12: Reorder Suggestions / Low Stock Alert */}
                    <div className="rounded-xl border shadow-sm p-6 mb-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--ink)' }}>
                            Reorder Suggestions / Low Stock Alert
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr style={{ background: 'var(--surface-muted)' }}>
                                        <th className="py-2 px-3 text-left font-semibold" style={{ color: 'var(--ink)' }}>Product Name</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>Current Stock</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>Min Stock</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>Suggested Qty</th>
                                        <th className="py-2 px-3 text-left font-semibold" style={{ color: 'var(--ink)' }}>Last Supplier</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>Last Price</th>
                                        <th className="py-2 px-3 text-left font-semibold" style={{ color: 'var(--ink)' }}>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr style={{ background: 'var(--surface)' }}>
                                        <td className="py-2 px-3" colSpan="7" style={{ color: 'var(--muted)', textAlign: 'center' }}>
                                            Low stock alerts require inventory threshold configuration
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Section 13: Export */}
                    <div className="rounded-xl border shadow-sm p-6 mb-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--ink)' }}>
                            Export Report
                        </h3>
                        <div className="flex flex-wrap gap-4">
                            <button
                                onClick={handleExport}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
                                style={{ background: 'var(--primary)', color: 'white' }}
                            >
                                <Download size={16} />
                                Export as PDF
                            </button>
                            <button
                                onClick={handleExport}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
                                style={{ background: 'var(--success)', color: 'white' }}
                            >
                                <Download size={16} />
                                Export as Excel
                            </button>
                            <button
                                onClick={handlePrint}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
                                style={{ background: 'var(--surface)', color: 'var(--ink)', border: '1px solid var(--border)' }}
                            >
                                <Printer size={16} />
                                Print Report
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
