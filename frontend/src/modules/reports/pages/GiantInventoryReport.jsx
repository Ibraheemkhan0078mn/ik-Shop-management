import React, { useState } from "react";
import { Calendar, Download, Printer, FileSpreadsheet, FileText, Filter, RefreshCw, Search, ArrowUpDown } from "lucide-react";
import { useGetInventoryReportQuery } from "../services/reports.service.js";
import { useGetCategoriesQuery } from "../../productsModule/services/category.service.js";

const TAG_OPTIONS = [
    { value: 'dead_stock', label: 'Dead Stock', color: 'bg-red-500' },
    { value: 'low_stock', label: 'Low Stock', color: 'bg-yellow-500' },
    { value: 'fast_selling', label: 'Fast Selling', color: 'bg-green-500' },
    { value: 'overstock', label: 'Overstock', color: 'bg-blue-500' },
    { value: 'expired', label: 'Expired', color: 'bg-gray-800' },
    { value: 'near_expiry', label: 'Near Expiry', color: 'bg-orange-500' },
    { value: 'high_return', label: 'High Return', color: 'bg-red-600' },
];

const SORT_OPTIONS = [
    { value: 'createdAt', label: 'Default' },
    { value: 'tag', label: 'Tag' },
    { value: 'highest_sales', label: 'Highest Sales' },
    { value: 'lowest_sales', label: 'Lowest Sales' },
    { value: 'most_returned', label: 'Most Returned' },
    { value: 'expiry_date', label: 'Expiry Date' },
    { value: 'stock_level', label: 'Stock Level' },
];

