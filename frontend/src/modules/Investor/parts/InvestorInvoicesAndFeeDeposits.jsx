import React, { useState, useEffect } from 'react';
import { FileText, IndianRupee, ArrowLeft, Eye, Receipt, History, Trash2 } from 'lucide-react';
import { useDeleteSalaryPaymentMutation } from '../../member/api/member.rtk.api.js';
import TransactionReceipt from '../../../common/components/Reciept';

const MemberInvoicesAndFeeDeposits = ({ memberId, setVisibility, responseData }) => {

    let [deleteSalaryPayment] = useDeleteSalaryPaymentMutation()
    // Mutation setup to fetch member financial data



    const [activeTab, setActiveTab] = useState('invoices');
    const [selectedInvoice, setSelectedInvoice] = useState(null);


    const [paymentReceiptData, setPaymentReceiptData] = useState(null)
    const [paymentReceiptVisibility, setPaymentReceiptVisibility] = useState(false)

    const allInvoices = responseData?.invoices || [];
    const allPayments = responseData?.payments || [];


    const formatDate = (iso) =>
        iso ? new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';

    // Premium Cyan Theme Colors
    const colors = {
        primary: 'text-primary',
        bgAccent: 'bg-primary-muted',
        border: 'border-edge-brand',
        button: 'bg-primary-muted hover:bg-primary',
        tabActive: 'bg-surface text-primary shadow-sm border-edge-brand'
    };





    async function handlePaymentDelete(paymentId) {
        await deleteSalaryPayment({ paymentId, memberId }).unwrap()
    }




    function handlePaymentReceipt(paymentData) {
        console.log(responseData, "The payemnt data. ")
        setPaymentReceiptData({
            name: responseData?.member?.name,
            id: responseData?.member?.id,
            receiptNo: paymentData?._id,
            date: paymentData?.date,
            method: paymentData?.paymentMethod,
            extraInfo: "",
            items: {
                "Salary_Amount": paymentData?.salaryAmount,
            }
        })

        setPaymentReceiptVisibility(true)
        //        setRecieptData({
        //     studentName: studentData?.studentName,
        //     studentId: studentData?._id,
        //     receiptNo: pay._id,
        //     date: pay.date ? formatDate(pay.date) : "N/A",
        //     method: pay.paymentMethod,
        //     extraInfo: "Academic Year 2026", // Optional kuch bhi dal dein
        //     items: {
        //         "Fee_Amount": pay.amount,
        //         // Yahan agar database me dusri keys hain to wo bhi auto handle ho jayengi
        //     }
        // });
        // setRecieptOpen(true);
    }





    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10">
            {/* Background Blur & Brightness */}
            <div
                className="absolute inset-0 bg-surface/30 app-backdrop brightness-90 "
                onClick={() => setVisibility(false)}
            />


            {paymentReceiptVisibility && <TransactionReceipt data={paymentReceiptData} setVisibility={setPaymentReceiptVisibility} />}



            <div className="relative w-full max-w-4xl h-[80vh] bg-surface rounded-[2rem] shadow-2xl border border-edge-brand flex flex-col overflow-hidden ">

                {/* Header Section */}
                <div className="p-6 border-b border-edge-brand bg-surface/80 sticky top-0 z-10">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-2xl font-black text-ink tracking-tight">Investor Payroll Hub</h2>
                            <p className="text-primary font-semibold text-sm">Managing Earnings & Disbursals</p>
                        </div>
                        <button onClick={() => setVisibility(false)} className="p-2 hover:bg-danger-muted rounded-full text-ink-subtle hover:text-danger transition-colors">
                            <i className="ri-close-line text-2xl"></i>
                        </button>
                    </div>

                    {!selectedInvoice && (
                        <div className="flex bg-surface-muted p-1.5 rounded-2xl w-full max-w-sm mx-auto border border-edge">
                            <button
                                onClick={() => setActiveTab('invoices')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'invoices' ? colors.tabActive : 'text-ink-muted'}`}
                            >
                                <FileText size={16} /> Invoices
                            </button>
                            <button
                                onClick={() => setActiveTab('payments')}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'payments' ? colors.tabActive : 'text-ink-muted'}`}
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
                        <div className="app-enter">
                            <button onClick={() => setSelectedInvoice(null)} className="flex items-center gap-2 text-primary font-bold mb-6 hover:translate-x-[-4px] transition-transform">
                                <ArrowLeft size={18} /> Back to Invoices
                            </button>

                            <div className="bg-primary text-primary-foreground p-6 rounded-3xl mb-8 shadow-lg shadow-sm">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-primary-muted text-[10px] font-bold uppercase tracking-widest">Billing Period</p>
                                        <h3 className="text-xl font-bold">{formatDate(selectedInvoice?.invoiceGeneratedFor)}</h3>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-primary-muted text-[10px] font-bold uppercase tracking-widest">Status</p>
                                        <span className="bg-surface/20 px-3 py-1 rounded-full text-xs font-black uppercase">{selectedInvoice?.paidStatus}</span>
                                    </div>
                                </div>
                                <div className="mt-8 grid grid-cols-3 gap-4">
                                    <div><p className="text-[10px] opacity-80 font-bold">Total Salary</p><p className="text-lg font-black">Rs {selectedInvoice?.invoiceAmount?.toLocaleString()}</p></div>
                                    <div><p className="text-[10px] opacity-80 font-bold">Paid</p><p className="text-lg font-black">Rs {selectedInvoice?.paidAmount?.toLocaleString()}</p></div>
                                    <div><p className="text-[10px] opacity-80 font-bold">Remaining</p><p className="text-lg font-black text-yellow-200">Rs {selectedInvoice?.remainingAmount?.toLocaleString()}</p></div>
                                </div>
                            </div>

                            <h4 className="text-ink font-bold mb-4 flex items-center gap-2">
                                <History size={18} className="text-ink" /> Linked Transactions
                            </h4>
                            <div className="space-y-3">
                                {selectedInvoice?.paymentRecord?.length > 0 ? selectedInvoice.paymentRecord.map((rec, i) => (
                                    <div key={i} className="flex justify-between items-center p-4 bg-primary-muted/30 border border-edge-brand rounded-2xl">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-surface rounded-xl flex items-center justify-center text-primary shadow-sm"><Receipt size={20} /></div>
                                            <div>
                                                <p className="text-xs font-bold text-ink">{formatDate(rec.date)}</p>
                                                <p className="text-[10px] font-mono text-ink-subtle">{rec.paymentId}</p>
                                            </div>
                                        </div>
                                        <p className="text-lg font-black text-ink">Rs {rec.usedAmountByPayment?.toLocaleString()}</p>
                                    </div>
                                )) : <p className="text-center text-ink-subtle py-10">No payments linked to this invoice.</p>}
                            </div>
                        </div>
                    ) : (
                        /* LIST VIEWS */
                        activeTab === 'invoices' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {allInvoices.map((inv, idx) => (
                                    <div key={idx} className="bg-surface border border-edge rounded-3xl p-5 hover:border-edge-brand hover:shadow-xl hover:shadow-sm/50 transition-all group border-l-4 border-l-cyan-400">
                                        <div className="flex justify-between items-start mb-4">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tighter ${inv.paidStatus === 'unpaid' ? 'bg-orange-100 text-warning' : 'bg-success-muted text-success'}`}>
                                                {inv.paidStatus}
                                            </span>
                                            <p className="text-ink-subtle text-xs font-bold">{formatDate(inv.invoiceGeneratedFor)}</p>
                                        </div>
                                        <div className="mb-4">
                                            <p className="text-[10px] text-ink-subtle font-bold uppercase">Net Salary</p>
                                            <p className="text-xl font-black text-ink">Rs {inv.invoiceAmount?.toLocaleString()}</p>
                                        </div>
                                        <div className="flex justify-between items-end pt-4 border-t border-edge">
                                            <div>
                                                <p className="text-[9px] text-ink-subtle font-bold uppercase">Remaining Balance</p>
                                                <p className={`text-sm font-bold ${inv.remainingAmount > 0 ? 'text-warning' : 'text-success'}`}>Rs {inv.remainingAmount?.toLocaleString()}</p>
                                            </div>
                                            <button
                                                onClick={() => setSelectedInvoice(inv)}
                                                className="bg-primary-muted text-primary p-2.5 rounded-xl hover:bg-primary hover:text-primary-foreground transition-all shadow-sm"
                                            >
                                                <Eye size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            /* PAYMENTS VIEW */
                            <div className="space-y-3">
                                {allPayments.map((pay, idx) => (
                                    <div key={idx} className="p-4 bg-surface border border-edge rounded-2xl flex justify-between items-center hover:bg-primary-muted/20 transition-all shadow-sm group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-primary-muted text-primary rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform">
                                                <IndianRupee size={22} />
                                            </div>
                                            <div>
                                                <div className='flex gap-5 justify-center items-center'>
                                                    <h4 className="text-ink font-black text-lg">Rs {pay.salaryAmount?.toLocaleString()}</h4>
                                                    <p className='text-ink-muted text-sm'>({pay.paymentType})</p>
                                                </div>
                                                <p className="text-[10px] text-ink-subtle font-bold uppercase">{pay.paymentMethod} • {formatDate(pay.date)}</p>
                                            </div>
                                        </div>
                                        <div
                                            onClick={() => { handlePaymentDelete(pay._id) }}
                                            className="text-right text-[9px] bg-surface-muted px-3 py-1 rounded-full text-ink-muted font-black tracking-widest uppercase">
                                            <Trash2 className='h-5 w-5 text-danger ' />
                                        </div>
                                        <div
                                            onClick={() => handlePaymentReceipt(pay._id)}
                                            className="text-right text-[9px] bg-surface-muted px-3 py-1 rounded-full text-ink-muted font-black tracking-widest uppercase">
                                            <Receipt className='h-5 w-5 text-danger ' />
                                        </div>
                                    </div>
                                ))}
                                {allPayments.length === 0 && (
                                    <div className="text-center py-20 text-ink-subtle">No payment history found.</div>
                                )}
                            </div>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

export default MemberInvoicesAndFeeDeposits;