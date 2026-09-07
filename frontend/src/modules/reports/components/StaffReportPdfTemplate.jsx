import React from "react";
import { Users, DollarSign, TrendingUp, Calendar } from "lucide-react";

function KpiCard({ label, description, value, icon: Icon, color, isCurrency = true }) {
    return (
        <div
            className="rounded-xl border shadow-sm p-5 transition-shadow hover:shadow-md"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
            <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                    <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{label}</p>
                    {description && (
                        <p className="text-xs mt-0.5 leading-snug" style={{ color: 'var(--muted)' }}>{description}</p>
                    )}
                </div>
                <div
                    className="shrink-0 rounded-lg p-2 flex items-center justify-center"
                    style={{ background: `${color}1A` }}
                >
                    <Icon size={18} style={{ color }} />
                </div>
            </div>
            <p className="text-2xl font-bold tabular-nums" style={{ color: 'var(--ink)' }}>
                {isCurrency ? `Rs ${value?.toLocaleString() || 0}` : (value?.toLocaleString() || 0)}
            </p>
        </div>
    );
}

function SummaryCard({ icon: Icon, label, value, description, isCurrency = true, color }) {
    return (
        <div className="rounded-xl border shadow-sm p-5" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="flex items-start gap-3 mb-2">
                <div className="shrink-0 rounded-lg p-2 flex items-center justify-center" style={{ background: 'var(--surface-muted)' }}>
                    <Icon size={18} style={{ color: color || 'var(--ink)' }} />
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{label}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{description}</p>
                </div>
            </div>
            <p className="text-xl font-bold tabular-nums" style={{ color: color || 'var(--ink)' }}>
                {isCurrency ? `Rs ${value?.toLocaleString() || 0}` : value}
            </p>
        </div>
    );
}

export default function StaffReportPdfTemplate({ summary = {}, details = {}, staffMetrics = [], labels = {}, selectedPeriodLabel = '' }) {
    return (
        <div className="p-6 bg-(--app-bg) text-(--ink) min-h-screen">
            <div className="mb-6">
                <h1 className="text-2xl font-bold font-display">{labels.staffReport}</h1>
                <p className="text-sm text-(--muted)">{labels.staffAnalysis} · {selectedPeriodLabel}</p>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
                    value={summary.totalSalaryPaid || 0} 
                    icon={DollarSign} 
                    color="#10b981" 
                    description={labels.salaryExpenses}
                />
                <KpiCard 
                    label={labels.commissionEarnings}
                    value={summary.totalCommissionEarnings || 0}
                    icon={DollarSign}
                    color="#8b5cf6"
                    description={labels.commissionRate}
                />
                <KpiCard
                    label={labels.averageSalary} 
                    value={summary.averageSalaryPaid || 0} 
                    icon={DollarSign} 
                    color="#2563eb" 
                    description={labels.perEmployee}
                />
                <KpiCard 
                    label={labels.totalExpectedSalary} 
                    value={summary.totalExpectedSalary || 0} 
                    icon={DollarSign} 
                    color="#3b82f6" 
                    description={labels.totalEarnings}
                />
                <KpiCard 
                    label={labels.remainingSalary} 
                    value={summary.totalRemaining || 0} 
                    icon={DollarSign} 
                    color="#f59e0b" 
                    description={labels.unpaidSalaries}
                />
                <KpiCard
                    label={labels.totalSales}
                    value={summary.totalSales || 0}
                    icon={TrendingUp}
                    color="#10b981"
                    description={labels.totalRevenue}
                />
                <KpiCard 
                    label={labels.totalOrders} 
                    value={summary.totalOrders || 0} 
                    icon={Users} 
                    color="#8b5cf6" 
                    description={labels.ordersHandled} 
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
                            Rs {(summary.totalSalaryPaid || 0).toLocaleString()}
                        </p>
                        <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                            {labels.totalSalaryExpenses}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm" style={{ color: 'var(--muted)' }}>{labels.staffCount}</p>
                        <p className="text-2xl font-bold" style={{ color: 'var(--ink)' }}>{details.totalStaff || 0}</p>
                        <p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>{labels.avgSalary}</p>
                        <p className="text-lg font-bold" style={{ color: 'var(--ink)' }}>Rs {(summary.averageSalaryPaid || 0).toLocaleString()}</p>
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
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>Rate</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>Commission</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>Salary</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>Total</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>Paid</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>Remaining</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>Advances</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>Payments</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                                    {staffMetrics.slice(0, 50).map((staff, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm font-medium" style={{ color: 'var(--ink)' }}>{staff.fullName || staff.name || '-'}</td>
                                            <td className="px-4 py-3 text-sm text-right" style={{ color: 'var(--ink)' }}>{staff.totalOrders || 0}</td>
                                            <td className="px-4 py-3 text-sm text-right font-medium" style={{ color: '#10b981' }}>Rs {(staff.totalSales || 0).toLocaleString()}</td>
                                            <td className="px-4 py-3 text-sm text-right" style={{ color: 'var(--ink)' }}>{staff.commissionRate || 0}%</td>
                                            <td className="px-4 py-3 text-sm text-right" style={{ color: '#8b5cf6' }}>Rs {(staff.totalCommissionEarnings || 0).toLocaleString()}</td>
                                            <td className="px-4 py-3 text-sm text-right" style={{ color: 'var(--ink)' }}>Rs {(staff.totalSalaryEarnings || 0).toLocaleString()}</td>
                                            <td className="px-4 py-3 text-sm text-right font-medium" style={{ color: '#3b82f6' }}>Rs {(staff.totalEarnings || 0).toLocaleString()}</td>
                                            <td className="px-4 py-3 text-sm text-right font-medium" style={{ color: '#10b981' }}>Rs {(staff.totalPaid || 0).toLocaleString()}</td>
                                            <td className="px-4 py-3 text-sm text-right" style={{ color: staff.totalRemaining > 0 ? '#f59e0b' : '#10b981' }}>Rs {(staff.totalRemaining || 0).toLocaleString()}</td>
                                            <td className="px-4 py-3 text-sm text-right" style={{ color: '#dc2626' }}>Rs {(staff.totalAdvance || 0).toLocaleString()}</td>
                                            <td className="px-4 py-3 text-sm text-right" style={{ color: 'var(--ink)' }}>{staff.paymentCount || 0}</td>
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
            </div>
        </div>
    );
}
