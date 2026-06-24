import React, { useMemo, useState } from 'react';
import MemberSalaryPaymentCreationComp from './MemberSalaryPaymentCreationComp';
import MemberFeeDepositsAndDetails from './MemberFeeDepositsAndDetails';
import { useGetMemberFinanceQuery } from '../member.rtk.api.js';
import { PermissionGuard } from '../../../shared/components/PermissionGuard.jsx';
import SalaryHistory from './SalaryChangeRecord';
import ClassPartnership from './ClassPartnerShip.jsx';

const fmt = (val) => {
    const num = Number(val);
    return isNaN(num) ? 0 : num
};

const safe = (val, fallback = 0) => {
    const num = Number(val);
    return isNaN(num) ? fallback : num;
};

const MemberFinancialHub = ({ memberId }) => {
    const { data: responseData, isLoading, isError } = useGetMemberFinanceQuery(memberId);

    const [showAllPayments, setShowAllPayments] = useState(false);
    const [showPaymentCreate, setShowPaymentCreate] = useState(false);
    const [memberSalaryHistoryVisibility, setMemberSalaryHistoryVisibility] = useState(false);

    const data = useMemo(() => responseData?.data || {}, [responseData]);
    const member = useMemo(() => responseData?.member || {}, [responseData]);
    const currentSalary = useMemo(() => responseData?.currentSalary?.data || null, [responseData]);

    const hasSalary = useMemo(() => Array.isArray(data?.salary?.salaryMap) && data.salary.salaryMap.length > 0, [data]);
    const hasPartnership = useMemo(() => Array.isArray(data?.classPartnership?.partnershipMap) && data.classPartnership.partnershipMap.length > 0, [data]);
    const hasSalaryConfig = useMemo(() => !!currentSalary, [currentSalary]);

    const totalEarned = useMemo(() => safe(data?.totalEarned), [data]);
    const totalPaid = useMemo(() => safe(data?.totalPaid), [data]);
    const remaining = useMemo(() => safe(data?.remaining), [data]);
    const advancePaid = useMemo(() => safe(data?.advancePaid), [data]);
    const salaryEarned = useMemo(() => safe(data?.salary?.totalEarned), [data]);
    const partnershipEarned = useMemo(() => safe(data?.classPartnership?.totalEarned), [data]);


    if (isLoading) {
        return (
            <div className="w-full min-h-[400px] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    <p className="text-sm text-ink-muted font-semibold">Loading financials...</p>
                </div>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="w-full min-h-[400px] flex items-center justify-center">
                <div className="flex flex-col items-center gap-3 text-center px-6">
                    <div className="w-14 h-14 rounded-2xl bg-danger-muted flex items-center justify-center">
                        <i className="ri-error-warning-line text-2xl text-danger" />
                    </div>
                    <p className="text-base font-bold text-ink">Failed to load financial data</p>
                    <p className="text-sm text-ink-muted">Please try refreshing or contact support.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full min-h-[500px] flex flex-col gap-4 font-sans antialiased text-ink">

            {memberSalaryHistoryVisibility && (
                <SalaryHistory memberId={memberId} setVisibility={setMemberSalaryHistoryVisibility} />
            )}
            {showAllPayments && (
                <MemberFeeDepositsAndDetails memberId={memberId} setVisibility={setShowAllPayments} responseData={responseData} />
            )}
            {showPaymentCreate && (
                <MemberSalaryPaymentCreationComp memberId={memberId} setVisible={setShowPaymentCreate} />
            )}

            {/* Hero Balance Card */}
            <div className="app-gradient rounded-3xl p-6 md:p-8 relative overflow-hidden">
                <div className="absolute -top-16 -right-16 w-40 h-40 bg-surface/10 rounded-full" />
                <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-surface/5 rounded-full blur-2xl" />

                <div className="relative z-10">
                    {!hasSalaryConfig ? (
                        <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-surface/20 flex items-center justify-center">
                                <i className="ri-file-unknow-line text-2xl text-primary-foreground/60" />
                            </div>
                            <h2 className="text-xl font-black text-primary-foreground">No Salary Configured</h2>
                            <p className="text-sm text-primary-muted max-w-xs">
                                This member doesn't have a salary set up yet. Please create a salary record to start tracking finances.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Balance */}
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-2 h-2 rounded-full bg-primary-muted" />
                                <span className="text-xs font-bold uppercase tracking-wider text-primary-muted">Available Balance</span>
                            </div>

                            <div className="mb-6 flex items-baseline gap-2 flex-wrap">
                                <span className="text-base font-medium text-primary-muted">PKR</span>
                                <h1 className="text-5xl md:text-6xl font-black text-primary-foreground tracking-tight leading-none">
                                    {((fmt(remaining )- fmt(responseData?.data?.classPartnership?.totalEarned))?.toFixed(2) ) < 0 ? 0 : ((fmt(remaining )- fmt(responseData?.data?.classPartnership?.totalEarned))?.toFixed(2))}
                                </h1>
                            </div>

                            {/* Stats Row */}
                            <div className="flex flex-wrap gap-x-6 gap-y-3 mb-6 pb-6 border-b border-surface/20">
                                {/* <div>
                                    <p className="text-xs font-semibold text-primary-muted uppercase tracking-wide mb-0.5">Total Earned</p>
                                    <p className="text-lg font-black text-primary-foreground">PKR {fmt(totalEarned)}</p>
                                </div> */}
                                <div className="border-l border-surface/20 pl-6">
                                    <p className="text-xs font-semibold text-primary-muted uppercase tracking-wide mb-0.5">Total Paid</p>
                                    <p className="text-lg font-black text-primary-foreground">PKR {fmt(totalPaid)}</p>
                                </div>
                                <div className="border-l border-surface/20 pl-6">
                                    <p className="text-xs font-semibold text-primary-muted uppercase tracking-wide mb-0.5">Advance Paid</p>
                                    <p className="text-lg font-black text-primary-foreground">PKR {fmt(advancePaid)}</p>
                                </div>

                            </div>

                            {/* Action Buttons */}

                        </>
                    )}
                    <div className="flex flex-wrap gap-3 w-full justify-center">
                        <PermissionGuard permission="member-payment-create">
                            <button
                                onClick={() => setShowPaymentCreate(true)}
                                className="px-5 py-2.5 bg-surface text-primary rounded-xl font-bold text-sm uppercase tracking-wide transition-all hover:bg-primary-muted hover:scale-105 active:scale-95 shadow-md flex items-center gap-2"
                            >
                                <i className="ri-hand-coin-line text-base" />
                                {(responseData?.currentSalary?.success && (fmt(remaining ) > 0)) ? "Pay Salary" : "Pay Advance"}
                            </button>
                        </PermissionGuard>

                        <PermissionGuard permission="member-salary-history-view">
                            <button
                                onClick={() => setMemberSalaryHistoryVisibility(true)}
                                className="px-5 py-2.5 bg-surface text-primary rounded-xl font-bold text-sm uppercase tracking-wide transition-all hover:bg-primary-muted hover:scale-105 active:scale-95 shadow-md flex items-center gap-2"
                            >
                                <i className="ri-history-line text-base" />
                                {responseData?.currentSalary?.success ? "Salary Change Log" : "Start Salary"}
                            </button>
                        </PermissionGuard>

                        <PermissionGuard permission="member-payment-view">
                            <button
                                onClick={() => setShowAllPayments(true)}
                                className="px-5 py-2.5 bg-surface text-primary rounded-xl font-bold text-sm uppercase tracking-wide transition-all hover:bg-primary-muted hover:scale-105 active:scale-95 shadow-md flex items-center gap-2"
                            >
                                <i className="ri-bar-chart-2-line text-base" />
                                Payment History
                            </button>
                        </PermissionGuard>
                    </div>
                </div>
            </div>

            {/* Info Cards */}
            <div className="flex flex-wrap gap-4">

                {/* Base Salary */}
                <div className="bg-surface  flex-1 rounded-2xl p-5 border border-edge hover:border-edge-brand transition-all shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-primary-muted text-primary flex items-center justify-center">
                            <i className="ri-bank-card-2-line text-lg" />
                        </div>
                        <span className="text-xs font-bold text-ink-subtle uppercase tracking-wide">Monthly</span>
                    </div>
                    <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1">Base Salary</p>
                    {hasSalaryConfig ? (
                        <div className="flex items-baseline gap-1">
                            <span className="text-xs font-medium text-ink-subtle">PKR</span>
                            <p className="text-2xl font-black text-ink">{fmt(currentSalary?.amount)}</p>
                        </div>
                    ) : (
                        <p className="text-sm text-ink-muted font-semibold">Not set</p>
                    )}
                </div>

                {/* Absence Cut */}
                <div className="bg-surface flex-1  rounded-2xl p-5 border border-edge hover:border-rose-300 transition-all shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-danger-muted text-danger flex items-center justify-center">
                            <i className="ri-scissors-2-line text-lg" />
                        </div>
                        <span className="text-xs font-bold text-ink-subtle uppercase tracking-wide">Per Day</span>
                    </div>
                    <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1">Absence Deduction</p>
                    {hasSalaryConfig ? (
                        <div className="flex items-baseline gap-1">
                            <span className="text-xs font-medium text-ink-subtle">PKR</span>
                            <p className="text-2xl font-black text-ink">{fmt(currentSalary?.perAbsenceCut)}</p>
                        </div>
                    ) : (
                        <p className="text-sm text-ink-muted font-semibold">Not set</p>
                    )}
                </div>

                {/* Class Partnership */}
                {/* <div className="bg-surface rounded-2xl p-5 border border-edge hover:border-edge-brand transition-all shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 rounded-xl bg-success-muted text-success flex items-center justify-center">
                            <i className="ri-group-line text-lg" />
                        </div>
                        <span className="text-xs font-bold text-ink-subtle uppercase tracking-wide">Partnership</span>
                    </div>
                    <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1">Class Share</p>
                    {hasPartnership ? (
                        <div className="flex flex-col gap-0.5">
                            <div className="flex items-baseline gap-1">
                                <span className="text-xs font-medium text-ink-subtle">PKR</span>
                                <p className="text-2xl font-black text-ink">{fmt(partnershipEarned)}</p>
                            </div>
                            <span className="text-xs text-ink-muted font-semibold">
                                {data.classPartnership.partnershipMap[0]?.partnershipType === 'percentage'
                                    ? `${data.classPartnership.partnershipMap[0]?.partnershipValue}% of collected fees`
                                    : 'Fixed rate'}
                            </span>
                        </div>
                    ) : (
                        <p className="text-sm text-ink-muted font-semibold">No partnership</p>
                    )}
                </div> */}
            </div>

            {/* Member Identity Bar */}
            <div className="bg-surface rounded-2xl p-4 border border-edge shadow-sm">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 min-w-[44px] rounded-xl app-gradient border border-edge-brand flex items-center justify-center text-primary">
                            <i className="ri-fingerprint-line text-xl" />
                        </div>
                        <div>
                            <h4 className="text-sm font-black text-ink">{member?.name || 'Active Partner'}</h4>
                            <p className="text-xs font-semibold text-primary uppercase tracking-wide">
                                ID: {member?.id || 'AUTH-00'}
                                {hasSalaryConfig && (
                                    <span className="text-ink-muted normal-case font-normal ml-2">
                                        · Since {new Date(currentSalary?.date).toLocaleDateString('en-PK', { month: 'short', year: 'numeric' })}
                                        · {currentSalary?.changeType === 'increase' ? '↑' : '↓'} {currentSalary?.changeType}
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 px-3 py-1.5 bg-success-muted rounded-xl border border-success-muted">
                        <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                        <span className="text-xs font-bold text-success uppercase">Live</span>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default MemberFinancialHub;



