import React from "react";
import { Percent, TrendingUp, ShoppingCart, DollarSign } from "lucide-react";
import { useGetStaffCommissionQuery } from "../api/staff.api.js";

export default function StaffCommissionKPI({ staffId, startDate, endDate }) {
    const { data: commissionResponse, isLoading, error } = useGetStaffCommissionQuery(
        { id: staffId, startDate, endDate },
        { skip: !staffId }
    );

    const commissionData = commissionResponse?.data;

    if (isLoading) {
        return (
            <div className="bg-[var(--surface)] rounded-xl p-4 border border-[var(--border)] animate-pulse">
                <div className="h-4 bg-[var(--app-bg)] rounded w-1/3 mb-3"></div>
                <div className="h-8 bg-[var(--app-bg)] rounded w-1/2"></div>
            </div>
        );
    }

    if (error || !commissionData) {
        return null;
    }

    const { totalCommission = 0, totalOrders = 0, totalSales = 0 } = commissionData;

    return (
        <div className="bg-[var(--surface)] rounded-xl p-5 border border-[var(--border)]">
            <div className="flex items-center gap-2 mb-4">
                <Percent className="w-5 h-5 text-[var(--accent-2)]" />
                <h3 className="text-sm font-semibold text-[var(--ink)]">Commission Share</h3>
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
    );
}
