import React, { useState } from "react";
import { Download, TrendingUp, ShoppingCart, DollarSign, ChevronDown, ChevronUp } from "lucide-react";
import { useGetPercentageBreakdownQuery } from "../api/staff.api.js";

export default function PercentageShare({ staffId, staffData }) {
    const [expandedMonths, setExpandedMonths] = useState(new Set());

    // Month-wise percentage breakdown (auto-calculates from first percentage change date if no dates provided)
    const { data: percentageBreakdownResponse } = useGetPercentageBreakdownQuery(
        { id: staffId, startDate: undefined, endDate: undefined },
        { skip: !staffId }
    );
    const percentageBreakdown = percentageBreakdownResponse?.data;

    const toggleMonth = (monthIndex) => {
        const newExpanded = new Set(expandedMonths);
        if (newExpanded.has(monthIndex)) {
            newExpanded.delete(monthIndex);
        } else {
            newExpanded.add(monthIndex);
        }
        setExpandedMonths(newExpanded);
    };

    if (!staffData) {
        return null;
    }

    // Calculate totals from breakdown
    const totalCommission = percentageBreakdown?.breakdown?.reduce((sum, month) => sum + month.totalCommission, 0) || 0;
    const totalOrders = percentageBreakdown?.breakdown?.reduce((sum, month) => sum + month.totalOrders, 0) || 0;
    const totalSales = percentageBreakdown?.breakdown?.reduce((sum, month) => sum + month.totalSales, 0) || 0;

    return (
        <div className="space-y-6">
            {/* KPI Section */}
            <div className="bg-[var(--surface)] rounded-xl p-5 border border-[var(--border)]">
                <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-[var(--accent-2)]" />
                    <h3 className="text-sm font-semibold text-[var(--ink)]">Commission Summary</h3>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div className="bg-[var(--app-bg)] rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                            <DollarSign className="w-4 h-4 text-green-500" />
                            <span className="text-xs text-[var(--muted)]">Total Commission</span>
                        </div>
                        <p className="text-lg font-bold text-[var(--ink)]">
                            Rs {totalCommission.toFixed(2)}
                        </p>
                    </div>

                    <div className="bg-[var(--app-bg)] rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                            <ShoppingCart className="w-4 h-4 text-blue-500" />
                            <span className="text-xs text-[var(--muted)]">Total Orders</span>
                        </div>
                        <p className="text-lg font-bold text-[var(--ink)]">
                            {totalOrders}
                        </p>
                    </div>

                    <div className="bg-[var(--app-bg)] rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                            <TrendingUp className="w-4 h-4 text-purple-500" />
                            <span className="text-xs text-[var(--muted)]">Total Sales</span>
                        </div>
                        <p className="text-lg font-bold text-[var(--ink)]">
                            Rs {totalSales.toFixed(2)}
                        </p>
                    </div>
                </div>
            </div>

            {/* Month-wise Percentage Breakdown */}
            <div className="bg-[var(--surface)] rounded-xl border border-[var(--border)] overflow-hidden">
                <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-[var(--ink)]">Month-wise Breakdown</h3>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-[var(--border)] text-[var(--ink)] hover:bg-[var(--app-bg)] transition">
                        <Download className="w-4 h-4" />
                        Export
                    </button>
                </div>

                {!percentageBreakdown?.breakdown || percentageBreakdown.breakdown.length === 0 ? (
                    <div className="p-8 text-center text-[var(--muted)]">No breakdown data for this period</div>
                ) : (
                    <div className="divide-y divide-[var(--border)]">
                        {percentageBreakdown.breakdown.map((monthData, index) => (
                            <div key={index} className="p-4">
                                <div 
                                    className="flex items-center justify-between cursor-pointer hover:bg-[var(--app-bg)] p-2 rounded-lg transition"
                                    onClick={() => toggleMonth(index)}
                                >
                                    <div className="flex items-center gap-3">
                                        {expandedMonths.has(index) ? (
                                            <ChevronUp className="w-4 h-4 text-[var(--muted)]" />
                                        ) : (
                                            <ChevronDown className="w-4 h-4 text-[var(--muted)]" />
                                        )}
                                        <div>
                                            <h4 className="font-semibold text-[var(--ink)]">{monthData.month}</h4>
                                            <p className="text-xs text-[var(--muted)]">{monthData.totalOrders} orders</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-[var(--accent-2)]">Rs {monthData.totalCommission.toFixed(2)}</p>
                                        <p className="text-xs text-[var(--muted)]">from Rs {monthData.totalSales.toFixed(2)} sales</p>
                                    </div>
                                </div>

                                {expandedMonths.has(index) && (
                                    <div className="mt-4 ml-8 border-l-2 border-[var(--border)] pl-4">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="text-xs text-[var(--muted)] uppercase">
                                                    <th className="text-left pb-2">Order #</th>
                                                    <th className="text-left pb-2">Date</th>
                                                    <th className="text-right pb-2">Amount</th>
                                                    <th className="text-right pb-2">%</th>
                                                    <th className="text-right pb-2">Commission</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {monthData.orderDetails.map((order, orderIndex) => (
                                                    <tr key={orderIndex} className="border-t border-[var(--border)]">
                                                        <td className="py-2 text-[var(--ink)]">{order.orderNumber}</td>
                                                        <td className="py-2 text-[var(--muted)]">{new Date(order.date).toLocaleDateString()}</td>
                                                        <td className="py-2 text-right text-[var(--ink)]">Rs {order.totalAmount.toFixed(2)}</td>
                                                        <td className="py-2 text-right">
                                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                                                order.percentageChange?.changeType === 'inc' ? 'bg-green-100 text-green-700' :
                                                                order.percentageChange?.changeType === 'decr' ? 'bg-red-100 text-red-700' :
                                                                'bg-blue-100 text-blue-700'
                                                            }`}>
                                                                {order.percentage}%
                                                                {order.percentageChange && (
                                                                    <span className="ml-1 opacity-70">
                                                                        ({order.percentageChange.changeType === 'inc' ? '+' : order.percentageChange.changeType === 'decr' ? '-' : ''}{order.percentageChange.percentage}%)
                                                                    </span>
                                                                )}
                                                            </span>
                                                        </td>
                                                        <td className="py-2 text-right font-semibold text-green-600">Rs {order.commission.toFixed(2)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
