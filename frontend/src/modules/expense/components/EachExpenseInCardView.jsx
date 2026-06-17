import axios from 'axios';
import { Calendar, DollarSign, DollarSignIcon, Edit2, Grid, LucideDollarSign, StickyNote, Trash2 } from 'lucide-react';
import React from 'react'
import { PermissionGuard } from '../../../common/components/PermissionGaurd';
import ConfirmDialog from '../../../common/components/ConfirmationDialog';

const EachExpenseInCardView = ({ getExpensesFunc, exp, setExpenseUpdateVisibility, setCurrentToUpdateExpenseData, setExpensesData }) => {
    const firstLetter = exp.type?.slice(0, 1)?.toUpperCase();

    async function handleDelete(expenseId) {
        try {
            let res = await api.delete(`/expenseRoutes/expense`, { data: { _id: expenseId } })
            if (res.data.success) {
                getExpensesFunc()
            }
        } catch (error) {
            console.error(error?.message)
        }
    }







    return (
        <div className="group relative w-80">
            {/* OUTER GLOW - Matches your sidebar gradient */}
            <div className="absolute -inset-0.5 bg-linear-to-r from-[#0e8dc7] to-[#109fe1] rounded-[2rem] opacity-0 group-hover:opacity-20 blur-xl transition-all duration-700"></div>

            {/* MAIN CONTAINER */}
            <div className="relative flex flex-col bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:-translate-y-3 group-hover:shadow-2xl group-hover:shadow-blue-100/50">

                {/* HEADER: AMOUNT & ICON */}
                <div className="flex justify-between items-start mb-6">
                    <div className="h-12 w-12 rounded-2xl bg-linear-to-tr from-[#0e8dc7] to-[#1aa2e6] flex items-center justify-center shadow-lg shadow-blue-200 group-hover:rotate-[10deg] transition-transform duration-500">
                        <DollarSign className="text-white w-6 h-6" />
                    </div>
                    <div className="text-right">
                        <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Spent</span>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tighter">
                            {exp.amount}<span className="text-[#0e8dc7] ml-0.5">.00</span>
                        </h3>
                    </div>
                </div>

                {/* DETAILS SECTION */}
                <div className="space-y-3">
                    <div className="flex gap-2">
                        <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100 group-hover:bg-blue-50/50 group-hover:border-blue-100 transition-colors duration-300">
                            <Calendar className="w-3.5 h-3.5 text-[#0e8dc7]" />


                            <span className="text-[11px] font-bold text-slate-600">{new Date(exp?.date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex-1 flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-xl border border-slate-100 group-hover:bg-blue-50/50 group-hover:border-blue-100 transition-colors duration-300">
                            <Grid className="w-3.5 h-3.5 text-[#0e8dc7]" />
                            <span className="text-[11px] font-bold text-slate-600 truncate">{exp?.category || "Misc"}</span>
                        </div>
                    </div>

                    {/* NOTES BOX with subtle indent */}
                    {exp.notes && (
                        <div className="p-3 bg-slate-50/80 rounded-2xl border-l-4 border-[#0e8dc7] group-hover:bg-white transition-all duration-300">
                            <div className="flex items-center gap-2 mb-1">
                                <StickyNote className="w-3 h-3 text-slate-400" />
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Memo</span>
                            </div>
                            <p className="text-[11px] text-slate-500 font-medium leading-relaxed italic line-clamp-2">
                                "{exp.notes}"
                            </p>
                        </div>
                    )}
                </div>

                {/* ACTION BUTTONS: Always visible, but they "grow" on hover */}
                <div className="mt-6 flex gap-3">
                    <PermissionGuard permission={"expense-update"}>
                        <button
                            onClick={() => { setCurrentToUpdateExpenseData(exp); setExpenseUpdateVisibility(true); }}
                            className="flex-[3] flex items-center justify-center gap-2 py-3 bg-slate-900 text-white rounded-2xl text-[11px] font-bold uppercase tracking-widest shadow-md hover:bg-[#0e8dc7] hover:shadow-blue-300 transition-all duration-300 active:scale-90"
                        >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                        </button>
                    </PermissionGuard>

                    <PermissionGuard permission={"expense-delete"}>
                        <ConfirmDialog onConfirm={() => { handleDelete(exp._id) }} message='Are you want to delete Expense?'  >
                            <button
                                // onClick={() => handleDelete(exp._id)}
                                className="flex-1 flex items-center justify-center bg-white border border-slate-100 text-red-500 rounded-2xl shadow-sm hover:bg-red-50 hover:border-red-100 hover:shadow-red-100 transition-all duration-300 active:scale-90"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </ConfirmDialog>
                    </PermissionGuard>
                </div>
            </div>
        </div>
    )
}

export default EachExpenseInCardView
