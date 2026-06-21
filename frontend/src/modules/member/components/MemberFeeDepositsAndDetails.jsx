import React, { useState, useEffect } from 'react';
import { Trash2, DollarSign, CreditCard, Receipt, Users, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { useDeleteSalaryPaymentMutation } from '../member.rtk.api.js';
import ScreenTabButton from '@shared/components/ScreenTabButton';
import MemberSalaryPaymentCreationComp from './MemberSalaryPaymentCreationComp';
// import TransactionReceipt from '../../../common/components/Reciept';

const MemberFeeDepositsAndDetails = ({ memberId, setVisibility, responseData }) => {

    const [deleteSalaryPayment] = useDeleteSalaryPaymentMutation();
    const [activeTab, setActiveTab] = useState('breakdown');
    const [expandedRow, setExpandedRow] = useState(null);
    const [createPaymentVisibility, setCreatePaymentVisibility] = useState(false);
    const [paymentReceiptData, setPaymentReceiptData] = useState(null);
    const [paymentReceiptVisibility, setPaymentReceiptVisibility] = useState(false);

    // Correct data paths from API response
    const data = responseData?.data || {};
    const member = responseData?.member || {};
    const salaryMap = data?.salary?.salaryMap || [];
    const partnershipMap = data?.classPartnership?.partnershipMap || [];
    const transactions = data?.transactions || [];

    const formatDate = (iso) =>
        iso ? new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';

    const fmt = (val) =>
        val != null && !isNaN(Number(val)) ? `Rs ${parseFloat(val).toLocaleString()}` : '—';

    const tabActive = 'bg-surface text-primary shadow-sm border-edge-brand';

    async function handlePaymentDelete(paymentId) {
        await deleteSalaryPayment({ paymentId, memberId }).unwrap();
    }

    function handlePaymentReceipt(paymentData) {
        setPaymentReceiptData({
            name: member?.name,
            id: member?.id,
            receiptNo: paymentData?._id,
            date: paymentData?.date,
            method: paymentData?.paymentMethod,
            extraInfo: '',
            items: { Salary_Amount: paymentData?.salaryAmount },
        });
        setPaymentReceiptVisibility(true);
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10">

            {/* {paymentReceiptVisibility && (
                // <TransactionReceipt data={paymentReceiptData} setVisibility={setPaymentReceiptVisibility} />
            )} */}
            {createPaymentVisibility && (
                <MemberSalaryPaymentCreationComp setVisible={setCreatePaymentVisibility} memberId={memberId} />
            )}

            <div className="absolute inset-0 bg-surface/30 app-backdrop brightness-90" onClick={() => setVisibility(false)} />

            <div className="relative w-full max-w-4xl h-[85vh] bg-surface rounded-[2rem] shadow-2xl border border-edge-brand flex flex-col overflow-hidden">

                {/* Header */}
                <div className="p-5 md:p-6 border-b border-edge bg-surface sticky top-0 z-10">
                    <div className="flex justify-between items-start mb-5">
                        <div>
                            <h2 className="text-xl font-black text-ink tracking-tight">Payroll Hub</h2>
                            <p className="text-primary font-semibold text-xs mt-0.5">{member?.name || 'Member'} · ID: {member?.id || '—'}</p>
                        </div>
                        <button
                            onClick={() => setVisibility(false)}
                            className="p-2 hover:bg-danger-muted rounded-xl text-ink-subtle hover:text-danger transition-colors"
                        >
                            <i className="ri-close-line text-xl" />
                        </button>
                    </div>

                    <div className="flex bg-surface-muted p-1 rounded-xl w-full max-w-xs border border-edge">
                        <button
                            onClick={() => setActiveTab('breakdown')}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'breakdown' ? tabActive : 'text-ink-muted'}`}
                        >
                            <Calendar size={13} /> Breakdown
                        </button>
                        <button
                            onClick={() => setActiveTab('payments')}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'payments' ? tabActive : 'text-ink-muted'}`}
                        >
                            <CreditCard size={13} /> Payments
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5 md:p-6 scrollbar-hide">



   {/* Summary Footer */}
                            <div className="flex flex-wrap gap-3 pt-2 mt-2 mb-10">
                                {[
                                    { label: 'Total Earned', value: fmt(data?.totalEarned), color: 'text-primary' },
                                    { label: 'Total Paid', value: fmt(data?.totalPaid), color: 'text-success' },
                                    { label: 'Remaining', value: fmt(data?.remaining), color: 'text-ink' },
                                    { label: 'Advanced Paid', value: fmt(data?.advancePaid), color: 'text-ink' },
                                ].map((s, i) => (
                                    <div key={i} className="bg-surface border flex-1 border-edge rounded-2xl px-4 py-3">
                                        <p className="text-[10px] text-ink-subtle font-bold uppercase">{s.label}</p>
                                        <p className={`text-base font-black mt-0.5 ${s.color}`}>{s.value}</p>
                                    </div>
                                ))}
                            </div>




                    {/* ── BREAKDOWN TAB ── */}
                    {activeTab === 'breakdown' && (
                        <div className="space-y-3">

                            {/* Salary Section */}
                            {[...salaryMap].reverse().length > 0 && (
                                <div>
                                    <p className="text-xs font-black text-ink-muted uppercase tracking-widest mb-2 px-1">Monthly Salary</p>
                                    <div className="space-y-2">
                                        {[...salaryMap].reverse().map((entry, idx) => {
                                            const isOpen = expandedRow === `s-${idx}`;
                                            const month = entry?.attendanceSummary?.month || formatDate(entry?.date);
                                            const isPartial = entry?.status === 'partial';

                                            return (
                                                <div key={idx} className={`rounded-2xl border transition-all ${isOpen ? 'border-edge-brand shadow-sm' : 'border-edge'} bg-surface overflow-hidden`}>
                                                    <div
                                                        className="flex items-center justify-between px-4 py-3.5 cursor-pointer hover:bg-primary-muted/30 transition-colors"
                                                        onClick={() => setExpandedRow(isOpen ? null : `s-${idx}`)}
                                                    >
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className="w-9 h-9 rounded-xl bg-primary-muted text-primary flex items-center justify-center shrink-0">
                                                                <Calendar size={15} />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-black text-ink">{month}</p>
                                                                <p className="text-xs text-ink-muted font-semibold">
                                                                    {entry?.attendanceSummary?.present ?? '—'}d present · {entry?.absentDays ?? '—'}d absent
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-3 shrink-0 ml-3">
                                                            <div className="text-right hidden sm:block">
                                                                <p className="text-xs text-ink-muted font-semibold">Net Salary</p>
                                                                <p className="text-sm font-black text-primary">{fmt(entry?.netSalary)}</p>
                                                            </div>
                                                            {entry?.totalAbsenceCut > 0 && (
                                                                <div className="text-right hidden sm:block">
                                                                    <p className="text-xs text-ink-muted font-semibold">Deducted</p>
                                                                    <p className="text-sm font-black text-danger">- {fmt(entry?.totalAbsenceCut)}</p>
                                                                </div>
                                                            )}
                                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg uppercase tracking-wide ${isPartial ? 'bg-warning-muted text-warning' : 'bg-success-muted text-success'}`}>
                                                                {entry?.status || '—'}
                                                            </span>
                                                            {isOpen ? <ChevronUp size={15} className="text-ink-subtle" /> : <ChevronDown size={15} className="text-ink-subtle" />}
                                                        </div>
                                                    </div>

                                                    {isOpen && (
                                                        <div className="px-4 pb-4 pt-2 border-t border-edge bg-surface-muted">
                                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                                                {[
                                                                    { label: 'Full Salary', value: fmt(entry?.fullSalary) },
                                                                    { label: 'Earned Salary', value: fmt(entry?.earnedSalary) },
                                                                    { label: 'Absence Cut', value: fmt(entry?.totalAbsenceCut) },
                                                                    { label: 'Net Salary', value: fmt(entry?.netSalary) },
                                                                    { label: 'Per Day Cut', value: fmt(entry?.perAbsenceCut) },
                                                                    { label: 'Absent Days', value: entry?.absentDays ?? '—' },
                                                                    { label: 'Attendance %', value: entry?.attendanceSummary?.attendancePercentage != null ? `${entry.attendanceSummary.attendancePercentage}%` : '—' },
                                                                    { label: 'Present / Total', value: entry?.attendanceSummary ? `${entry.attendanceSummary.present} / ${entry.attendanceSummary.total}` : '—' },
                                                                ].map((item, i) => (
                                                                    <div key={i} className="bg-surface rounded-xl px-3 py-2 border border-edge">
                                                                        <p className="text-[10px] text-ink-subtle font-bold uppercase">{item.label}</p>
                                                                        <p className="text-ink font-semibold text-xs mt-0.5">{item.value}</p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Partnership Section */}
                            {/* {partnershipMap.length > 0 && (
                                <div className="mt-4">
                                    <p className="text-xs font-black text-ink-muted uppercase tracking-widest mb-2 px-1">Class Partnership</p>
                                    <div className="space-y-2">
                                        {partnershipMap.map((entry, idx) => {
                                            const isOpen = expandedRow === `p-${idx}`;

                                            return (
                                                <div key={idx} className={`rounded-2xl border transition-all ${isOpen ? 'border-edge-brand shadow-sm' : 'border-edge'} bg-surface overflow-hidden`}>
                                                    <div
                                                        className="flex items-center justify-between px-4 py-3.5 cursor-pointer hover:bg-primary-muted/30 transition-colors"
                                                        onClick={() => setExpandedRow(isOpen ? null : `p-${idx}`)}
                                                    >
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className="w-9 h-9 rounded-xl bg-success-muted text-success flex items-center justify-center shrink-0">
                                                                <Users size={15} />
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-black text-ink">
                                                                    {entry?.partnershipType === 'percentage'
                                                                        ? `${entry?.partnershipValue}% Class Share`
                                                                        : 'Fixed Partnership'}
                                                                </p>
                                                                <p className="text-xs text-ink-muted font-semibold">
                                                                    {entry?.totalTransactions ?? 0} transactions · {fmt(entry?.totalDeposited)} collected
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center gap-3 shrink-0 ml-3">
                                                            <div className="text-right hidden sm:block">
                                                                <p className="text-xs text-ink-muted font-semibold">Earned</p>
                                                                <p className="text-sm font-black text-success">{fmt(entry?.earnedSalary)}</p>
                                                            </div>
                                                            {isOpen ? <ChevronUp size={15} className="text-ink-subtle" /> : <ChevronDown size={15} className="text-ink-subtle" />}
                                                        </div>
                                                    </div>

                                                    {isOpen && (
                                                        <div className="px-4 pb-4 pt-2 border-t border-edge bg-surface-muted">
                                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                                                {[
                                                                    { label: 'Partnership Type', value: entry?.partnershipType || '—' },
                                                                    { label: 'Share Value', value: entry?.partnershipType === 'percentage' ? `${entry?.partnershipValue}%` : fmt(entry?.partnershipValue) },
                                                                    { label: 'Total Deposited', value: fmt(entry?.totalDeposited) },
                                                                    { label: 'Total Transactions', value: entry?.totalTransactions ?? '—' },
                                                                    { label: 'Earned', value: fmt(entry?.earnedSalary) },
                                                                    { label: 'Net Salary', value: fmt(entry?.netSalary) },
                                                                    { label: 'End Date', value: entry?.endDate ? formatDate(entry.endDate) : '—' },
                                                                ].map((item, i) => (
                                                                    <div key={i} className="bg-surface rounded-xl px-3 py-2 border border-edge">
                                                                        <p className="text-[10px] text-ink-subtle font-bold uppercase">{item.label}</p>
                                                                        <p className="text-ink font-semibold text-xs mt-0.5">{item.value}</p>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )} */}

                            {salaryMap.length === 0  && (
                                <div className="text-center py-20 text-ink-subtle text-sm font-semibold">No breakdown data available.</div>
                            )}

                         
                        </div>
                    )}

                    {/* ── PAYMENTS TAB ── */}
                    {activeTab === 'payments' && (
                        <div className="space-y-4">
                            <div className="flex justify-center" onClick={() => setCreatePaymentVisibility(true)}>
                                <ScreenTabButton text="Add Payment" lucideIcon={DollarSign} />
                            </div>

                            {transactions.length === 0 ? (
                                <div className="text-center py-20 text-ink-subtle text-sm font-semibold">No payment history found.</div>
                            ) : (
                                <div className="rounded-2xl border border-edge overflow-hidden shadow-sm">
                                    {/* Table Header */}
                                    <div className="grid grid-cols-[2fr_1.2fr_1.2fr_40px_40px] bg-surface-muted border-b border-edge">
                                        {['Amount / Type', 'Method', 'Date', '', ''].map((h, i) => (
                                            <div key={i} className="px-4 py-2.5 text-[10px] font-bold text-ink-subtle uppercase tracking-widest">{h}</div>
                                        ))}
                                    </div>

                                    {transactions.map((pay, idx) => {
                                        const isLast = idx === transactions.length - 1;
                                        const typeColors = {
                                            Monthly: { bg: 'var(--color-primary-muted)', color: 'var(--color-primary)' },
                                            Advance: { bg: 'var(--color-success-muted)', color: 'var(--color-success)' },
                                            Bonus: { bg: 'var(--color-warning-muted)', color: 'var(--color-warning)' },
                                        };
                                        const badge = typeColors[pay?.paymentType] ?? { bg: 'var(--color-surface-muted)', color: 'var(--color-ink-muted)' };

                                        return (
                                            <div
                                                key={idx}
                                                className="grid grid-cols-[2fr_1.2fr_1.2fr_40px_40px] items-center hover:bg-surface-muted/60 transition-colors"
                                                style={{ borderBottom: isLast ? 'none' : '1px solid var(--color-edge)' }}
                                            >
                                                <div className="px-4 py-3 flex items-center gap-2.5">
                                                    <div className="w-8 h-8 rounded-xl bg-primary-muted text-primary flex items-center justify-center shrink-0">
                                                        <CreditCard size={14} />
                                                    </div>
                                                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                                                        <span className="text-ink font-bold text-sm">Rs {pay?.salaryAmount?.toLocaleString() ?? '—'}</span>
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: badge.bg, color: badge.color }}>
                                                            {pay?.paymentType || '—'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="px-4 py-3 text-ink-muted text-xs font-semibold flex items-center gap-1.5">
                                                    <CreditCard size={12} className="text-ink-subtle shrink-0" />
                                                    {pay?.paymentMethod || '—'}
                                                </div>
                                                <div className="px-4 py-3 text-ink-subtle text-xs">{formatDate(pay?.date)}</div>
                                                <div className="flex items-center justify-center py-3">
                                                    <button
                                                        onClick={() => handlePaymentReceipt(pay)}
                                                        className="w-7 h-7 rounded-lg bg-primary-muted text-primary flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
                                                    >
                                                        <Receipt size={13} />
                                                    </button>
                                                </div>
                                                <div className="flex items-center justify-center py-3">
                                                    <button
                                                        onClick={() => handlePaymentDelete(pay?._id)}
                                                        className="w-7 h-7 rounded-lg bg-danger-muted text-danger flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MemberFeeDepositsAndDetails;



































// import React, { useState, useEffect } from 'react';
// import { IndianRupee, Trash2, DollarSign, CreditCard, Receipt, Users, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
// import { useDeleteSalaryPaymentMutation } from '../member.rtk.api.js';
// import ScreenTabButton from '@shared/components/ScreenTabButton';
// import MemberSalaryPaymentCreationComp from './MemberSalaryPaymentCreationComp';
// import TransactionReceipt from '../../../common/components/Reciept';

// const MemberFeeDepositsAndDetails = ({ memberId, setVisibility, responseData }) => {

//     const [deleteSalaryPayment] = useDeleteSalaryPaymentMutation();

//     const [activeTab, setActiveTab] = useState('breakdown');
//     const [allPayments, setAllPaymentState] = useState([]);
//     const [combinedMap, setCombinedMap] = useState([]);
//     const [expandedRow, setExpandedRow] = useState(null);
//     const [createPaymentVisibility, setCreatePaymentVisibility] = useState(false);
//     const [paymentReceiptData, setPaymentReceiptData] = useState(null);
//     const [paymentReceiptVisibility, setPaymentReceiptVisibility] = useState(false);

//     useEffect(() => {
//         if (responseData?.transactions) {
//             setAllPaymentState(responseData.transactions || []);
//         }
//     }, [responseData?.transactions]);

//     useEffect(() => {
//         const salaryEntries = responseData?.salary?.salaryMap || [];
//         const partnershipEntries = responseData?.classPartnership?.partnershipMap || [];
//         setCombinedMap([...salaryEntries, ...partnershipEntries]);
//     }, [responseData]);

//     const formatDate = (iso) =>
//         iso ? new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
//     const formatAmount = (val) => val != null ? `Rs ${parseFloat(val).toLocaleString()}` : '—';
//     const isSalary = (entry) => entry.type === 'salary';

//     const tabActive = 'bg-surface text-primary shadow-sm border-edge-brand';

//     async function handlePaymentDelete(paymentId) {
//         await deleteSalaryPayment({ paymentId, memberId }).unwrap();
//     }

//     function handlePaymentReceipt(paymentData) {
//         setPaymentReceiptData({
//             name: responseData?.member?.name,
//             id: responseData?.member?.id,
//             receiptNo: paymentData?._id,
//             date: paymentData?.date,
//             method: paymentData?.paymentMethod,
//             extraInfo: "",
//             items: { "Salary_Amount": paymentData?.salaryAmount }
//         });
//         setPaymentReceiptVisibility(true);
//     }

//     return (
//         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10">

//             {paymentReceiptVisibility && <TransactionReceipt data={paymentReceiptData} setVisibility={setPaymentReceiptVisibility} />}
//             {createPaymentVisibility && <MemberSalaryPaymentCreationComp setVisible={setCreatePaymentVisibility} memberId={memberId} />}

//             <div className="absolute inset-0 bg-surface/30 app-backdrop brightness-90" onClick={() => setVisibility(false)} />

//             <div className="relative w-full max-w-4xl h-[80vh] bg-surface rounded-[2rem] shadow-2xl border border-edge-brand flex flex-col overflow-hidden">

//                 {/* Header */}
//                 <div className="p-6 border-b border-edge-brand bg-surface/80 sticky top-0 z-10">
//                     <div className="flex justify-between items-center mb-6">
//                         <div>
//                             <h2 className="text-2xl font-black text-ink tracking-tight">Member Payroll Hub</h2>
//                             <p className="text-primary font-semibold text-sm">Managing Earnings & Disbursals</p>
//                         </div>
//                         <button onClick={() => setVisibility(false)} className="p-2 hover:bg-danger-muted rounded-full text-ink-subtle hover:text-danger transition-colors">
//                             <i className="ri-close-line text-2xl"></i>
//                         </button>
//                     </div>

//                     <div className="flex bg-surface-muted p-1.5 rounded-2xl w-full max-w-sm mx-auto border border-edge">
//                         <button
//                             onClick={() => setActiveTab('breakdown')}
//                             className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'breakdown' ? tabActive : 'text-ink-muted'}`}
//                         >
//                             <Calendar size={16} /> Breakdown
//                         </button>
//                         <button
//                             onClick={() => setActiveTab('payments')}
//                             className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'payments' ? tabActive : 'text-ink-muted'}`}
//                         >
//                             <IndianRupee size={16} /> Payments
//                         </button>
//                     </div>
//                 </div>

//                 {/* Content */}
//                 <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
//                     {activeTab === 'breakdown' ? (

//                         <div className="space-y-2">
//                             {/* Header Row */}
//                             <div className="grid grid-cols-12 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-ink-subtle">
//                                 <div className="col-span-1">Type</div>
//                                 <div className="col-span-2">Date</div>
//                                 <div className="col-span-2">Full Salary</div>
//                                 <div className="col-span-2">Earned</div>
//                                 <div className="col-span-2">Deduction</div>
//                                 <div className="col-span-2">Net</div>
//                                 <div className="col-span-1"></div>
//                             </div>

//                             {combinedMap.map((entry, idx) => {
//                                 const isOpen = expandedRow === idx;
//                                 const salary = isSalary(entry);

//                                 return (
//                                     <div key={idx} className={`rounded-2xl border transition-all ${isOpen ? 'border-edge-brand shadow-md shadow-sm' : 'border-edge'} bg-surface overflow-hidden`}>
//                                         <div
//                                             className="grid grid-cols-12 items-center px-4 py-3.5 cursor-pointer hover:bg-primary-muted/40 transition-colors"
//                                             onClick={() => setExpandedRow(isOpen ? null : idx)}
//                                         >
//                                             <div className="col-span-1">
//                                                 <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${salary ? 'bg-primary-muted text-primary' : 'bg-primary-muted text-primary'}`}>
//                                                     {salary ? <Calendar size={15} /> : <Users size={15} />}
//                                                 </div>
//                                             </div>
//                                             <div className="col-span-2 text-ink-muted text-[13px] font-semibold">
//                                                 {formatDate(entry.date)}
//                                                 {entry.status && (
//                                                     <span className="ml-1 text-[10px] text-ink-subtle font-normal">
//                                                         ({entry.status}{entry.days ? ` · ${entry.days}d` : ''})
//                                                     </span>
//                                                 )}
//                                             </div>
//                                             <div className="col-span-2 text-ink-muted text-[13px]">{formatAmount(entry.fullSalary)}</div>
//                                             <div className="col-span-2 text-ink text-[13px] font-semibold">{formatAmount(entry.earnedSalary)}</div>
//                                             <div className={`col-span-2 text-[13px] font-semibold ${entry.totalAbsenceCut > 0 ? 'text-danger' : 'text-ink-subtle'}`}>
//                                                 {entry.totalAbsenceCut > 0 ? `- ${formatAmount(entry.totalAbsenceCut)}` : '—'}
//                                             </div>
//                                             <div className="col-span-2 text-primary font-black text-[14px]">{formatAmount(entry.netSalary)}</div>
//                                             <div className="col-span-1 flex justify-end text-ink-subtle">
//                                                 {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
//                                             </div>
//                                         </div>

//                                         {isOpen && (
//                                             <div className="px-4 pb-4 pt-1 border-t border-edge bg-surface-muted">
//                                                 <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
//                                                     {(salary ? [
//                                                         { label: 'Absent Days', value: entry.absentDays ?? '—' },
//                                                         { label: 'Per Absence Cut', value: formatAmount(entry.perAbsenceCut) },
//                                                         { label: 'Attendance %', value: entry.attendanceSummary ? `${entry.attendanceSummary.attendancePercentage}%` : '—' },
//                                                         { label: 'Present / Total', value: entry.attendanceSummary ? `${entry.attendanceSummary.present} / ${entry.attendanceSummary.total}` : '—' },
//                                                     ] : [
//                                                         { label: 'Partnership Type', value: entry.partnershipType },
//                                                         { label: 'Value', value: entry.partnershipType === 'percentage' ? `${entry.partnershipValue}%` : formatAmount(entry.partnershipValue) },
//                                                         { label: 'Total Deposited', value: formatAmount(entry.totalDeposited) },
//                                                         { label: 'Transactions', value: entry.totalTransactions },
//                                                     ]).map((item, i) => (
//                                                         <div key={i} className="bg-surface rounded-xl px-3 py-2.5 border border-edge">
//                                                             <p className="text-[10px] text-ink-subtle font-bold uppercase">{item.label}</p>
//                                                             <p className="text-ink font-semibold text-[13px] mt-0.5">{item.value}</p>
//                                                         </div>
//                                                     ))}
//                                                 </div>
//                                             </div>
//                                         )}
//                                     </div>
//                                 );
//                             })}

//                             {/* Summary Footer */}
//                             <div className="grid grid-cols-3 gap-3 pt-2">
//                                 {[
//                                     { label: 'Total Earned', value: formatAmount(responseData?.totalEarned), color: 'text-primary' },
//                                     { label: 'Total Paid', value: formatAmount(responseData?.totalPaid), color: 'text-success' },
//                                     {
//                                         label: responseData?.advancePaid > 0 ? 'Advance Paid' : 'Remaining',
//                                         value: formatAmount(responseData?.advancePaid > 0 ? responseData?.advancePaid : responseData?.remaining),
//                                         color: responseData?.advancePaid > 0 ? 'text-warning' : 'text-ink'
//                                     },
//                                 ].map((s, i) => (
//                                     <div key={i} className="bg-surface border border-edge rounded-2xl px-4 py-3">
//                                         <p className="text-[10px] text-ink-subtle font-bold uppercase">{s.label}</p>
//                                         <p className={`text-lg font-black mt-0.5 ${s.color}`}>{s.value}</p>
//                                     </div>
//                                 ))}
//                             </div>
//                         </div>

//                     ) : (

//                         /* PAYMENTS VIEW — untouched */
//                         <div className="space-y-3">
//                             <div className="flex justify-center items-center w-full" onClick={() => setCreatePaymentVisibility(true)}>
//                                 <ScreenTabButton text={"Add Payment"} lucideIcon={DollarSign} />
//                             </div>

//                             <div className="rounded-2xl border border-edge overflow-hidden shadow-sm">
//                                 <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1.2fr auto auto' }} className="bg-surface-muted border-b border-edge">
//                                     {['Amount / Type', 'Method', 'Date', 'Receipt', 'Delete'].map((h, i) => (
//                                         <div key={i} className="px-4 py-2.5 text-[11px] font-semibold text-ink-subtle uppercase tracking-widest">{h}</div>
//                                     ))}
//                                 </div>

//                                 {allPayments?.map((pay, idx) => {
//                                     const isLast = idx === allPayments.length - 1;
//                                     const typeColors = {
//                                         Monthly: { bg: 'var(--color-primary-muted)', color: 'var(--color-primary-hover)' },
//                                         Advance: { bg: 'var(--color-success-muted)', color: 'var(--color-success)' },
//                                         Bonus: { bg: 'var(--color-warning-muted)', color: 'var(--color-warning)' },
//                                     };
//                                     const badge = typeColors[pay.paymentType] ?? { bg: 'var(--color-surface-muted)', color: 'var(--color-ink-muted)' };

//                                     return (
//                                         <div
//                                             key={idx}
//                                             style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1.2fr auto auto', alignItems: 'center', borderBottom: isLast ? 'none' : '1px solid var(--color-edge)', background: 'var(--color-surface)', transition: 'background 0.15s' }}
//                                             className="hover:bg-surface-muted/60 group"
//                                         >
//                                             <div className="px-4 py-3.5 flex items-center gap-2.5">
//                                                 <div className="w-8 h-8 rounded-xl bg-primary-muted text-primary flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
//                                                     <IndianRupee size={15} />
//                                                 </div>
//                                                 <div className="flex items-center gap-2 flex-wrap">
//                                                     <span className="text-ink font-semibold text-[15px]">Rs {pay.salaryAmount?.toLocaleString()}</span>
//                                                     <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ background: badge.bg, color: badge.color }}>{pay.paymentType}</span>
//                                                 </div>
//                                             </div>
//                                             <div className="px-4 py-3.5 text-ink-muted text-[13px] flex items-center gap-1.5">
//                                                 <CreditCard size={13} className="text-ink-subtle shrink-0" />{pay.paymentMethod}
//                                             </div>
//                                             <div className="px-4 py-3.5 text-ink-subtle text-[13px]">{formatDate(pay.date)}</div>
//                                             <div className="px-3 py-3.5 flex items-center justify-center">
//                                                 <button onClick={() => handlePaymentReceipt(pay)} className="w-8 h-8 rounded-lg bg-primary-muted text-primary flex items-center justify-center hover:bg-primary-muted transition-colors">
//                                                     <Receipt size={15} />
//                                                 </button>
//                                             </div>
//                                             <div className="px-3 py-3.5 flex items-center justify-center">
//                                                 <button onClick={() => handlePaymentDelete(pay._id)} className="w-8 h-8 rounded-lg bg-danger-muted text-red-400 flex items-center justify-center hover:bg-danger-muted transition-colors">
//                                                     <Trash2 size={14} />
//                                                 </button>
//                                             </div>
//                                         </div>
//                                     );
//                                 })}
//                             </div>

//                             {allPayments.length === 0 && (
//                                 <div className="text-center py-20 text-ink-subtle">No payment history found.</div>
//                             )}
//                         </div>
//                     )}
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default MemberFeeDepositsAndDetails;