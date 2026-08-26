import React, { useState, useMemo } from "react";
import { RefreshCw, Users, DollarSign, Filter, AlertCircle, Star } from "lucide-react";
import { useGetStaffReportQuery, useGetStaffKPIReportQuery } from "../services/reports.service.js";
import { useGetStaffListQuery } from "../../staff/api/staff.api.js";
import { showError } from "../../../shared/utilities/toastHelpers.js";
import PdfModal from "../../../shared/components/PdfModal.jsx";
import StaffReportPdfTemplate from "../components/StaffReportPdfTemplate.jsx";
import { useSettings } from "../../settings/hooks/useSettings.js";
import { getReportsLabels } from "../labels/reportsLabels.js";

const getDatesFromPeriod = (periodValue, fromDate, toDate) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (periodValue) {
        case "today":
            return { from: today.toISOString().split('T')[0], to: today.toISOString().split('T')[0] };
        case "month": {
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
            const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            return { from: monthStart.toISOString().split('T')[0], to: monthEnd.toISOString().split('T')[0] };
        }
        case "3month": {
            const threeMonthStart = new Date(now.getFullYear(), now.getMonth() - 3, 1);
            const threeMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            return { from: threeMonthStart.toISOString().split('T')[0], to: threeMonthEnd.toISOString().split('T')[0] };
        }
        case "year": {
            const yearStart = new Date(now.getFullYear(), 0, 1);
            const yearEnd = new Date(now.getFullYear(), 11, 31);
            return { from: yearStart.toISOString().split('T')[0], to: yearEnd.toISOString().split('T')[0] };
        }
        case "custom":
        default:
            return { from: fromDate, to: toDate };
    }
};

function getInitials(name) {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.[0] || "";
    const second = parts.length > 1 ? parts[1][0] : "";
    return (first + second).toUpperCase();
}

function Avatar({ name }) {
    return (
        <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            style={{ background: 'var(--accent-2)17', color: 'var(--accent-2)' }}
        >
            {getInitials(name)}
        </div>
    );
}

