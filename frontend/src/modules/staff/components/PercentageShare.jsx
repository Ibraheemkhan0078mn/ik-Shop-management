import React, { useState, useEffect } from "react";
import { Calendar, Filter, Download, TrendingUp, ShoppingCart, DollarSign, Percent } from "lucide-react";
import { useGetStaffCommissionAllTimeQuery, useGetStaffCommissionQuery, useGetStaffCommissionOrdersQuery } from "../api/staff.api.js";

export default function PercentageShare({ staffId, staffData }) {
    const [dateRange, setDateRange] = useState("currentMonth"); // currentMonth, custom
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [page, setPage] = useState(1);

    // Set default to current month
    useEffect(() => {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        setStartDate(firstDay.toISOString().split('T')[0]);
        setEndDate(lastDay.toISOString().split('T')[0]);
    }, []);

    // All-time KPI (from join date to current)
    const { data: allTimeResponse } = useGetStaffCommissionAllTimeQuery(staffId, { skip: !staffId });
    const allTimeData = allTimeResponse?.data;

    // Filtered KPI (with date range)
    const { data: filteredResponse } = useGetStaffCommissionQuery(
        { id: staffId, startDate, endDate },
        { skip: !staffId || !startDate || !endDate }
    );
    const filteredData = filteredResponse?.data;

    // Paginated orders (with date range)
    const { data: ordersResponse } = useGetStaffCommissionOrdersQuery(
        { id: staffId, startDate, endDate, page, limit: 10 },
        { skip: !staffId || !startDate || !endDate }
    );
    const ordersData = ordersResponse?.data;

    const handleDateRangeChange = (value) => {
        setDateRange(value);
        setPage(1); // Reset to page 1 when date range changes
        if (value === "currentMonth") {
            const now = new Date();
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
            const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            setStartDate(firstDay.toISOString().split('T')[0]);
            setEndDate(lastDay.toISOString().split('T')[0]);
        }
    };

    if (!staffData || staffData.salaryType !== 'percentage') {
        return null;
    }

    return (
        <div className="space-y-6">
            {/* Section 1: All-Time KPI (from join date to current) */}
            <div className="bg-[var(--surface)] rounded-xl p-5 border border-[var(--border)]">
                <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-[var(--accent-2)]" />
                    <h3 className="text-sm font-semibold text-[var(--ink)]">All-Time Commission</h3>
                    <span className="text-xs text-[var(--muted)] ml-auto">
                        Since: {allTimeData?.joinDate ? new Date(allTimeData.joinDate).toLocaleDateString() : 'N/A'}
                    </span>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-[var(--app-bg)] rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                            <DollarSign className="w-4 h-4 text-green-500" />
                            <span className="text-xs text-[var(--muted)]">Total Commission</span>
                        </div>
                        <p className="text-lg font-bold text-[var(--ink)]">
                            Rs {(allTimeData?.totalCommission || 0).toFixed(2)}
                        </p>
                    </div>

                    <div className="bg-[var(--app-bg)] rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                            <ShoppingCart className="w-4 h-4 text-blue-500" />
                            <span className="text-xs text-[var(--muted)]">Total Orders</span>
                        </div>
                        <p className="text-lg font-bold text-[var(--ink)]">
                            {allTimeData?.totalOrders || 0}
                        </p>
                    </div>

                    <div className="bg-[var(--app-bg)] rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                            <Percent className="w-4 h-4 text-purple-500" />
                            <span className="text-xs text-[var(--muted)]">Commission Rate</span>
                        </div>
                        <p className="text-lg font-bold text-[var(--ink)]">
                            {allTimeData?.percentage || staffData.percentage || 0}%
                        </p>
                    </div>
                </div>
            </div>

            {/* Section 2: Filtered KPI with Date Filters */}
            <div className="bg-[var(--surface)] rounded-xl p-5 border border-[var(--border)]">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                    <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5 text-[var(--accent-2)]" />
                        <h3 className="text-sm font-semibold text-[var(--ink)]">Filtered Commission</h3>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2">
                        <select
                            value={dateRange}
                            onChange={(e) => handleDateRangeChange(e.target.value)}
                            className="px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--app-bg)] text-[var(--ink)] focus:outline-none focus:border-[var(--accent-2)]"
                        >
                            <option value="currentMonth">Current Month</option>
                            <option value="custom">Custom Range</option>
                        </select>

                        {dateRange === "custom" && (
                            <div className="flex items-center gap-2">
                                <div className="relative">
                                    <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="pl-8 pr-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--app-bg)] text-[var(--ink)] focus:outline-none focus:border-[var(--accent-2)]"
                                    />
                                </div>
                                <span className="text-[var(--muted)]">to</span>
                                <div className="relative">
                                    <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)]" />
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="pl-8 pr-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--app-bg)] text-[var(--ink)] focus:outline-none focus:border-[var(--accent-2)]"
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-[var(--app-bg)] rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                            <DollarSign className="w-4 h-4 text-green-500" />
                            <span className="text-xs text-[var(--muted)]">Commission</span>
                        </div>
                        <p className="text-lg font-bold text-[var(--ink)]">
                            Rs {(filteredData?.totalCommission || 0).toFixed(2)}
                        </p>
                    </div>

                    <div className="bg-[var(--app-bg)] rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                            <ShoppingCart className="w-4 h-4 text-blue-500" />
                            <span className="text-xs text-[var(--muted)]">Orders</span>
                        </div>
                        <p className="text-lg font-bold text-[var(--ink)]">
                            {filteredData?.totalOrders || 0}
                        </p>
                    </div>

                    <div className="bg-[var(--app-bg)] rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                            <TrendingUp className="w-4 h-4 text-purple-500" />
                            <span className="text-xs text-[var(--muted)]">Sales</span>
                        </div>
                        <p className="text-lg font-bold text-[var(--ink)]">
                            Rs {(filteredData?.totalSales || 0).toFixed(2)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Section 3: Paginated Orders Table */}
            <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] overflow-hidden">
                <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-[var(--ink)]">Order Payments</h3>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-[var(--border)] text-[var(--ink)] hover:bg-[var(--app-bg)] transition">
                        <Download className="w-4 h-4" />
                        Export
                    </button>
                </div>

                {!ordersData?.orders || ordersData.orders.length === 0 ? (
                    <div className="p-8 text-center text-[var(--muted)]">No orders found for this period</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[var(--app-bg)]">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Order #</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Date</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Total Amount</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Commission ({staffData.percentage}%)</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border)]">
                                {ordersData.orders.map((order) => (
                                    <tr key={order._id} className="hover:bg-[var(--app-bg)] transition">
                                        <td className="px-4 py-3 text-sm font-medium text-[var(--ink)]">
                                            {order.orderNumber}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-[var(--muted)]">
                                            {new Date(order.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right font-medium text-[var(--ink)]">
                                            Rs {order.totalAmount.toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right font-semibold text-green-600">
                                            Rs {order.staffCommission.toFixed(2)}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                {order.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                {ordersData?.pagination && ordersData.pagination.totalPages > 1 && (
                    <div className="p-4 border-t border-[var(--border)] flex items-center justify-between">
                        <span className="text-sm text-[var(--muted)]">
                            Page {ordersData.pagination.page} of {ordersData.pagination.totalPages}
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={ordersData.pagination.page === 1}
                                className="px-3 py-1 text-sm rounded-lg border border-[var(--border)] text-[var(--ink)] hover:bg-[var(--app-bg)] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Previous
                            </button>
                            <button
                                onClick={() => setPage(p => Math.min(ordersData.pagination.totalPages, p + 1))}
                                disabled={ordersData.pagination.page === ordersData.pagination.totalPages}
                                className="px-3 py-1 text-sm rounded-lg border border-[var(--border)] text-[var(--ink)] hover:bg-[var(--app-bg)] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
