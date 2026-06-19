import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useDispatch, useSelector } from 'react-redux'
import { setTeacherSalaryPayment } from "../slices/teacher.slice.js";
import api from "@shared/services/axiosInstance.js";

export default function SeeAllTeacherPayments({ teacherId, setVisibility, setTeacherSalaryPaymentCreationFormVisible }) {
    let dispatch = useDispatch()
    let paymentRedux = useSelector(state => state.teacher.teacherSalaryPayments)
    // const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);





    // Fetch all payments of teacher
    useEffect(() => {
        async function load() {
            try {
                const res = await api.post(`/teacherRoute/getTeacherSalaryPayments`, { teacherId: teacherId });
                // setPayments(res.data?.salaryList || []);
                res?.data?.salaryList && dispatch(setTeacherSalaryPayment(res.data?.salaryList))

            } catch (err) {
                console.error("Payment Fetch Error:", err);
            }
            setLoading(false);
        }

        if (teacherId) load();
    }, [teacherId]);










    async function handleDelete(paymentId) {
        try {
            const res = await api.delete(`/teacherRoute/deleteSalaryPayment`, { data: { teacherId: teacherId, salaryId: paymentId } });
            if (res.data.success) {
                res?.data?.salaryPayments && dispatch(setTeacherSalaryPayment(res.data?.salaryPayments))
            }
        } catch (err) {
            console.error("Payment Fetch Error:", err);
        }
    }






    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8 overflow-hidden">
            {/* High-End Glass Backdrop */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-500"
                onClick={() => { setVisibility(false) }}
            />

            {/* Main Dashboard Container */}
            <div className="relative w-full max-w-6xl h-[90vh] bg-[#f8fafc] rounded-[3rem] shadow-[0_32px_64px_-15px_rgba(0,0,0,0.3)] border-4 border-white flex flex-col md:flex-row overflow-hidden animate-in zoom-in-95 duration-500">

                {/* Left Side: Navigation & Summary (Static) */}
                <div className="w-full md:w-[320px] bg-white border-r border-slate-100 p-8 flex flex-col justify-between">
                    <div className="space-y-8">
                        <div className="space-y-4">
                            <div className="w-14 h-14 rounded-2xl bg-cyan-500 flex items-center justify-center shadow-lg shadow-cyan-200 text-white">
                                <i className="ri-wallet-3-line text-2xl"></i>
                            </div>
                            <div>
                                <h1 className="text-3xl font-black text-slate-800 leading-tight">
                                    Payment<br /><span className="text-cyan-500">Center</span>
                                </h1>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Financial Records</p>
                            </div>
                        </div>

                        <div className="p-5 bg-slate-50 rounded-[2rem] border border-slate-100">
                            <div className="flex items-center gap-3 text-slate-400 mb-2">
                                <i className="ri-line-chart-line text-sm"></i>
                                <span className="text-[10px] font-black uppercase tracking-tighter">Quick Action</span>
                            </div>
                            <button
                                onClick={() => { setTeacherSalaryPaymentCreationFormVisible(true) }}
                                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-cyan-600 transition-all duration-300 shadow-xl shadow-slate-200 active:scale-95 flex items-center justify-center gap-2"
                            >
                                <i className="ri-add-circle-fill text-lg"></i>
                                New Entry
                            </button>
                        </div>
                    </div>

                    <button
                        onClick={() => { setVisibility(false) }}
                        className="flex items-center gap-3 text-slate-400 hover:text-rose-500 transition-colors group"
                    >
                        <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-rose-50">
                            <X size={18} />
                        </div>
                        <span className="text-xs font-black uppercase tracking-widest">Close Portal</span>
                    </button>
                </div>

                {/* Right Side: Scrollable Activity Feed */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Top Bar */}
                    <div className="px-10 py-6 bg-white/50 backdrop-blur-sm border-b border-slate-100 flex justify-between items-center">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse"></div>
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Live Transaction Ledger</span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">
                            Records Found: <span className="text-slate-800">{paymentRedux?.length || 0}</span>
                        </p>
                    </div>

                    {/* Feed Area */}
                    <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                        {loading ? (
                            <div className="h-full flex flex-col items-center justify-center">
                                <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : paymentRedux.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                                <i className="ri-inbox-archive-line text-6xl text-slate-200 mb-4"></i>
                                <p className="font-bold text-slate-400">No records to display</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                {paymentRedux?.map((p) => (
                                    <div
                                        key={p._id}
                                        className="bg-white border border-slate-100 rounded-[2rem] p-6 hover:border-cyan-200 hover:shadow-xl hover:shadow-cyan-900/5 transition-all duration-500 group relative overflow-hidden"
                                    >
                                        {/* Decorative Gradient Overlay */}
                                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-cyan-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

                                        <div className="flex justify-between items-start mb-6">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="px-3 py-1 bg-slate-900 text-white text-[9px] font-black uppercase rounded-full tracking-tighter">
                                                        {p.paymentMethod}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-300">#{p._id.slice(-6)}</span>
                                                </div>
                                                <h2 className="text-3xl font-black text-slate-800 tracking-tighter">
                                                    <span className="text-sm font-medium text-slate-400 mr-1">$</span>
                                                    {p.salaryAmount}
                                                </h2>
                                            </div>
                                            <button
                                                onClick={() => handleDelete(p._id)}
                                                className="w-10 h-10 rounded-xl flex items-center justify-center text-slate-300 hover:bg-rose-50 hover:text-rose-500 transition-all border border-transparent hover:border-rose-100"
                                            >
                                                <i className="ri-delete-bin-7-line text-lg"></i>
                                            </button>
                                        </div>

                                        <div className="flex items-center justify-between pt-5 border-t border-slate-50">
                                            <div className="flex items-center gap-2">
                                                <i className="ri-calendar-event-line text-cyan-500"></i>
                                                <p className="text-[11px] font-bold text-slate-500">
                                                    {new Date(p.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                                </p>
                                            </div>
                                            <div className="group/note relative">
                                                <i className="ri-information-fill text-slate-200 hover:text-cyan-500 transition-colors text-xl cursor-help"></i>
                                                {p.note && (
                                                    <div className="absolute bottom-full right-0 mb-2 w-48 p-3 bg-slate-900 text-white text-[10px] rounded-xl opacity-0 group-hover/note:opacity-100 transition-opacity pointer-events-none shadow-xl z-10">
                                                        {p.note}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
