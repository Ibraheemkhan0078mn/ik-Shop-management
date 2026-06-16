import React, { useEffect, useState } from 'react';
import { useGetAllClassesQuery } from '../../class/services/class.rtk.service.js';
import { useCreateClassPartnershipMutation } from '../../member/api/member.rtk.api.js';
import { toInputDateFormat } from '../../../shared/utilities/date.utility';

const ClassPartnershipCreation = ({ setVisibility, partnerId }) => {
    let [createClassPartnership] = useCreateClassPartnershipMutation()
    let { data: classes } = useGetAllClassesQuery()
    const [formData, setFormData] = useState({
        partnerId: "",
        classId: '',
        type: 'percentage', // Default
        value: '',
        timing: 'startOfClass',
        startDate: toInputDateFormat(new Date()),
        hasEndDate: false,
        endDate: ''
    });


    useEffect(() => { setFormData({ ...formData, partnerId: partnerId }) }, [partnerId])






    async function handleSubmit() {
        try {

            await createClassPartnership(formData).unwrap()
            setVisibility(false)
        } catch (error) {
            console.log(error?.message)
        }
    }




    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* BACKDROP - Modern Blur & Dim */}
            <div
                className="absolute inset-0 app-overlay app-enter"
                onClick={() => { setVisibility(false) }}
            ></div>

            {/* MODAL CONTAINER */}
            <div className="relative bg-surface w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-edge/60 overflow-hidden app-enter">

                {/* HEADER */}
                <div className="p-8 pb-4 flex justify-between items-start bg-surface-muted">
                    <div>
                        <h2 className="text-2xl font-black text-ink tracking-tight">Setup Partnership</h2>
                        <p className="text-[10px] text-ink-subtle font-bold uppercase tracking-[0.2em] mt-1">Class Configuration</p>
                    </div>
                    <button onClick={() => { setVisibility(false) }} className="p-2 hover:bg-surface hover:shadow-sm rounded-xl transition-all group">
                        <i className="ri-close-line text-xl text-ink-subtle group-hover:text-danger"></i>
                    </button>
                </div>

                <form className="p-8 pt-6 space-y-6" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>

                    {/* 1. CLASS SELECTION */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-ink-subtle uppercase tracking-widest ml-1">Select Class</label>
                        <div className="relative">
                            <select
                                className="w-full bg-surface-muted border border-edge rounded-2xl px-4 py-3.5 text-sm font-bold text-ink focus:ring-4 focus:ring-primary/10 focus:border-edge-brand outline-none transition-all appearance-none"
                                value={formData.classId}
                                onChange={(e) => {
                                    if (formData.timing == "startOfClass") {
                                        let classData = classes?.find(c => c._id == e.target.value)
                                        // console.log(classData)
                                        if (classData) {
                                            setFormData({ ...formData, classId: e.target.value, startDate: toInputDateFormat(classData?.startSession), timing: e.target.value })
                                        }
                                    } else {
                                        setFormData({ ...formData, classId: e.target.value, timing: e.target.value })
                                    }
                                }}
                                required
                            >
                                <option value="">Select a batch...</option>
                                {classes?.map(c => (
                                    <option key={c._id} value={c._id}>{c.className} ({c.classId})</option>
                                ))}
                            </select>
                            <i className="ri-arrow-down-s-line absolute right-4 top-1/2 -translate-y-1/2 text-ink-subtle pointer-events-none"></i>
                        </div>
                    </div>

                    {/* 2. SPLIT STRATEGY (TOGGLE + INPUT) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-ink-subtle uppercase tracking-widest ml-1">Strategy</label>
                            <div className="flex p-1 bg-surface-muted rounded-2xl">
                                {['percentage', 'fixed'].map((t) => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type: t })}
                                        className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${formData.type === t ? 'bg-surface text-primary shadow-sm' : 'text-ink-subtle'
                                            }`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-ink-subtle uppercase tracking-widest ml-1">
                                {formData.type === 'Percentage' ? 'Share %' : 'Fixed Amount (PKR  )'}
                            </label>
                            <input
                                type="text"
                                placeholder={formData.type === 'Percentage' ? 'e.g. 20' : 'e.g. 5000'}
                                className="w-full bg-surface-muted border border-edge rounded-2xl px-4 py-2.5 text-sm font-bold text-ink outline-none focus:border-edge-brand transition-all"
                                value={formData.value}
                                onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    {/* 3. TIMING & START DATE */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-ink-subtle uppercase tracking-widest ml-1">Partnership Timing</label>
                            <select
                                className="w-full bg-surface-muted border border-edge rounded-2xl px-4 py-2.5 text-sm font-bold text-ink outline-none"
                                value={formData.timing}
                                onChange={(e) => {

                                    if (e.target.value == "startOfClass") {
                                        let classData = classes?.find(c => c._id == formData.classId)
                                        // console.log(classData)
                                        if (classData) {
                                            setFormData({ ...formData, startDate: toInputDateFormat(classData?.startSession), timing: e.target.value })
                                        }
                                    } else {
                                        setFormData({ ...formData, timing: e.target.value })
                                    }
                                }}
                            >
                                <option value="startOfClass">Start of Class</option>
                                <option value="custom">Custom Date</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-ink-subtle uppercase tracking-widest ml-1">Effective From</label>
                            <input
                                type="date"
                                className="w-full bg-surface-muted border border-edge rounded-2xl px-4 py-2.5 text-sm font-bold text-ink outline-none"
                                value={formData.startDate}
                                onChange={(e) => { formData.timing != "startOfClass" && setFormData({ ...formData, startDate: e.target.value }); }}
                            />
                        </div>
                    </div>

                    {/* 4. END DATE CHECKBOX & INPUT */}
                    <div className="p-4 bg-surface-muted rounded-3xl space-y-4">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                className="w-4 h-4 rounded border-edge text-primary focus:ring-primary"
                                checked={formData.hasEndDate}
                                onChange={(e) => setFormData({ ...formData, hasEndDate: e.target.checked })}
                            />
                            <span className="text-[11px] font-black text-ink-muted uppercase tracking-wider">Set Partnership End Date?</span>
                        </label>

                        {formData.hasEndDate && (
                            <div className="app-enter">
                                <input
                                    type="date"
                                    className="w-full bg-surface border border-edge rounded-2xl px-4 py-2.5 text-sm font-bold text-ink outline-none focus:border-red-300"
                                    value={formData.endDate}
                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                />
                                <p className="text-[9px] text-red-400 font-bold mt-2 ml-1 uppercase">Partnership will auto-expire on this date</p>
                            </div>
                        )}
                    </div>

                    {/* SUBMIT BUTTON */}
                    <button
                        type="submit"
                        className="w-full py-4 bg-inverse hover:bg-primary text-primary-foreground rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl shadow-slate-200 transition-all active:scale-[0.98]"
                    >
                        Create Partnership
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ClassPartnershipCreation;