function KpiCard({ label, value, sub, icon: Icon, color }) {
    return (
        <div className="rounded-2xl border p-4 transition-shadow hover:shadow-sm" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}17` }}>
                    <Icon size={18} style={{ color }} />
                </div>
                <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-wide truncate" style={{ color: 'var(--muted)' }}>{label}</p>
                    <p className="text-sm font-bold tabular-nums truncate" style={{ color: 'var(--ink)' }}>{value}</p>
                    {sub && <p className="text-xs truncate" style={{ color: 'var(--muted)' }}>{sub}</p>}
                </div>
            </div>
        </div>
    );
}

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
        <div className="p-6 min-h-screen" style={{ background: 'var(--app-bg)' }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold font-display" style={{ color: 'var(--ink)' }}>{labels.staffReport}</h1>
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>{labels.staffAnalysis}</p>
                </div>
                <div className="flex gap-2 no-print">
                    <button
                        onClick={handleRefresh}
                        className="px-4 py-2 rounded-xl border transition-colors flex items-center gap-2"
                        style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--ink)' }}
                    >
                        <RefreshCw size={16} className={showLoader ? "animate-spin" : ""} style={{ color: 'var(--accent-2)' }} />
                        {labels.refresh}
                    </button>
                    <button
                        onClick={() => setIsPdfModalOpen(true)}
                        className="px-4 py-2 rounded-xl text-white transition-opacity hover:opacity-90 flex items-center gap-2"
                        style={{ background: 'var(--accent-2)' }}
                    >
                        {labels.exportPdf}
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="rounded-2xl border p-4 mb-6 no-print" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-2 mb-3">
                    <Filter size={16} style={{ color: 'var(--accent-2)' }} />
                    <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{labels.filters}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--muted)' }}>{labels.period}</label>
                        <select
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2"
                            style={{ borderColor: 'var(--border)', background: 'var(--app-bg)', color: 'var(--ink)' }}
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
                                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--muted)' }}>{labels.fromDate}</label>
                                <input
                                    type="date"
                                    value={fromDate}
                                    onChange={(e) => setFromDate(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2"
                                    style={{ borderColor: 'var(--border)', background: 'var(--app-bg)', color: 'var(--ink)' }}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--muted)' }}>{labels.toDate}</label>
                                <input
                                    type="date"
                                    value={toDate}
                                    onChange={(e) => setToDate(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2"
                                    style={{ borderColor: 'var(--border)', background: 'var(--app-bg)', color: 'var(--ink)' }}
                                />
                            </div>
                        </>
                    )}
                    <div>
                        <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--muted)' }}>{labels.staffMember}</label>
                        <select
                            value={staffId}
                            onChange={(e) => setStaffId(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2"
                            style={{ borderColor: 'var(--border)', background: 'var(--app-bg)', color: 'var(--ink)' }}
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
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--accent-2)' }}></div>
                </div>
            ) : (
                <div>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
                        <KpiCard label={labels.totalStaff} value={summary.totalStaff || 0} icon={Users} color="var(--accent-2)" />
                        <KpiCard label={labels.totalExpectedSalary} value={`Rs ${(summary.totalExpectedSalary || 0).toLocaleString()}`} icon={DollarSign} color="#3b82f6" />
                        <KpiCard label={labels.totalSalariesPaid} value={`Rs ${(summary.totalSalariesPaid || 0).toLocaleString()}`} icon={DollarSign} color="#10b981" />
                        <KpiCard label={labels.remainingSalary} value={`Rs ${(summary.remainingSalary || 0).toLocaleString()}`} icon={AlertCircle} color="#f59e0b" />
                        <KpiCard label={labels.totalAdvances} value={`Rs ${(summary.totalAdvances || 0).toLocaleString()}`} icon={AlertCircle} color="#dc2626" />
                        <KpiCard label={labels.topPerformer} value={summary.topPerformer || "—"} icon={Star} color="#8b5cf6" />
                    </div>

                    {/* Staff Performance Section */}
                    {staffMetrics && staffMetrics.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-lg font-semibold" style={{ color: 'var(--ink)' }}>{labels.staffPerformance}</h2>

                            <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead style={{ background: 'var(--surface-muted)' }}>
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>{labels.staffName}</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>{labels.ordersHandled}</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>{labels.sales}</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>{labels.totalExpectedSalary}</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>{labels.totalSalariesPaid}</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>{labels.remainingSalary}</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>{labels.totalAdvances}</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>{labels.totalPresentDays}</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>{labels.totalAbsentDays}</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>{labels.totalWorkingHours}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                                            {staffMetrics.slice(0, 50).map((staff, idx) => (
                                                <tr key={idx} className="transition-colors" style={{ background: 'transparent' }}
                                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-muted)'}
                                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                                    <td className="px-4 py-3 text-sm font-medium" style={{ color: 'var(--ink)' }}>
                                                        <div className="flex items-center gap-2.5">
                                                            <Avatar name={staff.name || staff.fullName} />
                                                            <span>{staff.name || staff.fullName || '-'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-right tabular-nums" style={{ color: 'var(--ink)' }}>{staff.totalOrders || 0}</td>
                                                    <td className="px-4 py-3 text-sm text-right font-medium tabular-nums" style={{ color: '#10b981' }}>Rs {(staff.totalSales || 0).toLocaleString()}</td>
                                                    <td className="px-4 py-3 text-sm text-right tabular-nums" style={{ color: 'var(--ink)' }}>Rs {(staff.expectedSalary || 0).toLocaleString()}</td>
                                                    <td className="px-4 py-3 text-sm text-right font-medium tabular-nums" style={{ color: '#8b5cf6' }}>Rs {(staff.salaryPaid || 0).toLocaleString()}</td>
                                                    <td className="px-4 py-3 text-sm text-right font-medium tabular-nums" style={{ color: staff.remainingSalary >= 0 ? '#f59e0b' : '#dc2626' }}>Rs {(staff.remainingSalary || 0).toLocaleString()}</td>
                                                    <td className="px-4 py-3 text-sm text-right tabular-nums" style={{ color: 'var(--ink)' }}>Rs {(staff.advance || 0).toLocaleString()}</td>
                                                    <td className="px-4 py-3 text-sm text-right tabular-nums" style={{ color: 'var(--ink)' }}>{staff.totalPresentDays || 0}</td>
                                                    <td className="px-4 py-3 text-sm text-right tabular-nums" style={{ color: '#dc2626' }}>{staff.totalAbsentDays || 0}</td>
                                                    <td className="px-4 py-3 text-sm text-right tabular-nums" style={{ color: 'var(--ink)' }}>{staff.totalWorkingHours?.toFixed(1) || 0} hrs</td>
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