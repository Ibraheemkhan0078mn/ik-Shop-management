








import React, { useEffect, useMemo, useState } from 'react';
import { Edit2, Trash, ChevronDown, ChevronUp, Plus, Clock } from 'lucide-react';
import { PermissionGuard } from '@shared/components/PermissionGuard';
import { ClassPartnershipPaymentModel } from './ClassPartnershipPaymentModel';
import ClassPartnershipCrudModal from './ClassPartnershipCrudModel';
import { useDeleteClassPartnershipMutation, useDeleteClassPartnershipPaymentMutation, useGetClassPartnershipsByPartnerIdQuery } from '../member.rtk.api';
import { toast } from 'sonner';

const ClassPartnershipListingUnifiedComp = ({ memberId, mode = 'active' }) => {
    const isNonActive = mode === 'nonActive';
    const today = new Date();

    // ── RTK ──────────────────────────────────────────────────────────────────
    const { data: allPartnerships = [] } = useGetClassPartnershipsByPartnerIdQuery(memberId);
    const [deleteClassPartnership] = useDeleteClassPartnershipMutation();
    const [deleteClassPartnershipPayment] = useDeleteClassPartnershipPaymentMutation();
    // const [filteredPartnershipts, setFilteredPartnershipts]= useState([])


    const [currentPartnershipToOperateOn, setCurrentPartnershipToOperateOn] = useState(null)
    const [classPartnershipPaymentUpdateVisibility, setClassPartnershipPaymentUpdateVisibility] = useState(false)
    const [currentToUpdateClassPartnershipPayment, setCurrentToUpdateClassParnershipPayment] = useState(null)




    const filteredPartnershipts = useMemo(() => {
        return allPartnerships?.filter((item) => {
            const start = new Date(item.partnershipStartDate);
            const end = new Date(item.partnershipEndDate);
            const isActive = today >= start && today <= end;
            return isNonActive ? !isActive : isActive;
        });
    }, [allPartnerships, isNonActive]);


    // ── Filter by mode ────────────────────────────────────────────────────────


    // ── UI State ──────────────────────────────────────────────────────────────
    const [openPayments, setOpenPayments] = useState({});
    const [currentItem, setCurrentItem] = useState(null);
    const [paymentModalVisible, setPaymentModalVisible] = useState(false);
    const [updateModalVisible, setUpdateModalVisible] = useState(false);
    const [currentToUpdate, setCurrentToUpdate] = useState(null);

    // ── Handlers ──────────────────────────────────────────────────────────────
    const togglePayments = (id) => setOpenPayments(p => ({ ...p, [id]: !p[id] }));

    const handleDelete = async (id) => {
        try {
            await deleteClassPartnership(id).unwrap();
            toast.success('Partnership deleted');
        } catch (err) {
            toast.error(err?.data?.message || 'Delete failed');
        }
    };

    // ── Status badge (nonActive only) ─────────────────────────────────────────
    const getStatus = (item) => {
        const start = new Date(item.partnershipStartDate);
        const end = new Date(item.partnershipEndDate);
        if (today < start) return { label: 'Upcoming', cls: 'bg-primary-muted text-primary' };
        if (today > end) return { label: 'Expired', cls: 'bg-rose-100 text-rose-700' };
        return { label: 'Inactive', cls: 'bg-surface-muted text-ink-muted' };
    };

    // ── Mode-aware palette ────────────────────────────────────────────────────
    const p = isNonActive ? {
        indexBg: 'bg-danger-muted border border-danger',
        indexText: 'text-rose-400',
        paymentBtn: 'bg-surface-muted hover:bg-surface-muted border-edge',
        paymentBtnText: 'text-ink-muted',
        chevron: 'text-ink-subtle',
        paymentIndex: 'bg-border text-ink-muted',
        cardHover: 'hover:shadow-md',
    } : {
        indexBg: 'app-gradient border border-edge-brand/50',
        indexText: 'text-primary',
        paymentBtn: 'bg-primary-muted hover:bg-primary-muted/70 border-edge-brand',
        paymentBtnText: 'text-primary',
        chevron: 'text-primary',
        paymentIndex: 'bg-primary-muted text-primary',
        cardHover: 'hover:border-accent/50 hover:shadow-lg',
    };

    // ── Stat card color map ───────────────────────────────────────────────────
    const colorStyles = {
        cyan: { wrap: 'bg-primary-muted border-edge-brand/50', label: 'text-primary' },
        rose: { wrap: 'bg-danger-muted/50 border-danger/50', label: 'text-danger' },
        emerald: { wrap: 'bg-success-muted/50 border-success-muted/50', label: 'text-success' },
        orange: { wrap: 'bg-warning-muted/50 border-orange-100/50', label: 'text-warning' },
        slate: { wrap: 'bg-surface-muted border-edge', label: 'text-ink-muted' },
        blue: { wrap: 'bg-primary-muted/50 border-edge-brand/50', label: 'text-primary' },
    };

    const buildCards = (item) => [
        { label: 'Share', value: item?.partnershipValue, sub: item?.partnershipType === 'percentage' ? '%' : 'PKR', footer: item?.partnershipType, color: isNonActive ? 'rose' : 'cyan' },
        { label: 'Total Earned', value: item?.totalAmount ?? '—', sub: 'PKR', footer: `${item?.transactionCount ?? 0} transactions`, color: isNonActive ? 'orange' : 'emerald' },
        { label: 'Partner Amount', value: item?.partnerAmount ?? '—', sub: 'PKR', footer: 'Commission', color: 'slate' },
        { label: 'Paid', value: item?.paidAmount ?? 0, sub: 'PKR', footer: `${item?.payments?.length ?? 0} payments`, color: 'emerald' },
        { label: 'Remaining', value: item?.remainingAmount ?? 0, sub: 'PKR', footer: 'Pending', color: 'rose' },
        { label: 'Start Date', value: item?.partnershipStartDate ? new Date(item.partnershipStartDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A', footer: 'Effective From', color: isNonActive ? 'slate' : 'blue' },
        ...((item?.hasEndDate || item?.partnershipEndDate) ? [{
            label: 'End Date',
            value: item?.partnershipEndDate ? new Date(item.partnershipEndDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A',
            footer: isNonActive ? 'Expired On' : 'Auto Expire',
            color: 'rose',
        }] : []),
    ];

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <>
            {(paymentModalVisible && currentItem) && (
                <ClassPartnershipPaymentModel
                    classPartnershipId={currentItem._id}
                    operation="create"
                    setVisibility={setPaymentModalVisible}
                />
            )}
            {(updateModalVisible && currentToUpdate) && (
                <ClassPartnershipCrudModal
                    operation="update"
                    data={currentToUpdate}
                    setVisibility={setUpdateModalVisible}
                />
            )}
            {classPartnershipPaymentUpdateVisibility && <ClassPartnershipPaymentModel classPartnershipId={currentPartnershipToOperateOn._id} setVisibility={setClassPartnershipPaymentUpdateVisibility} operation='update' paymentData={currentToUpdateClassPartnershipPayment} />}



            <div className="space-y-3">
                {filteredPartnershipts.length === 0 ? (
                    <p className={`text-center text-sm font-bold py-10 ${isNonActive ? 'text-rose-300' : 'text-ink-subtle'}`}>
                        {isNonActive ? 'No non-active partnerships' : 'No active partnerships'}
                    </p>
                ) : filteredPartnershipts.map((item, index) => {
                    const status = isNonActive ? getStatus(item) : null;
                    const paymentsOpen = openPayments[item._id];

                    return (
                        <div
                            key={item._id ?? index}
                            className={`bg-surface p-5 rounded-2xl border border-edge/60 shadow-sm transition-all ${p.cardHover}`}
                        >
                            {/* Header */}
                            <div className="flex items-center gap-3 pb-4 border-b border-edge">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${p.indexBg}`}>
                                    <span className={`text-xs font-black ${p.indexText}`}>{index + 1}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-black text-ink truncate">{item?.className}</h4>
                                    <p className="text-[10px] font-bold text-ink-subtle mt-0.5">{item?.classId}</p>
                                </div>
                                {isNonActive && status && (
                                    <span className={`text-[10px] font-black px-3 py-1 rounded-full flex items-center gap-1 ${status.cls}`}>
                                        <Clock size={10} />
                                        {status.label}
                                    </span>
                                )}
                            </div>

                            {/* Stat Cards */}
                            <div className="flex flex-wrap gap-2 mt-4">
                                {buildCards(item).map((card, idx) => {
                                    const c = colorStyles[card.color] ?? colorStyles.slate;
                                    return (
                                        <div key={idx} className={`min-w-[120px] flex-1 p-3 rounded-2xl border ${c.wrap}`}>
                                            <span className={`text-[9px] font-black uppercase tracking-tight block mb-1 ${c.label}`}>{card.label}</span>
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-sm font-black text-ink">{card.value}</span>
                                                {card.sub && <span className="text-[9px] font-bold text-ink-muted uppercase">{card.sub}</span>}
                                            </div>
                                            <span className="text-[9px] font-semibold text-ink-subtle mt-0.5 block capitalize">{card.footer}</span>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Payments Dropdown */}
                            {item?.payments?.length > 0 && (
                                <div className="mt-4">
                                    <button
                                        onClick={() => togglePayments(item._id)}
                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl border transition-all ${p.paymentBtn}`}
                                    >
                                        <span className={`text-[10px] font-black uppercase tracking-tight ${p.paymentBtnText}`}>
                                            Payment History ({item.payments.length})
                                        </span>
                                        {paymentsOpen
                                            ? <ChevronUp size={13} className={p.chevron} />
                                            : <ChevronDown size={13} className={p.chevron} />
                                        }
                                    </button>
                                    {paymentsOpen && (
                                        <div className="mt-2 flex flex-col gap-1.5">
                                            {item.payments.map((pay, pi) => (
                                                <div key={pay?._id ?? pi} className="flex items-center justify-between px-3 py-2 rounded-xl bg-surface-muted border border-edge">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`w-5 h-5 rounded-lg flex items-center justify-center text-[9px] font-black ${p.paymentIndex}`}>
                                                            {pi + 1}
                                                        </span>
                                                        <span className="text-[11px] font-bold text-ink-muted">
                                                            {pay?.paymentDate ? new Date(pay.paymentDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                                                        </span>
                                                    </div>
                                                    <span className="text-sm font-black text-success">
                                                        {pay?.amount ?? 0} <span className="text-[9px] font-bold text-ink-subtle">PKR</span>
                                                    </span>
                                                    <div className="flex items-center gap-2">
                                                        <Edit2 onClick={() => {
                                                            setCurrentToUpdateClassParnershipPayment(pay)
                                                            setClassPartnershipPaymentUpdateVisibility(true)
                                                            setCurrentPartnershipToOperateOn(item)
                                                        }} className="w-4 h-4 text-blue-500 cursor-pointer hover:scale-110 transition-transform" />
                                                        <Trash 
                                                        onClick={async ()=>{await deleteClassPartnershipPayment({partnershipId: item._id, paymentId: pay._id}).unwrap(); toast.success("Payment deleted")}}
                                                        className="w-4 h-4 text-red-500 cursor-pointer hover:scale-110 transition-transform" />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-edge">
                                <PermissionGuard permission="member-class-partnership-update">
                                    <button
                                        onClick={() => { setCurrentToUpdate(item); setUpdateModalVisible(true); }}
                                        className="p-2 text-ink-subtle hover:text-primary hover:bg-primary-muted rounded-xl transition-all"
                                    >
                                        <Edit2 size={15} />
                                    </button>
                                </PermissionGuard>
                                <PermissionGuard permission="member-class-partnership-delete">
                                    <button
                                        onClick={() => handleDelete(item._id)}
                                        className="p-2 text-ink-subtle hover:text-danger hover:bg-danger-muted rounded-xl transition-all"
                                    >
                                        <Trash size={15} />
                                    </button>
                                </PermissionGuard>
                                <PermissionGuard permission="member-class-partnership-create">
                                    <button
                                        onClick={() => { setCurrentItem(item); setPaymentModalVisible(true); setCurrentPartnershipToOperateOn(item) }}
                                        className="p-2 text-ink-subtle hover:text-success hover:bg-success-muted rounded-xl transition-all"
                                    >
                                        <Plus size={15} />
                                    </button>
                                </PermissionGuard>
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
};

export default ClassPartnershipListingUnifiedComp;









