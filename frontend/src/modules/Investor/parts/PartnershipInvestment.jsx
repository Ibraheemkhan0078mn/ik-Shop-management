import React, { useState } from 'react'
import { useGetInvestmentsByPartnerId, usePartnerInvestmentDelete } from '../api/partnerInvestment.api'
import PartnerInvestmentCreation from './PartnerInvestmentCreation'
import PartnerInvestmentUpdate from './PartnerInvestmentUpdate'
import { PermissionGuard } from '../../../common/components/PermissionGaurd'
import { toInputDateFormat } from '../../../common/utilities/date.utility'

const PartnershipInvestment = ({ teacherId, teacherData }) => {
    let { data: investmentData } = useGetInvestmentsByPartnerId(teacherId)
    let investmentDeleteMutation = usePartnerInvestmentDelete()

    let [investmentCreationVisibility, setInvestmentCreationVisibility] = useState(false)
    let [investmentUpdateVisibility, setInvestmentUpdateVisibility] = useState(false)
    let [currentToUpdateInvestmentData, setCurrentToUpdateInvestmentData] = useState(null)

    // Handlers (Add your logic here)
    const handleEdit = (data) => { setCurrentToUpdateInvestmentData(data); setInvestmentUpdateVisibility(true) };
    const handleDelete = async (id) => { await investmentDeleteMutation.mutateAsync(id) };

    return (
        <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-4 max-w-5xl mx-auto">




            {investmentCreationVisibility && <PartnerInvestmentCreation setVisibility={setInvestmentCreationVisibility} investorId={teacherId} />}
            {investmentUpdateVisibility && <PartnerInvestmentUpdate setVisibility={setInvestmentUpdateVisibility} investmentToUpdateData={currentToUpdateInvestmentData} />}



            {/* TOTAL INVESTMENT SUMMARY CARD - SHRUNK FOR EFFICIENCY */}
            <div className="bg-gradient-to-br from-cyan-600 to-cyan-800 p-6 rounded-[1.5rem] text-white shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                <div className="relative flex justify-between items-center">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-1.5 h-1.5 bg-cyan-300 rounded-full animate-pulse"></div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-cyan-100">Capital Contribution</span>
                        </div>
                        <h4 className="text-3xl font-black tracking-tighter">
                            ₹{investmentData?.investments?.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString() || "0"}
                        </h4>
                    </div>
                    <div className="text-right">
                        <span className="text-[9px] font-bold uppercase text-cyan-200 opacity-60">Ref ID</span>
                        <div className="px-3 py-1 bg-black/20 backdrop-blur-md rounded-lg border border-white/10 text-[10px] font-mono">
                            {teacherData?.instituteId || "N/A"}
                        </div>
                    </div>
                </div>
            </div>

            {/* LIST SECTION HEADER - WITH CREATE BUTTON */}
            <div className="flex items-center justify-between px-2">
                <div>
                    <h3 className="text-md font-black text-slate-800 tracking-tight">Investment History</h3>
                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">Recent transactions</p>
                </div>

                <div className="flex items-center gap-3">
                    {/* THE CREATE BUTTON */}
                    <PermissionGuard permission={"teacher-investment-create"}>
                        <button
                            onClick={() => { setInvestmentCreationVisibility(true) }}
                            className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all shadow-lg shadow-cyan-900/20 active:scale-95"
                        >
                            <i className="ri-add-line text-sm"></i>
                            Add Investment
                        </button>
                    </PermissionGuard>

                    {/* RECORD COUNTER */}
                    <div className="px-3 py-2 bg-white rounded-xl border border-slate-200 text-[9px] font-bold text-slate-500 shadow-sm">
                        {investmentData?.investments?.length || 0} RECORDS
                    </div>
                </div>
            </div>

            {/* COMPACT LIST */}
            <div className="grid grid-cols-1 gap-3">
                {investmentData?.investments?.map((inv, index) => (
                    <div key={index} className="group bg-white p-4 rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md hover:border-cyan-500/30 transition-all duration-200 relative">

                        <div className="relative flex items-center justify-between gap-4">

                            {/* Left: Date (More compact) */}
                            <div className="flex items-center gap-3 min-w-[140px]">
                                <div className="w-11 h-11 bg-slate-50 rounded-xl flex flex-col items-center justify-center border border-slate-100 group-hover:bg-cyan-50 transition-colors">
                                    <p className="text-[8px] font-black text-slate-400 uppercase leading-none mb-0.5">
                                        {new Date(inv.date).toLocaleDateString('en-GB', { month: 'short' })}
                                    </p>
                                    <p className="text-md font-black text-slate-700 leading-none">
                                        {new Date(inv.date).toLocaleDateString('en-GB', { day: '2-digit' })}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-cyan-600 uppercase tracking-tighter">{inv.paymentMethod || "Direct Deposit"}</p>
                                    <h5 className="text-xs font-bold text-slate-600">{toInputDateFormat(inv.date)}</h5>
                                </div>
                            </div>

                            {/* Middle: Notes (Visible but restrained) */}
                            <div className="hidden md:block flex-1 max-w-xs">
                                <p className="text-[11px] text-slate-500 italic truncate">
                                    {inv.notes ? `"${inv.notes}"` : "No notes."}
                                </p>
                            </div>

                            {/* Right: Amount & Actions */}
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <p className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-100">
                                        ₹{inv.amount.toLocaleString()}
                                    </p>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex items-center gap-1 border-l pl-3 border-slate-100">
                                    <PermissionGuard permission={"teacher-investment-update"}>
                                        <button
                                            onClick={() => handleEdit(inv)}
                                            className="p-2 text-slate-400 hover:text-cyan-600 hover:bg-cyan-50 rounded-lg transition-colors"
                                            title="Edit"
                                        >
                                            <i className="ri-edit-line text-lg"></i>
                                        </button>
                                    </PermissionGuard>
                                    <PermissionGuard permission={"teacher-investment-delete"}>
                                        <button
                                            onClick={() => handleDelete(inv._id)}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                    <div className="py-12 flex flex-col items-center justify-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                        <i className="ri-database-2-line text-xl text-slate-300 mb-2"></i>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No Records Found</p>
                    </div>
                )}
            </div>
        </div>
    )
}

export default PartnershipInvestment