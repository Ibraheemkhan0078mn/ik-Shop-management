import React, { useState } from 'react'
import { useGetMemberByIdQuery } from '../api/member.rtk.api.js';
import ScreenTabButton from '@shared/components/ScreenTabButton.jsx';
import { Edit, Edit2 } from 'lucide-react';
import { PermissionGuard } from '@shared/components/PermissionGuard.jsx';
import MemberCrudModel from './MemberCrudMode.jsx';

export default function MemberProfileOverviewComp({ memberId }) {
    const { data: memberData } = useGetMemberByIdQuery(memberId, {
        skip: !memberId,  // ✅ won't fire until memberId is truthy
    });
    let [memberUpdateVisibility, setMemberUpdateVisibility] = useState(false)

    return (
        <div className="app-enter space-y-8 relative">


            {memberUpdateVisibility && <MemberCrudModel operation="update" memberId={memberData?._id} setVisibility={setMemberUpdateVisibility} />}

            {/* --- HEADER --- */}
            <div className="flex justify-between items-end mb-6 px-2 mt-5">
                <div>
                    <h3 className="text-[15px] font-black text-primary uppercase tracking-[0.2em]">Member Profile</h3>
                    <p className="text-ink-subtle text-[12px] font-medium ">Comprehensive Member overview and records</p>
                </div>
                <PermissionGuard permission={"student-edit"}>
                    <button
                        onClick={() => {setMemberUpdateVisibility(true)}}
                        className="flex cursor-pointer items-center gap-2 bg-primary border-2 border-edge-brand hover:border-edge-brand text-slate-100 px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all duration-300 hover:shadow-lg hover:shadow-sm active:scale-95"
                    >
                        <Edit2 className='h-3 w-3' />
                        Edit Data
                    </button>
                </PermissionGuard>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Employment Card */}
                <section className="relative overflow-hidden bg-surface p-8 rounded-[2rem] border border-edge/50 shadow-xl shadow-slate-200/20">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary-muted rounded-full -mr-16 -mt-16" />
                    <div className="relative">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2 bg-primary-muted rounded-lg">
                                <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                            </div>
                            <h3 className="text-[11px] font-bold text-ink-subtle uppercase tracking-[0.2em]">Employment Details</h3>
                        </div>
                        <div className="space-y-4">
                            {[
                                { label: "Designation", value: memberData?.post || "Not Provided" },
                                { label: "Education", value: memberData?.education || "Not Provided" },
                                { label: "Joined Date", value: memberData?.hiringDate ? new Date(memberData.hiringDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "Not Provided" },
                            ].map((item, i) => {
                                return (
                                    <div key={i} className="p-4 rounded-2xl bg-surface-muted border border-edge/50">
                                        <p className="text-[10px] font-bold text-ink-subtle uppercase mb-1">{item.label}</p>
                                        <p className="text-sm font-semibold text-ink truncate capitalize">{item.value}</p>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </section>

                {/* Contact Card */}
                <section className="relative overflow-hidden bg-surface p-8 rounded-[2rem] border border-edge/50 shadow-xl shadow-slate-200/20">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary-muted rounded-full -mr-16 -mt-16" />
                    <div className="relative">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="p-2 bg-primary-muted rounded-lg">
                                <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                            </div>
                            <h3 className="text-[11px] font-bold text-ink-subtle uppercase tracking-[0.2em]">Contact Matrix</h3>
                        </div>
                        <div className="space-y-4">
                            {[
                                { label: "Phone", value: memberData?.phoneNo || "Not Provided", color: "text-ink" },
                                { label: "Email", value: memberData?.email || "Not Provided", color: "text-primary" },
                                { label: "Location", value: memberData?.address || "Not Provided", color: "text-ink" },
                            ].map((item, i) => (
                                <div key={i} className="p-4 rounded-2xl bg-surface-muted border border-edge/50">
                                    <p className="text-[10px] font-bold text-ink-subtle uppercase mb-1">{item.label}</p>
                                    <p className={`text-sm font-semibold ${item.color} truncate`}>{item.value}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>

            {/* Associated Classes */}
            <TagSection
                title="Associated Classes"
                count={memberData?.associatedClasses?.length || 0}
                label="Classes Listed"
                items={memberData?.associatedClasses?.map(c => ({ key: c._id, label: c.className }))}
            />

            {/* Skills */}
            <TagSection
                title="Expertise"
                count={memberData?.skills?.length || 0}
                label="Skills Listed"
                items={memberData?.skills?.map(s => ({ key: s, label: s }))}
            />

            {/* Degrees */}
            <section className="bg-surface p-10 rounded-[2rem] border border-edge/60">
                <h3 className="text-[11px] font-bold text-ink-subtle uppercase tracking-[0.2em] mb-8">Educational Degrees</h3>
                <div className="flex flex-wrap gap-3">
                    {memberData?.educationDegrees?.length > 0 ? (
                        memberData.educationDegrees.map((degree, i) => <Tag key={i} label={degree} />)
                    ) : (
                        <p className="text-sm text-ink-muted italic">No degrees listed</p>
                    )}
                </div>
            </section>

            {/* Experience */}
            <section className="bg-surface p-10 rounded-[2rem] border border-edge/60">
                <h3 className="text-[11px] font-bold text-ink-subtle uppercase tracking-[0.2em] mb-6">Professional Experiences</h3>
                {memberData?.experiences?.length > 0 ? (
                    memberData.experiences.map((e, i) => (
                        <p key={i} className="text-ink-muted text-lg leading-relaxed font-medium italic border-l-4 border-edge-brand pl-6 mb-4">{e}</p>
                    ))
                ) : (
                    <p className="text-sm text-ink-muted italic">No professional experiences listed</p>
                )}
            </section>

            {/* Languages */}
            <section className="bg-surface-muted p-8 rounded-[2rem] border border-dashed border-edge">
                <h3 className="text-[11px] font-bold text-ink-subtle uppercase tracking-[0.2em] mb-6">Linguistic Profile</h3>
                <div className="flex gap-8 flex-wrap">
                    {memberData?.languages?.length > 0 ? (
                        memberData.languages.map(lang => <Tag key={lang} label={lang} />)
                    ) : (
                        <p className="text-sm text-ink-muted italic">No languages listed</p>
                    )}
                </div>
            </section>
        </div>
    )
}

function TagSection({ title, count = 0, label, items = [] }) {
    return (
        <section className="bg-surface p-8 rounded-[2.5rem] border border-edge/60 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary-muted/30 rounded-full -mr-32 -mt-32" />
            <div className="relative">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-[11px] font-black text-primary uppercase tracking-[0.2em]">{title}</h3>
                        <div className="h-0.5 w-8 bg-primary-muted mt-1 rounded-full" />
                    </div>
                    <span className="text-[10px] font-bold text-ink-subtle bg-surface-muted px-3 py-1 rounded-full uppercase">{count} {label}</span>
                </div>
                <div className="flex flex-wrap gap-3">
                    {items && items.length > 0 ? (
                        items.map(item => <Tag key={item.key} label={item.label} />)
                    ) : (
                        <p className="text-sm text-ink-muted italic">No data listed</p>
                    )}
                </div>
            </div>
        </section>
    )
}

function Tag({ label }) {
    return (
        <div className="group px-5 py-3 bg-surface border border-edge/80 text-ink-muted text-xs font-bold rounded-2xl hover:border-edge-brand/50 hover:shadow-md transition-all duration-300 cursor-default uppercase flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-border group-hover:bg-primary-muted transition-colors" />
            {label}
        </div>
    )
}