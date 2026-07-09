import React, { useState, useRef } from "react";
import { useGetSalesKPIReportQuery } from "../services/reports.service";
import { showError } from "../../../shared/utilities/toastHelpers.js";
import PageHeading from "../../../shared/components/PageHeading.jsx";
import ScreenTabButton from "../../../shared/components/ScreenTabButton.jsx";
import PdfExportButton from "../../../shared/components/PdfExportButton.jsx";
import { useSettings } from "../../settings/hooks/useSettings.js";
import { getReportLabels } from "../labels/reportLabels.js";
import { 
    Calendar, TrendingUp, TrendingDown, DollarSign, PieChart, BarChart3, 
    RefreshCw, Printer, Download, ChevronDown, ChevronUp, Users, Package,
    CreditCard, User, ShoppingCart, Percent, ArrowUpRight, ArrowDownRight,
    ArrowUp, ArrowDown, Filter, ToggleLeft, ToggleRight
} from "lucide-react";
import {
    LineChart, Line, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

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

const BreakdownItem = ({ label, value, count, percentage, color, subLabel }) => (
    <div className="flex items-center justify-between py-2 border-b last:border-b-0" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full" style={{ background: color }} />
            <div>
                <p className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{label}</p>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>
                    {count} transactions{subLabel ? ` • ${subLabel}` : ''}
                </p>
            </div>
        </div>
        <div className="text-right">
            <p className="text-sm font-bold" style={{ color }}>Rs {value?.toLocaleString() || 0}</p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>{percentage}%</p>
        </div>
    </div>
);

export default function SalesKPIReport() {
    const { settings } = useSettings();
    const language = settings?.language || "en";
    const labels = getReportLabels(language);
    
    const contentRef = useRef(null);
    const [period, setPeriod] = useState("today");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [compareWithPrevious, setCompareWithPrevious] = useState(false);
    const [customerTab, setCustomerTab] = useState("all");

    const filters = { period, compareWithPrevious };
    if (period === "custom" && fromDate && toDate) {
        filters.fromDate = fromDate;
        filters.toDate = toDate;
    }

    const { data, isLoading, error, refetch } = useGetSalesKPIReportQuery(filters, {
        refetchOnMountOrArgChange: true,
    });

    if (error) {
        showError(error?.data?.message || labels.failedToLoadReport.replace("{report}", labels.salesReport));
    }

    const handleRefresh = () => refetch();
    const handlePrint = () => window.print();
    const handleExport = () => console.log("Export functionality to be implemented");

    const summary = data?.data?.summary || {};
    const breakdowns = data?.data?.breakdowns || {};

    // Prepare chart data
    const trendData = breakdowns.salesByDate?.map(d => ({
        date: d.date,
        current: d.total,
        previous: breakdowns.previousSalesByDate?.find(p => p.date === d.date)?.total || 0
    })) || [];

    const categoryPieData = breakdowns.byCategory?.map((item, idx) => ({
        name: item.category,
        value: item.total,
        color: COLORS[idx % COLORS.length]
    })) || [];

    const paymentPieData = breakdowns.byPaymentMethod?.map((item, idx) => ({
        name: item.method,
        value: item.total,
        color: COLORS[idx % COLORS.length]
    })) || [];

    const staffBarData = breakdowns.byStaff?.map((item, idx) => ({
        name: item.staffName,
        sales: item.total,
        color: idx === 0 ? '#10b981' : COLORS[idx % COLORS.length]
    })) || [];

    const productBarData = breakdowns.topProducts?.map(item => ({
        name: item.productName,
        revenue: item.totalRevenue
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
                heading={labels.salesKPI}
                subheading={labels.generateViewReports}
                leftActions={
                    <div onClick={handleRefresh}>
                        <ScreenTabButton lucideIcon={RefreshCw} text={labels.refresh} />
                    </div>
                }
                rightActions={
                    <PdfExportButton 
                        contentRef={contentRef} 
                        fileName="sales-kpi-report.pdf" 
                    />
                }
            />

            {isLoading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--primary)' }} />
                </div>
            ) : (
                <div ref={contentRef}>
                    {/* Section 1: Summary Cards (6 cards in 2 rows of 3) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                        <KPICard
                            label={labels.totalRevenue}
                            value={summary.totalRevenue}
                            icon={DollarSign}
                            color="#3b82f6"
                            description={labels.grossSales}
                            trend={summary.revenueTrend}
                            suffix="Rs "
                        />
                        <KPICard
                            label={labels.totalOrders}
                            value={summary.totalOrders}
                            icon={ShoppingCart}
                            color="#10b981"
                            description={labels.numberOfTransactions}
                        />
                        <KPICard
                            label={labels.unitsSold}
                            value={summary.totalUnitsSold}
                            icon={Package}
                            color="#f59e0b"
                            description={labels.totalItemsSold}
                        />
                        <KPICard
                            label={labels.netSales}
                            value={summary.netSales}
                            icon={TrendingUp}
                            color="#8b5cf6"
                            description={labels.revenueAfterDiscounts}
                            suffix="Rs "
                        />
                        <KPICard
                            label={labels.grossProfit}
                            value={summary.grossProfit}
                            icon={PieChart}
                            color="#06b6d4"
                            description={labels.revenueMinusCost}
                            suffix="Rs "
                        />
                        <KPICard
                            label={labels.profitMargin}
                            value={summary.grossProfitMargin}
                            icon={Percent}
                            color="#ec4899"
                            description={labels.grossProfitPercentage}
                            suffix="%"
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
                                        {labels[p] || p.charAt(0).toUpperCase() + p.slice(1)}
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
                                        <span style={{ color: 'var(--muted)' }}>{labels.to || "to"}</span>
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
                                    {labels.custom}
                                </button>
                                <div className="flex items-center gap-2">
                                    {compareWithPrevious ? <ToggleRight size={20} color="var(--success)" /> : <ToggleLeft size={20} color="var(--muted)" />}
                                    <label className="text-sm cursor-pointer" style={{ color: 'var(--muted)' }}>
                                        {labels.compareWithPrevious}
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

                    {/* Section 3: Revenue Trend Chart */}
                    <div className="rounded-xl border shadow-sm p-6 mb-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--ink)' }}>
                            {labels.salesTrend} — {labels[period] || period.charAt(0).toUpperCase() + period.slice(1)}
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
                                            name={labels.lastPeriod || "Last Period"}
                                        />
                                    )}
                                    <Line 
                                        type="monotone" 
                                        dataKey="current" 
                                        stroke="var(--primary)" 
                                        strokeWidth={2}
                                        name={labels.thisPeriod || "This Period"}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Section 4: Top-Selling Products */}
                    <div className="rounded-xl border shadow-sm p-6 mb-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--ink)' }}>
                            {labels.topSellingProducts}
                        </h3>
                        <div style={{ height: '250px', marginBottom: '20px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={productBarData} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                    <XAxis type="number" stroke="var(--muted)" />
                                    <YAxis dataKey="name" type="category" width={150} stroke="var(--muted)" />
                                    <Tooltip 
                                        contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                                        itemStyle={{ color: 'var(--ink)' }}
                                    />
                                    <Bar dataKey="revenue" fill="var(--primary)" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr style={{ background: 'var(--surface-muted)' }}>
                                        <th className="py-2 px-3 text-left font-semibold" style={{ color: 'var(--ink)' }}>#</th>
                                        <th className="py-2 px-3 text-left font-semibold" style={{ color: 'var(--ink)' }}>{labels.productName}</th>
                                        <th className="py-2 px-3 text-left font-semibold" style={{ color: 'var(--ink)' }}>{labels.category}</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>{labels.unitsSold}</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>{labels.revenue}</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>{labels.percentageOfTotal}</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>{labels.profitMargin}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {breakdowns.topProducts?.map((item, idx) => (
                                        <tr key={idx} style={{ background: idx % 2 === 0 ? 'var(--surface)' : 'var(--surface-muted)' }}>
                                            <td className="py-2 px-3">{idx + 1}</td>
                                            <td className="py-2 px-3 font-medium" style={{ color: 'var(--ink)' }}>{item.productName}</td>
                                            <td className="py-2 px-3" style={{ color: 'var(--muted)' }}>{item.category}</td>
                                            <td className="py-2 px-3 text-right">{item.totalUnits}</td>
                                            <td className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--primary)' }}>Rs {item.totalRevenue?.toLocaleString()}</td>
                                            <td className="py-2 px-3 text-right">{item.percentage}%</td>
                                            <td className="py-2 px-3 text-right" style={{ color: item.profitMargin >= 20 ? 'var(--success)' : 'var(--warning)' }}>{item.profitMargin}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Section 5: Sales by Category */}
                    <div className="rounded-xl border shadow-sm p-6 mb-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--ink)' }}>
                            {labels.salesByCategory}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div style={{ height: '300px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <RechartsPieChart>
                                        <Pie
                                            data={categoryPieData}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={2}
                                            dataKey="value"
                                        >
                                            {categoryPieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </RechartsPieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr style={{ background: 'var(--surface-muted)' }}>
                                            <th className="py-2 px-3 text-left font-semibold" style={{ color: 'var(--ink)' }}>{labels.category}</th>
                                            <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>{labels.revenue}</th>
                                            <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>{labels.units}</th>
                                            <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>{labels.share}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {breakdowns.byCategory?.map((item, idx) => (
                                            <tr key={idx} style={{ background: idx % 2 === 0 ? 'var(--surface)' : 'var(--surface-muted)' }}>
                                                <td className="py-2 px-3 font-medium" style={{ color: 'var(--ink)' }}>{item.category}</td>
                                                <td className="py-2 px-3 text-right">Rs {item.total?.toLocaleString()}</td>
                                                <td className="py-2 px-3 text-right">{item.units}</td>
                                                <td className="py-2 px-3 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <div 
                                                            className="h-2 rounded" 
                                                            style={{ 
                                                                width: `${item.percentage}%`, 
                                                                background: COLORS[idx % COLORS.length] 
                                                            }}
                                                        />
                                                        <span>{item.percentage}%</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Section 6: Sales by Customer */}
                    <div className="rounded-xl border shadow-sm p-6 mb-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <div className="flex items-center gap-4 mb-4">
                            <h3 className="text-lg font-semibold" style={{ color: 'var(--ink)' }}>
                                {labels.salesByCustomer}
                            </h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCustomerTab("all")}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                                        customerTab === "all" ? 'text-white' : ''
                                    }`}
                                    style={{ 
                                        background: customerTab === "all" ? 'var(--primary)' : 'var(--surface-muted)',
                                        color: customerTab === "all" ? 'white' : 'var(--ink)'
                                    }}
                                >
                                    {labels.allCustomers}
                                </button>
                                <button
                                    onClick={() => setCustomerTab("retail")}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                                        customerTab === "retail" ? 'text-white' : ''
                                    }`}
                                    style={{ 
                                        background: customerTab === "retail" ? 'var(--primary)' : 'var(--surface-muted)',
                                        color: customerTab === "retail" ? 'white' : 'var(--ink)'
                                    }}
                                >
                                    {labels.retail}
                                </button>
                                <button
                                    onClick={() => setCustomerTab("wholesale")}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium ${
                                        customerTab === "wholesale" ? 'text-white' : ''
                                    }`}
                                    style={{ 
                                        background: customerTab === "wholesale" ? 'var(--primary)' : 'var(--surface-muted)',
                                        color: customerTab === "wholesale" ? 'white' : 'var(--ink)'
                                    }}
                                >
                                    {labels.wholesale}
                                </button>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr style={{ background: 'var(--surface-muted)' }}>
                                        <th className="py-2 px-3 text-left font-semibold" style={{ color: 'var(--ink)' }}>{labels.rank}</th>
                                        <th className="py-2 px-3 text-left font-semibold" style={{ color: 'var(--ink)' }}>{labels.customerName}</th>
                                        <th className="py-2 px-3 text-left font-semibold" style={{ color: 'var(--ink)' }}>{labels.type}</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>{labels.totalPurchased}</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>{labels.orders}</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>{labels.avgOrderValue}</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>{labels.lastPurchase}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {breakdowns.topCustomers
                                        ?.filter(c => customerTab === "all" || c.orderType === customerTab)
                                        .map((item, idx) => (
                                        <tr key={idx} style={{ background: idx % 2 === 0 ? 'var(--surface)' : 'var(--surface-muted)' }}>
                                            <td className="py-2 px-3 font-semibold">{idx + 1}</td>
                                            <td className="py-2 px-3 font-medium" style={{ color: 'var(--ink)' }}>{item.customerName}</td>
                                            <td className="py-2 px-3">
                                                <span className={`px-2 py-1 rounded text-xs ${
                                                    item.orderType === 'retail' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                                                }`}>
                                                    {item.orderType}
                                                </span>
                                            </td>
                                            <td className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--success)' }}>Rs {item.total?.toLocaleString()}</td>
                                            <td className="py-2 px-3 text-right">{item.count}</td>
                                            <td className="py-2 px-3 text-right">Rs {item.averageOrderValue?.toFixed(0)?.toLocaleString()}</td>
                                            <td className="py-2 px-3 text-right" style={{ color: 'var(--muted)' }}>
                                                {item.lastPurchase ? new Date(item.lastPurchase).toLocaleDateString() : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Section 7: Sales by Payment Method */}
                    <div className="rounded-xl border shadow-sm p-6 mb-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--ink)' }}>
                            {labels.salesByPayment}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div style={{ height: '300px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <RechartsPieChart>
                                        <Pie
                                            data={paymentPieData}
                                            cx="50%"
                                            cy="50%"
                                            outerRadius={100}
                                            dataKey="value"
                                        >
                                            {paymentPieData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </RechartsPieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr style={{ background: 'var(--surface-muted)' }}>
                                            <th className="py-2 px-3 text-left font-semibold" style={{ color: 'var(--ink)' }}>{labels.paymentMethod}</th>
                                            <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>{labels.transactions}</th>
                                            <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>{labels.totalAmount}</th>
                                            <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>{labels.percentageOfTotal}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {breakdowns.byPaymentMethod?.map((item, idx) => (
                                            <tr key={idx} style={{ background: idx % 2 === 0 ? 'var(--surface)' : 'var(--surface-muted)' }}>
                                                <td className="py-2 px-3 font-medium" style={{ color: 'var(--ink)' }}>
                                                    {item.method.charAt(0).toUpperCase() + item.method.slice(1)}
                                                </td>
                                                <td className="py-2 px-3 text-right">{item.count}</td>
                                                <td className="py-2 px-3 text-right font-semibold">Rs {item.total?.toLocaleString()}</td>
                                                <td className="py-2 px-3 text-right">{item.percentage}%</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="mt-4 p-3 rounded-lg" style={{ background: 'var(--warning-bg)', border: '1px solid var(--warning-border)' }}>
                            <p className="text-sm font-semibold" style={{ color: 'var(--warning-text)' }}>
                                💰 {labels.cashReconciliation}: {labels.cashCollected}: Rs {summary.cashCollected?.toLocaleString() || 0}
                            </p>
                        </div>
                    </div>

                    {/* Section 8: Sales by Staff */}
                    <div className="rounded-xl border shadow-sm p-6 mb-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--ink)' }}>
                            {labels.salesByStaff} / {labels.salesperson}
                        </h3>
                        <div style={{ height: '250px', marginBottom: '20px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={staffBarData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                    <XAxis dataKey="name" stroke="var(--muted)" />
                                    <YAxis stroke="var(--muted)" />
                                    <Tooltip 
                                        contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                                        itemStyle={{ color: 'var(--ink)' }}
                                    />
                                    <Bar dataKey="sales" fill="var(--primary)" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr style={{ background: 'var(--surface-muted)' }}>
                                        <th className="py-2 px-3 text-left font-semibold" style={{ color: 'var(--ink)' }}>{labels.staffName}</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>{labels.transactions}</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>{labels.totalRevenue}</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>{labels.avgOrderValue}</th>
                                        <th className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--ink)' }}>{labels.percentageOfTotal}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {breakdowns.byStaff?.map((item, idx) => (
                                        <tr key={idx} style={{ background: idx % 2 === 0 ? 'var(--surface)' : 'var(--surface-muted)' }}>
                                            <td className="py-2 px-3 font-medium" style={{ color: 'var(--ink)' }}>{item.staffName}</td>
                                            <td className="py-2 px-3 text-right">{item.count}</td>
                                            <td className="py-2 px-3 text-right font-semibold" style={{ color: 'var(--primary)' }}>Rs {item.total?.toLocaleString()}</td>
                                            <td className="py-2 px-3 text-right">Rs {item.averageOrderValue?.toFixed(0)?.toLocaleString()}</td>
                                            <td className="py-2 px-3 text-right">{item.percentage}%</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Section 9: Discount & Returns */}
                    <div className="rounded-xl border shadow-sm p-6 mb-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--ink)' }}>
                            {labels.discountAndReturns}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="p-4 rounded-lg" style={{ background: 'var(--error-bg)', border: '1px solid var(--error-border)' }}>
                                <p className="text-sm font-medium" style={{ color: 'var(--error-text)' }}>{labels.totalDiscountGiven}</p>
                                <p className="text-2xl font-bold mt-2" style={{ color: 'var(--error-text)' }}>Rs {summary.totalDiscount?.toLocaleString() || 0}</p>
                            </div>
                            <div className="p-4 rounded-lg" style={{ background: 'var(--error-bg)', border: '1px solid var(--error-border)' }}>
                                <p className="text-sm font-medium" style={{ color: 'var(--error-text)' }}>{labels.totalReturns}</p>
                                <p className="text-2xl font-bold mt-2" style={{ color: 'var(--error-text)' }}>Rs {summary.totalReturns?.toLocaleString() || 0}</p>
                                <p className="text-xs mt-1" style={{ color: 'var(--error-text)' }}>Return Rate: {summary.returnRate}%</p>
                            </div>
                        </div>
                    </div>

                    {/* Section 10: Tax Report */}
                    <div className="rounded-xl border shadow-sm p-6 mb-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold" style={{ color: 'var(--ink)' }}>
                                Tax Report
                            </h3>
                            <button
                                onClick={handleExport}
                                className="flex items-center gap-2 px-3 py-1 rounded text-sm"
                                style={{ background: 'var(--surface-muted)', color: 'var(--muted)' }}
                            >
                                <Download size={14} />
                                Export Tax Report
                            </button>
                        </div>
                        <div className="p-4 rounded-lg mb-4" style={{ background: 'var(--success-bg)', border: '1px solid var(--success-border)' }}>
                            <p className="text-sm" style={{ color: 'var(--success-text)' }}>
                                Total tax collected in selected period
                            </p>
                            <p className="text-2xl font-bold mt-1" style={{ color: 'var(--success-text)' }}>
                                Rs 0 (Tax calculation not implemented)
                            </p>
                        </div>
                        <p className="text-sm" style={{ color: 'var(--muted)' }}>
                            Tax breakdown will be available once tax configuration is implemented in the system.
                        </p>
                    </div>

                    {/* Section 11: Wholesale vs Retail Breakdown */}
                    <div className="rounded-xl border shadow-sm p-6 mb-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--ink)' }}>
                            Wholesale vs Retail Breakdown
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            {breakdowns.byOrderType?.map((item, idx) => (
                                <div 
                                    key={idx} 
                                    className="p-4 rounded-lg" 
                                    style={{ 
                                        background: item.type === 'retail' ? 'var(--primary-bg)' : 'var(--secondary-bg)',
                                        border: `1px solid ${item.type === 'retail' ? 'var(--primary-border)' : 'var(--secondary-border)'}`
                                    }}
                                >
                                    <p className="text-sm font-medium" style={{ color: item.type === 'retail' ? 'var(--primary-text)' : 'var(--secondary-text)' }}>
                                        {item.type === 'retail' ? '🛍️ Retail (B2C)' : '📦 Wholesale (B2B)'}
                                    </p>
                                    <p className="text-2xl font-bold mt-2" style={{ color: item.type === 'retail' ? 'var(--primary)' : 'var(--secondary)' }}>
                                        Rs {item.total?.toLocaleString() || 0}
                                    </p>
                                    <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                                        {item.count} orders • {item.percentage}%
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
