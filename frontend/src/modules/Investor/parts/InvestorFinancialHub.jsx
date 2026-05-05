






























// import React, { useState } from 'react';
// import TeacherSalaryPaymentCreationComp from './InvestorSalaryPaymentCreationComp';
// import TeacherInvoicesAndFeeDeposits from './InvestorInvoicesAndFeeDeposits';
// import { useRecalculateTeacherFinancials } from '../api/teacherFinance.api';
// import { PermissionGuard } from '../../../common/components/PermissionGaurd';

// const TeacherFinancialHub = ({ teacherId, responseData, onAction }) => {
//     let { mutateAsync: teacherFinancialRecalculation } = useRecalculateTeacherFinancials()

//     const teacher = responseData?.teacher || {};
//     const stats = responseData?.calculations || {};
//     const [showAllPayments, setShowAllPayments] = useState(false);
//     const [showPaymentCreate, setShowPaymentCreate] = useState(false);


//     async function handleRecalculateFinancialsBtnClick() {
//         await teacherFinancialRecalculation(teacherId)
//     }





//     return (
//         <div className="w-full h-full min-h-[500px] flex flex-col gap-5 font-sans antialiased text-slate-900">



//             {showAllPayments && <TeacherInvoicesAndFeeDeposits teacherId={teacherId} setVisibility={setShowAllPayments} responseData={responseData} />}
//             {showPaymentCreate && <TeacherSalaryPaymentCreationComp teacherId={teacherId} setVisible={setShowPaymentCreate} />}



//             {/* Main Wallet Card */}
//             <div className="bg-gradient-to-br from-cyan-500 via-cyan-600 to-cyan-700 rounded-3xl p-8 relative overflow-hidden shadow-xl shadow-cyan-200/50">
//                 {/* Decorative Elements */}
//                 <div className="absolute -top-20 -right-20 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
//                 <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>

//                 {/* Content */}
//                 <div className="relative z-10">
//                     {/* Header Label */}
//                     <div className="flex items-center gap-2 mb-6">
//                         <div className="w-2 h-2 rounded-full bg-cyan-200 animate-pulse"></div>
//                         <span className="text-xs font-bold uppercase tracking-wider text-cyan-100">Available Balance</span>
//                     </div>

//                     {/* Main Amount */}
//                     <div className="mb-8">
//                         <div className="flex items-baseline gap-3">
//                             <span className="text-lg font-medium text-cyan-200">PKR</span>
//                             <h1 className="text-6xl md:text-7xl font-black text-white tracking-tight">
//                                 {stats?.totalRemainingAmount?.toLocaleString()}
//                             </h1>
//                         </div>
//                     </div>

//                     {/* Stats Row */}
//                     <div className="flex flex-wrap items-center justify-between gap-6 pt-6 border-t border-white/20">
//                         <div className="flex gap-8">
//                             <div>
//                                 <p className="text-xs font-semibold text-cyan-200 uppercase tracking-wide mb-1">Paid</p>
//                                 <p className="text-2xl font-black text-white">₹{stats?.totalPaidAmount?.toLocaleString()}</p>
//                             </div>
//                             <div className="border-l border-white/20 pl-8">
//                                 <p className="text-xs font-semibold text-cyan-200 uppercase tracking-wide mb-1">Advance</p>
//                                 <p className="text-2xl font-black text-white/70">₹{stats?.advancedBalance?.toLocaleString()}</p>
//                             </div>
//                         </div>
//                         <div className="flex gap-5">
//                             <PermissionGuard permission={"investor-payment-create"}>
//                                 <button
//                                     onClick={() => setShowPaymentCreate(true)}
//                                     className="px-8 py-3.5 bg-white text-cyan-600 rounded-2xl font-bold text-sm uppercase tracking-wide transition-all hover:bg-cyan-50 hover:scale-105 active:scale-95 shadow-lg flex items-center gap-2.5"
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
//                                         className="px-8 py-3.5 bg-white text-cyan-600 rounded-2xl font-bold text-sm uppercase tracking-wide transition-all hover:bg-cyan-50 hover:scale-105 active:scale-95 shadow-lg flex items-center gap-2.5"
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
//                 <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-cyan-300 transition-all shadow-sm">
//                     <div className="flex items-start justify-between mb-4">
//                         <div className="w-12 h-12 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
//                             <i className="ri-bank-card-2-line text-xl"></i>
//                         </div>
//                         <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Monthly</span>
//                     </div>
//                     <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">Base Salary</p>
//                     <div className="flex items-baseline gap-2">
//                         <span className="text-sm font-medium text-slate-400">PKR</span>
//                         <p className="text-3xl font-black text-slate-800">{teacher?.salary?.toLocaleString()}</p>
//                     </div>
//                 </div>

