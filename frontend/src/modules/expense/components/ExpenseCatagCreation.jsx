import axios from 'axios';
import React, { useState } from 'react'
import { X } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { setAllExpenseCatags } from '../expense.slice';
import api from '@shared/services/axiosInstance.js';

const ExpenseCatagCreation = ({ setVisibility }) => {
    const [category, setCategory] = useState("");
    const [loading, setLoading] = useState(false);
    let dispatch = useDispatch()


    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!category.trim()) return;


        try {
            setLoading(true);
            let res = await api.post(`/expenseRoutes/expenseCatagCreate`, { catagName: category });
            if (res.data.success) {
                setCategory("");
                dispatch(setAllExpenseCatags(res.data.expenseCatags))
                setVisibility(false)
            }

        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false);
        }
    };


    return (
        <div
            // 🔹 Backdrop: Premium blur and fade
            className="h-screen w-full fixed top-0 right-0 z-[60] flex items-center justify-center backdrop-blur-md bg-slate-900/60 p-6 animate-in fade-in duration-300"
            onClick={() => setVisibility(false)}
        >
            <form
                onSubmit={handleSubmit}
                // 🔹 Modal Box: Zoom and Slide-up entry
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md relative bg-white rounded-[2rem] shadow-2xl p-8 flex flex-col gap-6 border border-cyan-100 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 ease-out"
            >
                {/* Premium Animated Top Accent */}
                <div className="absolute top-0 left-0 h-2 w-full bg-gradient-to-r from-cyan-400 via-cyan-600 to-cyan-400 animate-pulse"></div>

                {/* CLOSE BUTTON: logic preserved */}
                <X
                    className="absolute top-6 right-6 h-6 w-6 text-gray-400 hover:text-cyan-600 hover:rotate-90 transition-all duration-300 cursor-pointer"
                    onClick={() => { setVisibility(false) }}
                />

                <div className="mt-4">
                    <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight text-center">
                        New <span className="text-cyan-600">Category</span>
                    </h2>
                    <p className="text-gray-500 text-sm text-center mt-2">Create a label for your transactions.</p>
                </div>

                {/* INPUT: dataflow preserved */}
                <div className="group transition-all">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 ml-1 group-focus-within:text-cyan-600">
                        Category Name
                    </label>
                    <input
                        type="text"
                        placeholder="e.g. Groceries, Rent, Travel"
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full p-4 rounded-2xl border border-gray-200 bg-cyan-50/30 focus:outline-none focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 transition-all duration-300 placeholder:text-gray-400"
                        autoFocus
                    />
                </div>

                {/* SUBMIT BUTTON: logic preserved */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full p-4 rounded-2xl bg-cyan-600 text-white font-bold tracking-wide hover:bg-cyan-700 shadow-lg shadow-cyan-500/30 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
                >
                    {loading ? (
                        <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Saving...
                        </span>
                    ) : (
                        "Save Category"
                    )}
                </button>
            </form>
        </div>
    );
}

export default ExpenseCatagCreation
