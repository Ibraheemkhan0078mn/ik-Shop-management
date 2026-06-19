import React, { useEffect, useState } from 'react';
import { toInputDateFormat } from '@shared/utilities/date.utility';
import {
    useCreateClassPartnershipMutation,
    useUpdateClassPartnershipMutation,
} from '../api/member.rtk.api';

// filterActiveClasses: no class module in this project — pass-through
const filterActiveClasses = (classes) => classes ?? [];

const DEFAULT_FORM = {
    _id: '',
    partnerId: '',
    classId: '',
    type: 'percentage',
    value: '',
    timing: 'startOfClass',
    startDate: toInputDateFormat(new Date()),
    hasEndDate: false,
    endDate: '',
};

/**
 * ClassPartnershipModal
 * @param {'create' | 'update'} operation
 * @param {Function} setVisibility
 * @param {string}   [partnerId]  — required when operation === 'create'
 * @param {object}   [data]       — required when operation === 'update'
 */
const ClassPartnershipCrudModal = ({ operation, setVisibility, partnerId, data }) => {
    const isUpdate = operation === 'update';

    // ── RTK Mutations ────────────────────────────────────────────────────────
    const [createClassPartnership] = useCreateClassPartnershipMutation();
    const [updateClassPartnership] = useUpdateClassPartnershipMutation();

    const { data: classes } = useGetAllClassesQuery();
    const [formData, setFormData] = useState(DEFAULT_FORM);

    // ── Hydration ────────────────────────────────────────────────────────────
    useEffect(() => {
        if (isUpdate && data) {
            setFormData({
                ...data,
                endDate: toInputDateFormat(data?.partnershipEndDate),
                hasEndDate: data?.partnershipEndDate ? true : false,
                startDate: toInputDateFormat(data?.partnershipStartDate),
                type: data?.partnershipType,
                value: data?.partnershipValue,
                timing: data?.timingToStart,
            });
        } else if (!isUpdate && partnerId) {
            setFormData(prev => ({ ...prev, partnerId }));
        }
    }, [isUpdate, data, partnerId]);

    // ── Handlers ─────────────────────────────────────────────────────────────
    const handleClassChange = (e) => {
        const classData = classes?.find(c => c._id === e.target.value);
        if (formData.timing === 'startOfClass' && classData) {
            setFormData({ ...formData, classId: e.target.value, startDate: toInputDateFormat(classData?.startSession) });
        } else {
            setFormData({ ...formData, classId: e.target.value });
        }
    };

    const handleTimingChange = (e) => {
        if (e.target.value === 'startOfClass') {
            const classData = classes?.find(c => c._id === formData.classId);
            setFormData({
                ...formData,
                timing: e.target.value,
                startDate: classData ? toInputDateFormat(classData?.startSession) : toInputDateFormat(new Date()),
            });
        } else {
            setFormData({ ...formData, timing: e.target.value });
        }
    };

    async function handleSubmit() {
        try {
            if (isUpdate) {
                await updateClassPartnership({ id: formData._id, payload: formData }).unwrap();
            } else {
                await createClassPartnership(formData).unwrap();
            }
            setVisibility(false);
        } catch (error) {
            console.log(error?.message);
        }
    }

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
                className="absolute inset-0 app-overlay app-enter"
                onClick={() => setVisibility(false)}
            ></div>

            <div
                onClick={(e) => e.stopPropagation()}
                className="relative bg-surface w-full max-w-lg rounded-[2.5rem] shadow-2xl border border-edge/60 overflow-hidden app-enter"
            >
                {/* HEADER */}
                <div className="p-8 pb-4 flex justify-between items-start bg-surface-muted">
                    <div>
                        <h2 className="text-2xl font-black text-ink tracking-tight">
                            {isUpdate ? 'Update Partnership' : 'Setup Partnership'}
                        </h2>
                        <p className="text-[10px] text-ink-subtle font-bold uppercase tracking-[0.2em] mt-1">Class Configuration</p>
                    </div>
                    <button onClick={() => setVisibility(false)} className="p-2 hover:bg-surface hover:shadow-sm rounded-xl transition-all group">
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
                                onChange={handleClassChange}
                                required
                            >
                                <option value="">Select a batch...</option>
                                {filterActiveClasses(classes)?.map(c => (
                                    <option key={c._id} value={c._id}>{c.className}</option>
                                ))}
                            </select>
                            <i className="ri-arrow-down-s-line absolute right-4 top-1/2 -translate-y-1/2 text-ink-subtle pointer-events-none"></i>
                        </div>
                    </div>

                    {/* 2. SPLIT STRATEGY */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-ink-subtle uppercase tracking-widest ml-1">Strategy</label>
                            <div className="flex p-1 bg-surface-muted rounded-2xl">
                                {['percentage', 'fixed'].map((t) => (
                                    <button
                                        key={t}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, type: t, value: '' })}
                                        className={`flex-1 py-2 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all ${formData.type === t ? 'bg-surface text-primary shadow-sm' : 'text-ink-subtle'}`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-ink-subtle uppercase tracking-widest ml-1">
                                {formData.type === 'percentage' ? 'Share %' : 'Fixed Amount (PKR)'}
                            </label>
                            <div className="relative">
                                <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-sm font-black pointer-events-none ${formData.type === 'percentage' ? 'text-ink' : 'text-success'}`}>
                                    {formData.type === 'percentage' ? '%' : '₨'}
                                </span>
                                <input
                                    type="number"
                                    onWheel={(e) => e.target.blur()}
                                    placeholder={formData.type === 'percentage' ? 'e.g. 20' : 'e.g. 5000'}
                                    className={`w-full border rounded-2xl pl-9 pr-4 py-2.5 text-sm font-bold text-ink outline-none transition-all
                                        ${formData.type === 'percentage'
                                            ? 'bg-primary-muted border-edge-brand focus:border-edge-brand'
                                            : 'bg-success-muted border-success-muted focus:border-emerald-500'
                                        }`}
                                    value={formData.value}
                                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {/* 3. TIMING & START DATE */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-ink-subtle uppercase tracking-widest ml-1">Partnership Timing</label>
                            <select
                                className="w-full bg-surface-muted border border-edge rounded-2xl px-4 py-2.5 text-sm font-bold text-ink outline-none"
                                value={formData.timing}
                                onChange={handleTimingChange}
                            >
                                <option value="startOfClass">Start of Class</option>
                                <option value="custom">Custom Date</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-ink-subtle uppercase tracking-widest ml-1">
                                Effective From {formData.timing === 'startOfClass' && <span className="text-accent">(Auto)</span>}
                            </label>
                            <input
                                type="date"
                                readOnly={formData.timing === 'startOfClass'}
                                className={`w-full border rounded-2xl px-4 py-2.5 text-sm font-bold text-ink outline-none transition-all
                                    ${formData.timing === 'startOfClass'
                                        ? 'bg-surface-muted border-edge text-ink-subtle cursor-not-allowed'
                                        : 'bg-surface-muted border-edge focus:border-edge-brand'
                                    }`}
                                value={formData.startDate}
                                onChange={(e) => {
                                    if (formData.timing !== 'startOfClass') {
                                        setFormData({ ...formData, startDate: e.target.value });
                                    }
                                }}
                            />
                        </div>
                    </div>

                    {/* 4. END DATE */}
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

                    <button
                        type="submit"
                        className="w-full py-4 bg-inverse hover:bg-primary text-primary-foreground rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl shadow-slate-200 transition-all active:scale-[0.98]"
                    >
                        {isUpdate ? 'Update Partnership' : 'Create Partnership'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ClassPartnershipCrudModal;