//                 {/* Absence Cut Card */}
//                 <div className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-rose-300 transition-all shadow-sm">
//                     <div className="flex items-start justify-between mb-4">
//                         <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
//                             <i className="ri-scissors-2-line text-xl"></i>
//                         </div>
//                         <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Per Day</span>
//                     </div>
//                     <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">Absence Cut</p>
//                     <div className="flex items-baseline gap-2">
//                         <span className="text-sm font-medium text-slate-400">PKR</span>
//                         <p className="text-3xl font-black text-slate-800">{teacher?.perAttendenceCut?.toLocaleString()}</p>
//                     </div>
//                 </div>

//                 {/* Sync Button Card */}
//                 {/* <PermissionGuard permission={"teacher-payment-recalculate"}>
//                     <div
//                         onClick={() => { handleRecalculateFinancialsBtnClick() }}
//                         className="bg-white active:scale-95 rounded-2xl p-6 border-2 border-dashed border-slate-200 hover:border-cyan-300 transition-all shadow-sm flex items-center justify-center">
//                         <button

//                             className="flex flex-col items-center gap-3 group w-full "
//                         >
//                             <div className="w-14 h-14 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center transition-all group-hover:bg-cyan-600 group-hover:text-white group-hover:rotate-180 duration-500">
//                                 <i className="ri-refresh-line text-2xl"></i>
//                             </div>
//                             <span className="text-sm font-bold text-slate-600 uppercase tracking-wide group-hover:text-cyan-600 transition-colors">Recalculate Account</span>
//                         </button>
//                     </div>
//                 </PermissionGuard> */}

//             </div>

//             {/* Teacher Info & Actions Bar */}
//             <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
//                 <div className="flex flex-col md:flex-row items-center justify-between gap-5">

//                     {/* Teacher Info */}
//                     <div className="flex items-center gap-4">
//                         <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-50 to-cyan-100 border border-cyan-200 flex items-center justify-center text-cyan-600">
//                             <i className="ri-fingerprint-line text-2xl"></i>
//                         </div>
//                         <div>
//                             <h4 className="text-base font-black text-slate-800">{teacher?.name || "Active Partner"}</h4>
//                             <p className="text-xs font-semibold text-cyan-600 uppercase tracking-wide">ID: {teacher?.id || 'AUTH-00'}</p>
//                         </div>
//                     </div>

//                     {/* Action Buttons */}
//                     <div className="flex items-center gap-3">
//                         <PermissionGuard permission={"investor-payment-view"}>
//                             <button
//                                 onClick={() => { setShowAllPayments(true) }}
//                                 className="px-6 py-3 rounded-xl text-sm font-bold text-cyan-600 hover:text-cyan-600  bg-cyan-100 cursor-pointer border-4 shadow-md hover:scale-105 active:scale-95 border-slate-100 transition-all flex items-center gap-2"
//                             >
//                                 <i className="ri-pulse-line text-base"></i>
//                                 Full Analysis
//                             </button>
//                         </PermissionGuard>

//                         <div className="w-px h-8 bg-slate-200"></div>

//                         {/* <button
//                                       className="px-6 py-3 rounded-xl text-sm font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 transition-all flex items-center gap-2"
//                                   >
//                                       <i className="ri-download-2-line text-base"></i>
//                                       Download PDF
//                                   </button> */}

