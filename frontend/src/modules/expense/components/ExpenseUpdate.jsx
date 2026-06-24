import React, { useEffect, useState } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { setAllExpenseCatags } from "../slices/expense.slice";
import api from "../../../shared/services/axiosInstance.js";

const ExpenseUpdate = ({ getExpensesFunc, setVisibility, setExpensesData, expenseData }) => {
    const [formData, setFormData] = useState({
        amount: "",
        type: "purchase",
        date: "",
        notes: "",
        category: ""
    });
    let expenseCatags = useSelector(state => state.expense.allExpenseCatags)
    let dispatch = useDispatch()


    useEffect(() => {
        try {
            if (!expenseCatags || expenseCatags?.length < 1) {
                (async () => {
                    let res = await api.get(`/expenseRoutes/expenseCatagGetAll`)
                    if (res.data.success) {
                        dispatch(setAllExpenseCatags(res.data.expenseCatags))
                    }
                }
                )()
            }
        } catch (error) {
            console.error(error?.message)
        }
    }, [])


    useEffect(() => {
        setFormData({
            ...expenseData,
            date: new Date(expenseData.date).toISOString().split("T")[0]
        })
    }, [])


    // Handle input changes
    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    // Submit form
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {

            const res = await api.put(`/expenseRoutes/expense`, formData);


            if (res.data.success) {
                getExpensesFunc("update")
                setVisibility(false)
            }
            // Refresh parent page

            // Close modal

        } catch (error) {
            console.error("Error submitting expense:", error);
        }
    };

    return (
        <div
            // 🔹 Backdrop: Fades in with a soft blur
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex justify-center items-center z-[9999] px-5 animate-in fade-in duration-300"
            onClick={() => setVisibility(false)}
        >
            {/* MODAL BOX: Zooms in and slides up on entry */}
            <div
                className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-cyan-100 relative overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 ease-out"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Premium Top Decorative Accent */}
                <div className="h-2 w-full bg-gradient-to-r from-cyan-400 via-cyan-600 to-cyan-400 animate-pulse"></div>

                <div className="p-8">
                    {/* CLOSE BUTTON: Rotates on hover */}
                    <button
                        onClick={() => { setVisibility(false) }}
                        className="absolute top-5 right-5 text-zinc-400 hover:text-cyan-600 hover:rotate-90 transition-all duration-300 text-2xl"
                    >
                        <i className="ri-close-line"></i>
                    </button>

                    <div className="mb-8 text-center">
                        <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">
                            Add <span className="text-cyan-600">Expense</span>
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">Record your transaction details securely.</p>
                    </div>

                    {/* FORM */}
                    <form onSubmit={handleSubmit} className="space-y-5">

                        {/* AMOUNT */}
                        <div className="group transition-all">
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1 group-focus-within:text-cyan-600">
                                Amount
                            </label>
                            <input
                                type="number"
                                onWheel={(e) => e.target.blur()}
                                name="amount"
                                value={formData?.amount}
                                onChange={handleChange}
                                className="w-full p-3 bg-cyan-50/30 border border-zinc-200 rounded-xl focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 outline-none transition-all duration-300"
                                required
                                autoFocus
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* TYPE DROPDOWN */}
                            <div className="group transition-all">
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1 group-focus-within:text-cyan-600">
                                    Type
                                </label>
                                <select
                                    name="type"
                                    value={formData?.type}
                                    onChange={handleChange}
                                    className="w-full p-3 bg-cyan-50/30 border border-zinc-200 rounded-xl focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 outline-none transition-all cursor-pointer"
                                >
                                    <option value="purchase">Purchase</option>
                                    <option value="repair">Repair</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            {/* CATEGORY DROPDOWN */}
                            <div className="group transition-all">
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1 group-focus-within:text-cyan-600">
                                    Category
                                </label>
                                <select
                                    name="category"
                                    value={formData.category}
                                    onChange={handleChange}
                                    className="w-full p-3 bg-cyan-50/30 border border-zinc-200 rounded-xl focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 outline-none transition-all cursor-pointer"
                                >
                                    <option value="other">Other</option>
                                    {
                                        expenseCatags?.map((ec, index) => (
                                            <option key={index} value={ec?.name} >{ec?.name}</option>
                                        ))
                                    }
                                </select>
                            </div>
                        </div>

                        {/* DATE */}
                        <div className="group transition-all">
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1 group-focus-within:text-cyan-600">
                                Date
                            </label>
                            <input
                                type="date"
                                name="date"
                                value={formData?.date}
                                onChange={handleChange}
                                className="w-full p-3 bg-cyan-50/30 border border-zinc-200 rounded-xl focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 outline-none transition-all"
                                required
                            />
                        </div>

                        {/* NOTES */}
                        <div className="group transition-all">
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1 group-focus-within:text-cyan-600">
                                Notes
                            </label>
                            <textarea
                                name="notes"
                                value={formData?.notes}
                                onChange={handleChange}
                                placeholder="Additional details..."
                                className="w-full p-3 bg-cyan-50/30 border border-zinc-200 rounded-xl h-28 resize-none focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 outline-none transition-all"
                            />
                        </div>

                        {/* SUBMIT BUTTON */}
                        <button
                            type="submit"
                            className="w-full bg-cyan-600 text-white py-3.5 rounded-xl font-bold tracking-wide
                               hover:bg-cyan-700 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 
                               active:scale-95 transition-all duration-200 mt-2"
                        >
                            Submit Expense
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ExpenseUpdate;
