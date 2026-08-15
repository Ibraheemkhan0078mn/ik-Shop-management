import React, { useState, useEffect, useMemo } from "react";
import { Wallet, RefreshCw, Filter, Eye, ArrowRight, TrendingUp, TrendingDown } from "lucide-react";
import { showError } from "../../../shared/utilities/toastHelpers.js";
import PdfModal from "../../../shared/components/PdfModal.jsx";
import CreditsDebitsReportPdfTemplate from "../components/CreditsDebitsReportPdfTemplate.jsx";
import { useSettings } from "../../settings/hooks/useSettings.js";
import { getReportsLabels } from "../labels/reportsLabels.js";

export default function CreditsDebitsReport() {
    const { settings } = useSettings();
    const language = settings?.language || "en";
    const labels = getReportsLabels(language);
    const [transactionPeriod, setTransactionPeriod] = useState("all");
    const [customFromDate, setCustomFromDate] = useState("");
    const [customToDate, setCustomToDate] = useState("");
    const [accountType, setAccountType] = useState("all");
    const [status, setStatus] = useState("all");
    const [search, setSearch] = useState("");
    const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
    const [showLedger, setShowLedger] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState(null);

    // Calculate date range based on transaction period
    // This filter only shows accounts that have transactions in the selected period
    const transactionDates = useMemo(() => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        switch (transactionPeriod) {
            case "all": {
                return { from: null, to: null };
            }
            case "today": {
                return {
                    from: today.toISOString().split('T')[0],
                    to: today.toISOString().split('T')[0]
                };
            }
            case "week": {
                const weekStart = new Date(now);
                weekStart.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6); // End of week (Saturday)
                return {
                    from: weekStart.toISOString().split('T')[0],
                    to: weekEnd.toISOString().split('T')[0]
                };
            }
            case "month": {
                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                return {
                    from: monthStart.toISOString().split('T')[0],
                    to: monthEnd.toISOString().split('T')[0]
                };
            }
            case "custom":
            default:
                return { from: customFromDate, to: customToDate };
        }
    }, [transactionPeriod, customFromDate, customToDate]);
    
    const filters = useMemo(() => ({ 
        startDate: transactionPeriod === "all" ? null : (transactionPeriod === "custom" ? customFromDate : transactionDates.from), 
        endDate: transactionPeriod === "all" ? null : (transactionPeriod === "custom" ? customToDate : transactionDates.to), 
        accountType, status, search 
    }), [transactionPeriod, customFromDate, customToDate, transactionDates.from, transactionDates.to, accountType, status, search]);

    useEffect(() => {
        fetchReport();
        // eslint-disable-next-line react-hooks/exhaustive-deps
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

    const getBalanceDisplay = (accountData) => {
        const remaining = accountData.remainingBalance || 0;
        const status = accountData.accountStatus;

        if (remaining === 0 || status === 'cleared') {
            return <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border bg-green-100 text-green-800 border-green-300">Balanced</span>;
        } else if (remaining > 0) {
            // We need to receive this amount
            return <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border bg-green-100 text-green-800 border-green-300">receive ({remaining.toLocaleString()})</span>;
        } else {
            // We need to give this amount
            return <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border bg-red-100 text-red-800 border-red-300">give ({Math.abs(remaining).toLocaleString()})</span>;
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
                        <h1 className="text-2xl font-bold text-[var(--ink)] font-display">{labels.accountLedger}</h1>
                        <p className="text-sm text-[var(--muted)]">{selectedAccount.account.name} - {selectedAccount.account.type}</p>
                    </div>
                </div>

                <div className="card p-4 mb-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <p className="text-xs text-[var(--muted)]">{labels.accountName}</p>
                            <p className="font-semibold text-[var(--ink)]">{selectedAccount.account.name}</p>
                        </div>
                        <div>
                            <p className="text-xs text-[var(--muted)]">{labels.accountType}</p>
                            <p className="font-semibold capitalize text-[var(--ink)]">{selectedAccount.account.type}</p>
                        </div>
                        <div>
                            <p className="text-xs text-[var(--muted)]">{labels.phone}</p>
                            <p className="font-semibold text-[var(--ink)]">{selectedAccount.account.phoneNo || "—"}</p>
                        </div>
                        <div>
                            <p className="text-xs text-[var(--muted)]">{labels.currentBalance}</p>
                            <p className={`font-bold ${selectedAccount.account.currentBalance >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                                Rs {Math.abs(selectedAccount.account.currentBalance).toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="p-4 border-b border-[var(--border)]">
                        <h2 className="text-lg font-semibold text-[var(--ink)]">{labels.transactionHistory}</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[var(--surface-muted)]">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">{labels.date}</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">{labels.description}</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">{labels.source}</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">{labels.debit}</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">{labels.credit}</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">{labels.balance}</th>
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
                                        <td colSpan="6" className="px-4 py-8 text-center text-[var(--muted)]">{labels.noDataFound}</td>
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
                    <h1 className="text-2xl font-bold text-[var(--ink)] font-display">{labels.creditsDebitsReport}</h1>
                    <p className="text-sm text-[var(--muted)]">
                        {labels.trackTransactions}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchReport} className="px-4 py-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--app-bg)] transition-colors flex items-center gap-2">
                        <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
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

            {/* Filter bar */}
            <div className="card p-4 mb-6">
                <div className="flex items-center gap-2 mb-3">
                    <Filter size={16} className="text-[var(--accent-2)]" />
                    <span className="text-sm font-semibold text-[var(--ink)]">{labels.filters}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* Transaction period filter UI commented out - logic remains intact in state and functions */}
                    <div>
                        <label className="text-xs font-medium text-[var(--muted)] mb-1 block">{labels.accountType}</label>
                        <select
                            value={accountType}
                            onChange={(e) => setAccountType(e.target.value)}
                            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]/20"
                        >
                            <option value="all">{labels.allTypes}</option>
                            <option value="general">{labels.general}</option>
                            <option value="customer">{labels.customer}</option>
                            <option value="supplier">{labels.supplier}</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-[var(--muted)] mb-1 block">{labels.status}</label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full px-3 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--ink)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-2)]/20"
                        >
                            <option value="all">{labels.allStatuses}</option>
                            <option value="to_pay">{labels.toPay}</option>
                            <option value="to_receive">{labels.toReceive}</option>
                            <option value="cleared">{labels.cleared}</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-[var(--muted)] mb-1 block">{labels.search}</label>
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
                <div className="card">
                    {/* KPI Cards - Inline */}
                    {reportData && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border-b border-[var(--border)]">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-[var(--accent-2)]/10 flex items-center justify-center">
                                    <Wallet size={20} className="text-[var(--accent-2)]" />
                                </div>
                                <div>
                                    <p className="text-xs text-[var(--muted)] uppercase font-bold">{labels.totalAccounts}</p>
                                    <p className="font-semibold text-[var(--ink)]">
                                        {reportData.kpi?.totalAccounts || 0}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                                    <TrendingUp size={20} className="text-red-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-[var(--muted)] uppercase font-bold">{labels.iOwe}</p>
                                    <p className="font-semibold text-red-600">
                                        Rs {(reportData.kpi?.totalDebitOnOthers || 0).toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                                    <TrendingDown size={20} className="text-green-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-[var(--muted)] uppercase font-bold">{labels.owedToMe}</p>
                                    <p className="font-semibold text-green-600">
                                        Rs {(reportData.kpi?.totalDebitOnMe || 0).toLocaleString()}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                                    <Wallet size={20} className="text-yellow-600" />
                                </div>
                                <div>
                                    <p className="text-xs text-[var(--muted)] uppercase font-bold">{labels.netBalance}</p>
                                    <p className={`font-semibold ${(reportData.kpi?.finalAmount || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {(reportData.kpi?.finalAmount || 0) >= 0 ? '+' : ''}Rs {(reportData.kpi?.finalAmount || 0).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Accounts Table */}
                    {reportData && reportData.accounts && reportData.accounts.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-[var(--surface-muted)]">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">{labels.accountName}</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">{labels.accountType}</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">{labels.totalToPay}</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">{labels.totalPaid}</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-[var(--muted)]">{labels.statusAndBalance}</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-[var(--muted)]">{labels.actions}</th>
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
                                            <td className="px-4 py-3 text-center">
                                                {getBalanceDisplay(accountData)}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => fetchLedger(accountData.account._id)}
                                                    className="p-2 hover:bg-[var(--app-bg)] rounded-lg transition-colors"
                                                    title={labels.viewLedger}
                                                >
                                                    <Eye size={16} className="text-[var(--accent-2)]" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="p-12 text-center">
                            <Wallet size={48} className="mx-auto mb-4 text-[var(--muted)]" />
                            <h3 className="text-lg font-medium text-[var(--ink)] mb-2">{labels.noAccountsFound}</h3>
                            <p className="text-[var(--muted)]">{labels.tryAdjustingFilters}</p>
                        </div>
                    )}
                </div>
            )}

            {/* PDF Modal */}
            <PdfModal
                isOpen={isPdfModalOpen}
                onClose={() => setIsPdfModalOpen(false)}
                fileName={`${labels.creditsDebitsReport}.pdf`}
                labels={labels}
            >
                <CreditsDebitsReportPdfTemplate
                    reportData={reportData}
                    labels={labels}
                    selectedPeriodLabel={transactionPeriod === "all" ? labels.allPeriods : (transactionPeriod === "custom" ? `${customFromDate} to ${customToDate}` : transactionPeriod)}
                />
            </PdfModal>
        </div>
    );
}
