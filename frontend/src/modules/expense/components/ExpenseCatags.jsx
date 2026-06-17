import { Trash2Icon, X } from 'lucide-react';
import React, { useEffect, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { setAllExpenseCatags } from '../expense.slice';
import axios from 'axios';
import api from "@shared/services/axiosInstance.js";

const ExpenseCatags = ({ setVisibility, setExpenseCatagCreationVisibility }) => {

    let dispatch = useDispatch()
    let expenseCatags = useSelector(state => state.expense.allExpenseCatags)
    let categories = []
    let contRef = useRef()











    useEffect(() => {
        try {

            (
                async () => {
                    let res = await api.get(`/expenseRoutes/expenseCatagGetAll`)
                    if (res.data.success) {
                        dispatch(setAllExpenseCatags(res.data.expenseCatags))
                    }
                }
            )()

        } catch (error) {
            console.error(error?.message)
        }
    }, [])



    async function handleDeleteIconClick(expenseCatagId) {
        try {

            let res = await api.delete(`/expenseRoutes/expenseCatagDelete/${expenseCatagId}`)
            if (res.data.success) {
                dispatch(setAllExpenseCatags(res.data.expenseCatags))
            }
        } catch (error) {
            console.error(error)
        }
    }







    return (
        <div
            // 🔹 Backdrop: Entry fade animation
            className="h-screen w-screen fixed inset-0 z-40 flex items-center justify-center backdrop-blur-md bg-slate-900/60 p-6 animate-in fade-in duration-300"
            onClick={() => setVisibility(false)}
        >
            <div
                ref={contRef}
                // 🔹 Logic preserved: Stop propagation and handle wheel scroll
                onClick={(e) => e.stopPropagation()}
                onWheel={(e) => { contRef.current.scrollTop += e.deltaY }}
                className="max-h-[80vh] w-full max-w-2xl bg-white rounded-[2rem] shadow-2xl p-8 flex flex-col gap-6 relative overflow-y-auto overflow-x-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 ease-out border border-cyan-100"
            >
                {/* Premium Top Decorative Bar */}
                <div className="absolute top-0 left-0 h-2 w-full bg-gradient-to-r from-cyan-400 via-cyan-600 to-cyan-400"></div>

                {/* CLOSE BUTTON: Logic preserved */}
                <X
                    className='absolute top-6 right-6 h-6 w-6 text-gray-400 hover:text-red-500 hover:rotate-90 transition-all duration-300 cursor-pointer'
                    onClick={() => { setVisibility(false) }}
                />

                <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4 border-b border-gray-100 pb-6">
                    <div>
                        <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">
                            Expense <span className="text-cyan-600">Categories</span>
                        </h2>
                        <p className="text-gray-500 text-sm mt-1">Manage your custom spending groups</p>
                    </div>

                    <button
                        onClick={() => { setExpenseCatagCreationVisibility(true) }}
                        className="w-full sm:w-auto flex gap-2 bg-cyan-600 hover:bg-cyan-700 text-white p-3 px-6 rounded-xl font-bold justify-center items-center cursor-pointer shadow-lg shadow-cyan-500/30 active:scale-95 transition-all"
                    >
                        <span className="text-xl">+</span> Add Category
                    </button>
                </div>

                {/* GRID: Logic and Dataflow preserved */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-2">
                    {expenseCatags?.map((c, i) => (
                        <div
                            key={i}
                            className="p-5 flex justify-between items-center bg-cyan-50/30 hover:bg-cyan-50 rounded-2xl border border-cyan-100 shadow-sm transition-all group animate-in fade-in slide-in-from-left-4 duration-300"
                            style={{ animationDelay: `${i * 50}ms` }} // Staggered entry
                        >
                            <h1 className="text-gray-800 font-semibold tracking-wide capitalize">{c?.name}</h1>

                            <div
                                onClick={() => { handleDeleteIconClick(c?._id) }}
                                className="p-2 bg-white rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 cursor-pointer transition-colors shadow-sm group-hover:scale-110 active:scale-90"
                            >
                                <Trash2Icon className='h-5 w-5' />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Empty State visual if no categories exist */}
                {expenseCatags?.length === 0 && (
                    <div className="text-center py-10">
                        <p className="text-gray-400 italic font-medium">No categories found. Click Add to start.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ExpenseCatags
