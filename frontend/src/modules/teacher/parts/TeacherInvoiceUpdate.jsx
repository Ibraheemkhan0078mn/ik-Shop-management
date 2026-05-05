import React, { useEffect, useState } from 'react'
import { useHotkeys } from 'react-hotkeys-hook'
import { toast } from 'react-toastify'
import api from '../../../services/axiosInstance.js'

const TeacherInvoiceUpdate = ({ setVisibility, invoiceData, setData }) => {

    const [formData, setFormData] = useState({
        invoiceId: '',
        invoiceAmount: '',
        // revenueType: '',
        // invoiceGeneratedFor: '',
        // teacherUniqueId: '',
    })

    useHotkeys('esc', (e) => { e.preventDefault(); e.stopPropagation(); setVisibility(false) }, { enableOnFormTags: true })
    useHotkeys('enter', (e) => { e.preventDefault(); e.stopPropagation(); handleSubmit() }, { enableOnFormTags: true })

    useEffect(() => {
        if (invoiceData) {
            setFormData({
                invoiceId: invoiceData._id || '',
                invoiceAmount: invoiceData.invoiceAmount || '',
                // revenueType: invoiceData.revenueType || '',
                // invoiceGeneratedFor: invoiceData.invoiceGeneratedFor ? new Date(invoiceData.invoiceGeneratedFor).toISOString().split('T')[0] : '',
                // teacherUniqueId: invoiceData.teacherUniqueId || '',
            })
        }
    }, [invoiceData])

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async () => {
        try {
            if (!formData.invoiceId) return toast.error("Invoice ID missing.")
            if (!formData.invoiceAmount) return toast.error("Invoice amount is required.")

            const res = await api.post('/teacherRoute/updateTeacherInvoice', {
                ...formData,
                invoiceAmount: Number(formData.invoiceAmount)
            })

            if (res.data.success) {
                toast.success("Invoice updated successfully.")
                setData && setData(prev => prev.map(inv =>
                    inv._id === res.data.invoice._id ? res.data.invoice : inv
                ))
                setVisibility(false)
            } else {
                toast.error(res.data.msg || "Update failed.")
            }
        } catch (error) {
            console.error(error?.message)
            toast.error("Something went wrong.")
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setVisibility(false)} />

            <div className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Top accent */}
                <div className="h-1 w-full bg-gradient-to-r from-cyan-400 via-cyan-500 to-cyan-600" />

                {/* Left colored panel */}
                <div className="flex">
                    <div className="w-2 bg-gradient-to-b from-cyan-600 to-cyan-500" />

                    <div className="flex-1 p-8">

                        {/* Header */}
                        <div className="flex items-start justify-between mb-8">
                            <div>
                                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Update Invoice</h2>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">
                                    ID: {invoiceData?.teacherUniqueId || '—'}
                                </p>
                            </div>
                            <button
                                onClick={() => setVisibility(false)}
                                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-500 text-slate-400 flex items-center justify-center transition-all"
                            >
                                <i className="ri-close-line text-lg" />
                            </button>
                        </div>

                        {/* Current Info Badge */}
                        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-6">
                            <div className="h-10 w-10 rounded-xl bg-cyan-100 flex items-center justify-center shrink-0">
                                <i className="ri-file-text-line text-cyan-600 text-lg" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Amount</p>
                                <p className="text-lg font-black text-slate-700">
                                    {Number(invoiceData?.invoiceAmount || 0).toLocaleString()}
                                    <span className="text-xs font-bold text-slate-400 ml-1">PKR</span>
                                </p>
                            </div>
                            <div className="ml-auto">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tight
                                    ${invoiceData?.paidStatus === 'paid' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                        : invoiceData?.paidStatus === 'partial' ? 'bg-amber-50 text-amber-600 border border-amber-100'
                                            : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                                    {invoiceData?.paidStatus || 'unpaid'}
                                </span>
                            </div>
                        </div>

                        {/* Form Fields */}
                        <div className="space-y-5">

                            {/* Invoice Amount */}
                            <div className="relative w-full group">
                                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1 group-focus-within:text-cyan-600 transition-colors">
                                    New Invoice Amount
                                </label>
                                <div className="relative">
                                    <i className="ri-money-dollar-circle-line absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-cyan-500 text-lg transition-colors" />
                                    <input
                                        autoFocus
                                        type="number"
                                        onWheel={(e) => e.target.blur()}
                                        name="invoiceAmount"
                                        value={formData.invoiceAmount}
                                        onChange={handleChange}
                                        placeholder="Enter new amount"
                                        className="w-full bg-white border-2 border-slate-100 rounded-xl pl-11 pr-5 py-3 outline-none focus:border-cyan-500 transition-all font-bold text-slate-700 text-sm"
                                    />
                                </div>
                            </div>

                            {/* revenueType — commented for now */}
                            {/* <div className="relative w-full group">
                                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Revenue Type</label>
                                <div className="relative">
                                    <i className="ri-price-tag-3-line absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-lg" />
                                    <input
                                        type="text"
                                        name="revenueType"
                                        value={formData.revenueType}
                                        onChange={handleChange}
                                        className="w-full bg-white border-2 border-slate-100 rounded-xl pl-11 pr-5 py-3 outline-none focus:border-cyan-500 transition-all font-bold text-slate-700 text-sm"
                                    />
                                </div>
                            </div> */}

                            {/* invoiceGeneratedFor — commented for now */}
                            {/* <div className="relative w-full group">
                                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Invoice Date</label>
                                <div className="relative">
                                    <i className="ri-calendar-line absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 text-lg" />
                                    <input
                                        type="date"
                                        name="invoiceGeneratedFor"
                                        value={formData.invoiceGeneratedFor}
                                        onChange={handleChange}
                                        className="w-full bg-white border-2 border-slate-100 rounded-xl pl-11 pr-5 py-3 outline-none focus:border-cyan-500 transition-all font-bold text-slate-700 text-sm"
                                    />
                                </div>
                            </div> */}

                        </div>

                        {/* Submit Button */}
                        <button
                            onClick={handleSubmit}
                            className="mt-8 w-full py-4 bg-cyan-600 hover:bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3"
                        >
                            <i className="ri-save-3-fill text-lg" />
                            Update Invoice
                        </button>

                    </div>
                </div>
            </div>
        </div>
    )
}

export default TeacherInvoiceUpdate