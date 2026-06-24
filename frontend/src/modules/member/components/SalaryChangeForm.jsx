import React, { useState, useEffect } from 'react';
import { toInputDateFormat } from '../../../shared/utilities/date.utility.js';
import { useCreateSalaryChangeMutation, useUpdateSalaryChangeMutation } from '../member.rtk.api.js';

const SalaryChangeForm = ({ type, toUpdateData, memberId, setVisibility }) => {



    let [createSalaryChange] = useCreateSalaryChangeMutation()
    let [updateSalaryChange] = useUpdateSalaryChangeMutation()
    const [formData, setFormData] = useState({
        amount: '',
        date: toInputDateFormat(new Date()),
        reason: '',
        perAbsenceCut: 0
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (type === 'update' && toUpdateData) {
            setFormData({
                amount: toUpdateData.amount,
                date: toInputDateFormat(toUpdateData.date),
                reason: toUpdateData.reason,
                changeType: toUpdateData.changeType,
                perAbsenceCut: toUpdateData.perAbsenceCut

            });
        }
    }, [toUpdateData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setError('');
    };

    const handleCreate = async (e) => {
        e.preventDefault();

        if (!formData.amount || !formData.date || !formData.reason) {
            setError('All fields are required');
            return;
        }

        setLoading(true);
        setError('');

        try {



            await createSalaryChange({
                amount: parseFloat(formData.amount),
                date: formData.date,
                reason: formData.reason,
                memberId: memberId,
                changeType: formData.changeType,
                perAbsenceCut: formData.perAbsenceCut
            })

            setSuccess(true);
            setVisibility(false);
            // fetchSalaryHistory()
        } catch (err) {
            setError(err.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();

        if (!formData.amount || !formData.date || !formData.reason) {
            setError('All fields are required');
            return;
        }

        setLoading(true);
        setError('');

        try {
 

            await updateSalaryChange({
                id: toUpdateData?._id,
                amount: parseFloat(formData.amount),
                date: formData.date,
                reason: formData.reason,
                changeType: formData.changeType,
                perAbsenceCut: formData.perAbsenceCut
            })

            setSuccess(true);
            setVisibility(false);
            // fetchSalaryHistory()
        } catch (err) {
            setError(err.message || 'Something went wrong');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            onClick={() => setVisibility(false)}
            className="fixed inset-0 app-overlay flex justify-center items-center z-50 p-4 app-enter"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="h-max w-full max-w-md bg-surface rounded-2xl shadow-2xl border border-edge-brand relative overflow-hidden app-enter slide-in-from-bottom-10 duration-500 ease-out"
            >
                {/* Top Accent */}
                <div className="h-1.5 w-full app-gradient" />

                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-2">
                    <div>
                        <h2 className="text-2xl font-extrabold text-ink tracking-tight">
                            {type === 'create' ? (
                                <>Add <span className="app-gradient-text">Payment</span></>
                            ) : (
                                <>Update <span className="app-gradient-text">Payment</span></>
                            )}
                        </h2>
                        <p className="text-ink-muted text-sm mt-0.5 font-medium">
                            {type === 'create' ? 'Record a new payment entry.' : `Editing ID: ${toUpdateData?._id}`}
                        </p>
                    </div>
                    <button
                 
                        onClick={() => setVisibility(false)}
                        className="text-ink-subtle hover:text-danger hover:rotate-90 transition-all duration-300 text-3xl focus:outline-none"
                    >
                        &times;
                    </button>
                </div>

                {/* Form */}
                <form
                    onSubmit={type === 'create' ? handleCreate : handleUpdate}
                    className="flex flex-col gap-4 p-6"
                >
                    {/* Success */}
                    {success && (
                        <div className="p-3 bg-success-muted border border-success/30 rounded-xl flex items-center gap-2">
                            <svg className="w-4 h-4 text-success shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="text-sm text-success font-medium">
                                {type === 'create' ? 'Payment created successfully!' : 'Payment updated successfully!'}
                            </span>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="p-3 bg-danger-muted border border-danger rounded-xl">
                            <p className="text-sm text-danger">{error}</p>
                        </div>
                    )}

                    {/* Amount */}
                    <div className="flex flex-col gap-1 group">
                        <label className="text-xs font-medium text-ink-subtle pl-1 group-focus-within:text-primary transition-colors">
                            Amount <span className="text-danger">*</span>
                        </label>
                        <input
                            type="number"
                            onWheel={(e) => e.target.blur()}
                            name="amount"
                            value={formData.amount}
                            onChange={handleChange}
                            placeholder="0.00"
                            step="0.01"
                            min="0"
                            required
                            className="px-4 py-3 rounded-xl border border-edge bg-surface text-sm text-ink placeholder-gray-300 focus:outline-none focus:border-accent focus:ring-4 focus:ring-primary/20 transition-all"
                        />
                    </div>

                    {/* Date */}
                    <div className="flex flex-col gap-1 group">
                        <label className="text-xs font-medium text-ink-subtle pl-1 group-focus-within:text-primary transition-colors">
                            Date <span className="text-danger">*</span>
                        </label>
                        <input
                            type="date"
                            name="date"
                            value={formData.date}
                            onChange={handleChange}
                            required
                            className="px-4 py-3 rounded-xl border border-edge bg-surface text-sm text-ink focus:outline-none focus:border-accent focus:ring-4 focus:ring-primary/20 transition-all"
                        />
                    </div>



                    {/* Reason */}
                    <div className="flex flex-col gap-1 group">
                        <label className="text-xs font-medium text-ink-subtle pl-1 group-focus-within:text-primary transition-colors">
                            Per Absence Cut <span className="text-danger">*</span>
                        </label>
                        <input
                            name="perAbsenceCut"
                            value={formData.perAbsenceCut}
                            onChange={handleChange}
                            placeholder="Per absence cut..."
                            rows={3}
                            required
                            className="px-4 py-3 rounded-xl border border-edge bg-surface text-sm text-ink focus:outline-none focus:border-accent focus:ring-4 focus:ring-primary/20 transition-all"
                        />
                    </div>


                    {/* Reason */}
                    <div className="flex flex-col gap-1 group">
                        <label className="text-xs font-medium text-ink-subtle pl-1 group-focus-within:text-primary transition-colors">
                            Reason <span className="text-danger">*</span>
                        </label>
                        <textarea
                            name="reason"
                            value={formData.reason}
                            onChange={handleChange}
                            placeholder="Reason for this payment..."
                            rows={3}
                            required
                            className="px-4 py-3 rounded-xl border border-edge bg-surface text-sm text-ink placeholder-gray-300 resize-none focus:outline-none focus:border-accent focus:ring-4 focus:ring-primary/20 transition-all"
                        />
                    </div>







                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading || success}
                        className="w-full py-3 rounded-xl app-gradient disabled:opacity-50 text-primary-foreground text-sm font-semibold hover:opacity-90 active:scale-95 transition-all mt-1 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <svg className="h-4 w-4 text-primary-foreground animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                </svg>
                                Processing...
                            </>
                        ) : success ? (
                            <>
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                {type === 'create' ? 'Created' : 'Updated'}
                            </>
                        ) : (
                            type === 'create' ? 'Create Payment' : 'Update Payment'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default SalaryChangeForm;