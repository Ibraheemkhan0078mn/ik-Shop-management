import React, { useState } from "react";
import { Calendar, Download, Printer, FileSpreadsheet, FileText, Filter, RefreshCw } from "lucide-react";
import { useGetStaffReportQuery } from "../services/reports.service.js";
import { useGetStaffListQuery } from "../../staff/api/staff.api.js";

export default function StaffReport() {
    const [filters, setFilters] = useState({
        fromDate: '',
        toDate: '',
        staffId: '',
        orderType: 'both',
    });

    const { data: reportData, isLoading, refetch } = useGetStaffReportQuery(filters);
    const { data: staffList } = useGetStaffListQuery({ status: 'active' });

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handlePrint = () => {
        window.print();
    };

    const handleExportPDF = () => {
        // TODO: Implement PDF export
        console.log('Export PDF');
    };

    const handleExportExcel = () => {
        // TODO: Implement Excel export
        console.log('Export Excel');
    };

    return (
        <div className="p-6 bg-[var(--app-bg)] min-h-screen">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--ink)] font-display">Staff Report</h1>
                    <p className="text-sm text-[var(--muted)]">Comprehensive staff performance and salary report</p>
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
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                        <label className="block text-sm text-[var(--muted)] mb-1">Staff</label>
                        <select
                            value={filters.staffId}
                            onChange={(e) => handleFilterChange('staffId', e.target.value)}
                            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]"
                        >
                            <option value="">All Staff</option>
                            {staffList?.data?.map(staff => (
                                <option key={staff._id} value={staff._id}>{staff.fullName}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-[var(--muted)] mb-1">Order Type</label>
                        <select
                            value={filters.orderType}
                            onChange={(e) => handleFilterChange('orderType', e.target.value)}
                            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]"
                        >
                            <option value="both">Both</option>
                            <option value="retail">Retail</option>
                            <option value="wholesale">Wholesale</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Report Table */}
            {isLoading ? (
                <div className="card p-8 text-center text-[var(--muted)]">Loading...</div>
            ) : (
                <div className="card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[var(--app-bg)]">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Rank</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Staff Name</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Staff ID</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Total Orders</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Total Sales</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Retail Sales</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Wholesale Sales</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Present Days</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Absent Days</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Working Hours</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Salary Paid</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Advance</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Deductions</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-[var(--muted)] uppercase tracking-wider">Net Payable</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border)]">
                                {reportData?.data?.map((staff) => (
                                    <tr key={staff._id} className="hover:bg-[var(--hover)]">
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                                                staff.rank === 1 ? 'bg-yellow-400 text-white' :
                                                staff.rank === 2 ? 'bg-gray-400 text-white' :
                                                staff.rank === 3 ? 'bg-orange-400 text-white' :
                                                'bg-gray-200 text-gray-600'
                                            }`}>
                                                {staff.rank}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-[var(--ink)]">{staff.fullName}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-[var(--muted)]">{staff._id}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-[var(--ink)]">{staff.totalOrders}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-[var(--ink)]">{staff.totalSales.toFixed(2)}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-[var(--ink)]">{staff.retailSales.toFixed(2)}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-[var(--ink)]">{staff.wholesaleSales.toFixed(2)}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-[var(--ink)]">{staff.totalPresentDays}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-[var(--ink)]">{staff.totalAbsentDays}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-[var(--ink)]">{staff.totalWorkingHours.toFixed(1)}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-[var(--ink)]">{staff.salaryPaid.toFixed(2)}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-[var(--ink)]">{staff.advance.toFixed(2)}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-[var(--ink)]">{staff.deductions.toFixed(2)}</td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-[var(--accent-2)]">{staff.netPayable.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            {reportData?.summary && (
                                <tfoot className="bg-[var(--app-bg)] font-bold">
                                    <tr>
                                        <td colSpan={3} className="px-4 py-3 text-sm text-[var(--ink)]">Grand Total</td>
                                        <td className="px-4 py-3 text-sm text-right text-[var(--ink)]">{reportData.summary.grandTotalOrders}</td>
                                        <td className="px-4 py-3 text-sm text-right text-[var(--ink)]">{reportData.summary.grandTotalSales.toFixed(2)}</td>
                                        <td className="px-4 py-3 text-sm text-right text-[var(--muted)]">-</td>
                                        <td className="px-4 py-3 text-sm text-right text-[var(--muted)]">-</td>
                                        <td className="px-4 py-3 text-sm text-right text-[var(--muted)]">-</td>
                                        <td className="px-4 py-3 text-sm text-right text-[var(--muted)]">-</td>
                                        <td className="px-4 py-3 text-sm text-right text-[var(--muted)]">-</td>
                                        <td className="px-4 py-3 text-sm text-right text-[var(--ink)]">{reportData.summary.grandTotalSalaryPaid.toFixed(2)}</td>
                                        <td className="px-4 py-3 text-sm text-right text-[var(--muted)]">-</td>
                                        <td className="px-4 py-3 text-sm text-right text-[var(--muted)]">-</td>
                                        <td className="px-4 py-3 text-sm text-right text-[var(--accent-2)]">-</td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
