




























import React, { useState, useEffect } from 'react';
import { PermissionGuard } from '@shared/components/PermissionGuard';
import axios from 'axios';
import api from '@shared/services/api.js';
import { Edit, Receipt, Trash } from "lucide-react"
import InvestorPaymentCreate from './InvesterPaymentCreate';
import InvesterPaymentUpdate from './InvesterPaymentUpdate';

// import React, { useState } from 'react';
// import MemberSalaryPaymentCreationComp from './InvestorSalaryPaymentCreationComp';
// import MemberInvoicesAndFeeDeposits from './InvestorInvoicesAndFeeDeposits';
// import { useRecalculateMemberFinancials } from '../api/memberFinance.api';
// import { PermissionGuard } from '../../../common/components/PermissionGaurd';

// const MemberFinancialHub = ({ memberId, responseData, onAction }) => {
//     let { mutateAsync: memberFinancialRecalculation } = useRecalculateMemberFinancials()

//     const member = responseData?.member || {};
//     const stats = responseData?.calculations || {};
//     const [showAllPayments, setShowAllPayments] = useState(false);
//     const [showPaymentCreate, setShowPaymentCreate] = useState(false);


//     async function handleRecalculateFinancialsBtnClick() {
//         await memberFinancialRecalculation(memberId)
//     }





//     return (
//         <div className="w-full h-full min-h-[500px] flex flex-col gap-5 font-sans antialiased text-ink">



//             {showAllPayments && <MemberInvoicesAndFeeDeposits memberId={memberId} setVisibility={setShowAllPayments} responseData={responseData} />}
//             {showPaymentCreate && <MemberSalaryPaymentCreationComp memberId={memberId} setVisible={setShowPaymentCreate} />}



//             {/* Main Wallet Card */}
//             <div className="app-gradient rounded-3xl p-8 relative overflow-hidden shadow-xl shadow-sm/50">
//                 {/* Decorative Elements */}
//                 <div className="absolute -top-20 -right-20 w-48 h-48 bg-surface/10 rounded-full"></div>
//                 <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-surface/5 rounded-full blur-2xl"></div>

//                 {/* Content */}
//                 <div className="relative z-10">
//                     {/* Header Label */}
//                     <div className="flex items-center gap-2 mb-6">
//                         <div className="w-2 h-2 rounded-full bg-primary-muted "></div>
//                         <span className="text-xs font-bold uppercase tracking-wider text-primary-muted">Available Balance</span>
//                     </div>

//                     {/* Main Amount */}
//                     <div className="mb-8">
//                         <div className="flex items-baseline gap-3">
//                             <span className="text-lg font-medium text-primary-muted">PKR  </span>
//                             <h1 className="text-6xl md:text-7xl font-black text-primary-foreground tracking-tight">
//                                 {stats?.totalRemainingAmount?.toLocaleString()}
//                             </h1>
//                         </div>
//                     </div>

//                     {/* Stats Row */}
//                     <div className="flex flex-wrap items-center justify-between gap-6 pt-6 border-t border-surface/20">
//                         <div className="flex gap-8">
//                             <div>
//                                 <p className="text-xs font-semibold text-primary-muted uppercase tracking-wide mb-1">Paid</p>
//                                 <p className="text-2xl font-black text-primary-foreground">PKR  {stats?.totalPaidAmount?.toLocaleString()}</p>
//                             </div>
//                             <div className="border-l border-surface/20 pl-8">
//                                 <p className="text-xs font-semibold text-primary-muted uppercase tracking-wide mb-1">Advance</p>
//                                 <p className="text-2xl font-black text-primary-foreground/70">PKR  {stats?.advancedBalance?.toLocaleString()}</p>
//                             </div>
//                         </div>
//                         <div className="flex gap-5">
//                             <PermissionGuard permission={"investor-payment-create"}>
//                                 <button
//                                     onClick={() => setShowPaymentCreate(true)}
//                                     className="px-8 py-3.5 bg-surface text-primary rounded-2xl font-bold text-sm uppercase tracking-wide transition-all hover:bg-primary-muted hover:scale-105 active:scale-95 shadow-lg flex items-center gap-2.5"
//                                 >
//                                     <i className="ri-flashlight-fill text-lg"></i>
//                                     Give Payment
//                                 </button>
//                             </PermissionGuard>


//                             {/* Sync Button Card */}
//                             <PermissionGuard permission={"investor-payment-recalculate"}>
//                                 <div
//                                     onClick={() => { handleRecalculateFinancialsBtnClick() }}
//                                 >
//                                     <button
//                                         className="px-8 py-3.5 bg-surface text-primary rounded-2xl font-bold text-sm uppercase tracking-wide transition-all hover:bg-primary-muted hover:scale-105 active:scale-95 shadow-lg flex items-center gap-2.5"
//                                     >
//                                         <i className="ri-flashlight-fill text-lg"></i>
//                                         Recalculate Finance
//                                     </button>
//                                 </div>
//                             </PermissionGuard>
//                         </div>
//                     </div>
//                 </div>
//             </div>

