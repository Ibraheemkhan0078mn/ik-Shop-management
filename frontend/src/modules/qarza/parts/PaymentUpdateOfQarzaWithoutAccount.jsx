import React, { useEffect, useState } from "react";
import axios from "axios";
import api from "../../../services/axiosInstance.js";

const PaymentUpdateOfQarzaWithoutAccount = ({ currentToUpdateData, setVisible, setData }) => {
    const [formData, setFormData] = useState({
        amount: "",
        type: "cashin",
        name: "",
        address: "",
        date: "",
        notes: "",
        isReminded: false,
        remindDate: "",
        remindingNote: ""
    });

    let [reminderData, setReminderData] = useState(null)

    useEffect(() => {
        (
            async function () {
                let res = api.post(`/reminderRoutes/getSpecificReminder`, { type: "pwoacc", forDocumentId: currentToUpdateData?._id })
                if (res.data.success) {
                    // setReminderData(res.data.reminderData)
                    setFormData(prev => ({ ...prev, isReminded: true, remindDate: res.data.reminderData.remindDate, remindingNote: res.data.reminderData.remindingNote }))
                }
            }
        )()
    }, [])

    useEffect(() => {
        let [m, d, y] = new Date(currentToUpdateData?.date).toLocaleDateString().split("/")
        setFormData({ ...currentToUpdateData, date: y + "-" + m + "-" + d })
    }, [currentToUpdateData])

    // Handle input changes
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // Submit form
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            // Convert date to MongoDB start-of-day format
            const dateISO = new Date(new Date(formData.date).setHours(0, 0, 0, 0));

            const payload = { ...formData, date: dateISO };
            const res = await api.put(`/qarzaRoutes/updatePaymentWithoutAccount`, payload); // your backend URL

            if (res.data.success) {
                setData(res.data.allPayments); // refresh parent list
                setVisible(false);
            } else {
                console.error("Error creating payment");
            }
        } catch (err) {
            console.error("Submit Error:", err);
        }
    };

    return (
        <div
            // 🔹 Backdrop: Soft blur and entry animation
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-300"
            onClick={() => setVisible(false)}
        >
            {/* MODAL BOX: Premium slide and scale effect */}
            <div
                className="w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl border border-cyan-100 relative overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-500 ease-out"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Animated Accent Bar */}
                <div className="h-2.5 w-full bg-gradient-to-r from-cyan-400 via-cyan-600 to-cyan-400 animate-pulse"></div>

                <div className="p-8 sm:p-10 space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-3xl font-extrabold text-gray-800 tracking-tight">
                                Edit <span className="text-cyan-600">Payment</span>
                            </h2>
                            <p className="text-gray-500 text-sm mt-1">Modify the existing transaction details.</p>
                        </div>
                        <button
                            onClick={() => setVisible(false)}
                            className="text-zinc-400 hover:text-cyan-600 hover:rotate-90 transition-all duration-300 text-3xl focus:outline-none"
                        >
                            &times;
                        </button>
                    </div>

                    {/* Form */}
                    <form className="space-y-5" onSubmit={handleSubmit}>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* Amount */}
                            <div className="group transition-all">
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 ml-1 group-focus-within:text-cyan-600">
                                    Amount
                                </label>
                                <input
                                    type="number"
                                    onWheel={(e) => e.target.blur()}
                                    name="amount"
                                    value={formData.amount}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-cyan-50/30 border border-zinc-200 rounded-2xl focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 outline-none transition-all duration-300"
                                    required
                                />
                            </div>

                            {/* Type */}
                            <div className="group transition-all">
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 ml-1 group-focus-within:text-cyan-600">
                                    Type
                                </label>
                                <select
                                    name="type"
                                    value={formData.type}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-cyan-50/30 border border-zinc-200 rounded-2xl focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 outline-none transition-all cursor-pointer"
                                >
                                    <option value="cashin">Cash In</option>
                                    <option value="cashout">Cash Out</option>
                                </select>
                            </div>
                        </div>

                        {/* Name */}
                        <div className="group transition-all">
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 ml-1 group-focus-within:text-cyan-600">
                                Name
                            </label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-cyan-50/30 border border-zinc-200 rounded-2xl focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 outline-none transition-all"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* Address */}
                            <div className="group transition-all">
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 ml-1 group-focus-within:text-cyan-600">
                                    Address
                                </label>
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-cyan-50/30 border border-zinc-200 rounded-2xl focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 outline-none transition-all"
                                />
                            </div>

                            {/* Date */}
                            <div className="group transition-all">
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 ml-1 group-focus-within:text-cyan-600">
                                    Date
                                </label>
                                <input
                                    type="date"
                                    name="date"
                                    value={formData.date}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-cyan-50/30 border border-zinc-200 rounded-2xl focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 outline-none transition-all"
                                    required
                                />
                            </div>
                        </div>

                        {/* Notes */}
                        <div className="group transition-all">
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5 ml-1 group-focus-within:text-cyan-600">
                                Notes
                            </label>
                            <textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-cyan-50/30 border border-zinc-200 rounded-2xl h-24 resize-none focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 outline-none transition-all"
                            />
                        </div>

                        {/* Reminder Toggle */}
                        <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-dashed border-zinc-200 transition-all hover:border-cyan-300">
                            <input
                                type="checkbox"
                                id="edit-remind"
                                name="isReminded"
                                checked={formData.isReminded}
                                onChange={(e) => { setFormData(prev => ({ ...prev, remindDate: "", remindingNote: "", isReminded: !prev.isReminded })) }}
                                className="w-5 h-5 accent-cyan-600 cursor-pointer"
                            />
                            <label htmlFor="edit-remind" className="text-sm font-bold text-gray-700 cursor-pointer select-none">
                                Is Remind?
                            </label>
                        </div>

                        {formData.isReminded && (
                            <div className="p-5 bg-cyan-50/50 rounded-[2rem] border border-cyan-100 space-y-4 animate-in zoom-in-95 duration-300">
                                <div className="group">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-cyan-700 mb-1.5 ml-1">
                                        Reminding Date
                                    </label>
                                    <input
                                        type="date"
                                        name="remindDate"
                                        value={formData.remindDate}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-white border border-cyan-200 rounded-xl focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 outline-none transition-all"
                                    />
                                </div>

                                <div className="group">
                                    <label className="block text-xs font-bold uppercase tracking-wider text-cyan-700 mb-1.5 ml-1">
                                        Reminding Note
                                    </label>
                                    <textarea
                                        name="remindingNote"
                                        value={formData.remindingNote}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-white border border-cyan-200 rounded-xl h-24 resize-none focus:ring-4 focus:ring-cyan-500/10 focus:border-cyan-500 outline-none transition-all"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            className="w-full bg-cyan-600 text-white py-4 rounded-2xl font-bold tracking-widest uppercase text-sm
                               hover:bg-cyan-700 shadow-xl shadow-cyan-500/30 hover:shadow-cyan-500/50 
                               active:scale-95 transition-all duration-200 mt-4"
                        >
                            Update Payment
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default PaymentUpdateOfQarzaWithoutAccount;
