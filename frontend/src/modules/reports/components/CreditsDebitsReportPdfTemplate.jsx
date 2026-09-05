import React from "react";
import { Wallet, TrendingUp, TrendingDown } from "lucide-react";

function KpiCard({ label, value, icon: Icon, color, isCurrency = true, valueColor }) {
    return (
        <div className="card p-4">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: `${color}20` }}>
                    <Icon size={20} style={{ color }} />
                </div>
                <div>
                    <p className="text-xs text-[var(--muted)] uppercase font-bold">{label}</p>
                    <p className={`font-semibold ${valueColor || 'text-[var(--ink)]'}`}>
                        {isCurrency ? `Rs ${value?.toLocaleString() || 0}` : (value?.toLocaleString() || value || 0)}
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function CreditsDebitsReportPdfTemplate({ reportData = {}, labels = {}, selectedPeriodLabel = '' }) {
    const getBalanceDisplay = (accountData) => {
        const remaining = accountData.remainingBalance || 0;
        const status = accountData.accountStatus;

        if (remaining === 0 || status === 'cleared') {
            return <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border bg-green-100 text-green-800 border-green-300">Balanced</span>;
        } else if (remaining > 0) {
            return <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border bg-red-100 text-red-800 border-red-300">To Give ({remaining.toLocaleString()})</span>;
        } else {
            return <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border bg-green-100 text-green-800 border-green-300">To Receive ({Math.abs(remaining).toLocaleString()})</span>;
        }
    };

    const kpi = reportData?.kpi || {};
    const accounts = reportData?.accounts || [];

    return (
        <div className="p-6 bg-[var(--app-bg)] text-[var(--ink)] min-h-screen">
            <div className="mb-6">
                <h1 className="text-2xl font-bold font-display">{labels.creditsDebitsReport}</h1>
                <p className="text-sm text-[var(--muted)]">{labels.creditsDebitsAnalysis} · {selectedPeriodLabel}</p>
            </div>

            {/* KPI Cards */}
            {reportData && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <KpiCard
                        label={labels.totalAccounts}
                        value={kpi.totalAccounts}
                        icon={Wallet}
                        color="#3b82f6"
                        isCurrency={false}
                    />
                    <KpiCard
                        label={labels.iOwe}
                        value={kpi.totalDebitOnOthers}
                        icon={TrendingUp}
                        color="#ef4444"
                        valueColor="text-red-600"
                    />
                    <KpiCard
                        label={labels.owedToMe}
                        value={kpi.totalDebitOnMe}
                        icon={TrendingDown}
                        color="#22c55e"
                        valueColor="text-green-600"
                    />
                    <KpiCard
                        label={labels.netBalance}
                        value={kpi.finalAmount}
                        icon={Wallet}
                        color="#eab308"
                        valueColor={(kpi.finalAmount || 0) >= 0 ? 'text-green-600' : 'text-red-600'}
                    />
                </div>
            )}

            {/* Accounts Table */}
            {reportData && accounts && accounts.length > 0 ? (
                <div className="card">
                    <div className="p-4 border-b border-[var(--border)]">
                        <h2 className="text-lg font-semibold text-[var(--ink)]">{labels.creditAccounts}</h2>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-[var(--surface-muted)]">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">{labels.account}</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">{labels.type}</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">{labels.totalToPay}</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">{labels.totalPaid}</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-[var(--muted)]">{labels.statusAndBalance}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border)]">
                                {accounts.slice(0, 50).map((accountData, index) => (
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
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {accounts.length > 50 && (
                        <div className="px-4 py-2 text-xs text-center text-[var(--muted)]">
                            Showing first 50 of {accounts.length} accounts
                        </div>
                    )}
                </div>
            ) : (
                <div className="card p-12 text-center">
                    <Wallet size={48} className="mx-auto mb-4 text-[var(--muted)]" />
                    <h3 className="text-lg font-medium text-[var(--ink)] mb-2">{labels.noAccountsFound}</h3>
                    <p className="text-[var(--muted)]">{labels.tryAdjustingFilters}</p>
                </div>
            )}
        </div>
    );
}
