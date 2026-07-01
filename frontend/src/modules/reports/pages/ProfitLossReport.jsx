import React, { useState } from "react";
import { Calendar, Download, Printer, RefreshCw, TrendingUp, TrendingDown, PieChart } from "lucide-react";
import { useGetProfitLossReportQuery } from "../services/reports.service.js";
import { showError } from "../../../shared/utilities/toastHelpers.js";
import PageHeading from "../../../shared/components/PageHeading.jsx";
import ScreenTabButton from "../../../shared/components/ScreenTabButton.jsx";

const PERIOD_OPTIONS = [
    { value: "month", label: "This Month" },
    { value: "custom", label: "Custom Range" },
];

function MetricCard({ label, value, icon: Icon, color, isPositive }) {
    return (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">{label}</span>
                <Icon size={20} className={color} />
            </div>
            <p className="text-2xl font-bold text-gray-800">Rs {value?.toLocaleString() || 0}</p>
        </div>
    );
}

export default function ProfitLossReport() {
    const [period, setPeriod] = useState("month");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    const filters = { period };
    if (period === "custom" && fromDate && toDate) {
        filters.fromDate = fromDate;
        filters.toDate = toDate;
    }

    const { data, isLoading, error, refetch } = useGetProfitLossReportQuery(filters);

    if (error) {
        showError(error?.data?.message || "Failed to load report");
    }

    const handleRefresh = () => refetch();
    const handlePrint = () => window.print();
    const handleExport = () => console.log("Export functionality to be implemented");

    const summary = data?.summary || {};

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <PageHeading
                heading="Profit & Loss Report"
                subheading="Revenue minus all costs analysis"
                leftActions={
                    <div onClick={handleRefresh}>
                        <ScreenTabButton lucideIcon={RefreshCw} text="Refresh" />
                    </div>
                }
                rightActions={
                    <>
                        <button onClick={handleExport} className="p-2 rounded-lg transition-all hover:bg-[var(--surface-muted)]" style={{ color: "var(--muted)" }}>
                            <Download size={18} />
                        </button>
                        <button onClick={handlePrint} className="p-2 rounded-lg transition-all hover:bg-[var(--surface-muted)]" style={{ color: "var(--muted)" }}>
                            <Printer size={18} />
                        </button>
                    </>
                }
            />

            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-6">
                <div className="flex items-center gap-4">
                    <Calendar size={20} className="text-gray-500" />
                    <div className="flex gap-2">
                        {PERIOD_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => setPeriod(opt.value)}
                                className={`px-4 py-2 rounded-lg ${
                                    period === opt.value
                                        ? "bg-blue-500 text-white"
                                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                    {period === "custom" && (
                        <div className="flex gap-2 ml-4">
                            <input
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg"
                            />
                            <input
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                className="px-3 py-2 border border-gray-300 rounded-lg"
                            />
                        </div>
                    )}
                </div>
            </div>

            {isLoading ? (
                <div className="bg-white p-12 rounded-xl border border-gray-200 shadow-sm flex items-center justify-center">
                    <RefreshCw className="animate-spin text-blue-500" size={40} />
                </div>
            ) : (
                <>
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Net Result</h2>
                        <div className={`p-6 rounded-lg ${summary.netProfit >= 0 ? "bg-green-50" : "bg-red-50"}`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">Net Profit/Loss</p>
                                    <p className={`text-4xl font-bold ${summary.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                                        Rs {summary.netProfit?.toLocaleString() || 0}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-gray-500 mb-1">Profit Margin</p>
                                    <p className={`text-2xl font-bold ${summary.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                                        {summary.profitMargin || 0}%
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                        <MetricCard label="Total Revenue" value={summary.totalRevenue} icon={TrendingUp} color="text-green-500" />
                        <MetricCard label="Total Discount" value={summary.totalDiscount} icon={TrendingDown} color="text-orange-500" />
                        <MetricCard label="Net Revenue" value={summary.netRevenue} icon={TrendingUp} color="text-green-600" />
                        <MetricCard label="Cost of Goods Sold" value={summary.totalCOGS} icon={TrendingDown} color="text-red-500" />
                        <MetricCard label="Gross Profit" value={summary.grossProfit} icon={TrendingUp} color="text-green-600" isPositive={summary.grossProfit >= 0} />
                        <MetricCard label="Operating Expenses" value={summary.operatingExpenses} icon={TrendingDown} color="text-red-600" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <MetricCard label="Total Expenses" value={summary.totalExpenses} icon={TrendingDown} color="text-red-500" />
                        <MetricCard label="Total Wastage" value={summary.totalWastage} icon={TrendingDown} color="text-red-600" />
                        <MetricCard label="Total Salaries" value={summary.totalSalaries} icon={TrendingDown} color="text-purple-500" />
                        <MetricCard label="Total Refunds" value={summary.totalRefunds} icon={TrendingDown} color="text-orange-600" />
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Profit Breakdown</h2>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                                <span className="text-gray-700">Gross Profit (Revenue - COGS)</span>
                                <span className="font-bold text-green-600">Rs {summary.grossProfit?.toLocaleString() || 0}</span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                                <span className="text-gray-700">Less: Operating Expenses</span>
                                <span className="font-bold text-red-600">Rs {summary.operatingExpenses?.toLocaleString() || 0}</span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <span className="text-gray-700">= Net Profit/Loss</span>
                                <span className={`font-bold ${summary.netProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                                    Rs {summary.netProfit?.toLocaleString() || 0}
                                </span>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