//                         <div className="flex items-center gap-2 ml-3 px-4 py-2 bg-emerald-50 rounded-xl border border-emerald-200">
//                             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
//                             <span className="text-xs font-bold text-emerald-600 uppercase">Live</span>
//                         </div>
//                     </div>

//                 </div>
//             </div>

//         </div>
//     );
// };

// export default TeacherFinancialHub;









































import React, { useState, useEffect } from 'react';
import { useRecalculateTeacherFinancials } from '../api/teacherFinance.api';
import { PermissionGuard } from '../../../common/components/PermissionGaurd';
import axios from 'axios';
import api from '../../../services/axiosInstance.js';
import { Edit, Trash } from "lucide-react"
import InvestorPaymentCreate from './InvesterPaymentCreate';
import InvesterPaymentUpdate from './InvesterPaymentUpdate';

const InvestorFinancialHub = ({ teacherId }) => {
    let { mutateAsync: teacherFinancialRecalculation } = useRecalculateTeacherFinancials()

    const [showPaymentCreate, setShowPaymentCreate] = useState(false);
    const [paymentsData, setPaymentsData] = useState(null);
    const [paymentsLoading, setPaymentsLoading] = useState(false);
    const [currentToUpdatePayment, setCurrentToUpdatePayment] = useState(null)
    const [paymentUpdateVisibility, setPaymentUpdateVisibility] = useState()


    const fetchPayments = async () => {
        if (!teacherId) return;

        setPaymentsLoading(true);
        try {
            const res = await api.post('/memberRoutes/getInvesterPayments', { teacherId });
            if (res.data.success) {
                setPaymentsData(res.data);

            }
        } catch (err) {
            console.error(err?.message);
        } finally {
            setPaymentsLoading(false);
        }
    };


    async function handleDeletePayment(teacherId, salaryId) {
        try {
            const res = await api.delete(`/memberRoutes/deleteSalaryPayment`, { data: { teacherId, salaryId } })
            if (res.data.success) {
                fetchPayments()
            }
        } catch (err) {
            console.error("Delete Error:", err)
        }
    }




    useEffect(() => {
        fetchPayments();
    }, [teacherId]);

    async function handleRecalculateFinancialsBtnClick() {
        await teacherFinancialRecalculation(teacherId)
    }

    const payments = paymentsData?.salaryPayments || [];
    const totalPayments = paymentsData?.totalPayments || 0;

    return (
        <div className="w-full h-full min-h-[500px] flex flex-col gap-5 font-sans antialiased text-slate-900">

            {showPaymentCreate && <InvestorPaymentCreate getInvesterPayments={fetchPayments} origin={"investerPayment"} teacherId={teacherId} setVisible={setShowPaymentCreate} />}
            {paymentUpdateVisibility && <InvesterPaymentUpdate getInvesterPayments={fetchPayments} setVisible={setPaymentUpdateVisibility} teacherId={teacherId} paymentData={currentToUpdatePayment} />}





            {/* Total Payments Header Card */}
            <div className="bg-gradient-to-br from-cyan-500 via-cyan-600 to-cyan-700 rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-xl shadow-cyan-200/50">
                <div className="absolute -top-20 -right-20 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    {/* Total Amount */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-2 h-2 rounded-full bg-cyan-200 animate-pulse"></div>
                            <span className="text-xs font-bold uppercase tracking-wider text-cyan-100">Total Payments Given</span>
                        </div>
                        <div className="flex items-baseline gap-3">
                            <span className="text-lg font-medium text-cyan-200">PKR</span>
                            {paymentsLoading
                                ? <h1 className="text-3xl  font-black text-white/40 tracking-tight">...</h1>
                                : <h1 className="text-3xl font-black text-white tracking-tight">{totalPayments?.toLocaleString()}</h1>
                            }
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex flex-wrap gap-3">
                        <PermissionGuard permission={"investor-payment-create"}>
                            <button
                                onClick={() => setShowPaymentCreate(true)}
                                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl font-bold text-xs uppercase tracking-wide transition-all hover:scale-105 active:scale-95 flex items-center gap-2 border border-white/30"
                            >
                                <i className="ri-add-line text-sm"></i>
                                Give Payment
                            </button>
                        </PermissionGuard>

                        {/* <PermissionGuard permission={"investor-payment-recalculate"}>
                            <div onClick={() => { handleRecalculateFinancialsBtnClick() }}>
                                <button className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl font-bold text-xs uppercase tracking-wide transition-all hover:scale-105 active:scale-95 flex items-center gap-2 border border-white/30">
                                    <i className="ri-refresh-line text-sm"></i>
                                    Recalculate
                                </button>
                            </div>
                        </PermissionGuard> */}
                    </div>
                </div>
            </div>

            {/* Payments Record */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

                {/* Header */}
                <div className="px-4 md:px-6 py-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
                            <i className="ri-file-list-3-line text-base"></i>
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Payments Record</h3>
                            <p className="text-xs text-slate-400 font-medium">{payments.length} payment{payments.length !== 1 ? 's' : ''} found</p>
                        </div>
                    </div>
                    {/* <div className="flex items-baseline gap-1.5 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl">
                        <span className="text-xs font-bold text-emerald-600">Total:</span>
                        <span className="text-base font-black text-emerald-700">PKR {totalPayments?.toLocaleString()}</span>
                    </div> */}
                </div>

                {/* Column Headers */}
                <div className="grid grid-cols-4 md:grid-cols-5 px-4 md:px-6 py-3 bg-slate-50 border-b border-slate-100">
                    <span className="text-lg font-bold text-slate-400 uppercase tracking-wide">#</span>
                    <span className="text-lg font-bold text-slate-400 uppercase tracking-wide">Amount</span>
                    <span className="text-lg font-bold text-slate-400 uppercase tracking-wide">Method</span>
                    <span className="text-lg font-bold text-slate-400 uppercase tracking-wide">Date</span>
                </div>

                {/* Rows */}
                {paymentsLoading ? (
                    <div className="flex items-center justify-center py-16 gap-3">
                        <div className="w-5 h-5 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin"></div>
                        <span className="text-sm font-semibold text-slate-400">Fetching payments...</span>
                    </div>
                ) : payments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-300">
                            <i className="ri-inbox-line text-2xl"></i>
                        </div>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-wide">No payments found</p>
                    </div>
                ) : (
                    <div className=" overflow-y-scroll h-full">
                        {payments?.sort((a, b) => new Date(a.date) - new Date(b.date))?.map((payment, index) => (
                            <div key={payment._id || index} className="grid grid-cols-4 md:grid-cols-5 px-4 md:px-6 py-4 hover:bg-slate-50/70 transition-colors items-center">
                                <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-500 text-lg font-black flex items-center justify-center">
                                    {index + 1}
                                </span>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-lg text-slate-400 font-medium hidden sm:block">PKR</span>
                                    <span className="text-lg font-black text-slate-600">{payment.salaryAmount?.toLocaleString()}</span>
                                </div>

                                <span className="text-lg font-semibold text-slate-600 truncate">{payment.paymentMethod}</span>
                                <div className="flex items-center gap-1">
                                    <i className="ri-calendar-line text-slate-300 text-xs hidden sm:block"></i>
                                    <span className="text-lg font-semibold text-slate-500">
                                        {new Date(payment.date).toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </span>
                                </div>

                                <div className="flex items-center justify-end gap-2">
                                    <button
                                        onClick={() => { setCurrentToUpdatePayment(payment); setPaymentUpdateVisibility(true) }}
                                        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-cyan-50 hover:text-cyan-600 text-slate-400 flex items-center justify-center transition-all hover:scale-105 active:scale-95">
                                        <Edit size={14} />
                                    </button>
                                    <button
                                        onClick={() => { handleDeletePayment(teacherId, payment._id) }}
                                        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-500 text-slate-400 flex items-center justify-center transition-all hover:scale-105 active:scale-95">
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