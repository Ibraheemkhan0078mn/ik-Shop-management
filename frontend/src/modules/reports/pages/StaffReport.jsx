import React, { useState, useRef, useMemo } from "react";
import { Download, RefreshCw, Users, DollarSign, TrendingUp, Clock, Calendar, Filter } from "lucide-react";
import { useGetStaffReportQuery } from "../services/reports.service.js";
import { useGetStaffListQuery } from "../../staff/api/staff.api.js";
import { showError } from "../../../shared/utilities/toastHelpers.js";
import PdfPreviewModal from "../../../shared/components/PdfPreviewModal.jsx";
import { 
    KpiCard, 
    LoadingSpinner,
    SummaryCard,
    SourceSection
} from "../components/ReportComponents.jsx";

export default function StaffReport() {
    const targetRef = useRef(null);
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
                    <h1 className="text-2xl font-bold text-[var(--ink)] font-display">Staff Report</h1>
                    <p className="text-sm text-[var(--muted)]">Comprehensive staff performance, attendance, and salary report</p>
                </div>
                <div className="flex gap-2 no-print">
                    <button
                        onClick={handleRefresh}
                        className="px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--app-bg)] transition-colors flex items-center gap-2"
                    >
                        <RefreshCw size={16} className={showLoader ? "animate-spin" : ""} />
                        Refresh
                    </button>
                    <button
                        onClick={() => setIsPdfModalOpen(true)}
                        className="px-4 py-2 rounded-lg text-white transition-colors flex items-center gap-2"
                        style={{ background: 'var(--accent-2)' }}
                    >
                        Export PDF
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="card p-4 mb-6 no-print">
                <div className="flex items-center gap-2 mb-3">
                    <Filter size={16} className="text-[var(--accent-2)]" />
                    <span className="text-sm font-semibold text-[var(--ink)]">Filters</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="text-xs font-medium text-[var(--muted)] mb-1 block">Period</label>
                        <select
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]/20"
                        >
                            <option value="today">Today</option>
                            <option value="month">This Month</option>
                            <option value="3month">Last 3 Months</option>
                            <option value="year">This Year</option>
                            <option value="custom">Custom Range</option>
                        </select>
                    </div>
                    {period === "custom" && (
                        <>
                            <div>
                                <label className="text-xs font-medium text-[var(--muted)] mb-1 block">From Date</label>
                                <input
                                    type="date"
                                    value={fromDate}
                                    onChange={(e) => setFromDate(e.target.value)}
                                    className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]/20"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-[var(--muted)] mb-1 block">To Date</label>
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
                        <label className="text-xs font-medium text-[var(--muted)] mb-1 block">Staff Member</label>
                        <select
                            value={staffId}
                            onChange={(e) => setStaffId(e.target.value)}
                            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]/20"
                        >
                            <option value="">All Staff</option>
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
                <div ref={targetRef}>
                    {/* KPI Grid Row 1 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <KpiCard 
                            label="Total Staff" 
                            value={details.totalStaff || 0} 
                            icon={Users} 
                            color="#8b5cf6" 
                            description="Active staff members" 
                            isCurrency={false}
                        />
                        <KpiCard 
                            label="Total Salaries Paid" 
                            value={summary.totalSalariesPaid} 
                            icon={DollarSign} 
                            color="#10b981" 
                            description="Salary expenses"
                        />
                        <KpiCard 
                            label="Average Salary" 
                            value={summary.averageSalary} 
                            icon={DollarSign} 
                            color="#2563eb" 
                            description="Per employee"
                        />
                        <KpiCard 
                            label="Total Advances" 
                            value={summary.totalAdvances} 
                            icon={DollarSign} 
                            color="#f59e0b" 
                            description="Salary advances given"
                        />
                    </div>

                    {/* KPI Grid Row 2 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <KpiCard 
                            label="Total Working Hours" 
                            value={summary.totalWorkingHours || 0} 
                            icon={Clock} 
                            color="#06b6d4" 
                            description="Cumulative hours worked" 
                            isCurrency={false}
                        />
                        <KpiCard 
                            label="Average Attendance %" 
                            value={summary.avgAttendancePercent || 0} 
                            icon={Calendar} 
                            color="#16a34a" 
                            description="Present days percentage" 
                            isCurrency={false}
                        />
                        <KpiCard 
                            label="Total Present Days" 
                            value={summary.totalPresentDays || 0} 
                            icon={Users} 
                            color="#059669" 
                            description="Sum of present days" 
                            isCurrency={false}
                        />
                        <KpiCard 
                            label="Total Absent Days" 
                            value={summary.totalAbsentDays || 0} 
                            icon={Users} 
                            color="#dc2626" 
                            description="Sum of absent days" 
                            isCurrency={false}
                        />
                    </div>

                    {/* Summary Card */}
                    <div className="rounded-xl border-2 shadow-sm p-6 mb-6" style={{ background: 'var(--surface)', borderColor: '#8b5cf6' }}>
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <Users size={22} style={{ color: '#8b5cf6' }} />
                                    <span className="text-sm font-semibold" style={{ color: 'var(--muted)' }}>PAYROLL SUMMARY</span>
                                </div>
                                <p className="text-3xl font-bold" style={{ color: '#8b5cf6' }}>
                                    Rs {(summary.totalSalariesPaid || 0).toLocaleString()}
                                </p>
                                <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                                    Total salary expenses
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm" style={{ color: 'var(--muted)' }}>Staff Count</p>
                                <p className="text-2xl font-bold" style={{ color: 'var(--ink)' }}>{details.totalStaff || 0}</p>
                                <p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>Avg Salary</p>
                                <p className="text-lg font-bold" style={{ color: 'var(--ink)' }}>Rs {(summary.averageSalary || 0).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    {/* Staff Performance Section */}
                    {staffMetrics && staffMetrics.length > 0 && (
                        <div className="space-y-4 mb-6">
                            <h2 className="text-lg font-semibold" style={{ color: 'var(--ink)' }}>Staff Performance</h2>

                            <div className="rounded-xl border shadow-sm" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead style={{ background: 'var(--surface-muted)' }}>
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>Staff Name</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>Orders</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>Sales</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>Present Days</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>Absent Days</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>Working Hours</th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>Salary Paid</th>
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
                            label="Top Performer"
                            value={summary.topPerformer || 'N/A'}
                            description="Highest sales staff"
                            isCurrency={false}
                            color="var(--ink)"
                        />
                        <SummaryCard 
                            icon={Users}
                            label="Avg Working Hours"
                            value={summary.avgWorkingHours || 0}
                            description="Per staff member"
                            isCurrency={false}
                            color="var(--ink)"
                        />
                        <SummaryCard 
                            icon={Calendar}
                            label="Highest Attendance"
                            value={summary.highestAttendance || 0}
                            description="Percentage"
                            isCurrency={false}
                            color="var(--ink)"
                        />
                    </div>
                </div>
            )}

            {/* PDF Modal */}
            {isPdfModalOpen && (
                <PdfPreviewModal
                    title="Staff Report"
                    contentRef={targetRef}
                    onClose={() => setIsPdfModalOpen(false)}
                />
            )}
        </div>
    );
}
