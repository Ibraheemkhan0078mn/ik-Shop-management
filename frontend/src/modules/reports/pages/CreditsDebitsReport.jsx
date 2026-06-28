import { useState, useEffect } from "react";
import { Calendar, Filter, Download, Printer, FileText, ArrowRight, Wallet, ChevronRight, TrendingUp, TrendingDown } from "lucide-react";
import { showSuccess, showError } from "../../../shared/utilities/toastHelpers.js";
import PaginatedList from "../../../shared/components/PaginatedList.jsx";

export default function CreditsDebitsReport() {
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState(null);
    const [showLedger, setShowLedger] = useState(false);
    const [ledgerData, setLedgerData] = useState(null);
    const [showDatePicker, setShowDatePicker] = useState(false);

    // Filters
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        accountType: '',
        transactionType: '',
        direction: '',
        source: '',
        status: 'all',
        sortBy: 'all',
        datePreset: 'all'
    });

    const [accounts, setAccounts] = useState([]);

    // Fetch accounts for dropdown
    useEffect(() => {
        fetchAccounts();
    }, []);

    // Auto-fetch report on mount
    useEffect(() => {
        fetchReport();
    }, []);

    const fetchAccounts = async () => {
        try {
            const response = await fetch('http://localhost:5001/api/qarzaRoutes/getAllQarzaAccount', {
                credentials: 'include'
            });
            const data = await response.json();
            if (data.success) {
                setAccounts(data.accounts || []);
            }
        } catch (error) {
            console.error('Error fetching accounts:', error);
        }
    };

    const handleDatePreset = (preset) => {
        const today = new Date();
        let startDate = '';
        let endDate = today.toISOString().split('T')[0];

        switch (preset) {
            case '3days':
                startDate = new Date(today.setDate(today.getDate() - 3)).toISOString().split('T')[0];
                break;
            case '7days':
                startDate = new Date(today.setDate(today.getDate() - 7)).toISOString().split('T')[0];
                break;
            case 'month':
                startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
                break;
            case 'custom':
                return;
            default:
                startDate = '';
                endDate = '';
        }

        setFilters({ ...filters, datePreset: preset, startDate, endDate });
    };

    const fetchReport = async (page = 1) => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams();
            queryParams.append('page', page);
            queryParams.append('limit', '20');
            
            Object.entries(filters).forEach(([key, value]) => {
                if (value && value !== 'all' && key !== 'datePreset') {
                    queryParams.append(key, value);
                }
            });

            const response = await fetch(`http://localhost:5001/api/qarzaRoutes/credits-debits/report?${queryParams}`, {
                credentials: 'include'
            });
            const data = await response.json();
            if (data.success) {
                setReportData(data.data);
            } else {
                showError(data.msg || 'Failed to fetch report');
            }
        } catch (error) {
            showError('Failed to fetch report');
        } finally {
            setLoading(false);
        }
    };

    const fetchLedger = async (accountId) => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams();
            if (filters.startDate) queryParams.append('startDate', filters.startDate);
            if (filters.endDate) queryParams.append('endDate', filters.endDate);

            const response = await fetch(`http://localhost:5001/api/qarzaRoutes/credits-debits/ledger/${accountId}?${queryParams}`, {
                credentials: 'include'
            });
            const data = await response.json();
            if (data.success) {
                setLedgerData(data.data);
                setShowLedger(true);
            } else {
                showError(data.msg || 'Failed to fetch ledger');
            }
        } catch (error) {
            showError('Failed to fetch ledger');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = (type) => {
        showSuccess(`Exporting as ${type}...`);
    };

    const handlePrint = () => {
        window.print();
    };

    const getStatusBadge = (status) => {
        const statuses = {
            to_pay: { bg: 'bg-red-100', text: 'text-red-800', label: 'To Pay' },
            to_receive: { bg: 'bg-green-100', text: 'text-green-800', label: 'To Receive' },
            cleared: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Cleared' }
        };
        const statusConfig = statuses[status] || statuses.cleared;
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.bg} ${statusConfig.text}`}>
                {statusConfig.label}
            </span>
        );
    };

    if (showLedger && ledgerData) {
        return (
            <div className="h-screen flex flex-col" style={{ background: 'var(--app-bg)' }}>
                <div className="px-6 py-4 border-b" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setShowLedger(false)} className="p-2 rounded-lg hover:bg-gray-100">
                                <ArrowRight className="w-5 h-5 rotate-180" />
                            </button>
                            <div>
                                <h1 className="text-xl font-bold" style={{ color: 'var(--ink)' }}>Account Ledger</h1>
                                <p className="text-sm" style={{ color: 'var(--muted)' }}>{ledgerData.account.name} - {ledgerData.account.type}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-gray-50" style={{ borderColor: 'var(--border)' }}>
                                <Printer className="w-4 h-4" />
                                Print
                            </button>
                            <button onClick={() => handleExport('PDF')} className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-gray-50" style={{ borderColor: 'var(--border)' }}>
                                <FileText className="w-4 h-4" />
                                PDF
                            </button>
                            <button onClick={() => handleExport('Excel')} className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-gray-50" style={{ borderColor: 'var(--border)' }}>
                                <Download className="w-4 h-4" />
                                Excel
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-auto p-6">
                    <div className="rounded-xl border p-6 mb-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <p className="text-sm" style={{ color: 'var(--muted)' }}>Account Name</p>
                                <p className="font-semibold" style={{ color: 'var(--ink)' }}>{ledgerData.account.name}</p>
                            </div>
                            <div>
                                <p className="text-sm" style={{ color: 'var(--muted)' }}>Account Type</p>
                                <p className="font-semibold capitalize" style={{ color: 'var(--ink)' }}>{ledgerData.account.type}</p>
                            </div>
                            <div>
                                <p className="text-sm" style={{ color: 'var(--muted)' }}>Phone</p>
                                <p className="font-semibold" style={{ color: 'var(--ink)' }}>{ledgerData.account.phoneNo || '—'}</p>
                            </div>
                            <div>
                                <p className="text-sm" style={{ color: 'var(--muted)' }}>Current Balance</p>
                                <p className={`font-bold ${ledgerData.account.currentBalance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                                    Rs {Math.abs(ledgerData.account.currentBalance).toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <table className="w-full">
                            <thead className="border-b" style={{ background: 'var(--surface-muted)', borderColor: 'var(--border)' }}>
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>Description</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>Source</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>Debit</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>Credit</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>Balance</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                                {ledgerData.ledger.map((entry, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm" style={{ color: 'var(--ink)' }}>
                                            {new Date(entry.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm" style={{ color: 'var(--ink)' }}>{entry.description}</td>
                                        <td className="px-6 py-4 text-sm" style={{ color: 'var(--ink)' }}>
                                            {entry.source === 'pos' ? `POS Order: ${entry.orderNumber}` : 
                                             entry.source === 'purchase' ? `Purchase: ${entry.orderNumber}` : 
                                             entry.source}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-right font-medium text-red-600">
                                            {entry.debitAmount > 0 ? `Rs ${entry.debitAmount.toLocaleString()}` : '—'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-right font-medium text-green-600">
                                            {entry.creditAmount > 0 ? `Rs ${entry.creditAmount.toLocaleString()}` : '—'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-right font-bold" style={{ color: 'var(--ink)' }}>
                                            Rs {entry.runningBalance.toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                                {ledgerData.ledger.length === 0 && (
                                    <tr>
                                        <td colSpan="6" className="px-6 py-12 text-center" style={{ color: 'var(--muted)' }}>
                                            No transactions found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col" style={{ background: 'var(--app-bg)' }}>
            {/* Header */}
            <div className="px-6 py-4 border-b" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold" style={{ color: 'var(--ink)' }}>Credits & Debits Report</h1>
                        <p className="text-sm" style={{ color: 'var(--muted)' }}>Track all credit account transactions and balances</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-gray-50" style={{ borderColor: 'var(--border)' }}>
                            <Printer className="w-4 h-4" />
                            Print
                        </button>
                        <button onClick={() => handleExport('PDF')} className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-gray-50" style={{ borderColor: 'var(--border)' }}>
                            <FileText className="w-4 h-4" />
                            PDF
                        </button>
                        <button onClick={() => handleExport('Excel')} className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-gray-50" style={{ borderColor: 'var(--border)' }}>
                            <Download className="w-4 h-4" />
                            Excel
                        </button>
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            {reportData && (
                <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="rounded-lg p-4 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full" style={{ background: 'rgba(15, 118, 110, 0.1)' }}>
                                <Wallet className="w-5 h-5" style={{ color: 'var(--accent-2)' }} />
                            </div>
                            <div>
                                <p className="text-xs font-medium" style={{ color: 'var(--muted)' }}>Total Accounts</p>
                                <p className="text-xl font-bold" style={{ color: 'var(--ink)' }}>{reportData.kpi.totalAccounts}</p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-lg p-4 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full" style={{ background: 'rgba(239, 68, 68, 0.1)' }}>
                                <TrendingUp className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <p className="text-xs font-medium" style={{ color: 'var(--muted)' }}>Debit on Others (I owe)</p>
                                <p className="text-xl font-bold text-red-600">Rs {reportData.kpi.totalDebitOnOthers.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-lg p-4 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full" style={{ background: 'rgba(34, 197, 94, 0.1)' }}>
                                <TrendingDown className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <p className="text-xs font-medium" style={{ color: 'var(--muted)' }}>Debit on Me (Others owe)</p>
                                <p className="text-xl font-bold text-green-600">Rs {reportData.kpi.totalDebitOnMe.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                    <div className="rounded-lg p-4 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full" style={{ background: 'rgba(180, 83, 9, 0.1)' }}>
                                <Wallet className="w-5 h-5" style={{ color: 'var(--accent)' }} />
                            </div>
                            <div>
                                <p className="text-xs font-medium" style={{ color: 'var(--muted)' }}>Final Amount</p>
                                <p className={`text-xl font-bold ${reportData.kpi.finalAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {reportData.kpi.finalAmount >= 0 ? '+' : ''}Rs {reportData.kpi.finalAmount.toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Status Section - 3 Columns */}
            {reportData && (
                <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-lg p-4 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium" style={{ color: 'var(--muted)' }}>To Pay</span>
                            <span className="w-3 h-3 rounded-full bg-red-500"></span>
                        </div>
                        <p className="text-2xl font-bold text-red-600">
                            {reportData.accounts.filter(a => a.accountStatus === 'to_pay').length}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--muted)' }}>
                            Rs {reportData.accounts.filter(a => a.accountStatus === 'to_pay').reduce((sum, a) => sum + a.remainingBalance, 0).toLocaleString()}
                        </p>
                    </div>
                    <div className="rounded-lg p-4 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium" style={{ color: 'var(--muted)' }}>To Receive</span>
                            <span className="w-3 h-3 rounded-full bg-green-500"></span>
                        </div>
                        <p className="text-2xl font-bold text-green-600">
                            {reportData.accounts.filter(a => a.accountStatus === 'to_receive').length}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--muted)' }}>
                            Rs {Math.abs(reportData.accounts.filter(a => a.accountStatus === 'to_receive').reduce((sum, a) => sum + a.remainingBalance, 0)).toLocaleString()}
                        </p>
                    </div>
                    <div className="rounded-lg p-4 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium" style={{ color: 'var(--muted)' }}>Cleared</span>
                            <span className="w-3 h-3 rounded-full bg-gray-500"></span>
                        </div>
                        <p className="text-2xl font-bold" style={{ color: 'var(--ink)' }}>
                            {reportData.accounts.filter(a => a.accountStatus === 'cleared').length}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--muted)' }}>
                            All settled
                        </p>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className="px-6 py-4 border-b" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-2 mb-3">
                    <Filter className="w-4 h-4" style={{ color: 'var(--muted)' }} />
                    <span className="text-sm font-medium" style={{ color: 'var(--ink)' }}>Filters</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    <div>
                        <label className="block text-xs mb-1" style={{ color: 'var(--muted)' }}>Date Preset</label>
                        <select
                            value={filters.datePreset}
                            onChange={(e) => handleDatePreset(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2" style={{ borderColor: 'var(--border)', '--tw-ring-color': 'var(--accent-2)' }}
                        >
                            <option value="all">All Time</option>
                            <option value="3days">Last 3 Days</option>
                            <option value="7days">Last 7 Days</option>
                            <option value="month">This Month</option>
                            <option value="custom">Custom</option>
                        </select>
                    </div>
                    {filters.datePreset === 'custom' && (
                        <div className="relative">
                            <label className="block text-xs mb-1" style={{ color: 'var(--muted)' }}>Date Range</label>
                            <button
                                onClick={() => setShowDatePicker(true)}
                                className="w-full px-3 py-2 rounded-lg border text-sm text-left focus:outline-none focus:ring-2 flex items-center gap-2"
                                style={{ borderColor: 'var(--border)', '--tw-ring-color': 'var(--accent-2)' }}
                            >
                                <Calendar className="w-4 h-4" style={{ color: 'var(--muted)' }} />
                                {filters.startDate && filters.endDate 
                                    ? `${filters.startDate} - ${filters.endDate}`
                                    : 'Select dates'}
                            </button>
                        </div>
                    )}
                    <div>
                        <label className="block text-xs mb-1" style={{ color: 'var(--muted)' }}>Account Type</label>
                        <select
                            value={filters.accountType}
                            onChange={(e) => setFilters({ ...filters, accountType: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2" style={{ borderColor: 'var(--border)', '--tw-ring-color': 'var(--accent-2)' }}
                        >
                            <option value="all">All Types</option>
                            <option value="personal">Personal</option>
                            <option value="business">Business</option>
                            <option value="others">Others</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs mb-1" style={{ color: 'var(--muted)' }}>Status</label>
                        <select
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2" style={{ borderColor: 'var(--border)', '--tw-ring-color': 'var(--accent-2)' }}
                        >
                            <option value="all">All Status</option>
                            <option value="to_pay">To Pay</option>
                            <option value="to_receive">To Receive</option>
                            <option value="cleared">Cleared</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs mb-1" style={{ color: 'var(--muted)' }}>Source</label>
                        <select
                            value={filters.source}
                            onChange={(e) => setFilters({ ...filters, source: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2" style={{ borderColor: 'var(--border)', '--tw-ring-color': 'var(--accent-2)' }}
                        >
                            <option value="all">All Sources</option>
                            <option value="pos">POS</option>
                            <option value="purchaseProducts">Purchase</option>
                            <option value="manual">Manual</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs mb-1" style={{ color: 'var(--muted)' }}>Sort By</label>
                        <select
                            value={filters.sortBy}
                            onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                            className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2" style={{ borderColor: 'var(--border)', '--tw-ring-color': 'var(--accent-2)' }}
                        >
                            <option value="all">All</option>
                            <option value="to_pay">To Pay (I owe)</option>
                            <option value="to_receive">To Receive (Others owe)</option>
                        </select>
                    </div>
                </div>
                <button
                    onClick={() => fetchReport()}
                    disabled={loading}
                    className="mt-3 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
                    style={{ background: 'var(--accent-2)' }}
                >
                    {loading ? 'Loading...' : 'Apply Filters'}
                </button>

                {/* Date Picker Popup */}
                {showDatePicker && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="rounded-xl p-6" style={{ background: 'var(--surface)', minWidth: '400px' }}>
                            <h3 className="text-lg font-bold mb-4" style={{ color: 'var(--ink)' }}>Select Date Range</h3>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-xs mb-1" style={{ color: 'var(--muted)' }}>Start Date</label>
                                    <input
                                        type="date"
                                        value={filters.startDate}
                                        onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2" style={{ borderColor: 'var(--border)', '--tw-ring-color': 'var(--accent-2)' }}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs mb-1" style={{ color: 'var(--muted)' }}>End Date</label>
                                    <input
                                        type="date"
                                        value={filters.endDate}
                                        onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                                        className="w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2" style={{ borderColor: 'var(--border)', '--tw-ring-color': 'var(--accent-2)' }}
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => setShowDatePicker(false)}
                                    className="px-4 py-2 rounded-lg text-sm font-medium border"
                                    style={{ borderColor: 'var(--border)', color: 'var(--ink)' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        setShowDatePicker(false);
                                        fetchReport();
                                    }}
                                    className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                                    style={{ background: 'var(--accent-2)' }}
                                >
                                    Apply
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Account List */}
            <div className="flex-1 overflow-auto p-6">
                {reportData && reportData.accounts.length > 0 ? (
                    <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <table className="w-full">
                            <thead className="border-b" style={{ background: 'var(--surface-muted)', borderColor: 'var(--border)' }}>
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>Account Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>Type</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>Total To Pay</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>Total Paid</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>Remaining</th>
                                    <th className="px-6 py-3 text-center text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>Status</th>
                                    <th className="px-6 py-3 text-center text-xs font-semibold uppercase" style={{ color: 'var(--muted)' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                                {reportData.accounts.map((accountData, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-medium" style={{ color: 'var(--ink)' }}>{accountData.account.name}</p>
                                                <p className="text-xs" style={{ color: 'var(--muted)' }}>{accountData.account.phoneNo || '—'}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm capitalize" style={{ color: 'var(--ink)' }}>{accountData.account.type}</td>
                                        <td className="px-6 py-4 text-sm text-right font-medium text-red-600">
                                            Rs {accountData.totalToPay.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-right font-medium text-green-600">
                                            Rs {accountData.totalPaid.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-right font-bold" style={{ color: 'var(--ink)' }}>
                                            Rs {accountData.remainingBalance.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {getStatusBadge(accountData.accountStatus)}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => fetchLedger(accountData.account._id)}
                                                className="text-sm font-medium flex items-center justify-center gap-1"
                                                style={{ color: 'var(--accent-2)' }}
                                            >
                                                View Ledger <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        
                        {/* Pagination */}
                        {reportData.pagination && reportData.pagination.totalPages > 1 && (
                            <div className="flex items-center justify-between px-6 py-4 border-t" style={{ borderColor: 'var(--border)' }}>
                                <p className="text-sm" style={{ color: 'var(--muted)' }}>
                                    Showing {((reportData.pagination.page - 1) * reportData.pagination.limit) + 1} to {Math.min(reportData.pagination.page * reportData.pagination.limit, reportData.pagination.total)} of {reportData.pagination.total} accounts
                                </p>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => fetchReport(reportData.pagination.page - 1)}
                                        disabled={reportData.pagination.page === 1}
                                        className="px-3 py-1 rounded border text-sm disabled:opacity-50"
                                        style={{ borderColor: 'var(--border)' }}
                                    >
                                        Previous
                                    </button>
                                    <span className="text-sm" style={{ color: 'var(--ink)' }}>
                                        Page {reportData.pagination.page} of {reportData.pagination.totalPages}
                                    </span>
                                    <button
                                        onClick={() => fetchReport(reportData.pagination.page + 1)}
                                        disabled={reportData.pagination.page === reportData.pagination.totalPages}
                                        className="px-3 py-1 rounded border text-sm disabled:opacity-50"
                                        style={{ borderColor: 'var(--border)' }}
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="rounded-xl border p-12 text-center" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <Wallet className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--muted)' }} />
                        <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--ink)' }}>No Accounts Found</h3>
                        <p className="mb-4" style={{ color: 'var(--muted)' }}>Try adjusting your filters or date range</p>
                    </div>
                )}
            </div>
        </div>
    );
}
