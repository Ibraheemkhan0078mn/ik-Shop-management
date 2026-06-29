import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    FileText,
    Download,
    Filter,
    RefreshCw,
    Printer,
    FileSpreadsheet,
    File
} from "lucide-react";
import { showError } from "../../../shared/utilities/toastHelpers.js";
import {
    useGetSalesReportQuery,
    useGetPurchaseReportQuery,
    useGetFinancialReportQuery,
    useGetCreditDebitReportQuery,
    useGetExpenseReportQuery,
    useGetSupplierReportQuery,
    useGetWastageReportQuery,
    useGetActivityReportQuery,
} from "../services/reports.service.js";
import { FormField, Input, SearchableSelect } from "../../../shared/components/FormFields.jsx";
import ExpenseKPIReport from "./ExpenseKPIReport.jsx";

const REPORT_TYPES = [
    { value: "sales", label: "Sales Report", icon: FileText },
    { value: "purchases", label: "Purchase Report", icon: FileText },
    { value: "financial", label: "Financial Report", icon: FileText },
    { value: "credit-debit", label: "Credit/Debit Report", icon: FileText },
    { value: "expenses", label: "Expense Report", icon: FileText },
    { value: "suppliers", label: "Supplier Report", icon: FileText },
    { value: "wastage", label: "Wastage Report", icon: FileText },
    { value: "activity", label: "Activity Report", icon: FileText },
];

const PAYMENT_METHODS = [
    { value: "cash", label: "Cash" },
    { value: "online", label: "Online" },
    { value: "credit", label: "Credit (Qarza)" },
    { value: "hybrid", label: "Hybrid" },
];

function Card({ children, className = "" }) {
    return (
        <div
            className={`p-5 border bg-white border-gray-200 rounded-2xl shadow-sm ${className}`}
        >
            {children}
        </div>
    );
}

