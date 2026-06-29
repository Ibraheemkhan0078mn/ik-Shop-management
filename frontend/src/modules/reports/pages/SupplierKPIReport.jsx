import React, { useState } from "react";
import {
    Truck,
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
    Package,
    CreditCard,
    BarChart3
} from "lucide-react";
import { useGetSupplierKPIReportQuery } from "../services/reports.service.js";
import { showError } from "../../../shared/utilities/toastHelpers.js";

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

export default function SupplierKPIReport() {
    const [period, setPeriod] = useState("today");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [compareWithPrevious, setCompareWithPrevious] = useState(false);

    const filters = { period, compareWithPrevious };
    if (period === "custom" && fromDate && toDate) {
        filters.fromDate = fromDate;
        filters.toDate = toDate;
    }

    const { data, isLoading, error, refetch } = useGetSupplierKPIReportQuery(filters, {
        refetchOnMountOrArgChange: true,
    });

    if (error) {
        showError(error?.data?.message || "Failed to load supplier report");
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

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-3xl font-bold" style={{ color: 'var(--ink)' }}>Supplier Report</h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
                        Comprehensive supplier analytics, performance metrics, and payment tracking
                    </p>
                </div>
                <div className="flex items-center gap-2 no-print">
                    <button
                        onClick={handleRefresh}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        style={{ background: 'var(--surface)', color: 'var(--ink)', border: '1px solid var(--border)' }}
                    >
                        <RefreshCw size={16} />
                        Refresh
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        style={{ background: 'var(--surface)', color: 'var(--ink)', border: '1px solid var(--border)' }}
                    >
                        <Printer size={16} />
                        Print
                    </button>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        style={{ background: 'var(--primary)', color: 'white' }}
                    >
                        <Download size={16} />
                        Export
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--primary)' }} />
                </div>
            ) : (
                <>
                    {/* Section 1: Summary Cards (6 KPIs) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                        <KPICard
                            label="Total Suppliers"
                            value={summary.totalSuppliers}
                            icon={Truck}
                            color="#3b82f6"
                            description="Total registered suppliers"
                        />
                        <KPICard
                            label="Active Suppliers"
                            value={summary.activeSuppliers}
                            icon={CheckCircle}
                            color="#10b981"
                            description="Currently active suppliers"
                        />
                        <KPICard
                            label="Total Purchase Orders"
                            value={summary.totalPurchaseOrders}
                            icon={Package}
                            color="#f59e0b"
                            description="Orders in selected period"
                        />
                        <KPICard
                            label="Total Purchase Amount"
                            value={summary.totalPurchaseAmount}
                            icon={DollarSign}
                            color="#8b5cf6"
                            description="Total spending on purchases"
                            suffix="Rs "
                            trend={summary.purchaseTrend}
                        />
                        <KPICard
                            label="Total Unpaid"
                            value={summary.totalUnpaid}
                            icon={AlertTriangle}
                            color="#ef4444"
                            description="Outstanding payments to suppliers"
                            suffix="Rs "
                        />
                        <KPICard
                            label="Total Returns"
                            value={summary.totalReturns}
                            icon={XCircle}
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

                    {/* Section 3: Supplier Performance Dashboard */}
                    <div className="rounded-xl border shadow-sm p-6 mb-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--ink)' }}>
                            Supplier Performance Dashboard
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr style={{ background: 'var(--surface-muted)' }}>
                                        <th className="py-2 px-3 text-left font-semibold" style={{ color: 'var(--ink)' }}>Supplier Name</th>
                                        <th className="py-2 px-3 text-left font-semibold" style={{ color: 'var(--ink)' }}>Type</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>Total Orders</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>Total Spent</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>Avg Order Value</th>
                                        <th className="py-2 px-3 text-left font-semibold" style={{ color: 'var(--ink)' }}>Performance Rating</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {breakdowns.supplierPerformance?.map((item, idx) => (
                                        <tr key={idx} style={{ background: idx % 2 === 0 ? 'var(--surface)' : 'var(--surface-muted)' }}>
                                            <td className="py-2 px-3 font-medium" style={{ color: 'var(--ink)' }}>{item.supplierName}</td>
                                            <td className="py-2 px-3" style={{ color: 'var(--muted)' }}>{item.supplierType}</td>
                                            <td className="py-2 px-3 text-right">{item.totalOrders}</td>
                                            <td className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--primary)' }}>Rs {item.totalSpent?.toLocaleString()}</td>
                                            <td className="py-2 px-3 text-right">Rs {item.averageOrderValue?.toFixed(0)?.toLocaleString()}</td>
                                            <td className="py-2 px-3">
                                                <span className={`px-2 py-1 rounded text-xs ${
                                                    item.performanceRating === 'High' ? 'bg-green-100 text-green-800' : 
                                                    item.performanceRating === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                    {item.performanceRating}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Section 4: Supplier Purchase History */}
                    <div className="rounded-xl border shadow-sm p-6 mb-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--ink)' }}>
                            Supplier Purchase History
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr style={{ background: 'var(--surface-muted)' }}>
                                        <th className="py-2 px-3 text-left font-semibold" style={{ color: 'var(--ink)' }}>Invoice #</th>
                                        <th className="py-2 px-3 text-left font-semibold" style={{ color: 'var(--ink)' }}>Date</th>
                                        <th className="py-2 px-3 text-left font-semibold" style={{ color: 'var(--ink)' }}>Supplier</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>Items</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>Amount</th>
                                        <th className="py-2 px-3 text-left font-semibold" style={{ color: 'var(--ink)' }}>Status</th>
                                        <th className="py-2 px-3 text-left font-semibold" style={{ color: 'var(--ink)' }}>Payment Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {breakdowns.purchaseHistory?.map((item, idx) => (
                                        <tr key={idx} style={{ background: idx % 2 === 0 ? 'var(--surface)' : 'var(--surface-muted)' }}>
                                            <td className="py-2 px-3 font-medium" style={{ color: 'var(--ink)' }}>{item.invoiceNumber}</td>
                                            <td className="py-2 px-3" style={{ color: 'var(--muted)' }}>{new Date(item.date).toLocaleDateString()}</td>
                                            <td className="py-2 px-3 font-medium" style={{ color: 'var(--ink)' }}>{item.supplierName}</td>
                                            <td className="py-2 px-3 text-right">{item.itemCount}</td>
                                            <td className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--primary)' }}>Rs {item.totalAmount?.toLocaleString()}</td>
                                            <td className="py-2 px-3">
                                                <span className={`px-2 py-1 rounded text-xs ${
                                                    item.status === 'delivered' ? 'bg-green-100 text-green-800' : 
                                                    item.status === 'ordered' ? 'bg-blue-100 text-blue-800' : 
                                                    'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="py-2 px-3">
                                                <span className={`px-2 py-1 rounded text-xs ${
                                                    item.paymentStatus === 'full' ? 'bg-green-100 text-green-800' : 
                                                    item.paymentStatus === 'partial' ? 'bg-yellow-100 text-yellow-800' : 
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                    {item.paymentStatus}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Section 5: Supplier Payment Analysis */}
                    <div className="rounded-xl border shadow-sm p-6 mb-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--ink)' }}>
                            Supplier Payment Analysis (Aging Report)
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr style={{ background: 'var(--surface-muted)' }}>
                                        <th className="py-2 px-3 text-left font-semibold" style={{ color: 'var(--ink)' }}>Supplier Name</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>Total Invoiced</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>Total Paid</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>Outstanding Balance</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>Order Count</th>
                                        <th className="py-2 px-3 text-left font-semibold" style={{ color: 'var(--ink)' }}>Payment Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {breakdowns.paymentStatus?.map((item, idx) => (
                                        <tr key={idx} style={{ background: idx % 2 === 0 ? 'var(--surface)' : 'var(--surface-muted)' }}>
                                            <td className="py-2 px-3 font-medium" style={{ color: 'var(--ink)' }}>{item.supplierName}</td>
                                            <td className="py-2 px-3 text-right">Rs {item.totalInvoiced?.toLocaleString()}</td>
                                            <td className="py-2 px-3 text-right">Rs {item.totalPaid?.toLocaleString()}</td>
                                            <td className="py-2 px-3 text-right font-semibold" style={{ color: item.outstandingBalance > 0 ? 'var(--error-text)' : 'var(--success-text)' }}>
                                                Rs {item.outstandingBalance?.toLocaleString()}
                                            </td>
                                            <td className="py-2 px-3 text-right">{item.orderCount}</td>
                                            <td className="py-2 px-3">
                                                <span className={`px-2 py-1 rounded text-xs ${
                                                    item.paymentStatus === 'Paid' ? 'bg-green-100 text-green-800' : 
                                                    item.paymentStatus === 'Partial' ? 'bg-yellow-100 text-yellow-800' : 
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                    {item.paymentStatus}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Section 6: Supplier Quality Report */}
                    <div className="rounded-xl border shadow-sm p-6 mb-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--ink)' }}>
                            Supplier Quality Report
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr style={{ background: 'var(--surface-muted)' }}>
                                        <th className="py-2 px-3 text-left font-semibold" style={{ color: 'var(--ink)' }}>Supplier Name</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>Defect Rate</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>On-Time Delivery</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>Quality Score</th>
                                        <th className="py-2 px-3 text-left font-semibold" style={{ color: 'var(--ink)' }}>Rating</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr style={{ background: 'var(--surface)' }}>
                                        <td className="py-2 px-3" colSpan="5" style={{ color: 'var(--muted)', textAlign: 'center' }}>
                                            Quality tracking requires delivery and defect data implementation
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Section 7: Supplier Lead Time Analysis */}
                    <div className="rounded-xl border shadow-sm p-6 mb-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--ink)' }}>
                            Supplier Lead Time Analysis
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr style={{ background: 'var(--surface-muted)' }}>
                                        <th className="py-2 px-3 text-left font-semibold" style={{ color: 'var(--ink)' }}>Supplier Name</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>Avg Lead Time (Days)</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>Min Lead Time</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>Max Lead Time</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>Variance</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr style={{ background: 'var(--surface)' }}>
                                        <td className="py-2 px-3" colSpan="5" style={{ color: 'var(--muted)', textAlign: 'center' }}>
                                            Lead time tracking requires delivery date implementation
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Section 8: Supplier Comparison */}
                    <div className="rounded-xl border shadow-sm p-6 mb-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--ink)' }}>
                            Supplier Comparison
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr style={{ background: 'var(--surface-muted)' }}>
                                        <th className="py-2 px-3 text-left font-semibold" style={{ color: 'var(--ink)' }}>Metric</th>
                                        {breakdowns.supplierPerformance?.slice(0, 3).map((s, i) => (
                                            <th key={i} className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>{s.supplierName}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr style={{ background: 'var(--surface)' }}>
                                        <td className="py-2 px-3 font-medium" style={{ color: 'var(--ink)' }}>Total Orders</td>
                                        {breakdowns.supplierPerformance?.slice(0, 3).map((s, i) => (
                                            <td key={i} className="py-2 px-3 text-right">{s.totalOrders}</td>
                                        ))}
                                    </tr>
                                    <tr style={{ background: 'var(--surface-muted)' }}>
                                        <td className="py-2 px-3 font-medium" style={{ color: 'var(--ink)' }}>Total Spent</td>
                                        {breakdowns.supplierPerformance?.slice(0, 3).map((s, i) => (
                                            <td key={i} className="py-2 px-3 text-right">Rs {s.totalSpent?.toLocaleString()}</td>
                                        ))}
                                    </tr>
                                    <tr style={{ background: 'var(--surface)' }}>
                                        <td className="py-2 px-3 font-medium" style={{ color: 'var(--ink)' }}>Avg Order Value</td>
                                        {breakdowns.supplierPerformance?.slice(0, 3).map((s, i) => (
                                            <td key={i} className="py-2 px-3 text-right">Rs {s.averageOrderValue?.toFixed(0)?.toLocaleString()}</td>
                                        ))}
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Section 9: Supplier Risk Assessment */}
                    <div className="rounded-xl border shadow-sm p-6 mb-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--ink)' }}>
                            Supplier Risk Assessment
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr style={{ background: 'var(--surface-muted)' }}>
                                        <th className="py-2 px-3 text-left font-semibold" style={{ color: 'var(--ink)' }}>Supplier Name</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>Dependency Score</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>Payment Risk</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>Quality Risk</th>
                                        <th className="py-2 px-3 text-left font-semibold" style={{ color: 'var(--ink)' }}>Overall Risk</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr style={{ background: 'var(--surface)' }}>
                                        <td className="py-2 px-3" colSpan="5" style={{ color: 'var(--muted)', textAlign: 'center' }}>
                                            Risk assessment requires historical data analysis
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Section 10: Supplier Returns & Claims */}
                    <div className="rounded-xl border shadow-sm p-6 mb-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--ink)' }}>
                            Supplier Returns & Claims
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr style={{ background: 'var(--surface-muted)' }}>
                                        <th className="py-2 px-3 text-left font-semibold" style={{ color: 'var(--ink)' }}>Supplier Name</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>Total Returns</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>Return Count</th>
                                        <th className="py-2 px-3 text-left font-semibold" style={{ color: 'var(--ink)' }}>Main Reason</th>
                                        <th className="py-2 px-3 text-left font-semibold" style={{ color: 'var(--ink)' }}>Claim Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {breakdowns.returnsBySupplier?.map((item, idx) => (
                                        <tr key={idx} style={{ background: idx % 2 === 0 ? 'var(--surface)' : 'var(--surface-muted)' }}>
                                            <td className="py-2 px-3 font-medium" style={{ color: 'var(--ink)' }}>{item.supplierName}</td>
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

                    {/* Section 11: Supplier Product Catalog */}
                    <div className="rounded-xl border shadow-sm p-6 mb-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--ink)' }}>
                            Supplier Product Catalog
                        </h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr style={{ background: 'var(--surface-muted)' }}>
                                        <th className="py-2 px-3 text-left font-semibold" style={{ color: 'var(--ink)' }}>Supplier Name</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>Products Supplied</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>Categories</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>Avg Price</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>Price Trend</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr style={{ background: 'var(--surface)' }}>
                                        <td className="py-2 px-3" colSpan="5" style={{ color: 'var(--muted)', textAlign: 'center' }}>
                                            Product catalog requires product-supplier relationship mapping
                                        </td>
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
