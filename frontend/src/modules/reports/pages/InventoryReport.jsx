import React, { useState, useMemo } from "react";
import { Package, AlertTriangle, TrendingUp, RefreshCw, Filter, Search, ArrowUpDown, Box, Clock, RotateCcw, Zap } from "lucide-react";
import { useGetInventoryReportQuery } from "../services/reports.service.js";
import { useGetCategoriesQuery } from "../../productsModule/services/category.service.js";
import { useSettings } from "../../settings/hooks/useSettings.js";
import { getReportsLabels } from "../labels/reportsLabels.js";

export default function InventoryReport() {
    const { settings } = useSettings();
    const language = settings?.language || "en";
    const labels = getReportsLabels(language);

    const TAG_OPTIONS = useMemo(() => [
        { value: 'dead_stock', label: labels.deadStock, color: 'bg-red-500' },
        { value: 'low_stock', label: labels.lowStock, color: 'bg-yellow-500' },
        { value: 'fast_selling', label: labels.fastSelling, color: 'bg-green-500' },
        { value: 'overstock', label: labels.overstock, color: 'bg-blue-500' },
        { value: 'expired', label: labels.expired, color: 'bg-gray-800' },
        { value: 'near_expiry', label: labels.nearExpiry, color: 'bg-orange-500' },
        { value: 'high_return', label: labels.highReturn, color: 'bg-red-600' },
    ], [labels]);

    const SORT_OPTIONS = useMemo(() => [
        { value: 'createdAt', label: labels.sortByDefault },
        { value: 'tag', label: labels.sortByTag },
        { value: 'highest_sales', label: labels.sortByHighestSales },
        { value: 'lowest_sales', label: labels.sortByLowestSales },
        { value: 'most_returned', label: labels.sortByMostReturned },
        { value: 'expiry_date', label: labels.sortByExpiryDate },
        { value: 'stock_level', label: labels.sortByStockLevel },
    ], [labels]);

    const TAG_LABELS = useMemo(() => ({
        dead_stock: { label: labels.deadStock, emoji: '🔴', color: 'bg-red-100 text-red-800 border-red-300' },
        low_stock: { label: labels.lowStock, emoji: '🟡', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
        fast_selling: { label: labels.fastSelling, emoji: '🟢', color: 'bg-green-100 text-green-800 border-green-300' },
        overstock: { label: labels.overstock, emoji: '🔵', color: 'bg-blue-100 text-blue-800 border-blue-300' },
        expired: { label: labels.expired, emoji: '⚫', color: 'bg-gray-100 text-gray-800 border-gray-300' },
        near_expiry: { label: labels.nearExpiry, emoji: '🟠', color: 'bg-orange-100 text-orange-800 border-orange-300' },
        high_return: { label: labels.highReturn, emoji: '🔴', color: 'bg-red-100 text-red-800 border-red-300' },
    }), [labels]);
    const [period, setPeriod] = useState("today");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [categoryId, setCategoryId] = useState("");
    const [productName, setProductName] = useState("");
    const [productCode, setProductCode] = useState("");
    const [tag, setTag] = useState("");
    const [sortBy, setSortBy] = useState("createdAt");

    // Calculate date range based on period
    const getDatesFromPeriod = (periodValue) => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        
        switch (periodValue) {
            case "today":
                return {
                    from: today.toISOString().split('T')[0],
                    to: today.toISOString().split('T')[0]
                };
            case "month":
                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                return {
                    from: monthStart.toISOString().split('T')[0],
                    to: monthEnd.toISOString().split('T')[0]
                };
            case "3month":
                const threeMonthStart = new Date(now.getFullYear(), now.getMonth() - 3, 1);
                const threeMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                return {
                    from: threeMonthStart.toISOString().split('T')[0],
                    to: threeMonthEnd.toISOString().split('T')[0]
                };
            case "year":
                const yearStart = new Date(now.getFullYear(), 0, 1);
                const yearEnd = new Date(now.getFullYear(), 11, 31);
                return {
                    from: yearStart.toISOString().split('T')[0],
                    to: yearEnd.toISOString().split('T')[0]
                };
            case "custom":
            default:
                return { from: fromDate, to: toDate };
        }
    };

    const dates = useMemo(() => getDatesFromPeriod(period), [period, fromDate, toDate]);
    
    const filters = useMemo(() => ({ 
        fromDate: period === "custom" ? fromDate : dates.from, 
        toDate: period === "custom" ? toDate : dates.to, 
        categoryId, productName, productCode, tag, sortBy 
    }), [period, fromDate, toDate, dates.from, dates.to, categoryId, productName, productCode, tag, sortBy]);

    const { data: reportData, isLoading, isFetching, refetch } = useGetInventoryReportQuery(filters);
    const { data: categories } = useGetCategoriesQuery();

    const handleFilterChange = (key, value) => {
        if (key === 'fromDate') setFromDate(value);
        else if (key === 'toDate') setToDate(value);
        else if (key === 'categoryId') setCategoryId(value);
        else if (key === 'productName') setProductName(value);
        else if (key === 'productCode') setProductCode(value);
        else if (key === 'tag') setTag(value);
        else if (key === 'sortBy') setSortBy(value);
    };

    const formatDate = (date) => {
        if (!date) return '—';
        return new Date(date).toLocaleDateString();
    };

    const showLoader = isLoading || isFetching;

    return (
        <div className="p-6 min-h-screen bg-[var(--app-bg)]">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--ink)] font-display">{labels.inventoryReport}</h1>
                    <p className="text-sm text-[var(--muted)]">{labels.inventoryAnalysis}</p>
                </div>
                <button onClick={() => refetch()} className="px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--app-bg)] transition-colors flex items-center gap-2">
                    <RefreshCw size={16} className={showLoader ? "animate-spin" : ""} />
                    {labels.refresh}
                </button>
            </div>

            {/* Filters */}
            <div className="card p-4 mb-6">
                <div className="flex items-center gap-2 mb-3">
                    <Filter size={16} className="text-[var(--accent-2)]" />
                    <span className="text-sm font-semibold text-[var(--ink)]">{labels.filters}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
                    <div>
                        <label className="text-xs font-medium text-[var(--muted)] mb-1 block">{labels.period}</label>
                        <select
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]/20"
                        >
                            <option value="today">{labels.today}</option>
                            <option value="month">{labels.thisMonth}</option>
                            <option value="3month">{labels.last3Months}</option>
                            <option value="year">{labels.thisYear}</option>
                            <option value="custom">{labels.customRange}</option>
                        </select>
                    </div>
                    {period === "custom" && (
                        <>
                            <div>
                                <label className="text-xs font-medium text-[var(--muted)] mb-1 block">{labels.fromDate}</label>
                                <input
                                    type="date"
                                    value={fromDate}
                                    onChange={(e) => handleFilterChange('fromDate', e.target.value)}
                                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]/20"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-[var(--muted)] mb-1 block">{labels.toDate}</label>
                                <input
                                    type="date"
                                    value={toDate}
                                    onChange={(e) => handleFilterChange('toDate', e.target.value)}
                                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]/20"
                                />
                            </div>
                        </>
                    )}
                    <div>
                        <label className="text-xs font-medium text-[var(--muted)] mb-1 block">{labels.category}</label>
                        <select
                            value={categoryId}
                            onChange={(e) => handleFilterChange('categoryId', e.target.value)}
                            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]/20"
                        >
                            <option value="">{labels.allCategories}</option>
                            {categories?.data?.map(cat => (
                                <option key={cat._id} value={cat._id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-[var(--muted)] mb-1 block">{labels.productName}</label>
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--muted)]" />
                            <input
                                type="text"
                                placeholder={labels.searchByName}
                                value={productName}
                                onChange={(e) => handleFilterChange('productName', e.target.value)}
                                className="w-full pl-10 pr-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]/20"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-[var(--muted)] mb-1 block">{labels.productCode}</label>
                        <input
                            type="text"
                            placeholder={labels.searchByCode}
                            value={productCode}
                            onChange={(e) => handleFilterChange('productCode', e.target.value)}
                            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]/20"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-[var(--muted)] mb-1 block">{labels.tag}</label>
                        <select
                            value={tag}
                            onChange={(e) => handleFilterChange('tag', e.target.value)}
                            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]/20"
                        >
                            <option value="">{labels.allTags}</option>
                            {TAG_OPTIONS.map(tag => (
                                <option key={tag.value} value={tag.value}>{tag.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-[var(--muted)] mb-1 block">{labels.sortBy}</label>
                        <div className="relative">
                            <ArrowUpDown size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--muted)]" />
                            <select
                                value={sortBy}
                                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                                className="w-full pl-10 pr-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]/20"
                            >
                                {SORT_OPTIONS.map(option => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {showLoader ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-2)]"></div>
                </div>
            ) : (
                <div>
                    {/* Summary Cards */}
                    {reportData?.summary && (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
                            <div className="card p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-[var(--accent-2)]/10 flex items-center justify-center">
                                        <Package size={20} className="text-[var(--accent-2)]" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-[var(--muted)] uppercase font-bold">Total</p>
                                        <p className="font-semibold text-[var(--ink)]">{reportData.summary.totalProducts}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="card p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                                        <AlertTriangle size={20} className="text-red-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-[var(--muted)] uppercase font-bold">Dead Stock</p>
                                        <p className="font-semibold text-red-600">{reportData.summary.deadStockCount}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="card p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                                        <Clock size={20} className="text-gray-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-[var(--muted)] uppercase font-bold">Expired</p>
                                        <p className="font-semibold text-gray-600">{reportData.summary.expiredCount}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="card p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                                        <AlertTriangle size={20} className="text-yellow-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-[var(--muted)] uppercase font-bold">Low Stock</p>
                                        <p className="font-semibold text-yellow-600">{reportData.summary.lowStockCount}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="card p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                        <TrendingUp size={20} className="text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-[var(--muted)] uppercase font-bold">Fast Selling</p>
                                        <p className="font-semibold text-green-600">{reportData.summary.fastSellingCount}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="card p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                        <Box size={20} className="text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-[var(--muted)] uppercase font-bold">Overstock</p>
                                        <p className="font-semibold text-blue-600">{reportData.summary.overstockCount}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="card p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                                        <RotateCcw size={20} className="text-red-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-[var(--muted)] uppercase font-bold">High Return</p>
                                        <p className="font-semibold text-red-600">{reportData.summary.highReturnCount}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="card p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                                        <Zap size={20} className="text-orange-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-[var(--muted)] uppercase font-bold">Near Expiry</p>
                                        <p className="font-semibold text-orange-600">{reportData.summary.nearExpiryCount}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Report Table */}
                    <div className="card">
                        <div className="p-4 border-b border-[var(--border)]">
                            <h2 className="text-lg font-semibold text-[var(--ink)]">Inventory Details</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-[var(--surface-muted)]">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">Tag</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">Product Name</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">Code</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">Category</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">Stock</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">Min</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">Max</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">Purchased</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">Sold</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">Returned</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">Wasted</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">Expiry</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">Sales Rank</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">Return Rank</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border)]">
                                    {reportData?.data?.length === 0 ? (
                                        <tr>
                                            <td colSpan="14" className="px-4 py-8 text-center text-[var(--muted)]">No inventory data found</td>
                                        </tr>
                                    ) : (
                                        reportData?.data?.map((product) => (
                                            <tr key={product._id} className="hover:bg-[var(--surface-muted)] transition-colors">
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    {product.tag && TAG_LABELS[product.tag] && (
                                                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full border ${TAG_LABELS[product.tag].color}`}>
                                                            <span>{TAG_LABELS[product.tag].emoji}</span>
                                                            {TAG_LABELS[product.tag].label}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-[var(--ink)]">{product.name}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-[var(--muted)]">{product.code || '—'}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-[var(--muted)]">{product.category?.name || '—'}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-[var(--ink)]">{product.currentStock}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-[var(--muted)]">{product.minStockLevel || '—'}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-[var(--muted)]">{product.maxStockLevel || '—'}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-[var(--ink)]">{product.totalPurchased}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-[var(--ink)]">{product.totalSold}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-[var(--ink)]">{product.totalReturned}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-[var(--ink)]">{product.totalWasted}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-[var(--muted)]">{formatDate(product.expiryDate)}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-[var(--accent-2)] font-bold">#{product.salesRank}</td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-[var(--accent-2)] font-bold">#{product.returnRank}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
