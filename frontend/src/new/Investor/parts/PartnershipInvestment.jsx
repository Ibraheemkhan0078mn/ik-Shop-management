import React, { useState } from 'react'
import { useDeletePartnerInvestmentMutation, useGetInvestmentsByPartnerIdQuery } from '../../member/api/member.rtk.api.js'
import PartnerInvestmentCreation from './PartnerInvestmentCreation'
import PartnerInvestmentUpdate from './PartnerInvestmentUpdate'
import { PermissionGuard } from '../../../shared/components/PermissionGaurd'
import { toInputDateFormat } from '../../../shared/utilities/date.utility'
import TransactionReceipt from '../../../shared/components/Reciept'
import { Receipt } from 'lucide-react'

const PartnershipInvestment = ({ memberId, memberData }) => {
    let { data: investmentData } = useGetInvestmentsByPartnerIdQuery(memberId)
    let [deletePartnerInvestment] = useDeletePartnerInvestmentMutation()

    let [investmentCreationVisibility, setInvestmentCreationVisibility] = useState(false)
    let [investmentUpdateVisibility, setInvestmentUpdateVisibility] = useState(false)
    let [currentToUpdateInvestmentData, setCurrentToUpdateInvestmentData] = useState(null)
    const [paymentReceiptData, setPaymentReceiptData] = useState(null)
    const [paymentReceiptVisibility, setPaymentReceiptVisibility] = useState(false)
    // Handlers (Add your logic here)
    const handleEdit = (data) => { setCurrentToUpdateInvestmentData(data); setInvestmentUpdateVisibility(true) };
    const handleDelete = async (id) => { await deletePartnerInvestment(id).unwrap() };





    function handlePaymentReceipt(paymentData) {

        setPaymentReceiptData({
            name: memberData?.name,
            id: memberData?._id,
            receiptNo: paymentData?._id,
            date: paymentData?.date,
            method: paymentData?.paymentMethod,
            extraInfo: "",
            items: {
                "Investment_Amount": paymentData?.amount,
            }
        })

        setPaymentReceiptVisibility(true)

    }




    return (
        <div className="app-enter space-y-4 max-w-5xl mx-auto">



            {paymentReceiptVisibility && <TransactionReceipt data={paymentReceiptData} setVisibility={setPaymentReceiptVisibility} />}
            {investmentCreationVisibility && <PartnerInvestmentCreation setVisibility={setInvestmentCreationVisibility} investorId={memberId} />}
            {investmentUpdateVisibility && <PartnerInvestmentUpdate setVisibility={setInvestmentUpdateVisibility} investmentToUpdateData={currentToUpdateInvestmentData} />}



            {/* TOTAL INVESTMENT SUMMARY CARD - SHRUNK FOR EFFICIENCY */}
            <div className="app-gradient p-6 rounded-[1.5rem] text-primary-foreground shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-surface/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                <div className="relative flex justify-between items-center">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-1.5 h-1.5 bg-accent-muted rounded-full "></div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-primary-muted">Capital Contribution</span>
                        </div>
                        <h4 className="text-3xl font-black tracking-tighter">
                            PKR - {investmentData?.investments?.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString() || "0"}
                        </h4>
                    </div>
                    <div className="text-right">
                        <span className="text-[9px] font-bold uppercase text-primary-muted opacity-60">Ref ID</span>
                        <div className="px-3 py-1 bg-black/20 app-backdrop rounded-lg border border-surface/10 text-[10px] font-mono">
                            {memberData?.instituteId || "N/A"}
                        </div>
                    </div>
                </div>
            </div>

            {/* LIST SECTION HEADER - WITH CREATE BUTTON */}
            <div className="flex items-center justify-between px-2">
                <div>
                    <h3 className="text-md font-black text-ink tracking-tight">Investment History</h3>
                    <p className="text-[10px] text-ink-subtle font-medium uppercase tracking-tighter">Recent transactions</p>
                </div>

                <div className="flex items-center gap-3">
                    {/* THE CREATE BUTTON */}
                    <PermissionGuard permission={"member-investment-create"}>
                        <button
                            onClick={() => { setInvestmentCreationVisibility(true) }}
                            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary text-primary-foreground rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all shadow-lg shadow-sm/20 active:scale-95"
                        >
                            <i className="ri-add-line text-sm"></i>
                            Add Investment
                        </button>
                    </PermissionGuard>

                    {/* RECORD COUNTER */}
                    <div className="px-3 py-2 bg-surface rounded-xl border border-edge text-[9px] font-bold text-ink-muted shadow-sm">
                        {investmentData?.investments?.length || 0} RECORDS
                    </div>
                </div>
            </div>

            {/* COMPACT LIST */}
            <div className="grid grid-cols-1 gap-3">
                {investmentData?.investments?.map((inv, index) => (
                    <div key={index} className="group bg-surface p-4 rounded-2xl border border-edge/60 shadow-sm hover:shadow-md hover:border-edge-brand/30 transition-all duration-200 relative">

                        <div className="relative flex items-center justify-between gap-4">

                            {/* Left: Date (More compact) */}
                            <div className="flex items-center gap-3 min-w-[140px]">
                                <div className="w-11 h-11 bg-surface-muted rounded-xl flex flex-col items-center justify-center border border-edge group-hover:bg-primary-muted transition-colors">
                                    <p className="text-[8px] font-black text-ink-subtle uppercase leading-none mb-0.5">
                                        {new Date(inv.date).toLocaleDateString('en-GB', { month: 'short' })}
                                    </p>
                                    <p className="text-md font-black text-ink leading-none">
                                        {new Date(inv.date).toLocaleDateString('en-GB', { day: '2-digit' })}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-primary uppercase tracking-tighter">{inv.paymentMethod || "Direct Deposit"}</p>
                                    <h5 className="text-xs font-bold text-ink-muted">{toInputDateFormat(inv.date)}</h5>
                                </div>
                            </div>

                            {/* Middle: Notes (Visible but restrained) */}
                            <div className="hidden md:block flex-1 max-w-xs">
                                <p className="text-[11px] text-ink-muted italic truncate">
                                    {inv.notes ? `"${inv.notes}"` : "No notes."}
                                </p>
                            </div>

                            {/* Right: Amount & Actions */}
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-success bg-success-muted px-3 py-1 rounded-lg border border-success-muted">
                                        PKR  {inv.amount.toLocaleString()}
                                    </p>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-1 border-l pl-3 border-edge">
                                    <PermissionGuard permission={"member-investment-reciept"}>
                                        <button
                                            onClick={() => handlePaymentReceipt(inv)}
                                            className="p-2 text-ink-subtle hover:text-primary hover:bg-primary-muted rounded-lg transition-colors"
                                            title="Edit"
                                        >
                                            <Receipt size={15} />
                                        </button>
                                    </PermissionGuard>
                                    <PermissionGuard permission={"member-investment-update"}>
                                        <button
                                            onClick={() => handleEdit(inv)}
                                            className="p-2 text-ink-subtle hover:text-primary hover:bg-primary-muted rounded-lg transition-colors"
                                            title="Edit"
                                        >
                                            <i className="ri-edit-line text-lg"></i>
                                        </button>
                                    </PermissionGuard>
                                    <PermissionGuard permission={"member-investment-delete"}>
                                        <button
                                            onClick={() => handleDelete(inv._id)}
                                            className="p-2 text-ink-subtle hover:text-danger hover:bg-danger-muted rounded-lg transition-colors"
                                            title="Delete"
                                        >
                                            <i className="ri-delete-bin-line text-lg"></i>
                                        </button>
                                    </PermissionGuard>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Empty State */}
                {(!investmentData?.investments || investmentData.investments.length === 0) && (
                    <div className="py-12 flex flex-col items-center justify-center bg-surface-muted rounded-2xl border-2 border-dashed border-edge">
                        <i className="ri-database-2-line text-xl text-ink-subtle mb-2"></i>
                        <p className="text-[10px] font-black text-ink-subtle uppercase tracking-widest">No Records Found</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default PartnershipInvestment