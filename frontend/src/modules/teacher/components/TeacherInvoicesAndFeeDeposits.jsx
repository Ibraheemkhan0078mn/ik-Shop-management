import React, { useState, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import api from "@shared/services/axiosInstance.js"; // Apne api service ka path check karlein
import { FileText, IndianRupee, ArrowLeft, Eye, Receipt, History, Trash2, Edit2, DollarSign } from 'lucide-react';
import { useDeleteSalaryPayment, useGetTeacherFinancialRecord } from '../api/teacherFinance.api';
import TeacherInvoiceUpdate from './TeacherInvoiceUpdate';
import ScreenTabButton from '@shared/components/ScreenTabButton.jsx';
import TeacherSalaryPaymentCreationComp from './TeacherSalaryPaymentCreationComp';

const TeacherInvoicesAndFeeDeposits = ({ teacherId, setVisibility, responseData }) => {

    let deleteSalaryMutation = useDeleteSalaryPayment()
    // Mutation setup to fetch teacher financial data



    const [activeTab, setActiveTab] = useState('invoices');
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [invoiceUpdateVisibility, setInvoiceUpdateVisibility] = useState(false)
    const [allInvoices, setAllInvoiceState] = useState([])
    const [allPayments, setAllPaymentState] = useState([])
    const [currentToUpdateInvoiceData, setCurrentToUpdateInvoiceData] = useState(null)
    const [createPaymentVisibility, setCreatePaymentVisibility] = useState(false)

    useEffect(() => {
        if (responseData?.invoices) {
            setAllInvoiceState(responseData?.invoices || [])
        }
    }, [responseData?.invoices])


    useEffect(() => {
        if (responseData?.payments) {
            setAllPaymentState(responseData?.payments || [])
        }
    }, [responseData?.payments])



    // const allInvoices = responseData?.invoices || [];
    //     const allPayments = responseData?.payments || [];


    const formatDate = (iso) =>
        iso ? new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';

    // Premium Cyan Theme Colors
    const colors = {
        primary: 'text-cyan-600',
        bgAccent: 'bg-cyan-50',
        border: 'border-cyan-200',
        button: 'bg-cyan-500 hover:bg-cyan-600',
        tabActive: 'bg-white text-cyan-600 shadow-sm border-cyan-100'
    };





    async function handlePaymentDelete(paymentId) {
        await deleteSalaryMutation.mutateAsync({ paymentId, teacherId })
    }








    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10">



            {invoiceUpdateVisibility && <TeacherInvoiceUpdate invoiceData={currentToUpdateInvoiceData} setVisibility={setInvoiceUpdateVisibility} setData={setAllInvoiceState} />}
            {createPaymentVisibility && <TeacherSalaryPaymentCreationComp setVisible={setCreatePaymentVisibility} teacherId={teacherId} />}


            {/* Background Blur & Brightness */}
            <div
                className="absolute inset-0 bg-white/30 backdrop-blur-lg brightness-90 "
                onClick={() => setVisibility(false)}
            />

            <div className="relative w-full max-w-4xl h-[80vh] bg-white rounded-[2rem] shadow-2xl border border-cyan-100 flex flex-col overflow-hidden ">

                {/* Header Section */}
                <div className="p-6 border-b border-cyan-50 bg-white/80 sticky top-0 z-10">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Teacher Payroll Hub</h2>
                            <p className="text-cyan-600 font-semibold text-sm">Managing Earnings & Disbursals</p>
                        </div>
                        <button onClick={() => setVisibility(false)} className="p-2 hover:bg-red-50 rounded-full text-slate-400 hover:text-red-500 transition-colors">
                            <i className="ri-close-line text-2xl"></i>
                        </button>
                    </div>

                    {!selectedInvoice && (
                        <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full max-w-sm mx-auto border border-slate-200">
                            <button
                                onClick={() => setActiveTab('invoices')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'invoices' ? colors.tabActive : 'text-slate-500'}`}
                            >
                                <FileText size={16} /> Invoices
                            </button>
                            <button
                                onClick={() => setActiveTab('payments')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'payments' ? colors.tabActive : 'text-slate-500'}`}
                            >
                                <IndianRupee size={16} /> Payments
                            </button>
                        </div>
                    )}
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                    {selectedInvoice ? (
                        /* INVOICE DETAIL VIEW */
                        <div className="animate-in slide-in-from-right-10 duration-500">
                            <button onClick={() => setSelectedInvoice(null)} className="flex items-center gap-2 text-cyan-600 font-bold mb-6 hover:translate-x-[-4px] transition-transform">
                                <ArrowLeft size={18} /> Back to Invoices
                            </button>

                            <div className="bg-cyan-600 text-white p-6 rounded-3xl mb-8 shadow-lg shadow-cyan-100">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-cyan-100 text-[10px] font-bold uppercase tracking-widest">Billing Period</p>
                                        <h3 className="text-xl font-bold">{formatDate(selectedInvoice?.invoiceGeneratedFor)}</h3>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-cyan-100 text-[10px] font-bold uppercase tracking-widest">Status</p>
                                        <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-black uppercase">{selectedInvoice?.paidStatus}</span>
                                    </div>
                                </div>
                                <div className="mt-8 grid grid-cols-3 gap-4">
                                    <div><p className="text-[10px] opacity-80 font-bold">Total Salary</p><p className="text-lg font-black">Rs {selectedInvoice?.invoiceAmount?.toLocaleString()}</p></div>
                                    <div><p className="text-[10px] opacity-80 font-bold">Paid</p><p className="text-lg font-black">Rs {selectedInvoice?.paidAmount?.toLocaleString()}</p></div>
                                    <div><p className="text-[10px] opacity-80 font-bold">Remaining</p><p className="text-lg font-black text-yellow-200">Rs {selectedInvoice?.remainingAmount?.toLocaleString()}</p></div>
                                </div>
                            </div>

                            <h4 className="text-slate-700 font-bold mb-4 flex items-center gap-2">
                                <History size={18} className="text-cyan-500" /> Linked Transactions
                            </h4>
                            <div className="space-y-3">
                                {selectedInvoice?.paymentRecord?.length > 0 ? selectedInvoice.paymentRecord.map((rec, i) => (
                                    <div key={i} className="flex justify-between items-center p-4 bg-cyan-50/30 border border-cyan-100 rounded-2xl">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-cyan-600 shadow-sm"><Receipt size={20} /></div>
                                            <div>
                                                <p className="text-xs font-bold text-slate-700">{formatDate(rec.date)}</p>
                                                <p className="text-[10px] font-mono text-slate-400">{rec.paymentId}</p>
                                            </div>
                                        </div>
                                        <p className="text-lg font-black text-slate-800">Rs {rec.usedAmountByPayment?.toLocaleString()}</p>
                                    </div>
                                )) : <p className="text-center text-slate-400 py-10">No payments linked to this invoice.</p>}
                            </div>
                        </div>
                    ) : (
                        /* LIST VIEWS */
                        activeTab === 'invoices' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {allInvoices.map((inv, idx) => (
                                    <div key={idx} className="bg-white border border-slate-100 rounded-3xl p-5 hover:border-cyan-200 hover:shadow-xl hover:shadow-cyan-50/50 transition-all group border-l-4 border-l-cyan-400">
                                        <div className="flex justify-between items-start mb-4">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter ${inv.paidStatus === 'unpaid' ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                                {inv.paidStatus}
                                            </span>
                                            <p className="text-slate-400 text-xs font-bold">{formatDate(inv.invoiceGeneratedFor)}</p>
                                        </div>
                                        <div className="mb-4">
                                            <p className="text-[10px] text-slate-400 font-bold uppercase">Net Salary</p>
                                            <p className="text-xl font-black text-slate-800">Rs {inv.invoiceAmount?.toLocaleString()}</p>
                                        </div>
                                        <div className="flex justify-between items-end pt-4 border-t border-slate-50">
                                            <div>
                                                <p className="text-[9px] text-slate-400 font-bold uppercase">Remaining Balance</p>
                                                <p className={`text-sm font-bold ${inv.remainingAmount > 0 ? 'text-orange-500' : 'text-emerald-500'}`}>Rs {inv.remainingAmount?.toLocaleString()}</p>
                                            </div>
                                            <div className="flex gap-5">
                                                <button
                                                    onClick={() => { setCurrentToUpdateInvoiceData(inv); setInvoiceUpdateVisibility(true) }}
                                                    className="bg-cyan-50 text-cyan-600 p-2.5 rounded-xl hover:bg-cyan-600 hover:text-white transition-all shadow-sm"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => setSelectedInvoice(inv)}
                                                    className="bg-cyan-50 text-cyan-600 p-2.5 rounded-xl hover:bg-cyan-600 hover:text-white transition-all shadow-sm"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            /* PAYMENTS VIEW */
                            <div className="space-y-3">

                                <div className="flex justify-center items-center w-full" onClick={() => { setCreatePaymentVisibility(true) }}>
                                    <ScreenTabButton text={"Add Payment"} lucideIcon={DollarSign} />
                                </div>

                                {allPayments?.map((pay, idx) => (
                                    <div key={idx} className="p-4 bg-white border border-slate-100 rounded-2xl flex justify-between items-center hover:bg-cyan-50/20 transition-all shadow-sm group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-cyan-50 text-cyan-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <IndianRupee size={22} />
                                            </div>
                                            <div>
                                                <div className='flex gap-5 justify-center items-center'>
                                                    <h4 className="text-slate-800 font-black text-lg">Rs {pay.salaryAmount?.toLocaleString()}</h4>
                                                    <p className='text-gray-500 text-sm'>({pay.paymentType})</p>
                                                </div>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase">{pay.paymentMethod} • {formatDate(pay.date)}</p>
                                            </div>
                                        </div>
                                        <div
                                            onClick={() => { handlePaymentDelete(pay._id) }}
                                            className="text-right text-[9px] bg-slate-100 px-3 py-1 rounded-full text-slate-500 font-black tracking-widest uppercase">
                                            <Trash2 className='h-5 w-5 text-red-300 ' />
                                        </div>
                                    </div>
                                ))}
                                {allPayments.length === 0 && (
                                    <div className="text-center py-20 text-slate-400">No payment history found.</div>
                                )}
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

export default TeacherInvoicesAndFeeDeposits;