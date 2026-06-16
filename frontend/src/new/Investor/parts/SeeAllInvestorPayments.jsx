// import React, { useEffect, useState } from "react";
// import { Receipt, X } from "lucide-react";
// import { useDispatch, useSelector } from 'react-redux'
// import { setMemberSalaryPayment } from "../member.slice.js";
// import api from "../../../shared/services/api.service.js";
// import TransactionReceipt from "../../../shared/components/Reciept.jsx";

// export default function SeeAllMemberPayments({ memberId, setVisibility, setMemberSalaryPaymentCreationFormVisible }) {
//     let dispatch = useDispatch()
//     let paymentRedux = useSelector(state => state.member.memberSalaryPayments)
//     // const [payments, setPayments] = useState([]);
//     const [loading, setLoading] = useState(true);
//         const [paymentReceiptData, setPaymentReceiptData] = useState(null)
//         const [paymentReceiptVisibility, setPaymentReceiptVisibility] = useState(false)







//     // Fetch all payments of member
//     useEffect(() => {
//         async function load() {
//             try {
//                 const res = await api.post(`/memberRoute/getMemberSalaryPayments`, { memberId: memberId });
//                 // setPayments(res.data?.salaryList || []);
//                 res?.data?.salaryList && dispatch(setMemberSalaryPayment(res.data?.salaryList))

//             } catch (err) {
//                 console.error("Payment Fetch Error:", err);
//             }
//             setLoading(false);
//         }

//         if (memberId) load();
//     }, [memberId]);










//     async function handleDelete(paymentId) {
//         try {
//             const res = await api.delete(`/memberRoute/deleteSalaryPayment`, { data: { memberId: memberId, salaryId: paymentId } });
//             if (res.data.success) {
//                 res?.data?.salaryPayments && dispatch(setMemberSalaryPayment(res.data?.salaryPayments))
//             }
//         } catch (err) {
//             console.error("Payment Fetch Error:", err);
//         }
//     }
















//       function handlePaymentReceipt(paymentData) {

//         setPaymentReceiptData({
//             name: memberData?.name,
//             id: memberData?._id,
//             receiptNo: paymentData?._id,
//             date: paymentData?.date,
//             method: paymentData?.paymentMethod,
//             extraInfo: "",
//             items: {
//                 "Investment_Amount": paymentData?.amount,
//             }
//         })

//         setPaymentReceiptVisibility(true)

//     }













//     return (
//         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 overflow-hidden">
//             {/* High-End Glass Backdrop */}
//             <div
//                 className="absolute inset-0 app-overlay app-enter"
//                 onClick={() => { setVisibility(false) }}
//             />

//                         {paymentReceiptVisibility && <TransactionReceipt data={paymentReceiptData} setVisibility={setPaymentReceiptVisibility} />}




//             {/* Main Dashboard Container */}
//             <div className="relative w-full max-w-6xl h-[90vh] bg-[#f8fafc] rounded-[3rem] shadow-[0_32px_64px_-15px_rgba(0,0,0,0.3)] border-4 border-surface flex flex-col md:flex-row overflow-hidden app-enter">

//                 {/* Left Side: Navigation & Summary (Static) */}
//                 <div className="w-full md:w-[320px] bg-surface border-r border-edge p-8 flex flex-col justify-between">
//                     <div className="space-y-8">
//                         <div className="space-y-4">
//                             <div className="w-14 h-14 rounded-2xl bg-primary-muted flex items-center justify-center shadow-lg shadow-sm text-primary-foreground">
//                                 <i className="ri-wallet-3-line text-2xl"></i>
//                             </div>
//                             <div>
//                                 <h1 className="text-3xl font-black text-ink leading-tight">
//                                     Payment<br /><span className="text-ink">Center</span>
//                                 </h1>
//                                 <p className="text-xs font-bold text-ink-subtle uppercase tracking-widest mt-2">Financial Records</p>
//                             </div>
//                         </div>

//                         <div className="p-5 bg-surface-muted rounded-[2rem] border border-edge">
//                             <div className="flex items-center gap-3 text-ink-subtle mb-2">
//                                 <i className="ri-line-chart-line text-sm"></i>
//                                 <span className="text-[10px] font-black uppercase tracking-tighter">Quick Action</span>
//                             </div>
//                             <button
//                                 onClick={() => { setMemberSalaryPaymentCreationFormVisible(true) }}
//                                 className="w-full py-4 bg-inverse text-primary-foreground rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-primary transition-all duration-300 shadow-xl shadow-slate-200 active:scale-95 flex items-center justify-center gap-2"
//                             >
//                                 <i className="ri-add-circle-fill text-lg"></i>
//                                 New Entry
//                             </button>
//                         </div>
//                     </div>

