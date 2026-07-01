import React, { useState } from "react";
import {
    Users,
    DollarSign,
    TrendingUp,
    AlertTriangle,
    CheckCircle,
    Clock,
    XCircle,
    Star,
    ArrowUp,
    ArrowDown,
    Filter,
    ToggleLeft,
    ToggleRight,
    RefreshCw,
    Printer,
    Download,
    ShoppingCart,
    CreditCard,
    BarChart3,
    Heart,
    Target
} from "lucide-react";
import { useGetCustomerKPIReportQuery } from "../services/reports.service.js";
import { showError } from "../../../shared/utilities/toastHelpers.js";
import PageHeading from "../../../shared/components/PageHeading.jsx";
import ScreenTabButton from "../../../shared/components/ScreenTabButton.jsx";

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

export default function CustomerKPIReport() {
    const [period, setPeriod] = useState("today");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [compareWithPrevious, setCompareWithPrevious] = useState(false);

    const filters = { period, compareWithPrevious };
    if (period === "custom" && fromDate && toDate) {
        filters.fromDate = fromDate;
        filters.toDate = toDate;
    }

    const { data, isLoading, error, refetch } = useGetCustomerKPIReportQuery(filters, {
        refetchOnMountOrArgChange: true,
    });

    if (error) {
        showError(error?.data?.message || "Failed to load customer report");
    }

    const handleRefresh = () => refetch();
    const handlePrint = () => window.print();
    const handleExport = () => console.log("Export functionality to be implemented");

    const summary = data?.data?.summary || {};
    const breakdowns = data?.data?.breakdowns || {};

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
                heading="Customer Report"
                subheading="Comprehensive customer analytics, behavior patterns, and profitability metrics"
                leftActions={
                    <div onClick={handleRefresh}>
                        <ScreenTabButton lucideIcon={RefreshCw} text="Refresh" />
                    </div>
                }
                rightActions={
                    <>
                        <button onClick={handlePrint} className="p-2 rounded-lg transition-all hover:bg-[var(--surface-muted)] no-print" style={{ color: "var(--muted)" }}>
                            <Printer size={18} />
                        </button>
                        <button onClick={handleExport} className="p-2 rounded-lg transition-all hover:bg-[var(--surface-muted)] no-print" style={{ color: "var(--muted)" }}>
                            <Download size={18} />
                        </button>
                    </>
                }
            />

            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--primary)' }} />
                </div>
            ) : (
                <>
                    {/* Section 1: Summary Cards (6 KPIs) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                        <KPICard
                            label="Total Customers"
                            value={summary.totalCustomers}
                            icon={Users}
                            color="#3b82f6"
                            description="Total registered customers"
                        />
                        <KPICard
                            label="Active Customers"
                            value={summary.activeCustomers}
                            icon={CheckCircle}
                            color="#10b981"
                            description="Customers with recent activity"
                        />
                        <KPICard
                            label="Total Orders"
                            value={summary.totalOrders}
                            icon={ShoppingCart}
                            color="#f59e0b"
                            description="Orders in selected period"
                        />
                        <KPICard
                            label="Total Sales"
                            value={summary.totalSales}
                            icon={DollarSign}
                            color="#8b5cf6"
                            description="Total revenue from customers"
                            suffix="Rs "
                            trend={summary.salesTrend}
                        />
                        <KPICard
                            label="Total Unpaid (Credit)"
                            value={summary.totalUnpaid}
                            icon={AlertTriangle}
                            color="#ef4444"
                            description="Outstanding credit from customers"
                            suffix="Rs "
                        />
                        <KPICard
                            label="Total Returns"
                            value={summary.totalReturns}
                            icon={XCircle}
                            color="#06b6d4"
                            description="Goods returned by customers"
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

                    {/* Section 3: Customer Sales Dashboard */}
                    <div className="rounded-xl border shadow-sm p-6 mb-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--ink)' }}>
                            Customer Sales Dashboard
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr style={{ background: 'var(--surface-muted)' }}>
                                        <th className="py-2 px-3 text-left font-semibold" style={{ color: 'var(--ink)' }}>Customer Name</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>Total Orders</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>Total Spent</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>Avg Order Value</th>
                                        <th className="py-2 px-3 text-left font-semibold" style={{ color: 'var(--ink)' }}>Last Purchase</th>
                                        <th className="py-2 px-3 text-left font-semibold" style={{ color: 'var(--ink)' }}>Segment</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {breakdowns.customerPerformance?.map((item, idx) => (
                                        <tr key={idx} style={{ background: idx % 2 === 0 ? 'var(--surface)' : 'var(--surface-muted)' }}>
                                            <td className="py-2 px-3 font-medium" style={{ color: 'var(--ink)' }}>{item.customerName}</td>
                                            <td className="py-2 px-3 text-right">{item.totalOrders}</td>
                                            <td className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--primary)' }}>Rs {item.totalSpent?.toLocaleString()}</td>
                                            <td className="py-2 px-3 text-right">Rs {item.averageOrderValue?.toFixed(0)?.toLocaleString()}</td>
                                            <td className="py-2 px-3" style={{ color: 'var(--muted)' }}>
                                                {item.lastPurchaseDate ? new Date(item.lastPurchaseDate).toLocaleDateString() : '-'}
                                            </td>
                                            <td className="py-2 px-3">
                                                <span className={`px-2 py-1 rounded text-xs ${
                                                    item.customerSegment === 'VIP' ? 'bg-purple-100 text-purple-800' : 
                                                    item.customerSegment === 'Premium' ? 'bg-blue-100 text-blue-800' : 
                                                    item.customerSegment === 'Regular' ? 'bg-green-100 text-green-800' : 
                                                    'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {item.customerSegment}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Section 4: Customer Purchase History */}
                    <div className="rounded-xl border shadow-sm p-6 mb-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--ink)' }}>
                            Customer Purchase History
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr style={{ background: 'var(--surface-muted)' }}>
                                        <th className="py-2 px-3 text-left font-semibold" style={{ color: 'var(--ink)' }}>Order #</th>
                                        <th className="py-2 px-3 text-left font-semibold" style={{ color: 'var(--ink)' }}>Date</th>
                                        <th className="py-2 px-3 text-left font-semibold" style={{ color: 'var(--ink)' }}>Customer</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>Items</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>Amount</th>
                                        <th className="py-2 px-3 text-left font-semibold" style={{ color: 'var(--ink)' }}>Payment Method</th>
                                        <th className="py-2 px-3 text-left font-semibold" style={{ color: 'var(--ink)' }}>Order Type</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {breakdowns.purchaseHistory?.map((item, idx) => (
                                        <tr key={idx} style={{ background: idx % 2 === 0 ? 'var(--surface)' : 'var(--surface-muted)' }}>
                                            <td className="py-2 px-3 font-medium" style={{ color: 'var(--ink)' }}>{item.orderNumber}</td>
                                            <td className="py-2 px-3" style={{ color: 'var(--muted)' }}>{new Date(item.createdAt).toLocaleDateString()}</td>
                                            <td className="py-2 px-3 font-medium" style={{ color: 'var(--ink)' }}>{item.customerName}</td>
                                            <td className="py-2 px-3 text-right">{item.itemCount}</td>
                                            <td className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--primary)' }}>Rs {item.totalAmount?.toLocaleString()}</td>
                                            <td className="py-2 px-3">
                                                <span className={`px-2 py-1 rounded text-xs ${
                                                    item.paymentMethod === 'cash' ? 'bg-green-100 text-green-800' : 
                                                    item.paymentMethod === 'credit' ? 'bg-blue-100 text-blue-800' : 
                                                    'bg-purple-100 text-purple-800'
                                                }`}>
                                                    {item.paymentMethod}
                                                </span>
                                            </td>
                                            <td className="py-2 px-3">
                                                <span className={`px-2 py-1 rounded text-xs ${
                                                    item.orderType === 'retail' ? 'bg-orange-100 text-orange-800' : 
                                                    'bg-indigo-100 text-indigo-800'
                                                }`}>
                                                    {item.orderType}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Section 5: Customer Payment Analysis */}
                    <div className="rounded-xl border shadow-sm p-6 mb-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--ink)' }}>
                            Customer Payment Analysis (Receivables)
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr style={{ background: 'var(--surface-muted)' }}>
                                        <th className="py-2 px-3 text-left font-semibold" style={{ color: 'var(--ink)' }}>Customer Name</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>Total Credit</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>Order Count</th>
                                        <th className="py-2 px-3 text-left font-semibold" style={{ color: 'var(--ink)' }}>Credit Status</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>Risk Level</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {breakdowns.paymentStatus?.map((item, idx) => (
                                        <tr key={idx} style={{ background: idx % 2 === 0 ? 'var(--surface)' : 'var(--surface-muted)' }}>
                                            <td className="py-2 px-3 font-medium" style={{ color: 'var(--ink)' }}>{item.customerName}</td>
                                            <td className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--error-text)' }}>Rs {item.totalCredit?.toLocaleString()}</td>
                                            <td className="py-2 px-3 text-right">{item.orderCount}</td>
                                            <td className="py-2 px-3">
                                                <span className="px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-800">Outstanding</span>
                                            </td>
                                            <td className="py-2 px-3">
                                                <span className={`px-2 py-1 rounded text-xs ${
                                                    item.creditStatus === 'High Risk' ? 'bg-red-100 text-red-800' : 
                                                    item.creditStatus === 'Medium Risk' ? 'bg-yellow-100 text-yellow-800' : 
                                                    'bg-green-100 text-green-800'
                                                }`}>
                                                    {item.creditStatus}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Section 6: Customer Behavior Analysis */}
                    <div className="rounded-xl border shadow-sm p-6 mb-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--ink)' }}>
                            Customer Behavior Analysis
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr style={{ background: 'var(--surface-muted)' }}>
                                        <th className="py-2 px-3 text-left font-semibold" style={{ color: 'var(--ink)' }}>Customer Name</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>Purchase Frequency</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>Avg Days Between Orders</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>Preferred Time</th>
                                        <th className="py-2 px-3 text-left font-semibold" style={{ color: 'var(--ink)' }}>Behavior Pattern</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr style={{ background: 'var(--surface)' }}>
                                        <td className="py-2 px-3" colSpan="5" style={{ color: 'var(--muted)', textAlign: 'center' }}>
                                            Behavior analysis requires historical purchase pattern tracking
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Section 7: Customer Segmentation */}
                    <div className="rounded-xl border shadow-sm p-6 mb-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--ink)' }}>
                            Customer Segmentation
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                            <div className="p-4 rounded-lg" style={{ background: 'var(--primary-bg)', border: '1px solid var(--primary-border)' }}>
                                <p className="text-sm font-medium" style={{ color: 'var(--primary-text)' }}>VIP Customers</p>
                                <p className="text-2xl font-bold mt-2" style={{ color: 'var(--primary)' }}>
                                    {breakdowns.customerPerformance?.filter(c => c.customerSegment === 'VIP').length || 0}
                                </p>
                            </div>
                            <div className="p-4 rounded-lg" style={{ background: 'var(--secondary-bg)', border: '1px solid var(--secondary-border)' }}>
                                <p className="text-sm font-medium" style={{ color: 'var(--secondary-text)' }}>Premium</p>
                                <p className="text-2xl font-bold mt-2" style={{ color: 'var(--secondary)' }}>
                                    {breakdowns.customerPerformance?.filter(c => c.customerSegment === 'Premium').length || 0}
                                </p>
                            </div>
                            <div className="p-4 rounded-lg" style={{ background: 'var(--success-bg)', border: '1px solid var(--success-border)' }}>
                                <p className="text-sm font-medium" style={{ color: 'var(--success-text)' }}>Regular</p>
                                <p className="text-2xl font-bold mt-2" style={{ color: 'var(--success)' }}>
                                    {breakdowns.customerPerformance?.filter(c => c.customerSegment === 'Regular').length || 0}
                                </p>
                            </div>
                            <div className="p-4 rounded-lg" style={{ background: 'var(--error-bg)', border: '1px solid var(--error-border)' }}>
                                <p className="text-sm font-medium" style={{ color: 'var(--error-text)' }}>One-time</p>
                                <p className="text-2xl font-bold mt-2" style={{ color: 'var(--error-text)' }}>
                                    {breakdowns.customerPerformance?.filter(c => c.customerSegment === 'One-time').length || 0}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Section 8: Customer Loyalty Metrics */}
                    <div className="rounded-xl border shadow-sm p-6 mb-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--ink)' }}>
                            Customer Loyalty Metrics
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr style={{ background: 'var(--surface-muted)' }}>
                                        <th className="py-2 px-3 text-left font-semibold" style={{ color: 'var(--ink)' }}>Customer Name</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>Repeat Rate</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>Retention Period</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>Churn Risk</th>
                                        <th className="py-2 px-3 text-left font-semibold" style={{ color: 'var(--ink)' }}>Loyalty Score</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr style={{ background: 'var(--surface)' }}>
                                        <td className="py-2 px-3" colSpan="5" style={{ color: 'var(--muted)', textAlign: 'center' }}>
                                            Loyalty metrics require historical retention tracking
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Section 9: Customer Profitability */}
                    <div className="rounded-xl border shadow-sm p-6 mb-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--ink)' }}>
                            Customer Profitability Analysis
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr style={{ background: 'var(--surface-muted)' }}>
                                        <th className="py-2 px-3 text-left font-semibold" style={{ color: 'var(--ink)' }}>Customer Name</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>Total Revenue</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>Cost to Serve</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>Net Profit</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>Profit Margin</th>
                                        <th className="py-2 px-3 text-left font-semibold" style={{ color: 'var(--ink)' }}>Profitability</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr style={{ background: 'var(--surface)' }}>
                                        <td className="py-2 px-3" colSpan="6" style={{ color: 'var(--muted)', textAlign: 'center' }}>
                                            Profitability analysis requires cost-to-serve tracking
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Section 10: Customer Returns & Refunds */}
                    <div className="rounded-xl border shadow-sm p-6 mb-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--ink)' }}>
                            Customer Returns & Refunds
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr style={{ background: 'var(--surface-muted)' }}>
                                        <th className="py-2 px-3 text-left font-semibold" style={{ color: 'var(--ink)' }}>Customer Name</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>Total Returns</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>Return Count</th>
                                        <th className="py-2 px-3 text-left font-semibold" style={{ color: 'var(--ink)' }}>Return Rate</th>
                                        <th className="py-2 px-3 text-left font-semibold" style={{ color: 'var(--ink)' }}>Refund Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {breakdowns.returnsByCustomer?.map((item, idx) => (
                                        <tr key={idx} style={{ background: idx % 2 === 0 ? 'var(--surface)' : 'var(--surface-muted)' }}>
                                            <td className="py-2 px-3 font-medium" style={{ color: 'var(--ink)' }}>{item.customerName}</td>
                                            <td className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--error-text)' }}>Rs {item.totalReturns?.toLocaleString()}</td>
                                            <td className="py-2 px-3 text-right">{item.returnCount}</td>
                                            <td className="py-2 px-3" style={{ color: 'var(--muted)' }}>-</td>
                                            <td className="py-2 px-3">
                                                <span className="px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-800">Pending</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Section 11: Customer Comparison */}
                    <div className="rounded-xl border shadow-sm p-6 mb-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--ink)' }}>
                            Customer Comparison
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr style={{ background: 'var(--surface-muted)' }}>
                                        <th className="py-2 px-3 text-left font-semibold" style={{ color: 'var(--ink)' }}>Metric</th>
                                        {breakdowns.customerPerformance?.slice(0, 3).map((c, i) => (
                                            <th key={i} className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>{c.customerName}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr style={{ background: 'var(--surface)' }}>
                                        <td className="py-2 px-3 font-medium" style={{ color: 'var(--ink)' }}>Total Orders</td>
                                        {breakdowns.customerPerformance?.slice(0, 3).map((c, i) => (
                                            <td key={i} className="py-2 px-3 text-right">{c.totalOrders}</td>
                                        ))}
                                    </tr>
                                    <tr style={{ background: 'var(--surface-muted)' }}>
                                        <td className="py-2 px-3 font-medium" style={{ color: 'var(--ink)' }}>Total Spent</td>
                                        {breakdowns.customerPerformance?.slice(0, 3).map((c, i) => (
                                            <td key={i} className="py-2 px-3 text-right">Rs {c.totalSpent?.toLocaleString()}</td>
                                        ))}
                                    </tr>
                                    <tr style={{ background: 'var(--surface)' }}>
                                        <td className="py-2 px-3 font-medium" style={{ color: 'var(--ink)' }}>Avg Order Value</td>
                                        {breakdowns.customerPerformance?.slice(0, 3).map((c, i) => (
                                            <td key={i} className="py-2 px-3 text-right">Rs {c.averageOrderValue?.toFixed(0)?.toLocaleString()}</td>
                                        ))}
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Section 12: Export */}
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
                </>
            )}
        </div>
    );
}
