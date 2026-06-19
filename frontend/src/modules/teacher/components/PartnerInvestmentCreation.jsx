import React, { useEffect, useState } from 'react';
import { useGetAllTeacherData } from '../api/teacher.api';
import { usePartnerInvestmentCreate } from '../api/partnerInvestment.api';
import { toInputDateFormat } from '@shared/utilities/date.utility';

const PartnerInvestmentCreation = ({ setVisibility }) => {
    let { data: allTeacherData } = useGetAllTeacherData()
    let partnerInvestmentCreationMutation = usePartnerInvestmentCreate()
    const [formData, setFormData] = useState({
        partnerId: '',
        amount: '',
        date: toInputDateFormat(new Date()), // Default to today
        paymentMethod: 'UPI',
        notes: ''
    });

    let [partners, setPartners] = useState([])

    useEffect(() => {
        setPartners(allTeacherData?.filter(t => t?.isPartner))
    }, [allTeacherData])




    async function handleSubmit() {
        try {
            await partnerInvestmentCreationMutation.mutateAsync(formData)
            setVisibility(false)
        } catch (error) {
            console.error(error?.message)
        }
    }

    const paymentMethods = ['Easypaisa', 'JazzCash', 'Bank Transfer', 'Cheque', "Cash"];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* BACKDROP - Brightness 90 & Large Blur */}
            <div
                className="absolute inset-0 bg-white/40 backdrop-blur-lg brightness-90"
                onClick={() => { setVisibility(false) }}
            ></div>

            {/* MODAL CONTAINER */}
            <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-200/60 overflow-hidden ">

                {/* Header */}
                <div className="p-8 pb-0 flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 tracking-tight">New Investment</h2>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Capital Entry Log</p>
                    </div>
                    <button onClick={() => { setVisibility(false) }} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <i className="ri-close-line text-xl text-slate-400"></i>
                    </button>
                </div>

                <form className="p-8 space-y-5" onSubmit={(e) => { e.preventDefault(); handleSubmit(formData) }}>

                    {/* PARTNER SELECT */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Select Partner</label>
                        <select
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 outline-none transition-all appearance-none"
                            value={formData.partnerId}
                            onChange={(e) => setFormData({ ...formData, partnerId: e.target.value })}
                        >
                            <option value="">Choose a partner...</option>
                            {partners.map(p => (
                                <option key={p._id} value={p._id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* AMOUNT & DATE GRID */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Amount (₹)</label>
                            <input
                                type="number"
                                onWheel={(e) => e.target.blur()}
                                placeholder="0.00"
                                value={formData.amount}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-emerald-600 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Date</label>
                            <input
                                type="date"
                                value={formData.date}
                                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 outline-none"
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* PAYMENT METHOD - TOGGLE BUTTONS */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Payment Method</label>
                        <div className="grid grid-cols-2 gap-2">
                            {paymentMethods.map(method => (
                                <button
                                    key={method}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, paymentMethod: method })}
                                    className={`py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${formData.paymentMethod === method
                                        ? 'bg-cyan-600 border-cyan-600 text-white shadow-lg shadow-cyan-200'
                                        : 'bg-white border-slate-200 text-slate-400 hover:border-cyan-200'
                                        }`}
                                >
                                    {method}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* NOTES */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Transaction Notes</label>
                        <textarea
                            rows="2"
                            placeholder="Add internal memo..."
                            value={formData.notes}
                            className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium text-slate-600 outline-none resize-none focus:border-cyan-500 transition-all"
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        ></textarea>
                    </div>

                    {/* SUBMIT */}
                    <button
                        type="submit"
                        className="w-full py-4 bg-gradient-to-r from-cyan-600 to-cyan-700 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-cyan-900/20 hover:shadow-cyan-900/30 active:scale-[0.98] transition-all mt-4"
                    >
                        Confirm Investment
                    </button>
                </form>
            </div>
        </div>
    );
};

export default PartnerInvestmentCreation;