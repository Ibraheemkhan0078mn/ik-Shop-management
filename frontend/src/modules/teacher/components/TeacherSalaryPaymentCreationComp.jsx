import React, { useEffect, useState } from "react";
import { useCreateTeacherSalary } from "../api/teacherFinance.api.js";
import { toInputDateFormat } from '@shared/utilities/date.utility.js'
import axios from "axios";
import api from "@shared/services/axiosInstance.js";

const TeacherSalaryPaymentCreationComp = ({ setVisible, teacherId }) => {
    let teacherSalaryCreationMutate = useCreateTeacherSalary()
    let [teacherData, setTeacherData] = useState(null)
    const [isTeacherSalary, setIsTeacherSalary] = useState(false)
    const [formData, setFormData] = useState({
        salaryAmount: "",
        paymentType: "salary",
        paymentMethod: "cash",
        date: toInputDateFormat(new Date()),
        notes: "",
    });


    useEffect(() => {
        try {
            (
                async function () {
                    let res = await api.post(`/teacherRoute/getTeacherDataOnId`, { teacherId })
                    if (res.data.success) {
                        let teacherDataRes = res.data.teacherdata
                        setTeacherData(teacherDataRes)
                        if (teacherDataRes.salary == 0 || teacherDataRes.salary == null || teacherDataRes.salary == undefined) {
                            setIsTeacherSalary(false)
                        } else {
                            setIsTeacherSalary(true)
                        }
                    }
                }
            )()
        } catch (error) {
            console.error(error)
        }
    }, [])






    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            await teacherSalaryCreationMutate.mutateAsync({ ...formData, teacherId: teacherId })
            setVisible(false);
        } catch (err) {
            console.error("Submit Error:", err);
        }
    };






    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 md:p-6">
            {/* Backdrop with High-End Blur */}
            <div
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-500"
                onClick={() => setVisible(false)}
            />

            {/* Main Form Container */}
            <div className="relative w-full max-w-xl bg-white rounded-[2.5rem] shadow-[0_32px_64px_-15px_rgba(0,0,0,0.3)] border border-white flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">

                {/* Glossy Header Area */}
                <div className="relative p-8 border-b border-slate-100 bg-gradient-to-br from-white via-white to-cyan-50/30">
                    <button
                        onClick={() => setVisible(false)}
                        className="absolute top-8 right-8 h-10 w-10 rounded-full flex justify-center items-center bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 hover:rotate-90 transition-all duration-300"
                    >
                        <i className="ri-close-line text-xl"></i>
                    </button>

                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-cyan-500 rounded-xl shadow-lg shadow-cyan-200 text-white">
                                <i className="ri-hand-coin-line text-xl"></i>
                            </div>
                            <h1 className="text-3xl font-black text-slate-800 tracking-tighter">
                                Add <span className="text-cyan-500">Salary</span>
                            </h1>
                        </div>
                        <p className="text-sm font-semibold text-slate-400 mt-2 ml-1 flex items-center gap-2">
                            <i className="ri-information-line text-cyan-400"></i>
                            Recording new financial disbursement
                        </p>
                    </div>
                </div>

                {/* Form Body */}
                <form className="p-8 space-y-6 bg-slate-50/30" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Amount Input */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-cyan-600 uppercase tracking-widest ml-1">Salary Amount</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                                <input
                                    type="number"
                                    onWheel={(e) => e.target.blur()}
                                    min={1}
                                    name="salaryAmount"
                                    value={formData.salaryAmount}
                                    onChange={handleChange}
                                    className="w-full bg-white pl-8 pr-4 py-4 rounded-2xl border border-slate-200 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all font-bold text-slate-700"
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                        </div>

                        {/* Date Input */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-cyan-600 uppercase tracking-widest ml-1">Payment Date</label>
                            <input
                                type="date"
                                name="date"
                                value={formData.date}
                                onChange={handleChange}
                                className="w-full bg-white px-4 py-4 rounded-2xl border border-slate-200 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all font-bold text-slate-700 cursor-pointer"
                                required
                            />
                        </div>
                    </div>






                    {/* payemnt type */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-cyan-600 uppercase tracking-widest ml-1">Payment Method</label>
                        <div className="grid grid-cols-3 gap-3">
                            {['salary', 'extra-expense'].map((method) => (
                                <label key={method} className="relative cursor-pointer group">
                                    <input
                                        type="radio"
                                        name="paymentType"
                                        value={method}
                                        checked={formData.paymentType === method}
                                        onChange={handleChange}
                                        className="peer sr-only"
                                    />
                                    <div className="py-3 text-center rounded-xl border border-slate-200 bg-white text-[13px] font-black uppercase  text-slate-400 peer-checked:bg-cyan-600 peer-checked:text-white peer-checked:border-cyan-600 transition-all duration-300 group-hover:border-cyan-200">
                                        {/* {method === 'bankAccount' ? 'Bank' : method} */}
                                        {method}
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>







                    {/* Method Select */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-cyan-600 uppercase tracking-widest ml-1">Payment Method</label>
                        <div className="grid grid-cols-3 gap-3">
                            {['cash', 'online', 'bankAccount'].map((method) => (
                                <label key={method} className="relative cursor-pointer group">
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value={method}
                                        checked={formData.paymentMethod === method}
                                        onChange={handleChange}
                                        className="peer sr-only"
                                    />
                                    <div className="py-3 text-center rounded-xl border border-slate-200 bg-white text-[13px] font-black uppercase  text-slate-400 peer-checked:bg-cyan-600 peer-checked:text-white peer-checked:border-cyan-600 transition-all duration-300 group-hover:border-cyan-200">
                                        {method === 'bankAccount' ? 'Bank' : method}
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>




                    {/* Notes Textarea */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-cyan-600 uppercase tracking-widest ml-1">Transaction Notes</label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            className="w-full bg-white px-4 py-4 rounded-2xl border border-slate-200 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/10 outline-none transition-all font-medium text-slate-600 h-28 resize-none"
                            placeholder="Add specific details about this payment..."
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="w-full py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-slate-200 hover:bg-cyan-600 hover:shadow-cyan-100 transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-3"
                    >
                        <i className="ri-check-double-line text-lg"></i>
                        Confirm & Create Payment
                    </button>
                </form>
            </div>
        </div>
    );
};

export default TeacherSalaryPaymentCreationComp;