import React, { useState, useEffect, useMemo } from "react";
import { Wallet, RefreshCw, Filter, ChevronDown, ChevronUp, TrendingUp, TrendingDown } from "lucide-react";
import { showError } from "../../../shared/utilities/toastHelpers.js";
import PdfModal from "../../../shared/components/PdfModal.jsx";
import CreditsDebitsReportPdfTemplate from "../components/CreditsDebitsReportPdfTemplate.jsx";
import { useSettings } from "../../settings/hooks/useSettings.js";
import { getReportsLabels } from "../labels/reportsLabels.js";

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
            className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            style={{ background: 'var(--accent-2)17', color: 'var(--accent-2)' }}
        >
            {getInitials(name)}
        </div>
    );
}

function InlineStat({ label, value, icon: Icon, color }) {
    return (
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}17` }}>
                <Icon size={18} style={{ color }} />
            </div>
            <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-wide truncate" style={{ color: 'var(--muted)' }}>{label}</p>
                <p className="text-sm font-bold tabular-nums truncate" style={{ color }}>{value}</p>
            </div>
        </div>
    );
}

function BalanceBadge({ accountData }) {
    const remaining = accountData.remainingBalance || 0;
    const status = accountData.accountStatus;

    if (remaining === 0 || status === 'cleared') {
        return <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full border" style={{ background: '#10b98117', color: '#10b981', borderColor: '#10b98140' }}>Balanced</span>;
    } else if (remaining > 0) {
        return <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full border" style={{ background: '#10b98117', color: '#10b981', borderColor: '#10b98140' }}>receive ({remaining.toLocaleString()})</span>;
    }
    return <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full border" style={{ background: '#dc262617', color: '#dc2626', borderColor: '#dc262640' }}>give ({Math.abs(remaining).toLocaleString()})</span>;
}

// ---------- Inline ledger panel shown when an account row is expanded ----------
function LedgerPanel({ ledgerData, loading, labels, formatDate }) {
    if (loading) {
        return <p className="text-sm py-6 text-center" style={{ color: 'var(--muted)' }}>{labels.loading || 'Loading...'}</p>;
    }
    if (!ledgerData) return null;

    const entries = ledgerData.ledger || [];

    return (
        <div className="px-4 pb-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                <div className="p-3 rounded-xl" style={{ background: 'var(--surface-muted)' }}>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>{labels.accountType}</p>
                    <p className="font-semibold capitalize text-sm" style={{ color: 'var(--ink)' }}>{ledgerData.account.type}</p>
                </div>
                <div className="p-3 rounded-xl" style={{ background: 'var(--surface-muted)' }}>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>{labels.phone}</p>
                    <p className="font-semibold text-sm" style={{ color: 'var(--ink)' }}>{ledgerData.account.phoneNo || "—"}</p>
                </div>
                <div className="p-3 rounded-xl col-span-2 md:col-span-2" style={{ background: 'var(--surface-muted)' }}>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>{labels.currentBalance}</p>
                    <p className="font-bold tabular-nums text-sm" style={{ color: ledgerData.account.currentBalance >= 0 ? '#dc2626' : '#10b981' }}>
                        Rs {Math.abs(ledgerData.account.currentBalance).toLocaleString()}
                    </p>
                </div>
            </div>

            <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead style={{ background: 'var(--surface-muted)' }}>
                            <tr>
                                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>{labels.date}</th>
                                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>{labels.description}</th>
                                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>{labels.source}</th>
                                <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>{labels.debit}</th>
                                <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>{labels.credit}</th>
                                <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>{labels.balance}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                            {entries.length > 0 ? (
                                entries.map((entry, index) => (
                                    <tr key={index}>
                                        <td className="px-3 py-2 text-sm" style={{ color: 'var(--ink)' }}>{formatDate(entry.date)}</td>
                                        <td className="px-3 py-2 text-sm" style={{ color: 'var(--ink)' }}>{entry.description}</td>
                                        <td className="px-3 py-2 text-sm" style={{ color: 'var(--muted)' }}>
                                            {entry.source === 'pos' ? `POS: ${entry.orderNumber}` :
                                             entry.source === 'purchase' ? `Purchase: ${entry.orderNumber}` :
                                             entry.source}
                                        </td>
                                        <td className="px-3 py-2 text-sm text-right font-medium tabular-nums" style={{ color: '#dc2626' }}>
                                            {entry.debitAmount > 0 ? `Rs ${entry.debitAmount.toLocaleString()}` : '—'}
                                        </td>
                                        <td className="px-3 py-2 text-sm text-right font-medium tabular-nums" style={{ color: '#10b981' }}>
                                            {entry.creditAmount > 0 ? `Rs ${entry.creditAmount.toLocaleString()}` : '—'}
                                        </td>
                                        <td className="px-3 py-2 text-sm text-right font-bold tabular-nums" style={{ color: 'var(--ink)' }}>
                                            Rs {entry.runningBalance.toLocaleString()}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-3 py-6 text-center text-sm" style={{ color: 'var(--muted)' }}>{labels.noDataFound}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

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
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState(null);

    // Expand-in-place state: which account row is open, its ledger data, and its own loading flag
    const [expandedAccountId, setExpandedAccountId] = useState(null);
    const [ledgerCache, setLedgerCache] = useState({});
    const [ledgerLoadingId, setLedgerLoadingId] = useState(null);

    const transactionDates = useMemo(() => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        switch (transactionPeriod) {
            case "all": {
                return { from: null, to: null };
            }
            case "today": {
                return { from: today.toISOString().split('T')[0], to: today.toISOString().split('T')[0] };
            }
            case "week": {
                const weekStart = new Date(now);
                weekStart.setDate(now.getDate() - now.getDay());
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);
                return { from: weekStart.toISOString().split('T')[0], to: weekEnd.toISOString().split('T')[0] };
            }
            case "month": {
                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                return { from: monthStart.toISOString().split('T')[0], to: monthEnd.toISOString().split('T')[0] };
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
        setExpandedAccountId(null);
        setLedgerCache({});
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
        setLedgerLoadingId(accountId);
        try {
            const queryParams = new URLSearchParams();
            if (filters.startDate) queryParams.append('startDate', filters.startDate);
            if (filters.endDate) queryParams.append('endDate', filters.endDate);

            const response = await fetch(`http://localhost:5001/api/qarzaRoutes/credits-debits/ledger/${accountId}?${queryParams}`, {
                credentials: 'include'
            });
            const data = await response.json();
            if (data.success) {
                setLedgerCache(prev => ({ ...prev, [accountId]: data.data }));
            } else {
                showError(data.msg || 'Failed to fetch ledger');
            }
        } catch (error) {
            showError('Failed to fetch ledger');
        } finally {
            setLedgerLoadingId(null);
        }
    };

    const toggleAccount = (accountId) => {
        if (expandedAccountId === accountId) {
            setExpandedAccountId(null);
            return;
        }
        setExpandedAccountId(accountId);
        if (!ledgerCache[accountId]) {
            fetchLedger(accountId);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleDateString();
    };

    return (
        <div className="p-6 min-h-screen" style={{ background: 'var(--app-bg)' }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold font-display" style={{ color: 'var(--ink)' }}>{labels.creditsDebitsReport}</h1>
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>{labels.trackTransactions}</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchReport} className="px-4 py-2 rounded-xl border transition-colors flex items-center gap-2" style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--ink)' }}>
                        <RefreshCw size={16} style={{ color: 'var(--accent-2)' }} />
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

            {/* Filter bar */}
            <div className="rounded-2xl border p-4 mb-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-2 mb-3">
                    <Filter size={16} style={{ color: 'var(--accent-2)' }} />
                    <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{labels.filters}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div>
                        <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--muted)' }}>{labels.accountType}</label>
                        <select
                            value={accountType}
                            onChange={(e) => setAccountType(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2"
                            style={{ borderColor: 'var(--border)', background: 'var(--app-bg)', color: 'var(--ink)' }}
                        >
                            <option value="all">{labels.allTypes}</option>
                            <option value="general">{labels.general}</option>
                            <option value="customer">{labels.customer}</option>
                            <option value="supplier">{labels.supplier}</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--muted)' }}>{labels.status}</label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2"
                            style={{ borderColor: 'var(--border)', background: 'var(--app-bg)', color: 'var(--ink)' }}
                        >
                            <option value="all">{labels.allStatuses}</option>
                            <option value="to_pay">{labels.toPay}</option>
                            <option value="to_receive">{labels.toReceive}</option>
                            <option value="cleared">{labels.cleared}</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--muted)' }}>{labels.search}</label>
                        <input
                            type="text"
                            placeholder="Account name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2"
                            style={{ borderColor: 'var(--border)', background: 'var(--app-bg)', color: 'var(--ink)' }}
                        />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>{labels.loading || 'Loading...'}</p>
                </div>
            ) : (
                <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                    {/* KPI Cards - Inline */}
                    {reportData && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border-b" style={{ borderColor: 'var(--border)' }}>
                            <InlineStat label={labels.totalAccounts} value={reportData.kpi?.totalAccounts || 0} icon={Wallet} color="var(--accent-2)" />
                            <InlineStat label={labels.iOwe} value={`Rs ${(reportData.kpi?.totalDebitOnOthers || 0).toLocaleString()}`} icon={TrendingUp} color="#dc2626" />
                            <InlineStat label={labels.owedToMe} value={`Rs ${(reportData.kpi?.totalDebitOnMe || 0).toLocaleString()}`} icon={TrendingDown} color="#10b981" />
                            <InlineStat
                                label={labels.netBalance}
                                value={`${(reportData.kpi?.finalAmount || 0) >= 0 ? '+' : ''}Rs ${(reportData.kpi?.finalAmount || 0).toLocaleString()}`}
                                icon={Wallet}
                                color={(reportData.kpi?.finalAmount || 0) >= 0 ? '#10b981' : '#dc2626'}
                            />
                        </div>
                    )}

                    {/* Accounts — each row expands in place to reveal its ledger */}
                    {reportData && reportData.accounts && reportData.accounts.length > 0 ? (
                        <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                            {reportData.accounts.map((accountData, index) => {
                                const id = accountData.account._id;
                                const isOpen = expandedAccountId === id;
                                return (
                                    <div key={id || index}>
                                        <button
                                            onClick={() => toggleAccount(id)}
                                            className="w-full flex items-center justify-between gap-4 p-4 text-left transition-colors"
                                            style={{ background: isOpen ? 'var(--surface-muted)' : 'transparent' }}
                                            onMouseEnter={(e) => { if (!isOpen) e.currentTarget.style.background = 'var(--surface-muted)'; }}
                                            onMouseLeave={(e) => { if (!isOpen) e.currentTarget.style.background = 'transparent'; }}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <Avatar name={accountData.account.name} />
                                                <div className="min-w-0">
                                                    <p className="font-medium text-sm truncate" style={{ color: 'var(--ink)' }}>{accountData.account.name}</p>
                                                    <p className="text-xs capitalize" style={{ color: 'var(--muted)' }}>{accountData.account.type} · {accountData.account.phoneNo || "—"}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-5 shrink-0">
                                                <div className="text-right hidden md:block">
                                                    <p className="text-xs" style={{ color: 'var(--muted)' }}>{labels.totalToPay}</p>
                                                    <p className="text-sm font-semibold tabular-nums" style={{ color: '#dc2626' }}>Rs {(accountData.totalToPay || 0).toLocaleString()}</p>
                                                </div>
                                                <div className="text-right hidden md:block">
                                                    <p className="text-xs" style={{ color: 'var(--muted)' }}>{labels.totalPaid}</p>
                                                    <p className="text-sm font-semibold tabular-nums" style={{ color: '#10b981' }}>Rs {(accountData.totalPaid || 0).toLocaleString()}</p>
                                                </div>
                                                <BalanceBadge accountData={accountData} />
                                                <div className="rounded-full p-1.5" style={{ background: isOpen ? 'var(--accent-2)17' : 'var(--surface-muted)' }}>
                                                    {isOpen ? <ChevronUp size={16} style={{ color: 'var(--accent-2)' }} /> : <ChevronDown size={16} style={{ color: 'var(--muted)' }} />}
                                                </div>
                                            </div>
                                        </button>
                                        {isOpen && (
                                            <LedgerPanel
                                                ledgerData={ledgerCache[id]}
                                                loading={ledgerLoadingId === id}
                                                labels={labels}
                                                formatDate={formatDate}
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="p-12 text-center">
                            <Wallet size={40} className="mx-auto mb-4" style={{ color: 'var(--muted)' }} />
                            <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--ink)' }}>{labels.noAccountsFound}</h3>
                            <p style={{ color: 'var(--muted)' }}>{labels.tryAdjustingFilters}</p>
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