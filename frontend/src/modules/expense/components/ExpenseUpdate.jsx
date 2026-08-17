import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setAllExpenseCatags } from "../slices/expense.slice";
import api from "../../../shared/services/api.js";
import { showSuccess, showError } from "../../../shared/utilities/toastHelpers.js";

const ExpenseUpdate = ({ getExpensesFunc, setVisibility, expenseData }) => {
    const [formData, setFormData] = useState({
        amount: "",
        transactionDate: "",
        notes: "",
        paymentMethodId: "",
        paymentMethodName: "Cash"
    });
    let expenseCatags = useSelector(state => state.expense.allExpenseCatags)
    let dispatch = useDispatch()
    let [paymentMethods, setPaymentMethods] = useState([])

    useEffect(() => {
        const fetchPaymentMethods = async () => {
            try {
                const res = await api.get('/paymentMethods/getAll');
                if (res.data.success) {
                    setPaymentMethods(res.data.paymentMethods || []);
                }
            } catch (error) {
                console.error('Failed to fetch payment methods:', error);
            }
        };
        fetchPaymentMethods();
    }, []);

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


    useEffect(() => {
        setFormData({
            _id: expenseData._id,
            amount: expenseData.amount,
            transactionDate: new Date(expenseData.transactionDate || expenseData.date).toISOString().split("T")[0],
            notes: expenseData.notes || "",
            paymentMethodId: expenseData.paymentMethod || "",
            paymentMethodName: expenseData.paymentMethodName || "Cash"
        })
    }, [expenseData])


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
                showSuccess("Expense updated successfully");
                getExpensesFunc("update")
                setVisibility(false)
            } else {
                showError("Failed to update expense");
            }
        } catch (error) {
            showError(error?.response?.data?.message || error?.message || "Failed to update expense");
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

                        {/* DATE */}
                        <div className="group transition-all">
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1 group-focus-within:text-cyan-600">
                                Date
                            </label>
                            <input
                                type="date"
                                name="transactionDate"
                                value={formData?.transactionDate}
                                onChange={handleChange}
                                className="w-full p-3 bg-cyan-50/30 border border-zinc-200 rounded-xl focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 outline-none transition-all"
                                required
                            />
                        </div>

                        {/* PAYMENT METHOD DROPDOWN */}
                        <div className="group transition-all">
                            <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1 group-focus-within:text-cyan-600">
                                Payment Method
                            </label>
                            <select
                                name="paymentMethodId"
                                value={formData.paymentMethodId}
                                onChange={(e) => {
                                    const selectedMethod = paymentMethods.find(pm => pm._id === e.target.value);
                                    setFormData({
                                        ...formData,
                                        paymentMethodId: e.target.value,
                                        paymentMethodName: selectedMethod?.name || 'Cash'
                                    });
                                }}
                                className="w-full p-3 bg-cyan-50/30 border border-zinc-200 rounded-xl focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 outline-none transition-all cursor-pointer"
                            >
                                <option value="">Cash</option>
                                {
                                    paymentMethods?.map((pm, index) => (
                                        <option key={index} value={pm._id}>{pm?.name}</option>
                                    ))
                                }
                            </select>
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
