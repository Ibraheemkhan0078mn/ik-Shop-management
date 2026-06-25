import React, { useState } from "react";
import { Calendar, Download, Printer, RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import { useGetMainBusinessReportQuery } from "../services/reports.service.js";
import { showError } from "../../../shared/utilities/toastHelpers.js";

const PERIOD_OPTIONS = [
    { value: "today", label: "Today" },
    { value: "week", label: "This Week" },
    { value: "month", label: "This Month" },
    { value: "custom", label: "Custom Range" },
];

function SummaryCard({ label, value, icon: Icon, color, trend }) {
    const isPositive = trend >= 0;
    return (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">{label}</span>
                <Icon size={20} className={color} />
            </div>
            <p className="text-2xl font-bold text-gray-800">Rs {value?.toLocaleString() || 0}</p>
            {trend !== undefined && (
                <div className={`flex items-center gap-1 mt-2 text-sm ${isPositive ? "text-green-600" : "text-red-600"}`}>
                    {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    <span>{Math.abs(trend).toFixed(1)}%</span>
                </div>
            )}
        </div>
    );
}

export default function MainBusinessReport() {
    const [period, setPeriod] = useState("today");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

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

    const summary = data?.summary || {};
    const details = data?.details || {};

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Main Business Report</h1>
                    <p className="text-sm text-gray-500">Complete business overview</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleRefresh}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        <RefreshCw size={16} />
                        Refresh
                    </button>
                    <button
                        onClick={handleExport}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                        <Download size={16} />
                        Export
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800"
                    >
                        <Printer size={16} />
                        Print
                    </button>
                </div>
            </div>

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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <SummaryCard label="Total Sales" value={summary.totalSales} icon={TrendingUp} color="text-green-500" />
                        <SummaryCard label="Total Purchases" value={summary.totalPurchases} icon={TrendingDown} color="text-blue-500" />
                        <SummaryCard label="Total Expenses" value={summary.totalExpenses} icon={TrendingDown} color="text-red-500" />
                        <SummaryCard label="Total Salaries" value={summary.totalSalaries} icon={TrendingDown} color="text-purple-500" />
                        <SummaryCard label="Purchase Returns" value={summary.totalPurchaseReturns} icon={TrendingUp} color="text-cyan-500" />
                        <SummaryCard label="Sale Returns" value={summary.totalProductReturns} icon={TrendingDown} color="text-orange-500" />
                        <SummaryCard label="Wastage Loss" value={summary.totalWastage} icon={TrendingDown} color="text-red-600" />
                        <SummaryCard
                            label="Net Profit/Loss"
                            value={summary.netProfit}
                            icon={summary.netProfit >= 0 ? TrendingUp : TrendingDown}
                            color={summary.netProfit >= 0 ? "text-green-600" : "text-red-600"}
                        />
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">Transaction Details</h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-500 mb-1">Sales Count</p>
                                <p className="text-xl font-bold text-gray-800">{details.salesCount || 0}</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-500 mb-1">Purchase Count</p>
                                <p className="text-xl font-bold text-gray-800">{details.purchaseCount || 0}</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-500 mb-1">Expense Count</p>
                                <p className="text-xl font-bold text-gray-800">{details.expenseCount || 0}</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-500 mb-1">Wastage Count</p>
                                <p className="text-xl font-bold text-gray-800">{details.wastageCount || 0}</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-500 mb-1">Purchase Returns</p>
                                <p className="text-xl font-bold text-gray-800">{details.purchaseReturnCount || 0}</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-500 mb-1">Sale Returns</p>
                                <p className="text-xl font-bold text-gray-800">{details.productReturnCount || 0}</p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-500 mb-1">Salary Payments</p>
                                <p className="text-xl font-bold text-gray-800">{details.salaryPaymentCount || 0}</p>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
