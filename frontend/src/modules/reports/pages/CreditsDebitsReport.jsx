import React, { useState, useEffect, useMemo } from "react";
import { Wallet, RefreshCw, Filter, TrendingUp, TrendingDown, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from "lucide-react";
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
        return <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full border" style={{ background: '#dc262617', color: '#dc2626', borderColor: '#dc262640' }}>To Give ({remaining.toLocaleString()})</span>;
    }
    return <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full border" style={{ background: '#10b98117', color: '#10b981', borderColor: '#10b98140' }}>To Receive ({Math.abs(remaining).toLocaleString()})</span>;
}

function formatLocalDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
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
    const [expandedAccountId, setExpandedAccountId] = useState(null);
    const [page, setPage] = useState(1);
    const pageLimit = 20;
    const totalPages = reportData?.pagination?.totalPages || 0;
    const pageNumbers = useMemo(() => {
        if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);
        const numbers = new Set([1, totalPages, page, page - 1, page + 1]);
        return Array.from(numbers).filter((number) => number > 0 && number <= totalPages).sort((a, b) => a - b);
    }, [page, totalPages]);

    // Expand-in-place state: which account row is open, its ledger data, and its own loading flag

    const transactionDates = useMemo(() => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        switch (transactionPeriod) {
            case "all": {
                return { from: null, to: null };
            }
            case "today": {
                const localToday = formatLocalDate(today);
                return { from: localToday, to: localToday };
            }
            case "threeDays": {
                const threeDaysStart = new Date(today);
                threeDaysStart.setDate(today.getDate() - 2);
                return { from: formatLocalDate(threeDaysStart), to: formatLocalDate(today) };
            }
            case "week": {
                const weekStart = new Date(now);
                weekStart.setDate(now.getDate() - now.getDay());
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);
                return { from: formatLocalDate(weekStart), to: formatLocalDate(weekEnd) };
            }
            case "month": {
                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                return { from: formatLocalDate(monthStart), to: formatLocalDate(monthEnd) };
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
    }, [filters.startDate, filters.endDate, filters.accountType, filters.status, filters.search, page]);

    useEffect(() => {
        setPage(1);
        setExpandedAccountId(null);
    }, [filters.startDate, filters.endDate, filters.accountType, filters.status, filters.search]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams();
            const requestFilters = { ...filters, page, limit: pageLimit };
            Object.entries(requestFilters).forEach(([key, value]) => {
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--muted)' }}>Time Period</label>
                        <select
                            value={transactionPeriod}
                            onChange={(e) => setTransactionPeriod(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2"
                            style={{ borderColor: 'var(--border)', background: 'var(--app-bg)', color: 'var(--ink)' }}
                        >
                            <option value="all">All</option>
                            <option value="today">Today</option>
                            <option value="threeDays">3 Days</option>
                            <option value="week">Week</option>
                            <option value="month">Month</option>
                            <option value="custom">Custom Dates</option>
                        </select>
                    </div>
                    {transactionPeriod === "custom" && (
                        <>
                            <div>
                                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--muted)' }}>From</label>
                                <input
                                    type="date"
                                    value={customFromDate}
                                    onChange={(e) => setCustomFromDate(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2"
                                    style={{ borderColor: 'var(--border)', background: 'var(--app-bg)', color: 'var(--ink)' }}
                                />
                            </div>
                            <div>
                                <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--muted)' }}>To</label>
                                <input
                                    type="date"
                                    value={customToDate}
                                    onChange={(e) => setCustomToDate(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2"
                                    style={{ borderColor: 'var(--border)', background: 'var(--app-bg)', color: 'var(--ink)' }}
                                />
                            </div>
                        </>
                    )}
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

                    {/* Accounts and period-filtered payment details */}
                    {reportData && reportData.accounts && reportData.accounts.length > 0 ? (
                        <div className="overflow-x-auto">
                            <div className="min-w-[760px] divide-y" style={{ borderColor: 'var(--border)' }}>
                                <div className="grid grid-cols-[minmax(240px,1fr)_110px_110px_150px_36px] gap-4 px-4 py-2 text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--muted)', background: 'var(--surface-muted)' }}>
                                    <span>Account</span>
                                    <span className="text-right">{labels.totalToPay}</span>
                                    <span className="text-right">{labels.totalPaid}</span>
                                    <span className="text-right">{labels.statusAndBalance}</span>
                                    <span />
                                </div>
                                {reportData.accounts.map((accountData, index) => {
                                    const accountId = accountData.account._id || index;
                                    const isExpanded = expandedAccountId === accountId;
                                    const payments = accountData.payments || [];

                                    return (
                                        <React.Fragment key={accountId}>
                                            <div className="grid grid-cols-[minmax(240px,1fr)_110px_110px_150px_36px] gap-4 items-center px-4 py-3">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <Avatar name={accountData.account.name} />
                                                    <div className="min-w-0">
                                                        <p className="font-medium text-sm truncate" style={{ color: 'var(--ink)' }}>{accountData.account.name}</p>
                                                        <p className="text-xs capitalize truncate" style={{ color: 'var(--muted)' }}>{accountData.account.type} · {accountData.account.phoneNo || "—"}</p>
                                                        <p className="text-xs" style={{ color: 'var(--muted)' }}>{accountData.transactionCount || 0} payment{accountData.transactionCount === 1 ? "" : "s"} in period</p>
                                                    </div>
                                                </div>
                                                <p className="text-right text-sm font-semibold tabular-nums" style={{ color: '#dc2626' }}>Rs {(accountData.totalToPay || 0).toLocaleString()}</p>
                                                <p className="text-right text-sm font-semibold tabular-nums" style={{ color: '#10b981' }}>Rs {(accountData.totalPaid || 0).toLocaleString()}</p>
                                                <div className="flex justify-end"><BalanceBadge accountData={accountData} /></div>
                                                <button
                                                    type="button"
                                                    onClick={() => setExpandedAccountId(isExpanded ? null : accountId)}
                                                    className="w-8 h-8 inline-flex items-center justify-center rounded-lg border transition-colors hover:border-(--accent-2) hover:text-(--accent-2)"
                                                    style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
                                                    title={isExpanded ? "Hide payments" : "Show payments"}
                                                    aria-label={isExpanded ? "Hide payments" : "Show payments"}
                                                >
                                                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                                </button>
                                            </div>
                                            {isExpanded && (
                                                <div className="px-4 pb-4">
                                                    <div className="rounded-xl border overflow-hidden" style={{ borderColor: 'var(--border)', background: 'var(--surface-muted)' }}>
                                                        <table className="w-full text-sm">
                                                            <thead>
                                                                <tr style={{ color: 'var(--muted)' }}>
                                                                    <th className="px-3 py-2 text-left text-xs font-bold uppercase">Date</th>
                                                                    <th className="px-3 py-2 text-left text-xs font-bold uppercase">Source</th>
                                                                    <th className="px-3 py-2 text-left text-xs font-bold uppercase">Type</th>
                                                                    <th className="px-3 py-2 text-right text-xs font-bold uppercase">Amount</th>
                                                                    <th className="px-3 py-2 text-left text-xs font-bold uppercase">Notes</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {payments.map((payment, paymentIndex) => (
                                                                    <tr key={payment._id || paymentIndex} className="border-t" style={{ borderColor: 'var(--border)' }}>
                                                                        <td className="px-3 py-2 whitespace-nowrap" style={{ color: 'var(--ink)' }}>{payment.transactionDate ? new Date(payment.transactionDate).toLocaleString() : "—"}</td>
                                                                        <td className="px-3 py-2 capitalize" style={{ color: 'var(--muted)' }}>{payment.sourceType || "—"}</td>
                                                                        <td className="px-3 py-2">
                                                                            <span className={`text-xs font-semibold px-2 py-1 rounded-md ${payment.paymentType === "Cash In" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                                                                {payment.paymentType}
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-3 py-2 text-right font-semibold tabular-nums" style={{ color: 'var(--ink)' }}>Rs {Number(payment.amount || 0).toLocaleString()}</td>
                                                                        <td className="px-3 py-2 truncate max-w-[240px]" style={{ color: 'var(--muted)' }}>{payment.notes || "—"}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}
                                        </React.Fragment>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="p-12 text-center">
                            <Wallet size={40} className="mx-auto mb-4" style={{ color: 'var(--muted)' }} />
                            <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--ink)' }}>{labels.noAccountsFound}</h3>
                            <p style={{ color: 'var(--muted)' }}>{labels.tryAdjustingFilters}</p>
                        </div>
                    )}
                    {reportData?.pagination?.total > 0 && (
                        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 border-t px-4 py-3" style={{ borderColor: 'var(--border)' }}>
                            <span className="text-xs font-semibold" style={{ color: 'var(--muted)' }}>
                                Showing {(reportData.pagination.page - 1) * reportData.pagination.limit + 1}
                                -{Math.min(reportData.pagination.page * reportData.pagination.limit, reportData.pagination.total)}
                                of {reportData.pagination.total}
                            </span>
                            <div className="flex items-center justify-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => setPage((currentPage) => Math.max(1, currentPage - 1))}
                                    disabled={page <= 1 || loading}
                                    className="w-8 h-8 inline-flex items-center justify-center rounded-lg border disabled:opacity-30 disabled:cursor-not-allowed"
                                    style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
                                    aria-label="Previous page"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                {pageNumbers.map((pageNumber, index) => {
                                    const previousPageNumber = pageNumbers[index - 1];
                                    const showGap = previousPageNumber && pageNumber - previousPageNumber > 1;
                                    return (
                                        <React.Fragment key={pageNumber}>
                                            {showGap && <span className="px-1 text-sm" style={{ color: 'var(--muted)' }}>...</span>}
                                            <button
                                                type="button"
                                                onClick={() => setPage(pageNumber)}
                                                disabled={loading}
                                                className="w-8 h-8 rounded-lg border text-sm font-semibold disabled:cursor-not-allowed"
                                                style={{
                                                    borderColor: pageNumber === page ? 'var(--accent-2)' : 'var(--border)',
                                                    background: pageNumber === page ? 'var(--accent-2)' : 'var(--surface)',
                                                    color: pageNumber === page ? '#ffffff' : 'var(--muted)'
                                                }}
                                            >
                                                {pageNumber}
                                            </button>
                                        </React.Fragment>
                                    );
                                })}
                                <button
                                    type="button"
                                    onClick={() => setPage((currentPage) => Math.min(reportData.pagination.totalPages, currentPage + 1))}
                                    disabled={page >= reportData.pagination.totalPages || loading}
                                    className="w-8 h-8 inline-flex items-center justify-center rounded-lg border disabled:opacity-30 disabled:cursor-not-allowed"
                                    style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
                                    aria-label="Next page"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
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