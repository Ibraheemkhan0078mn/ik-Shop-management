import React, { useEffect, useState } from "react";
import { useCreateSalaryPaymentMutation } from "../../member/api/member.rtk.api.js";
import { toInputDateFormat } from '@shared/utilities/date.utility.js'
import api from "@shared/services/api.js";

const InvestorPaymentCreate = ({ setVisible, memberId, getInvesterPayments }) => {
    let [createSalaryPayment] = useCreateSalaryPaymentMutation()
    const [formData, setFormData] = useState({
        salaryAmount: "",
        paymentType: "investerPayment",
        paymentMethod: "cash",
        date: toInputDateFormat(new Date()),
        notes: "",
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post(`/memberRoute/createMemberSalaryPayment`, { ...formData, memberId: memberId })
            if (res.data.success) {
                getInvesterPayments()
                setVisible(false);
            }
        } catch (err) {
            console.error("Submit Error:", err);
        }
    };

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 md:p-6">
            <div
                className="absolute inset-0 app-overlay app-enter"
                onClick={() => setVisible(false)}
            />

            <div className="relative w-full max-w-xl bg-surface rounded-[2.5rem] shadow-[0_32px_64px_-15px_rgba(0,0,0,0.3)] border border-surface flex flex-col overflow-hidden app-enter">

                {/* Header */}
                <div className="relative p-8 border-b border-edge bg-gradient-to-br from-white via-white to-primary-muted/30">
                    <button
                        onClick={() => setVisible(false)}
                        className="absolute top-8 right-8 h-10 w-10 rounded-full flex justify-center items-center bg-surface-muted text-ink-subtle hover:bg-danger-muted hover:text-danger hover:rotate-90 transition-all duration-300"
                    >
                        <i className="ri-close-line text-xl"></i>
                    </button>

                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary-muted rounded-xl shadow-lg shadow-sm text-primary-foreground">
                                <i className="ri-hand-coin-line text-xl"></i>
                            </div>
                            <h1 className="text-3xl font-black text-ink tracking-tighter">
                                Add <span className="text-ink">Invester Payment</span>
                            </h1>
                        </div>
                        <p className="text-sm font-semibold text-ink-subtle mt-2 ml-1 flex items-center gap-2">
                            <i className="ri-information-line text-accent"></i>
                            Recording new financial disbursement
                        </p>
                    </div>
                </div>

                {/* Form Body */}
                <form className="p-8 space-y-6 bg-surface-muted/30" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Amount */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-1">Salary Amount</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-subtle font-bold">$</span>
                                <input
                                    type="number" 
    onWheel={(e) => e.target.blur()}
                                    min={1}
                                    name="salaryAmount"
                                    value={formData.salaryAmount}
                                    onChange={handleChange}
                                    className="w-full bg-surface pl-8 pr-4 py-4 rounded-2xl border border-edge focus:border-edge-brand focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-ink"
                                    placeholder="0.00"
                                    required
                                />
                            </div>
                        </div>

                        {/* Date */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-1">Payment Date</label>
                            <input
                                type="date"
                                name="date"
                                value={formData.date}
                                onChange={handleChange}
                                className="w-full bg-surface px-4 py-4 rounded-2xl border border-edge focus:border-edge-brand focus:ring-4 focus:ring-primary/10 outline-none transition-all font-bold text-ink cursor-pointer"
                                required
                            />
                        </div>
                    </div>

                    {/* Payment Method */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-1">Payment Method</label>
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
                                    <div className="py-3 text-center rounded-xl border border-edge bg-surface text-[13px] font-black uppercase text-ink-subtle peer-checked:bg-primary peer-checked:text-primary-foreground peer-checked:border-primary transition-all duration-300 group-hover:border-edge-brand">
                                        {method === 'bankAccount' ? 'Bank' : method}
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-1">Transaction Notes</label>
                        <textarea
                            name="notes"
                            value={formData.notes}
                            onChange={handleChange}
                            className="w-full bg-surface px-4 py-4 rounded-2xl border border-edge focus:border-edge-brand focus:ring-4 focus:ring-primary/10 outline-none transition-all font-medium text-ink-muted h-28 resize-none"
                            placeholder="Add specific details about this payment..."
                        />
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        className="w-full py-5 bg-inverse text-primary-foreground rounded-[1.5rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-slate-200 hover:bg-primary hover:shadow-sm transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-3"
                    >
                        <i className="ri-check-double-line text-lg"></i>
                        Confirm & Create Payment
                    </button>
                </form>
            </div>
        </div>
    );
};

export default InvestorPaymentCreate;