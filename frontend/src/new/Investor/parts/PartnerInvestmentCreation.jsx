import React, { useEffect, useState } from 'react';
import { useGetAllMembersQuery } from '../../member/api/member.rtk.api.js';
import { useCreatePartnerInvestmentMutation } from '../../member/api/member.rtk.api.js';
import { toInputDateFormat } from '../../../shared/utilities/date.utility';

const PartnerInvestmentCreation = ({ setVisibility, investorId }) => {
    let { data: allMemberData } = useGetAllMembersQuery()
    let [createPartnerInvestment] = useCreatePartnerInvestmentMutation()
    const [formData, setFormData] = useState({
        partnerId: investorId || "",
        amount: '',
        date: toInputDateFormat(new Date()), // Default to today
        paymentMethod: 'Easypaisa',
        notes: ''
    });

    let [partners, setPartners] = useState([])

    useEffect(() => {
        setPartners(allMemberData.filter(t => t._id == investorId))
    }, [allMemberData])




    async function handleSubmit() {
        try {
            await createPartnerInvestment(formData).unwrap()
            setVisibility(false)
        } catch (error) {
            console.log(error?.message)
        }
    }

    const paymentMethods = ['Easypaisa', 'JazzCash', 'Bank Transfer', 'Cheque', "Cash"];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* BACKDROP - Brightness 90 & Large Blur */}
            <div
                className="absolute inset-0 bg-surface/40 app-backdrop brightness-90"
                onClick={() => { setVisibility(false) }}
            ></div>

            {/* MODAL CONTAINER */}
            <div className="relative bg-surface w-full max-w-md rounded-[2.5rem] shadow-2xl border border-edge/60 overflow-hidden ">

                {/* Header */}
                <div className="p-8 pb-0 flex justify-between items-start">
                    <div>
                        <h2 className="text-2xl font-black text-ink tracking-tight">New Investment</h2>
                        <p className="text-xs text-ink-subtle font-bold uppercase tracking-widest mt-1">Capital Entry Log</p>
                    </div>
                    <button onClick={() => { setVisibility(false) }} className="p-2 hover:bg-surface-muted rounded-full transition-colors">
                        <i className="ri-close-line text-xl text-ink-subtle"></i>
                    </button>
                </div>

                <form className="p-8 space-y-5" onSubmit={(e) => { e.preventDefault(); handleSubmit(formData) }}>

                    {/* PARTNER SELECT */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-ink-subtle uppercase ml-1">Select Partner</label>
                        <select
                            className="w-full bg-surface-muted border border-edge rounded-2xl px-4 py-3 text-sm font-bold text-ink focus:ring-2 focus:ring-primary/20 focus:border-edge-brand outline-none transition-all appearance-none"
                            value={formData.partnerId}
                            onChange={(e) => setFormData({ ...formData, partnerId: e.target.value })}
                        >
                            {/* <option value="">Choose a partner...</option> */}
                            {partners.map(p => (
                                <option key={p._id} value={p._id}>{p.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* AMOUNT & DATE GRID */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-ink-subtle uppercase ml-1">Amount (PKR  )</label>
                            <input
                                type="number"
                                onWheel={(e) => e.target.blur()}
                                placeholder="0.00"
                                value={formData.amount}
                                className="w-full bg-surface-muted border border-edge rounded-2xl px-4 py-3 text-sm font-bold text-success focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-ink-subtle uppercase ml-1">Date</label>
                            <input
                                type="date"
                                value={formData.date}
                                className="w-full bg-surface-muted border border-edge rounded-2xl px-4 py-3 text-sm font-bold text-ink outline-none"
                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* PAYMENT METHOD - TOGGLE BUTTONS */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-ink-subtle uppercase ml-1">Payment Method</label>
                        <div className="grid grid-cols-2 gap-2">
                            {paymentMethods.map(method => (
                                <button
                                    key={method}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, paymentMethod: method })}
                                    className={`py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${formData.paymentMethod === method
                                        ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-sm'
                                        : 'bg-surface border-edge text-ink-subtle hover:border-edge-brand'
                                        }`}
                                >
                                    {method}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* NOTES */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-ink-subtle uppercase ml-1">Transaction Notes</label>
                        <textarea
                            rows="2"
                            placeholder="Add internal memo..."
                            value={formData.notes}
                            className="w-full bg-surface-muted border border-edge rounded-2xl px-4 py-3 text-sm font-medium text-ink-muted outline-none resize-none focus:border-edge-brand transition-all"
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        ></textarea>
                    </div>

                    {/* SUBMIT */}
                    <button
                        type="submit"
                        className="w-full py-4 app-gradient text-primary-foreground rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-sm/20 hover:shadow-sm/30 active:scale-[0.98] transition-all mt-4"
                    >
                        Confirm Investment
                    </button>
                </form>
            </div>
        </div>
    );
};

export default PartnerInvestmentCreation;