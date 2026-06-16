import React, { useState } from 'react';
import ClassPartnershipCreation from './ClassPartnerCreation';
import { useDeleteClassPartnershipMutation, useGetClassPartnershipsByPartnerIdQuery } from '../../member/api/member.rtk.api.js';
import ClassPartnershipUpdate from './ClassPartnershipUpdate';
import { PermissionGuard } from '../../../shared/components/PermissionGaurd';

const ClassPartnership = ({ memberId }) => {

    let { data: partnerships } = useGetClassPartnershipsByPartnerIdQuery(memberId)
    let [deleteClassPartnership] = useDeleteClassPartnershipMutation()
    const [classPartnershipCreaionVisibility, setclassPartnershipCreaionVisibility] = useState(false)
    const [classPartnershipUpdateVisibility, setClassPartnershipUpdateVisibility] = useState(false)
    const [currentToUpdateClassPartnershipData, setCurrentToUpdateClassPartnershipData] = useState(null)

















    return (
        <div className="p-2 space-y-6 app-enter slide-in-from-bottom-2 duration-700">

            {classPartnershipCreaionVisibility && <ClassPartnershipCreation partnerId={memberId} setVisibility={setclassPartnershipCreaionVisibility} />}
            {classPartnershipUpdateVisibility && <ClassPartnershipUpdate setVisibility={setClassPartnershipUpdateVisibility} data={currentToUpdateClassPartnershipData} />}


            {/* HEADER SECTION */}
            <div className="flex items-center justify-between bg-surface p-5 rounded-[1.5rem] border border-edge/60 shadow-sm">
                <div>
                    <h2 className="text-xl font-black text-ink tracking-tight">Class Partnerships</h2>
                    <p className="text-[10px] text-ink-subtle font-bold uppercase tracking-widest">Manage academic profit sharing</p>
                </div>
                <PermissionGuard permission={"member-class-partnership-create"}>
                    <button
                        onClick={() => setclassPartnershipCreaionVisibility(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary text-primary-foreground rounded-xl text-[11px] font-black uppercase tracking-wider transition-all shadow-lg shadow-sm/20 active:scale-95">
                        <i className="ri-add-line"></i>
                        New Partnership
                    </button>
                </PermissionGuard>
            </div>

            {/* DATA LIST (FLEX TABLE) */}
            <div className="space-y-3">
                {/* COLUMN LABELS */}
                {/* <div className="hidden md:flex items-center px-6 text-[10px] font-black text-ink-subtle uppercase tracking-widest">
                    <div className="flex-[1.5]">Class Details</div>
                    <div className="flex-1">Split Strategy</div>
                    <div className="flex-1">Partnership Timeline</div>
                    <div className="flex-1 text-right">Actions</div>
                </div> */}

                {/* {partnerships?.map((item, index) => (
                    <div key={item._id} className="group flex flex-col md:flex-row md:items-center bg-surface p-4 md:px-6 md:py-4 rounded-[1.5rem] border border-edge/60 hover:border-edge-brand/40 transition-all shadow-sm hover:shadow-md">

                        <div className="flex-[1.5] flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-surface-muted flex items-center justify-center border border-edge group-hover:bg-primary-muted transition-colors">
                                <span className="text-[10px] font-black text-primary">{index + 1}</span>
                            </div>
                            <div>
                                <h4 className="text-sm font-black text-ink leading-tight">{item?.className}</h4>
                            </div>
                        </div>

                        <div className="flex-1 mt-4 md:mt-0">
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-success uppercase tracking-tighter mb-0.5">{item?.partnershipType}</span>
                                <span className="text-md font-black text-ink">{item?.partnershipValue}</span>
                            </div>
                        </div>

                        <div className="flex-1 mt-4 md:mt-0">
                            <div className="flex items-center gap-3">
                                <div className="w-1 h-8 rounded-full bg-accent"></div>
                                <div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-[9px] font-black uppercase tracking-tight text-primary">
                                            Partnership
                                        </span>
                                    </div>
                                    <p className="text-xs font-bold text-ink-muted">
                                        {new Date(item?.partnershipStartDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} - {new Date(item?.partnershipEndDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 flex justify-end gap-1 mt-4 md:mt-0 pt-3 md:pt-0 border-t md:border-none border-edge">
                            <button className="p-2 text-ink-subtle hover:text-primary hover:bg-primary-muted rounded-xl transition-all">
                                <i className="ri-eye-line text-lg"></i>
                            </button>
                            <button className="p-2 text-ink-subtle hover:text-primary hover:bg-primary-muted rounded-xl transition-all">
                                <i className="ri-edit-line text-lg"></i>
                            </button>
                            <button className="p-2 text-ink-subtle hover:text-danger hover:bg-danger-muted rounded-xl transition-all">
                                <i className="ri-delete-bin-line text-lg"></i>
                            </button>
                        </div>

                    </div>
                ))} */}



                {partnerships?.map((item, index) => (
                    <div key={item._id} className="group bg-surface p-5 rounded-2xl border border-edge/60 hover:border-accent/50 transition-all shadow-sm hover:shadow-lg">

                        {/* Header - Class Info */}
                        <div className="flex items-center gap-3 pb-4 border-b border-edge">
                            <div className="w-11 h-11 rounded-xl app-gradient flex items-center justify-center border border-edge-brand/50">
                                <span className="text-xs font-black text-primary">{index + 1}</span>
                            </div>
                            <div className="flex-1">
                                <h4 className="text-base font-black text-ink leading-tight">{item?.className}</h4>
                                <p className="text-[10px] font-bold text-ink-subtle tracking-tight mt-0.5">Class ID: {item?.classId}</p>
                            </div>
                        </div>

                        {/* Content Grid */}
                        <div className="flex flex-wrap gap-3 mt-4">
                            {/* 1. Logic: Pehle Data Array Define karein */}
                            {[
                                { label: 'Type', value: item?.partnershipValue, subValue: item?.partnershipType === 'percentage' ? '%' : 'PKR  ', footer: item?.partnershipType, icon: <i className="ri-pie-chart-line"></i>, color: 'cyan' },
                                { label: 'Total Earned', value: item?.totalAmount, subValue: 'PKR  ', footer: `${item?.transactionCount || 0} transactions`, icon: <i className="ri-wallet-3-line"></i>, color: 'emerald' },
                                { label: 'Partner Amount', value: item?.partnerAmount, subValue: 'PKR  ', footer: 'Commission Share', icon: <i className="ri-hand-coin-line"></i>, color: 'orange' },
                                { label: 'Start Date', value: item?.partnershipStartDate ? new Date(item.partnershipStartDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A', footer: 'Effective From', icon: <i className="ri-calendar-event-line"></i>, color: 'blue' },
                                // { label: 'End Date', value: item?.partnershipEndDate ? new Date(item.partnershipEndDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A', footer: 'Auto Expire', icon: <i className="ri-calendar-close-line"></i>, color: 'rose' },

                                ...((item?.hasEndDate || item?.endDate) ? [{ label: 'End Date', value: item?.partnershipEndDate ? new Date(item.partnershipEndDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A', footer: 'Auto Expire', icon: <i className="ri-calendar-close-line"></i>, color: 'rose' }] : [])


                            ].map((card, idx) => (
                                /* 2. Render: Ek hi format use karke sab render karein */
                                <div key={idx} className={`min-w-[140px] flex-1 bg-gradient-to-br from-${card.color}-50/50 to-transparent p-3 rounded-2xl border border-${card.color}-100/50 hover:shadow-sm transition-all`}>
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <span className={`text-${card.color}-600 bg-${card.color}-100/50 p-1 rounded-md text-xs`}>
                                            {card.icon}
                                        </span>
                                        <span className={`text-[9px] font-black text-${card.color}-600 uppercase tracking-tight`}>
                                            {card.label}
                                        </span>
                                    </div>

                                    <div className="flex items-baseline gap-1.5">
                                        <span className="text-md font-black text-ink">{card.value}</span>
                                        {card.subValue && <span className="text-[10px] font-bold text-ink-muted uppercase">{card.subValue}</span>}
                                    </div>

                                    <span className="text-[9px] font-bold text-ink-subtle capitalize mt-0.5 block">
                                        {card.footer}
                                    </span>
                                </div>
                            ))}
                        </div>
                        {/* Actions Footer */}
                        <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-edge">
                            <button className="p-2 text-ink-subtle hover:text-primary hover:bg-primary-muted rounded-xl transition-all">
                                <i className="ri-eye-line text-lg"></i>
                            </button>
                            <PermissionGuard permission={"member-class-partnership-update"}>
                                <button
                                    onClick={() => { setCurrentToUpdateClassPartnershipData(item); setClassPartnershipUpdateVisibility(true) }}
                                    className="p-2 text-ink-subtle hover:text-primary hover:bg-primary-muted rounded-xl transition-all">
                                    <i className="ri-edit-line text-lg"></i>
                                </button>
                            </PermissionGuard>
                            <PermissionGuard permission={"member-class-partnership-delete"}></PermissionGuard>
                        </div>

                    </div>
                ))}




            </div>
        </div>
    );
};

export default ClassPartnership;