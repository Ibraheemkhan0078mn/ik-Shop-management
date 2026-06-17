import React from "react";
import { Calendar, Edit2, Trash2 } from "lucide-react";
import axios from "axios";
import api from "@shared/services/axiosInstance.js";
import { PermissionGuard } from "@shared/components/PermissionGaurd";
import ConfirmDialog from "@shared/components/ConfirmationDialog";

// Improved table-row component with proper column alignment
// This now follows real table formatting with consistent spacing
{/* Highlight helper function - add this above your component or inside it */ }
const highlightMatch = (text, search) => {
    if (!search || !text) return text;
    const index = text.toLowerCase().indexOf(search.toLowerCase());
    if (index === -1) return text;
    return (
        <>
            {text.slice(0, index)}
            <mark className="bg-yellow-200 text-inherit rounded-sm px-0">{text.slice(index, index + search.length)}</mark>
            {text.slice(index + search.length)}
        </>
    );
};












export default function EachExpenseInTableView({ catagSearch, getExpensesFunc, exp, setExpenseUpdateVisibility, setCurrentToUpdateExpenseData, setExpensesData }) {



    async function handleDelete(expenseId) {
        try {
            let res = await api.delete(`/expenseRoutes/expense`, { data: { _id: expenseId } })
            if (res.data.success) {
                getExpensesFunc("delete")
            }
        } catch (error) {
            console.error(error?.message)
        }
    }






    return (
        <div className="group relative flex items-center w-full bg-white hover:bg-slate-50/80 border-b border-slate-100 transition-all duration-300 ease-out hover:z-10 hover:shadow-[0_10px_30px_-15px_rgba(14,141,199,0.2)]">

            {/* HOVER INDICATOR - Matches your sidebar gradient */}
            <div className="absolute left-0 w-1 h-0 bg-linear-to-b from-[#0e8dc7] to-[#109fe1] group-hover:h-full transition-all duration-300" />

            {/* AMOUNT */}
            <div className="w-[15%] px-6 py-5 flex justify-center">
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Amount</span>
                    <span className="text-base font-extrabold text-slate-900 group-hover:text-[#0e8dc7] transition-colors">
                        <span className="text-[11px] mr-1 opacity-70">Rs</span>{exp.amount}
                    </span>
                </div>
            </div>

            {/* TYPE
            <div className="w-[10%] px-5 py-3 flex justify-center">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border transition-all duration-300 ${exp.type === 'income'
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100 group-hover:bg-emerald-500 group-hover:text-white'
                    : 'bg-blue-50 text-[#0e8dc7] border-blue-100 group-hover:bg-[#0e8dc7] group-hover:text-white'
                    }`}>
                    {exp.type}
                </span>
            </div> */}

            {/* DATE */}
            <div className="w-[12%] px-5 py-3 flex justify-center">
                <div className="flex items-center gap-2 text-slate-600">
                    <Calendar className="w-3.5 h-3.5 opacity-40 group-hover:text-[#0e8dc7] group-hover:opacity-100 transition-all" />
                    <span className="text-xs font-bold">{new Date(exp?.date).toLocaleDateString()}</span>
                </div>
            </div>

            {/* CATEGORY */}
            <div className="w-[15%] px-5 py-3 flex justify-center">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#0e8dc7] group-hover:scale-150 transition-transform" />
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-tight">{highlightMatch(exp?.category || "General", catagSearch)}</span>
                </div>
            </div>

            {/* NOTES - Flex-1 to take remaining space */}
            <div className="flex-1 px-5 py-3 flex justify-center">
                <div className="max-w-[300px]">
                    <p className="text-xs text-slate-500 font-medium italic truncate group-hover:text-slate-700 transition-colors">
                        {exp.notes ? <>{'"'}{highlightMatch(exp.notes, catagSearch)}{'"'}</> : "—"}
                    </p>
                </div>
            </div>

            {/* ACTIONS */}
            <div className="w-[20%] px-6 py-3 flex justify-center">
                <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity duration-300">

                    <PermissionGuard permission={"expense-update"}>
                        <button
                            onClick={() => { setExpenseUpdateVisibility(true); setCurrentToUpdateExpenseData(exp) }}
                            className="p-2 hover:bg-white rounded-xl hover:shadow-md border border-transparent hover:border-slate-200 text-slate-600 hover:text-[#0e8dc7] transition-all active:scale-90"
                            title="Edit"
                        >
                            <Edit2 className="w-4 h-4" />
                        </button>
                    </PermissionGuard>




                    <div className="w-[1px] h-4 bg-slate-200" />



                    <PermissionGuard permission={"expense-delete"}>
                        <ConfirmDialog onConfirm={() => { handleDelete(exp._id) }} message='Are you want to delete Expense?'  >

                            <button
                                // onClick={() => { handleDelete(exp._id) }}
                                className="p-2 hover:bg-red-50 rounded-xl hover:shadow-md border border-transparent hover:border-red-100 text-slate-400 hover:text-red-500 transition-all active:scale-90"
                                title="Delete"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </ConfirmDialog>
                    </PermissionGuard>

                </div>
            </div>
        </div>
    );
}