export default function ReportsPage() {
    const navigate = useNavigate();
    const [selectedReport, setSelectedReport] = useState("sales");
    const [filters, setFilters] = useState({
        fromDate: "",
        toDate: "",
        paymentMethod: "",
        search: "",
        page: 1,
        limit: 20,
    });
    const [showFilters, setShowFilters] = useState(false);

    // Navigate to new sales/purchases/suppliers/customers reports when selected
    const handleReportChange = (value) => {
        if (value === "sales") {
            navigate("/reports/sales");
        } else if (value === "purchases") {
            navigate("/reports/purchases");
        } else if (value === "suppliers") {
            navigate("/reports/suppliers");
        } else if (value === "customers") {
            navigate("/reports/customers");
        } else {
            setSelectedReport(value);
        }
    };

    // Report queries
    const salesQuery = useGetSalesReportQuery(filters, { skip: selectedReport !== "sales" });
    const purchaseQuery = useGetPurchaseReportQuery(filters, { skip: selectedReport !== "purchases" });
    const financialQuery = useGetFinancialReportQuery(filters, { skip: selectedReport !== "financial" });
    const creditDebitQuery = useGetCreditDebitReportQuery(filters, { skip: selectedReport !== "credit-debit" });
    const expenseQuery = useGetExpenseReportQuery(filters, { skip: selectedReport !== "expenses" });
    const supplierQuery = useGetSupplierReportQuery(filters, { skip: selectedReport !== "suppliers" });
    const wastageQuery = useGetWastageReportQuery(filters, { skip: selectedReport !== "wastage" });
    const activityQuery = useGetActivityReportQuery(filters, { skip: selectedReport !== "activity" });

    const getActiveQuery = () => {
        switch (selectedReport) {
            case "sales": return salesQuery;
            case "purchases": return purchaseQuery;
            case "financial": return financialQuery;
            case "credit-debit": return creditDebitQuery;
            case "expenses": return expenseQuery;
            case "suppliers": return supplierQuery;
            case "wastage": return wastageQuery;
            case "activity": return activityQuery;
            default: return salesQuery;
        }
    };

    const activeQuery = getActiveQuery();
    const { data, isLoading, error, refetch } = activeQuery;

    // Handle errors
    if (error) {
        showError(error?.data?.message || error?.message || `Failed to load ${selectedReport} report`);
    }

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
    };

    const handlePageChange = (newPage) => {
        setFilters(prev => ({ ...prev, page: newPage }));
    };

    const handleRefresh = () => {
        refetch();
    };

    const handleExport = (format) => {
        // Export functionality would be implemented here
        console.log(`Exporting ${selectedReport} as ${format}`);
    };

    const handlePrint = () => {
        window.print();
    };

    const renderSummaryCards = () => {
        if (!data?.summary) return null;

        const summary = data.summary;
        const cards = [];

        if (summary.totalSales !== undefined) {
            cards.push({ label: "Total Sales", value: summary.totalSales, color: "bg-green-500" });
        }
        if (summary.totalPurchases !== undefined) {
            cards.push({ label: "Total Purchases", value: summary.totalPurchases, color: "bg-blue-500" });
        }
        if (summary.totalExpenses !== undefined) {
            cards.push({ label: "Total Expenses", value: summary.totalExpenses, color: "bg-red-500" });
        }
        if (summary.totalItems !== undefined) {
            cards.push({ label: "Total Items", value: summary.totalItems, color: "bg-purple-500" });
        }
        if (summary.totalQuantity !== undefined) {
            cards.push({ label: "Total Quantity", value: summary.totalQuantity, color: "bg-cyan-500" });
        }
        if (summary.totalValue !== undefined) {
            cards.push({ label: "Total Value", value: summary.totalValue, color: "bg-orange-500" });
        }
        if (summary.totalBalance !== undefined) {
            cards.push({ label: "Total Balance", value: summary.totalBalance, color: "bg-indigo-500" });
        }
        if (summary.totalOrders !== undefined) {
            cards.push({ label: "Total Orders", value: summary.totalOrders, color: "bg-pink-500" });
        }

        if (cards.length === 0) return null;

        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {cards.map((card, index) => (
                    <Card key={index} className="hover:shadow-md transition-shadow">
                        <p className="text-sm text-gray-500 mb-1">{card.label}</p>
                        <p className="text-2xl font-bold text-gray-800">
                            Rs {card.value?.toLocaleString() || 0}
                        </p>
                    </Card>
                ))}
            </div>
        );
    };

    const renderTable = () => {
        if (!data?.data || data.data.length === 0) {
            return (
                <Card>
                    <p className="text-center text-gray-500 py-8">No data available</p>
                </Card>
            );
        }

        const columns = Object.keys(data.data[0] || {}).filter(
            key => !["_id", "__v", "createdAt", "updatedAt"].includes(key)
        );

        return (
            <Card>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-200">
                                {columns.map((col) => (
                                    <th key={col} className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                                        {col.charAt(0).toUpperCase() + col.slice(1).replace(/([A-Z])/g, ' $1')}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {data.data.map((row, index) => (
                                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                    {columns.map((col) => (
                                        <td key={col} className="py-3 px-4 text-sm text-gray-600">
                                            {typeof row[col] === 'number' && col.toLowerCase().includes('amount') || col.toLowerCase().includes('price') || col.toLowerCase().includes('value') || col.toLowerCase().includes('balance')
                                                ? `Rs ${row[col]?.toLocaleString() || 0}`
                                                : row[col] || '-'}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {data.totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                        <p className="text-sm text-gray-500">
                            Page {data.page} of {data.totalPages} ({data.total} total)
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handlePageChange(data.page - 1)}
                                disabled={data.page === 1}
                                className="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => handlePageChange(data.page + 1)}
                                disabled={data.page === data.totalPages}
                                className="px-3 py-1 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </Card>
        );
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
                    <p className="text-sm text-gray-500">Generate and view business reports</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <Filter size={16} />
                        Filters
                    </button>
                    <button
                        onClick={handleRefresh}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <RefreshCw size={16} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Report Selector */}
            <div className="mb-6">
                <SearchableSelect
                    options={REPORT_TYPES}
                    value={selectedReport}
                    onChange={handleReportChange}
                    placeholder="Select a report..."
                />
            </div>

            {/* Filters */}
            {showFilters && (
                <Card className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Filters</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <FormField label="From Date">
                            <Input
                                type="date"
                                value={filters.fromDate}
                                onChange={(e) => handleFilterChange("fromDate", e.target.value)}
                            />
                        </FormField>
                        <FormField label="To Date">
                            <Input
                                type="date"
                                value={filters.toDate}
                                onChange={(e) => handleFilterChange("toDate", e.target.value)}
                            />
                        </FormField>
                        {(selectedReport === "sales" || selectedReport === "financial") && (
                            <FormField label="Payment Method">
                                <SearchableSelect
                                    options={PAYMENT_METHODS}
                                    value={filters.paymentMethod}
                                    onChange={(value) => handleFilterChange("paymentMethod", value)}
                                    placeholder="All methods"
                                />
                            </FormField>
                        )}
                        <FormField label="Search">
                            <Input
                                placeholder="Search..."
                                value={filters.search}
                                onChange={(e) => handleFilterChange("search", e.target.value)}
                            />
                        </FormField>
                    </div>
                </Card>
            )}

            {/* Export Buttons */}
            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => handleExport("pdf")}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                    <File size={16} />
                    Export PDF
                </button>
                <button
                    onClick={() => handleExport("excel")}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                    <FileSpreadsheet size={16} />
                    Export Excel
                </button>
                <button
                    onClick={() => handleExport("csv")}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                    <Download size={16} />
                    Export CSV
                </button>
                <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                    <Printer size={16} />
                    Print
                </button>
            </div>

            {/* Expense Report - has its own loading state */}
            {selectedReport === "expenses" ? (
                <ExpenseKPIReport />
            ) : (
                <>
                    {/* Loading State */}
                    {isLoading ? (
                        <Card>
                            <div className="flex items-center justify-center py-12">
                                <RefreshCw className="animate-spin text-cyan-600" size={40} />
                            </div>
                        </Card>
                    ) : (
                        <>
                            {/* Summary Cards */}
                            {renderSummaryCards()}

                            {/* Data Table */}
                            {renderTable()}
                        </>
                    )}
                </>
            )}
        </div>
    );
}
