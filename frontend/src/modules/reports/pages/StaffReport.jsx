import React, { useState, useMemo } from "react";
import { RefreshCw, Users, DollarSign, Filter, AlertCircle, Star } from "lucide-react";
import { useGetStaffReportQuery, useGetStaffKPIReportQuery } from "../services/reports.service.js";
import { useGetStaffListQuery } from "../../staff/api/staff.api.js";
import { showError } from "../../../shared/utilities/toastHelpers.js";
import PdfModal from "../../../shared/components/PdfModal.jsx";
import StaffReportPdfTemplate from "../components/StaffReportPdfTemplate.jsx";
import { useSettings } from "../../settings/hooks/useSettings.js";
import { getReportsLabels } from "../labels/reportsLabels.js";

// Calculate date range based on period
const getDatesFromPeriod = (periodValue, fromDate, toDate) => {
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

export default function StaffReport() {
    const { settings } = useSettings();
    const language = settings?.language || "en";
    const labels = getReportsLabels(language);
    const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
    const [period, setPeriod] = useState("month");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [staffId, setStaffId] = useState("");

    const dates = useMemo(() => getDatesFromPeriod(period, fromDate, toDate), [period, fromDate, toDate]);
    
    const { data: reportData, isLoading, error, refetch } = useGetStaffReportQuery({
        fromDate: dates.from,
        toDate: dates.to,
        staffId,
        page: 1,
        limit: 50,
    });
    const { data: kpiData } = useGetStaffKPIReportQuery({
        fromDate: dates.from,
        toDate: dates.to,
        staffId,
    });
    const { data: staffList } = useGetStaffListQuery({ status: 'active' });

    if (error) {
        showError(error?.data?.message || "Failed to load staff report");
    }

    const handleRefresh = () => refetch();
    const showLoader = isLoading;

    const summary = kpiData?.data?.data?.summary || {};
    const details = kpiData?.data?.data?.details || {};
    const staffMetrics = reportData?.data?.staffMetrics || [];

    return (
        <div className="p-6 min-h-screen bg-[var(--app-bg)]">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--ink)] font-display">{labels.staffReport}</h1>
                    <p className="text-sm text-[var(--muted)]">{labels.staffAnalysis}</p>
                </div>
                <div className="flex gap-2 no-print">
                    <button
                        onClick={handleRefresh}
                        className="px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--app-bg)] transition-colors flex items-center gap-2"
                    >
                        <RefreshCw size={16} className={showLoader ? "animate-spin" : ""} />
                        {labels.refresh}
                    </button>
                    <button
                        onClick={() => setIsPdfModalOpen(true)}
                        className="px-4 py-2 rounded-lg text-white transition-colors flex items-center gap-2"
                        style={{ background: 'var(--accent-2)' }}
                    >
                        {labels.exportPdf}
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="card p-4 mb-6 no-print">
                <div className="flex items-center gap-2 mb-3">
                    <Filter size={16} className="text-[var(--accent-2)]" />
                    <span className="text-sm font-semibold text-[var(--ink)]">{labels.filters}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                                    onChange={(e) => setFromDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]/20"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-[var(--muted)] mb-1 block">{labels.toDate}</label>
                                <input
                                    type="date"
                                    value={toDate}
                                    onChange={(e) => setToDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]/20"
                                />
                            </div>
                        </>
                    )}
                    <div>
                        <label className="text-xs font-medium text-[var(--muted)] mb-1 block">{labels.staffMember}</label>
                        <select
                            value={staffId}
                            onChange={(e) => setStaffId(e.target.value)}
                            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]/20"
                        >
                            <option value="">{labels.allStaff}</option>
                            {staffList?.data?.map(staff => (
                                <option key={staff._id} value={staff._id}>{staff.name || staff.fullName}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Content */}
            {showLoader ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-2)]"></div>
                </div>
            ) : (
                <div>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
                        <div className="card p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-[var(--accent-2)]/10 flex items-center justify-center">
                                    <Users size={20} className="text-[var(--accent-2)]" />
                                </div>
                                <div>
                                    <p className="text-xs text-[var(--muted)] uppercase font-bold">{labels.totalStaff}</p>
                                    <p className="font-semibold text-[var(--ink)]">
                                        {summary.totalStaff || 0}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="card p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                    <DollarSign size={20} className="text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-[var(--muted)] uppercase font-bold">{labels.totalExpectedSalary}</p>
                                    <p className="font-semibold text-[var(--ink)]">
                                        Rs {(summary.totalExpectedSalary || 0).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="card p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                    <DollarSign size={20} className="text-green-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-[var(--muted)] uppercase font-bold">{labels.totalSalariesPaid}</p>
                                    <p className="font-semibold text-[var(--ink)]">
                                        Rs {(summary.totalSalariesPaid || 0).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="card p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                                    <AlertCircle size={20} className="text-orange-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-[var(--muted)] uppercase font-bold">{labels.remainingSalary}</p>
                                    <p className="font-semibold text-[var(--ink)]">
                                        Rs {(summary.remainingSalary || 0).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="card p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                                    <AlertCircle size={20} className="text-red-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-[var(--muted)] uppercase font-bold">{labels.totalAdvances}</p>
                                    <p className="font-semibold text-[var(--ink)]">
                                        Rs {(summary.totalAdvances || 0).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="card p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                                    <Star size={20} className="text-yellow-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-[var(--muted)] uppercase font-bold">{labels.topPerformer}</p>
                                    <p className="font-semibold text-[var(--ink)] text-sm truncate max-w-[150px]">
                                        {summary.topPerformer || "—"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Staff Performance Section */}
                    {staffMetrics && staffMetrics.length > 0 && (
                        <div className="space-y-4 mb-6">
                            <h2 className="text-lg font-semibold" style={{ color: 'var(--ink)' }}>{labels.staffPerformance}</h2>

                            <div className="rounded-xl border shadow-sm" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead style={{ background: 'var(--surface-muted)' }}>
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>{labels.staffName}</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>{labels.ordersHandled}</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>{labels.sales}</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>{labels.totalExpectedSalary}</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>{labels.totalSalariesPaid}</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>{labels.remainingSalary}</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>{labels.totalAdvances}</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>{labels.totalPresentDays}</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>{labels.totalAbsentDays}</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>{labels.totalWorkingHours}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                                            {staffMetrics.slice(0, 50).map((staff, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3 text-sm font-medium" style={{ color: 'var(--ink)' }}>{staff.name || staff.fullName || '-'}</td>
                                                    <td className="px-4 py-3 text-sm text-right" style={{ color: 'var(--ink)' }}>{staff.totalOrders || 0}</td>
                                                    <td className="px-4 py-3 text-sm text-right font-medium" style={{ color: '#10b981' }}>Rs {(staff.totalSales || 0).toLocaleString()}</td>
                                                    <td className="px-4 py-3 text-sm text-right" style={{ color: 'var(--ink)' }}>Rs {(staff.expectedSalary || 0).toLocaleString()}</td>
                                                    <td className="px-4 py-3 text-sm text-right font-medium" style={{ color: '#8b5cf6' }}>Rs {(staff.salaryPaid || 0).toLocaleString()}</td>
                                                    <td className="px-4 py-3 text-sm text-right font-medium" style={{ color: staff.remainingSalary >= 0 ? '#f59e0b' : '#dc2626' }}>Rs {(staff.remainingSalary || 0).toLocaleString()}</td>
                                                    <td className="px-4 py-3 text-sm text-right" style={{ color: 'var(--ink)' }}>Rs {(staff.advance || 0).toLocaleString()}</td>
                                                    <td className="px-4 py-3 text-sm text-right" style={{ color: 'var(--ink)' }}>{staff.totalPresentDays || 0}</td>
                                                    <td className="px-4 py-3 text-sm text-right" style={{ color: '#dc2626' }}>{staff.totalAbsentDays || 0}</td>
                                                    <td className="px-4 py-3 text-sm text-right" style={{ color: 'var(--ink)' }}>{staff.totalWorkingHours?.toFixed(1) || 0} hrs</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* PDF Modal */}
            <PdfModal
                isOpen={isPdfModalOpen}
                onClose={() => setIsPdfModalOpen(false)}
                fileName={`${labels.staffReport}.pdf`}
                labels={labels}
            >
                <StaffReportPdfTemplate
                    summary={summary}
                    details={details}
                    staffMetrics={staffMetrics}
                    labels={labels}
                    selectedPeriodLabel={labels[period] || period}
                />
            </PdfModal>
        </div>
    );
}