//                     <button
//                         onClick={() => { setVisibility(false) }}
//                         className="flex items-center gap-3 text-ink-subtle hover:text-danger transition-colors group"
//                     >
//                         <div className="w-10 h-10 rounded-full bg-surface-muted flex items-center justify-center group-hover:bg-danger-muted">
//                             <X size={18} />
//                         </div>
//                         <span className="text-xs font-black uppercase tracking-widest">Close Portal</span>
//                     </button>
//                 </div>

//                 {/* Right Side: Scrollable Activity Feed */}
//                 <div className="flex-1 flex flex-col overflow-hidden">
//                     {/* Top Bar */}
//                     <div className="px-10 py-6 bg-surface/50 app-backdrop border-b border-edge flex justify-between items-center">
//                         <div className="flex items-center gap-2">
//                             <div className="w-2 h-2 rounded-full bg-primary-muted "></div>
//                             <span className="text-[10px] font-black text-ink-muted uppercase tracking-[0.2em]">Live Transaction Ledger</span>
//                         </div>
//                         <p className="text-[10px] font-bold text-ink-subtle uppercase">
//                             Records Found: <span className="text-ink">{paymentRedux?.length || 0}</span>
//                         </p>
//                     </div>

//                     {/* Feed Area */}
//                     <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
//                         {loading ? (
//                             <div className="h-full flex flex-col items-center justify-center">
//                                 <div className="w-10 h-10 border-4 border-edge-brand border-t-transparent rounded-full "></div>
//                             </div>
//                         ) : paymentRedux.length === 0 ? (
//                             <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
//                                 <i className="ri-inbox-archive-line text-6xl text-border mb-4"></i>
//                                 <p className="font-bold text-ink-subtle">No records to display</p>
//                             </div>
//                         ) : (
//                             <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
//                                 {paymentRedux?.map((p) => (
//                                     <div
//                                         key={p._id}
//                                         className="bg-surface border border-edge rounded-[2rem] p-6 hover:border-edge-brand hover:shadow-xl hover:shadow-sm/5 transition-all duration-200 group relative overflow-hidden"
//                                     >
//                                         {/* Decorative Gradient Overlay */}
//                                         <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-primary-muted to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

//                                         <div className="flex justify-between items-start mb-6">
//                                             <div className="space-y-1">
//                                                 <div className="flex items-center gap-2">
//                                                     <span className="px-3 py-1 bg-inverse text-primary-foreground text-[9px] font-black uppercase rounded-full tracking-tighter">
//                                                         {p.paymentMethod}
//                                                     </span>
//                                                     <span className="text-[10px] font-bold text-ink-subtle">#{p._id.slice(-6)}</span>
//                                                 </div>
//                                                 <h2 className="text-3xl font-black text-ink tracking-tighter">
//                                                     <span className="text-sm font-medium text-ink-subtle mr-1">$</span>
//                                                     {p.salaryAmount}
//                                                 </h2>
//                                             </div>
//                                              <button
//                                             onClick={() => handlePaymentReceipt(p)}
//                                                 className="w-10 h-10 rounded-xl flex items-center justify-center text-ink-subtle hover:bg-danger-muted hover:text-danger transition-all border border-transparent hover:border-danger"
//                                             >
//                                                                                                         <Receipt size={15} />

//                                             </button>
//                                             <button
//                                                 onClick={() => handleDelete(p._id)}
//                                                 className="w-10 h-10 rounded-xl flex items-center justify-center text-ink-subtle hover:bg-danger-muted hover:text-danger transition-all border border-transparent hover:border-danger"
//                                             >
//                                                 <i className="ri-delete-bin-7-line text-lg"></i>
//                                             </button>
//                                         </div>

//                                         <div className="flex items-center justify-between pt-5 border-t border-edge">
//                                             <div className="flex items-center gap-2">
//                                                 <i className="ri-calendar-event-line text-ink"></i>
//                                                 <p className="text-[11px] font-bold text-ink-muted">
//                                                     {new Date(p.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
//                                                 </p>
//                                             </div>
//                                             <div className="group/note relative">
//                                                 <i className="ri-information-fill text-border hover:text-ink transition-colors text-xl cursor-help"></i>
//                                                 {p.note && (
//                                                     <div className="absolute bottom-full right-0 mb-2 w-48 p-3 bg-inverse text-primary-foreground text-[10px] rounded-xl opacity-0 group-hover/note:opacity-100 transition-opacity pointer-events-none shadow-xl z-10">
//                                                         {p.note}
//                                                     </div>
//                                                 )}
//                                             </div>
//                                         </div>
//                                     </div>
//                                 ))}
//                             </div>
//                         )}
//                     </div>
//                 </div>
//             </div>
//         </div>
//     );
// }
