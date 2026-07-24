import React, { useState, useEffect, useMemo } from "react";
import { Wallet, RefreshCw, Filter, Eye, ArrowRight, TrendingUp, TrendingDown, X, Calendar } from "lucide-react";
import { showError } from "../../../shared/utilities/toastHelpers.js";

export default function CreditsDebitsReport() {
    const [period, setPeriod] = useState("today");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [accountType, setAccountType] = useState("all");
    const [status, setStatus] = useState("all");
    const [search, setSearch] = useState("");
    const [showLedger, setShowLedger] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState(null);

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
    
    const filters = useMemo(() => ({ 
        startDate: period === "custom" ? fromDate : dates.from, 
        endDate: period === "custom" ? toDate : dates.to, 
        accountType, status, search 
    }), [period, fromDate, toDate, dates.from, dates.to, accountType, status, search]);

    useEffect(() => {
        fetchReport();
    }, [filters.startDate, filters.endDate, filters.accountType, filters.status, filters.search]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value && value !== 'all') {
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
                setSelectedAccount(data.data);
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

    const formatDate = (dateStr) => {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleDateString();
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'to_pay': return 'bg-red-100 text-red-800 border-red-300';
            case 'to_receive': return 'bg-green-100 text-green-800 border-green-300';
            case 'cleared': return 'bg-gray-100 text-gray-800 border-gray-300';
            default: return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'to_pay': return 'To Pay';
            case 'to_receive': return 'To Receive';
            case 'cleared': return 'Cleared';
            default: return status;
        }
    };

    if (showLedger && selectedAccount) {
        return (
            <div className="p-6 min-h-screen bg-[var(--app-bg)]">
                <div className="flex items-center gap-3 mb-4">
                    <button onClick={() => setShowLedger(false)} className="p-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--app-bg)] transition-colors">
                        <ArrowRight size={20} className="rotate-180" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-[var(--ink)] font-display">Account Ledger</h1>
                        <p className="text-sm text-[var(--muted)]">{selectedAccount.account.name} - {selectedAccount.account.type}</p>
                    </div>
                </div>

                <div className="card p-4 mb-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <p className="text-xs text-[var(--muted)]">Account Name</p>
                            <p className="font-semibold text-[var(--ink)]">{selectedAccount.account.name}</p>
                        </div>
                        <div>
                            <p className="text-xs text-[var(--muted)]">Account Type</p>
                            <p className="font-semibold capitalize text-[var(--ink)]">{selectedAccount.account.type}</p>
                        </div>
                        <div>
                            <p className="text-xs text-[var(--muted)]">Phone</p>
                            <p className="font-semibold text-[var(--ink)]">{selectedAccount.account.phoneNo || "—"}</p>
                        </div>
                        <div>
                            <p className="text-xs text-[var(--muted)]">Current Balance</p>
                            <p className={`font-bold ${selectedAccount.account.currentBalance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                                Rs {Math.abs(selectedAccount.account.currentBalance).toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="p-4 border-b border-[var(--border)]">
                        <h2 className="text-lg font-semibold text-[var(--ink)]">Transaction History</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[var(--surface-muted)]">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">Date</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">Description</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">Source</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">Debit</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">Credit</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">Balance</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border)]">
                                {selectedAccount.ledger && selectedAccount.ledger.length > 0 ? (
                                    selectedAccount.ledger.map((entry, index) => (
                                        <tr key={index} className="hover:bg-[var(--surface-muted)] transition-colors">
                                            <td className="px-4 py-3 text-sm text-[var(--ink)]">{formatDate(entry.date)}</td>
                                            <td className="px-4 py-3 text-sm text-[var(--ink)]">{entry.description}</td>
                                            <td className="px-4 py-3 text-sm text-[var(--muted)]">
                                                {entry.source === 'pos' ? `POS: ${entry.orderNumber}` : 
                                                 entry.source === 'purchase' ? `Purchase: ${entry.orderNumber}` : 
                                                 entry.source}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-right font-medium text-red-600">
                                                {entry.debitAmount > 0 ? `Rs ${entry.debitAmount.toLocaleString()}` : '—'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-right font-medium text-green-600">
                                                {entry.creditAmount > 0 ? `Rs ${entry.creditAmount.toLocaleString()}` : '—'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-right font-bold text-[var(--ink)]">
                                                Rs {entry.runningBalance.toLocaleString()}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="px-4 py-8 text-center text-[var(--muted)]">No transactions found</td>
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
        <div className="p-6 min-h-screen bg-[var(--app-bg)]">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--ink)] font-display">Credits & Debits Report</h1>
                    <p className="text-sm text-[var(--muted)]">
                        Track credit account transactions and balances
                    </p>
                </div>
                <button onClick={fetchReport} className="px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--app-bg)] transition-colors flex items-center gap-2">
                    <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                    Refresh
                </button>
            </div>

            {/* Filter bar */}
            <div className="card p-4 mb-6">
                <div className="flex items-center gap-2 mb-3">
                    <Filter size={16} className="text-[var(--accent-2)]" />
                    <span className="text-sm font-semibold text-[var(--ink)]">Filters</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
                            <option value="custom">Custom</option>
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
                        <label className="text-xs font-medium text-[var(--muted)] mb-1 block">Account Type</label>
                        <select
                            value={accountType}
                            onChange={(e) => setAccountType(e.target.value)}
                            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]/20"
                        >
                            <option value="all">All Types</option>
                            <option value="personal">Personal</option>
                            <option value="business">Business</option>
                            <option value="others">Others</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-[var(--muted)] mb-1 block">Status</label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]/20"
                        >
                            <option value="all">All Status</option>
                            <option value="to_pay">To Pay</option>
                            <option value="to_receive">To Receive</option>
                            <option value="cleared">Cleared</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-[var(--muted)] mb-1 block">Search</label>
                        <input
                            type="text"
                            placeholder="Account name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]/20"
                        />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent-2)]"></div>
                </div>
            ) : (
                <div>
                    {/* KPI Cards */}
                    {reportData && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            <div className="card p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-[var(--accent-2)]/10 flex items-center justify-center">
                                        <Wallet size={20} className="text-[var(--accent-2)]" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-[var(--muted)] uppercase font-bold">Total Accounts</p>
                                        <p className="font-semibold text-[var(--ink)]">
                                            {reportData.kpi?.totalAccounts || 0}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="card p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                                        <TrendingUp size={20} className="text-red-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-[var(--muted)] uppercase font-bold">I Owe (Debit)</p>
                                        <p className="font-semibold text-red-600">
                                            Rs {(reportData.kpi?.totalDebitOnOthers || 0).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="card p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                        <TrendingDown size={20} className="text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-[var(--muted)] uppercase font-bold">Owed to Me</p>
                                        <p className="font-semibold text-green-600">
                                            Rs {(reportData.kpi?.totalDebitOnMe || 0).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="card p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                                        <Wallet size={20} className="text-yellow-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-[var(--muted)] uppercase font-bold">Net Balance</p>
                                        <p className={`font-semibold ${(reportData.kpi?.finalAmount || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {(reportData.kpi?.finalAmount || 0) >= 0 ? '+' : ''}Rs {(reportData.kpi?.finalAmount || 0).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Accounts Table */}
                    {reportData && reportData.accounts && reportData.accounts.length > 0 ? (
                        <div className="card">
                            <div className="p-4 border-b border-[var(--border)]">
                                <h2 className="text-lg font-semibold text-[var(--ink)]">Credit Accounts</h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-[var(--surface-muted)]">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">Account Name</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">Type</th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">Total To Pay</th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">Total Paid</th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">Remaining</th>
                                            <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-[var(--muted)]">Status</th>
                                            <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-[var(--muted)]">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--border)]">
                                        {reportData.accounts.map((accountData, index) => (
                                            <tr key={index} className="hover:bg-[var(--surface-muted)] transition-colors">
                                                <td className="px-4 py-3">
                                                    <div>
                                                        <p className="font-medium text-[var(--ink)]">{accountData.account.name}</p>
                                                        <p className="text-xs text-[var(--muted)]">{accountData.account.phoneNo || "—"}</p>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm capitalize text-[var(--ink)]">{accountData.account.type}</td>
                                                <td className="px-4 py-3 text-right font-medium text-red-600">Rs {(accountData.totalToPay || 0).toLocaleString()}</td>
                                                <td className="px-4 py-3 text-right font-medium text-green-600">Rs {(accountData.totalPaid || 0).toLocaleString()}</td>
                                                <td className="px-4 py-3 text-right font-bold text-[var(--ink)]">Rs {(accountData.remainingBalance || 0).toLocaleString()}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadge(accountData.accountStatus)}`}>
                                                        {getStatusLabel(accountData.accountStatus)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <button
                                                        onClick={() => fetchLedger(accountData.account._id)}
                                                        className="p-2 hover:bg-[var(--app-bg)] rounded-lg transition-colors"
                                                        title="View Ledger"
                                                    >
                                                        <Eye size={16} className="text-[var(--accent-2)]" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ) : (
                        <div className="card p-12 text-center">
                            <Wallet size={48} className="mx-auto mb-4 text-[var(--muted)]" />
                            <h3 className="text-lg font-medium text-[var(--ink)] mb-2">No Accounts Found</h3>
                            <p className="text-[var(--muted)]">Try adjusting your filters or date range</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
