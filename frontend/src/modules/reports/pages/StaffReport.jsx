import React, { useState, useMemo } from "react";
import { Download, RefreshCw, Users, DollarSign, TrendingUp, Clock, Calendar, Filter } from "lucide-react";
import { useGetStaffReportQuery } from "../services/reports.service.js";
import { useGetStaffListQuery } from "../../staff/api/staff.api.js";
import { showError } from "../../../shared/utilities/toastHelpers.js";
import PdfModal from "../../../shared/components/PdfModal.jsx";
import StaffReportPdfTemplate from "../components/StaffReportPdfTemplate.jsx";
import { useSettings } from "../../settings/hooks/useSettings.js";
import { getReportsLabels } from "../labels/reportsLabels.js";
import { 
    KpiCard, 
    LoadingSpinner,
    SummaryCard,
    SourceSection
} from "../components/ReportComponents.jsx";

export default function StaffReport() {
    const { settings } = useSettings();
    const language = settings?.language || "en";
    const labels = getReportsLabels(language);
    const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
    const [period, setPeriod] = useState("today");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [staffId, setStaffId] = useState("");
    const [expandedSections, setExpandedSections] = useState({});

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
    
    const { data: reportData, isLoading, error, refetch } = useGetStaffReportQuery({
        fromDate: period === "custom" ? fromDate : dates.from,
        toDate: period === "custom" ? toDate : dates.to,
        staffId,
    });
    const { data: staffList } = useGetStaffListQuery({ status: 'active' });

    if (error) {
        showError(error?.data?.message || "Failed to load staff report");
    }

    const handleRefresh = () => refetch();
    const showLoader = isLoading;

    const toggleSection = (key) => {
        setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const summary = reportData?.data?.summary || {};
    const details = reportData?.data?.details || {};
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
                    {/* KPI Grid Row 1 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <KpiCard 
                            label={labels.totalStaff} 
                            value={details.totalStaff || 0} 
                            icon={Users} 
                            color="#8b5cf6" 
                            description={labels.activeStaffMembers} 
                            isCurrency={false}
                        />
                        <KpiCard 
                            label={labels.totalSalariesPaid} 
                            value={summary.totalSalariesPaid} 
                            icon={DollarSign} 
                            color="#10b981" 
                            description={labels.salaryExpenses}
                        />
                        <KpiCard 
                            label={labels.averageSalary} 
                            value={summary.averageSalary} 
                            icon={DollarSign} 
                            color="#2563eb" 
                            description={labels.perEmployee}
                        />
                        <KpiCard 
                            label={labels.totalAdvances} 
                            value={summary.totalAdvances} 
                            icon={DollarSign} 
                            color="#f59e0b" 
                            description={labels.salaryAdvancesGiven}
                        />
                    </div>

                    {/* KPI Grid Row 2 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <KpiCard 
                            label={labels.totalWorkingHours} 
                            value={summary.totalWorkingHours || 0} 
                            icon={Clock} 
                            color="#06b6d4" 
                            description={labels.cumulativeHoursWorked} 
                            isCurrency={false}
                        />
                        <KpiCard 
                            label={labels.averageAttendance} 
                            value={summary.avgAttendancePercent || 0} 
                            icon={Calendar} 
                            color="#16a34a" 
                            description={labels.presentDaysPercentage} 
                            isCurrency={false}
                        />
                        <KpiCard 
                            label={labels.totalPresentDays} 
                            value={summary.totalPresentDays || 0} 
                            icon={Users} 
                            color="#059669" 
                            description={labels.sumOfPresentDays} 
                            isCurrency={false}
                        />
                        <KpiCard 
                            label={labels.totalAbsentDays} 
                            value={summary.totalAbsentDays || 0} 
                            icon={Users} 
                            color="#dc2626" 
                            description={labels.sumOfAbsentDays} 
                            isCurrency={false}
                        />
                    </div>

                    {/* Summary Card */}
                    <div className="rounded-xl border-2 shadow-sm p-6 mb-6" style={{ background: 'var(--surface)', borderColor: '#8b5cf6' }}>
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <Users size={22} style={{ color: '#8b5cf6' }} />
                                    <span className="text-sm font-semibold" style={{ color: 'var(--muted)' }}>{labels.payrollSummary}</span>
                                </div>
                                <p className="text-3xl font-bold" style={{ color: '#8b5cf6' }}>
                                    Rs {(summary.totalSalariesPaid || 0).toLocaleString()}
                                </p>
                                <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                                    {labels.totalSalaryExpenses}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm" style={{ color: 'var(--muted)' }}>{labels.staffCount}</p>
                                <p className="text-2xl font-bold" style={{ color: 'var(--ink)' }}>{details.totalStaff || 0}</p>
                                <p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>{labels.avgSalary}</p>
                                <p className="text-lg font-bold" style={{ color: 'var(--ink)' }}>Rs {(summary.averageSalary || 0).toLocaleString()}</p>
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
                                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>{labels.orders}</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>{labels.sales}</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>{labels.presentDays}</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>{labels.absentDays}</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>{labels.workingHours}</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>{labels.salaryPaid}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                                            {staffMetrics.slice(0, 50).map((staff, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3 text-sm font-medium" style={{ color: 'var(--ink)' }}>{staff.staffName || staff.name || '-'}</td>
                                                    <td className="px-4 py-3 text-sm text-right" style={{ color: 'var(--ink)' }}>{staff.totalOrders || 0}</td>
                                                    <td className="px-4 py-3 text-sm text-right font-medium" style={{ color: '#10b981' }}>Rs {(staff.totalSales || 0).toLocaleString()}</td>
                                                    <td className="px-4 py-3 text-sm text-right" style={{ color: 'var(--ink)' }}>{staff.presentDays || 0}</td>
                                                    <td className="px-4 py-3 text-sm text-right" style={{ color: '#dc2626' }}>{staff.absentDays || 0}</td>
                                                    <td className="px-4 py-3 text-sm text-right" style={{ color: 'var(--ink)' }}>{staff.workingHours || 0} hrs</td>
                                                    <td className="px-4 py-3 text-sm text-right font-medium" style={{ color: '#8b5cf6' }}>Rs {(staff.salaryPaid || 0).toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Additional Metrics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <SummaryCard 
                            icon={TrendingUp}
                            label={labels.topPerformer}
                            value={summary.topPerformer || 'N/A'}
                            description={labels.highestSalesStaff}
                            isCurrency={false}
                            color="var(--ink)"
                        />
                        <SummaryCard 
                            icon={Users}
                            label={labels.avgWorkingHours}
                            value={summary.avgWorkingHours || 0}
                            description={labels.perStaffMember}
                            isCurrency={false}
                            color="var(--ink)"
                        />
                        <SummaryCard 
                            icon={Calendar}
                            label={labels.highestAttendance}
                            value={summary.highestAttendance || 0}
                            description={labels.percentage}
                            isCurrency={false}
                            color="var(--ink)"
                        />
                    </div>
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
                    selectedPeriodLabel={period === "custom" ? `${fromDate} to ${toDate}` : labels[period] || period}
                />
            </PdfModal>
        </div>
    );
}