const TAG_LABELS = {
    dead_stock: { label: 'Dead Stock', emoji: '🔴', color: 'bg-red-100 text-red-800 border-red-300' },
    low_stock: { label: 'Low Stock', emoji: '🟡', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
    fast_selling: { label: 'Fast Selling', emoji: '🟢', color: 'bg-green-100 text-green-800 border-green-300' },
    overstock: { label: 'Overstock', emoji: '🔵', color: 'bg-blue-100 text-blue-800 border-blue-300' },
    expired: { label: 'Expired', emoji: '⚫', color: 'bg-gray-100 text-gray-800 border-gray-300' },
    near_expiry: { label: 'Near Expiry', emoji: '🟠', color: 'bg-orange-100 text-orange-800 border-orange-300' },
    high_return: { label: 'High Return', emoji: '🔴', color: 'bg-red-100 text-red-800 border-red-300' },
};

export default function GiantInventoryReport() {
    const [filters, setFilters] = useState({
        fromDate: '',
        toDate: '',
        categoryId: '',
        productName: '',
        productCode: '',
        tag: '',
        sortBy: 'createdAt',
    });

    const { data: reportData, isLoading, refetch } = useGetInventoryReportQuery(filters);
    const { data: categories } = useGetCategoriesQuery();

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handlePrint = () => {
        window.print();
    };

    const handleExportPDF = () => {
        console.log('Export PDF');
    };

    const handleExportExcel = () => {
        console.log('Export Excel');
    };

    const formatDate = (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString();
    };

    return (
        <div className="p-6 bg-[var(--app-bg)] min-h-screen">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--ink)] font-display">Giant Inventory Report</h1>
                    <p className="text-sm text-[var(--muted)]">Comprehensive inventory analysis with auto-tagging</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => refetch()}
                        className="px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--hover)] flex items-center gap-2"
                    >
                        <RefreshCw size={16} />
                    </button>
                    <button
                        onClick={handlePrint}
                        className="px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--hover)] flex items-center gap-2"
                    >
                        <Printer size={16} />
                        Print
                    </button>
                    <button
                        onClick={handleExportPDF}
                        className="px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--hover)] flex items-center gap-2"
                    >
                        <FileText size={16} />
                        PDF
                    </button>
                    <button
                        onClick={handleExportExcel}
                        className="px-4 py-2 border border-[var(--border)] rounded-lg hover:bg-[var(--hover)] flex items-center gap-2"
                    >
                        <FileSpreadsheet size={16} />
                        Excel
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="card mb-6 p-4">
                <div className="flex items-center gap-2 mb-4">
                    <Filter size={16} className="text-[var(--muted)]" />
                    <h3 className="font-medium text-[var(--ink)]">Filters</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm text-[var(--muted)] mb-1">From Date</label>
                        <input
                            type="date"
                            value={filters.fromDate}
                            onChange={(e) => handleFilterChange('fromDate', e.target.value)}
                            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-[var(--muted)] mb-1">To Date</label>
                        <input
                            type="date"
                            value={filters.toDate}
                            onChange={(e) => handleFilterChange('toDate', e.target.value)}
                            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-[var(--muted)] mb-1">Category</label>
                        <select
                            value={filters.categoryId}
                            onChange={(e) => handleFilterChange('categoryId', e.target.value)}
                            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]"
                        >
                            <option value="">All Categories</option>
                            {categories?.data?.map(cat => (
                                <option key={cat._id} value={cat._id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-[var(--muted)] mb-1">Product Name</label>
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--muted)]" />
                            <input
                                type="text"
                                placeholder="Search by name"
                                value={filters.productName}
                                onChange={(e) => handleFilterChange('productName', e.target.value)}
                                className="w-full pl-10 pr-3 py-2 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm text-[var(--muted)] mb-1">Product Code</label>
                        <input
                            type="text"
                            placeholder="Search by code"
                            value={filters.productCode}
                            onChange={(e) => handleFilterChange('productCode', e.target.value)}
                            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]"
                        />
                    </div>
                    <div>
                        <label className="block text-sm text-[var(--muted)] mb-1">Tag</label>
                        <select
                            value={filters.tag}
                            onChange={(e) => handleFilterChange('tag', e.target.value)}
                            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]"
                        >
                            <option value="">All Tags</option>
                            {TAG_OPTIONS.map(tag => (
                                <option key={tag.value} value={tag.value}>{tag.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-[var(--muted)] mb-1">Sort By</label>
                        <div className="relative">
                            <ArrowUpDown size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--muted)]" />
                            <select
                                value={filters.sortBy}
                                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                                className="w-full pl-10 pr-3 py-2 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]"
                            >
                                {SORT_OPTIONS.map(option => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Summary Bar */}
            {reportData?.summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
                    <div className="card p-4 text-center">
                        <div className="text-2xl font-bold text-[var(--ink)]">{reportData.summary.totalProducts}</div>
                        <div className="text-xs text-[var(--muted)]">Total Products</div>
                    </div>
                    <div className="card p-4 text-center">
                        <div className="text-2xl font-bold text-red-500">{reportData.summary.deadStockCount}</div>
                        <div className="text-xs text-[var(--muted)]">Dead Stock</div>
                    </div>
                    <div className="card p-4 text-center">
                        <div className="text-2xl font-bold text-gray-800">{reportData.summary.expiredCount}</div>
                        <div className="text-xs text-[var(--muted)]">Expired</div>
                    </div>
                    <div className="card p-4 text-center">
                        <div className="text-2xl font-bold text-yellow-500">{reportData.summary.lowStockCount}</div>
                        <div className="text-xs text-[var(--muted)]">Low Stock</div>
                    </div>
                    <div className="card p-4 text-center">
                        <div className="text-2xl font-bold text-green-500">{reportData.summary.fastSellingCount}</div>
                        <div className="text-xs text-[var(--muted)]">Fast Selling</div>
                    </div>
                    <div className="card p-4 text-center">
                        <div className="text-2xl font-bold text-blue-500">{reportData.summary.overstockCount}</div>
                        <div className="text-xs text-[var(--muted)]">Overstock</div>
                    </div>
                    <div className="card p-4 text-center">
                        <div className="text-2xl font-bold text-red-600">{reportData.summary.highReturnCount}</div>
                        <div className="text-xs text-[var(--muted)]">High Return</div>
                    </div>
                    <div className="card p-4 text-center">
                        <div className="text-2xl font-bold text-orange-500">{reportData.summary.nearExpiryCount}</div>
                        <div className="text-xs text-[var(--muted)]">Near Expiry</div>
                    </div>
                </div>
            )}

            {/* Report Table */}
            {isLoading ? (
                <div className="card p-8 text-center text-[var(--muted)]">Loading...</div>
            ) : (
                <div className="card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[var(--app-bg)]">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Tag</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Product Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Code</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Category</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Stock</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Min</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Max</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Purchased</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Sold</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Returned</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Wasted</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Expiry</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Sales Rank</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Return Rank</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border)]">
                                {reportData?.data?.map((product) => (
                                    <tr key={product._id} className="hover:bg-[var(--hover)]">
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            {product.tag && TAG_LABELS[product.tag] && (
                                                <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${TAG_LABELS[product.tag].color}`}>
                                                    <span>{TAG_LABELS[product.tag].emoji}</span>
                                                    {TAG_LABELS[product.tag].label}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-[var(--ink)]">{product.name}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-[var(--muted)]">{product.code || '-'}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-[var(--muted)]">{product.category?.name || '-'}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-[var(--ink)]">{product.currentStock}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-[var(--muted)]">{product.minStockLevel || '-'}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-[var(--muted)]">{product.maxStockLevel || '-'}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-[var(--ink)]">{product.totalPurchased}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-[var(--ink)]">{product.totalSold}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-[var(--ink)]">{product.totalReturned}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-[var(--ink)]">{product.totalWasted}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-[var(--muted)]">{formatDate(product.expiryDate)}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-[var(--ink)]">#{product.salesRank}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-[var(--ink)]">#{product.returnRank}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