//             {/* Info Cards Grid */}
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

//                 {/* Base Salary Card */}
//                 <div className="bg-surface rounded-2xl p-6 border border-edge hover:border-edge-brand transition-all shadow-sm">
//                     <div className="flex items-start justify-between mb-4">
//                         <div className="w-12 h-12 rounded-xl bg-primary-muted text-primary flex items-center justify-center">
//                             <i className="ri-bank-card-2-line text-xl"></i>
//                         </div>
//                         <span className="text-xs font-bold text-ink-subtle uppercase tracking-wide">Monthly</span>
//                     </div>
//                     <p className="text-sm font-semibold text-ink-muted uppercase tracking-wide mb-2">Base Salary</p>
//                     <div className="flex items-baseline gap-2">
//                         <span className="text-sm font-medium text-ink-subtle">PKR  </span>
//                         <p className="text-3xl font-black text-ink">{member?.salary?.toLocaleString()}</p>
//                     </div>
//                 </div>

//                 {/* Absence Cut Card */}
//                 <div className="bg-surface rounded-2xl p-6 border border-edge hover:border-rose-300 transition-all shadow-sm">
//                     <div className="flex items-start justify-between mb-4">
//                         <div className="w-12 h-12 rounded-xl bg-danger-muted text-danger flex items-center justify-center">
//                             <i className="ri-scissors-2-line text-xl"></i>
//                         </div>
//                         <span className="text-xs font-bold text-ink-subtle uppercase tracking-wide">Per Day</span>
//                     </div>
//                     <p className="text-sm font-semibold text-ink-muted uppercase tracking-wide mb-2">Absence Cut</p>
//                     <div className="flex items-baseline gap-2">
//                         <span className="text-sm font-medium text-ink-subtle">PKR  </span>
//                         <p className="text-3xl font-black text-ink">{member?.perAttendenceCut?.toLocaleString()}</p>
//                     </div>
//                 </div>

//                 {/* Sync Button Card */}
//                 {/* <PermissionGuard permission={"member-payment-recalculate"}>
//                     <div
//                         onClick={() => { handleRecalculateFinancialsBtnClick() }}
//                         className="bg-surface active:scale-95 rounded-2xl p-6 border-2 border-dashed border-edge hover:border-edge-brand transition-all shadow-sm flex items-center justify-center">
//                         <button

//                             className="flex flex-col items-center gap-3 group w-full "
//                         >
//                             <div className="w-14 h-14 rounded-2xl bg-primary-muted text-primary flex items-center justify-center transition-all group-hover:bg-primary group-hover:text-primary-foreground group-hover:rotate-180 duration-500">
//                                 <i className="ri-refresh-line text-2xl"></i>
//                             </div>
//                             <span className="text-sm font-bold text-ink-muted uppercase tracking-wide group-hover:text-primary transition-colors">Recalculate Account</span>
//                         </button>
//                     </div>
//                 </PermissionGuard> */}

//             </div>

//             {/* Member Info & Actions Bar */}
//             <div className="bg-surface rounded-2xl p-5 border border-edge shadow-sm">
//                 <div className="flex flex-col md:flex-row items-center justify-between gap-5">

//                     {/* Member Info */}
//                     <div className="flex items-center gap-4">
//                         <div className="w-14 h-14 rounded-2xl app-gradient border border-edge-brand flex items-center justify-center text-primary">
//                             <i className="ri-fingerprint-line text-2xl"></i>
//                         </div>
//                         <div>
//                             <h4 className="text-base font-black text-ink">{member?.name || "Active Partner"}</h4>
//                             <p className="text-xs font-semibold text-primary uppercase tracking-wide">ID: {member?.id || 'AUTH-00'}</p>
//                         </div>
//                     </div>

//                     {/* Action Buttons */}
//                     <div className="flex items-center gap-3">
//                         <PermissionGuard permission={"investor-payment-view"}>
//                             <button
//                                 onClick={() => { setShowAllPayments(true) }}
//                                 className="px-6 py-3 rounded-xl text-sm font-bold text-primary hover:text-primary  bg-primary-muted cursor-pointer border-4 shadow-md hover:scale-105 active:scale-95 border-edge transition-all flex items-center gap-2"
//                             >
//                                 <i className="ri-pulse-line text-base"></i>
//                                 Full Analysis
//                             </button>
//                         </PermissionGuard>

//                         <div className="w-px h-8 bg-border"></div>

