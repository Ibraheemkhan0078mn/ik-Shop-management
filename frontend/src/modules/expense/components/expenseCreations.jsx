import React, { useEffect, useState } from "react";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { setAllExpenseCatags } from "../slices/expense.slice";
import api from "../../../shared/services/api.js";
import { toInputDateFormat } from "@shared/utilities/date.utility";
import { useHotkeys } from "react-hotkeys-hook";
import { showSuccess, showError } from "../../../shared/utilities/toastHelpers.js";

const ExpenseCreation = ({ getExpensesFunc, setVisibility, setExpensesData }) => {


    let dispatch = useDispatch()
    let expenseCatags = useSelector(state => state.expense.allExpenseCatags || [])
    const [formData, setFormData] = useState({
        amount: "",
        type: "purchase",
        date: toInputDateFormat(new Date()),
        notes: "",
        category: "general",
        isInvestment: false,
        investedBy: ""
    });
    let [partners, setPartners] = useState([])
    useHotkeys("enter", (e) => { handleSubmit(e) })






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
            showError(error?.response?.data?.message || error?.message || "Failed to fetch categories");
        }
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
            const res = await api.post(`/expenseRoutes/expense`, formData);
            if (res.data.success) {
                showSuccess("Expense created successfully");
                getExpensesFunc("update")
                setVisibility(false)
            } else {
                showError("Failed to create expense");
            }
        } catch (error) {
            showError(error?.response?.data?.message || error?.message || "Failed to create expense");
        }
    };

    return (
        <div
            // 🔹 Backdrop with fade-in and blur
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex justify-center items-center z-[9999] px-5 animate-in fade-in duration-300"
            onClick={() => setVisibility(false)}
        >
            {/* MODAL BOX - Slide and Zoom entry */}
            <div
                className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-cyan-100 relative overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 ease-out"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Premium Animated Top Accent */}
                <div className="h-2 w-full bg-gradient-to-r from-cyan-400 via-cyan-600 to-cyan-400 animate-pulse"></div>

                <div className="p-8">
                    {/* CLOSE BUTTON with rotate effect */}
                    <button
                        onClick={() => { setVisibility(false) }}
                        className="absolute top-5 right-5 text-zinc-400 hover:text-cyan-600 hover:rotate-90 transition-all duration-300 text-2xl"
                    >
                        <i className="ri-close-line"></i>
                    </button>

                    <div className="mb-6 text-center">
                        <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">
                            Add <span className="text-cyan-600">Expense</span>
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">Record your financial transaction details</p>
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
                                value={formData.amount}
                                onChange={handleChange}
                                className="w-full p-3 bg-cyan-50/30 border border-zinc-200 rounded-xl focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 outline-none transition-all placeholder:text-gray-400"
                                required
                                autoFocus
                            />
                        </div>



                        {/* CATEGORY DROPDOWN */}
                        <div className="group flex-1 w-full">
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1 group-focus-within:text-cyan-600">
                                Category
                            </label>
                            <select
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                                className="w-full flex-1 p-3 bg-cyan-50/30 border border-zinc-200 rounded-xl focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 outline-none transition-all cursor-pointer"
                            >
                                <option value="others">Others</option>
                                {
                                    expenseCatags?.map((ec, index) => (
                                        <option key={index} value={ec?.name}>{ec?.name}</option>
                                    ))
                                }
                            </select>
                        </div>
                        {/* </div> */}

                        {/* DATE */}
                        <div className="group">
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1 group-focus-within:text-cyan-600">
                                Date
                            </label>
                            <input
                                type="date"
                                name="date"
                                value={formData.date}
                                onChange={handleChange}
                                className="w-full p-3 bg-cyan-50/30 border border-zinc-200 rounded-xl focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 outline-none transition-all"
                                required
                            />
                        </div>





                        {/* NOTES */}
                        <div className="group">
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1 group-focus-within:text-cyan-600">
                                Notes
                            </label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                placeholder="Add specific details here..."
                                className="w-full p-3 bg-cyan-50/30 border border-zinc-200 rounded-xl h-28 resize-none focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 outline-none transition-all placeholder:text-gray-400"
                            />
                        </div>












                        {/* PARTNER INVESTMENT SECTION */}
                        {/* <div className="group mb-6">
                            <div className="flex items-center gap-4 flex-wrap">
                                <div className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        id="isInvestment"
                                        name="isInvestment"
                                        checked={formData.isInvestment}
                                        onChange={(e) => {
                                            const checked = e.target.checked;
                                            setFormData({
                                                ...formData,
                                                isInvestment: checked,
                                                investedBy: checked ? formData.investedBy : ""
                                            });
                                        }}
                                        className="w-5 h-5 rounded border-zinc-300 text-cyan-600 focus:ring-cyan-500 transition-all"
                                    />
                                    <label
                                        htmlFor="isInvestment"
                                        className="text-sm font-semibold text-gray-700 cursor-pointer"
                                    >
                                        Partner Investment
                                    </label>
                                </div>

                                {formData.isInvestment && (
                                    <div className="flex-1 min-w-[200px] animate-in fade-in slide-in-from-left-2 duration-200">
                                        <select
                                            name="investedBy"
                                            value={formData.investedBy}
                                            onChange={(e) => setFormData({ ...formData, investedBy: e.target.value })}
                                            className="w-full p-2 bg-cyan-50/30 border border-zinc-200 rounded-xl focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 outline-none transition-all text-sm"
                                        >
                                            <option value="">Select Partner</option>
                                            {
                                                partners?.length > 0
                                                &&
                                                partners?.map((p) => {
                                                    return (
                                                        <option key={p?._id} value={p?._id}>{p?.name}</option>
                                                    )
                                                })
                                            }
                                        </select>
                                    </div>
                                )}
                            </div>
                        </div> */}








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

export default ExpenseCreation;