//                         {/* <button
//                                       className="px-6 py-3 rounded-xl text-sm font-bold text-ink-muted hover:text-ink hover:bg-surface-muted transition-all flex items-center gap-2"
//                                   >
//                                       <i className="ri-download-2-line text-base"></i>
//                                       Download PDF
//                                   </button> */}

//                         <div className="flex items-center gap-2 ml-3 px-4 py-2 bg-success-muted rounded-xl border border-success-muted">
//                             <div className="w-2 h-2 rounded-full bg-success "></div>
//                             <span className="text-xs font-bold text-success uppercase">Live</span>
//                         </div>
//                     </div>

//                 </div>
//             </div>

//         </div>
//     );
// };

// export default MemberFinancialHub;











































const InvestorFinancialHub = ({ memberId, memberData }) => {

    const [showPaymentCreate, setShowPaymentCreate] = useState(false);
    const [paymentsData, setPaymentsData] = useState(null);
    const [paymentsLoading, setPaymentsLoading] = useState(false);
    const [currentToUpdatePayment, setCurrentToUpdatePayment] = useState(null)
    const [paymentUpdateVisibility, setPaymentUpdateVisibility] = useState()
    const [paymentReceiptData, setPaymentReceiptData] = useState(null)
    const [paymentReceiptVisibility, setPaymentReceiptVisibility] = useState(false)


    const fetchPayments = async () => {
        if (!memberId) return;

        setPaymentsLoading(true);
        try {
            const res = await api.post('/memberRoute/getInvesterPayments', { memberId });
            if (res.data.success) {
                setPaymentsData(res.data);
                console.log(res.data)
            }
        } catch (err) {
            console.log(err?.message);
        } finally {
            setPaymentsLoading(false);
        }
    };


    async function handleDeletePayment(memberId, salaryId) {
        try {
            const res = await api.delete(`/memberRoute/deleteSalaryPayment`, { data: { memberId, salaryId } })
            if (res.data.success) {
                fetchPayments()
            }
        } catch (err) {
            console.error("Delete Error:", err)
        }
    }




    useEffect(() => {
        fetchPayments();
    }, [memberId]);

    async function handleRecalculateFinancialsBtnClick() {
        fetchPayments()
    }

    const payments = paymentsData?.salaryPayments || [];
    const totalPayments = paymentsData?.totalPayments || 0;














    function handlePaymentReceipt(paymentData) {

        console.log(paymentData, "The payment data")
        setPaymentReceiptData({
            name: memberData?.name,
            id: memberData?._id,
            receiptNo: paymentData?._id,
            date: paymentData?.date,
            method: paymentData?.paymentMethod,
            extraInfo: "",
            items: {
                "Investment_Amount": paymentData?.salaryAmount,
            }
        })

        setPaymentReceiptVisibility(true)

    }







    return (
        <div className="w-full h-full min-h-[500px] flex flex-col gap-5 font-sans antialiased text-ink">



            {showPaymentCreate && <InvestorPaymentCreate getInvesterPayments={fetchPayments} origin={"investerPayment"} memberId={memberId} setVisible={setShowPaymentCreate} />}
            {paymentUpdateVisibility && <InvesterPaymentUpdate getInvesterPayments={fetchPayments} setVisible={setPaymentUpdateVisibility} memberId={memberId} paymentData={currentToUpdatePayment} />}





            {/* Total Payments Header Card */}
            <div className="app-gradient rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-xl shadow-sm/50">
                <div className="absolute -top-20 -right-20 w-48 h-48 bg-surface/10 rounded-full"></div>
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-surface/5 rounded-full blur-2xl"></div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    {/* Total Amount */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-2 h-2 rounded-full bg-primary-muted "></div>
                            <span className="text-xs font-bold uppercase tracking-wider text-primary-muted">Total Payments Given</span>
                        </div>
                        <div className="flex items-baseline gap-3">
                            <span className="text-lg font-medium text-primary-muted">PKR  </span>
                            {paymentsLoading
                                ? <h1 className="text-3xl  font-black text-primary-foreground/40 tracking-tight">...</h1>
                                : <h1 className="text-3xl font-black text-primary-foreground tracking-tight">{totalPayments?.toLocaleString()}</h1>
                            }
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex flex-wrap gap-3">
                        <PermissionGuard permission={"investor-payment-create"}>
                            <button
                                onClick={() => setShowPaymentCreate(true)}
                                className="px-4 py-2 bg-surface/20 hover:bg-surface/30 text-primary-foreground rounded-xl font-bold text-xs uppercase tracking-wide transition-all hover:scale-105 active:scale-95 flex items-center gap-2 border border-surface/30"
                            >
                                <i className="ri-add-line text-sm"></i>
                                Give Payment
                            </button>
                        </PermissionGuard>

                        {/* <PermissionGuard permission={"investor-payment-recalculate"}>
                            <div onClick={() => { handleRecalculateFinancialsBtnClick() }}>
                                <button className="px-4 py-2 bg-surface/20 hover:bg-surface/30 text-primary-foreground rounded-xl font-bold text-xs uppercase tracking-wide transition-all hover:scale-105 active:scale-95 flex items-center gap-2 border border-surface/30">
                                    <i className="ri-refresh-line text-sm"></i>
                                    Recalculate
                                </button>
                            </div>
                        </PermissionGuard> */}
                    </div>
                </div>
            </div>

            {/* Payments Record */}
            <div className="bg-surface rounded-2xl border border-edge shadow-sm overflow-hidden">

                {/* Header */}
                <div className="px-4 md:px-6 py-4 border-b border-edge flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-primary-muted text-primary flex items-center justify-center">
                            <i className="ri-file-list-3-line text-base"></i>
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-ink uppercase tracking-wide">Payments Record</h3>
                            <p className="text-xs text-ink-subtle font-medium">{payments.length} payment{payments.length !== 1 ? 's' : ''} found</p>
                        </div>
                    </div>
                    {/* <div className="flex items-baseline gap-1.5 bg-success-muted border border-success-muted px-4 py-2 rounded-xl">
                        <span className="text-xs font-bold text-success">Total:</span>
                        <span className="text-base font-black text-success">PKR   {totalPayments?.toLocaleString()}</span>
                    </div> */}
                </div>

                {/* Column Headers */}
                <div className="grid grid-cols-4 md:grid-cols-5 px-4 md:px-6 py-3 bg-surface-muted border-b border-edge">
                    <span className="text-lg font-bold text-ink-subtle uppercase tracking-wide">#</span>
                    <span className="text-lg font-bold text-ink-subtle uppercase tracking-wide">Amount</span>
                    <span className="text-lg font-bold text-ink-subtle uppercase tracking-wide">Method</span>
                    <span className="text-lg font-bold text-ink-subtle uppercase tracking-wide">Date</span>
                </div>

                {/* Rows */}
                {paymentsLoading ? (
                    <div className="flex items-center justify-center py-16 gap-3">
                        <div className="w-5 h-5 rounded-full border-2 border-accent border-t-transparent "></div>
                        <span className="text-sm font-semibold text-ink-subtle">Fetching payments...</span>
                    </div>
                ) : payments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-surface-muted border border-edge flex items-center justify-center text-ink-subtle">
                            <i className="ri-inbox-line text-2xl"></i>
                        </div>
                        <p className="text-sm font-bold text-ink-subtle uppercase tracking-wide">No payments found</p>
                    </div>
                ) : (
                    <div className=" overflow-y-scroll h-full">
                        {payments?.sort((a, b) => new Date(a.date) - new Date(b.date))?.map((payment, index) => (
                            <div key={payment._id || index} className="grid grid-cols-4 md:grid-cols-5 px-4 md:px-6 py-4 hover:bg-surface-muted/70 transition-colors items-center">
                                <span className="w-6 h-6 rounded-lg bg-surface-muted text-ink-muted text-lg font-black flex items-center justify-center">
                                    {index + 1}
                                </span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-lg text-ink-subtle font-medium hidden sm:block">PKR  </span>
                                    <span className="text-lg font-black text-ink-muted">{payment.salaryAmount?.toLocaleString()}</span>
                                </div>

                                <span className="text-lg font-semibold text-ink-muted truncate">{payment.paymentMethod}</span>
                                <div className="flex items-center gap-1">
                                    <i className="ri-calendar-line text-ink-subtle text-xs hidden sm:block"></i>
                                    <span className="text-lg font-semibold text-ink-muted">
                                        {new Date(payment.date).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </span>
                                </div>

                                <div className="flex items-center justify-end gap-2">
                                    <button
                                        onClick={() => handlePaymentReceipt(payment)}
                                        className="w-8 h-8 rounded-lg bg-surface-muted hover:bg-primary-muted hover:text-primary text-ink-subtle flex items-center justify-center transition-all hover:scale-105 active:scale-95">
                                        <Receipt size={14} />
                                    </button>

                                    <button
                                        onClick={() => { setCurrentToUpdatePayment(payment); setPaymentUpdateVisibility(true) }}
                                        className="w-8 h-8 rounded-lg bg-surface-muted hover:bg-primary-muted hover:text-primary text-ink-subtle flex items-center justify-center transition-all hover:scale-105 active:scale-95">
                                        <Edit size={14} />
                                    </button>
                                    <button
                                        onClick={() => { handleDeletePayment(memberId, payment._id) }}
                                        className="w-8 h-8 rounded-lg bg-surface-muted hover:bg-danger-muted hover:text-danger text-ink-subtle flex items-center justify-center transition-all hover:scale-105 active:scale-95">
                                        <Trash size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

        </div>
    );
};

export default InvestorFinancialHub;