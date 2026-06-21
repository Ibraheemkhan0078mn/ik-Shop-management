












import React, { useState } from 'react'
import { Edit, Trash2 } from 'lucide-react'
import { useHotkeys } from 'react-hotkeys-hook'
import boy_empty_user from '@shared/assets/images/boy-user.jpg'

import MemberDocumentsComp from './MemberDocuemntsComp.jsx'
import MemberFinancialHub from './MemberFinancialHub.jsx'
// import MemberOverview from './MemberOverview.jsx'
import ClassPartnership from './ClassPartnerShip.jsx'
import ConfirmDialog from '@shared/components/ConfirmationDialog.jsx'
import { PermissionGuard } from '@shared/components/PermissionGuard.jsx'

import { useGetMemberByIdQuery, useDeleteMemberMutation } from '../member.rtk.api.js'
import MemberProfileOverviewComp from './MemberProfileoverviewComp.jsx'
import MemberAttedanceComp from './MemberAttedanceComp.jsx'
import MemberCrudModel from './MemberCrudMode.jsx'

const TABS = [
    { id: 'profile', label: 'Overview', icon: 'ri-fingerprint-line' },
    { id: 'attendance', label: 'Attendance', icon: 'ri-pulse-line' },
    { id: 'salary', label: 'Financials', icon: 'ri-bank-card-line' },
    { id: 'documents', label: 'Documents', icon: 'ri-file-line' },
    { id: 'classPartnership', label: 'Class Partnership', icon: 'ri-file-line' },
]

export default function EachMemberDataComp({ memberId, setVisibility }) {
    const [activeTab, setActiveTab] = useState('profile')
    const [showUpdate, setShowUpdate] = useState(false)

    const { data: memberData } = useGetMemberByIdQuery(memberId)
    const [deleteMember] = useDeleteMemberMutation()

    useHotkeys('esc', () => setVisibility(false))

    if (!memberId) return null

    async function handleDelete() {
        await deleteMember(memberId)
        setVisibility(false)
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 app-overlay app-enter" onClick={() => setVisibility(false)} />

            {showUpdate && <MemberCrudModel operation='update' memberId={memberId} setVisibility={setShowUpdate} />}

            <div className="relative w-full max-w-[80%] h-[85vh] bg-surface rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row overflow-hidden app-enter">

                {/* SIDEBAR */}
                <div className="w-full relative md:w-80 app-gradient-vertical p-8 flex flex-col text-primary-foreground">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-surface/10 rounded-full -mr-32 -mt-32" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full -ml-32 -mb-32" />

                    <div className="mb-10">
                        <div className="rounded-2xl overflow-hidden flex items-center justify-center mb-6">
                            <img
                                className="rounded-2xl h-40 w-40 object-cover"
                                src={memberData?.profileImage ? `http://localhost:4000/uploads/${memberData.profileImage}` : boy_empty_user}
                                onError={(e) => e.target.src = boy_empty_user}
                                alt=""
                            />
                        </div>
                        <h2 className="text-2xl font-black tracking-tight text-center">{memberData?.name || "Loading..."}</h2>
                        <p className="text-accent text-center text-xs font-bold uppercase tracking-widest mt-1">ID: {memberData?.instituteId}</p>
                    </div>

                    <nav className="flex-1 space-y-3 overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {TABS.map(tab => {
                            if (!memberData?.isPartner && tab.id === 'classPartnership') return null
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 ${activeTab === tab.id
                                        ? 'bg-surface text-primary shadow-xl font-black scale-105'
                                        : 'text-primary-foreground/90 hover:bg-surface/10 font-medium'
                                        }`}
                                >
                                    <i className={`${tab.icon} text-xl`} />
                                    <span className="text-sm tracking-wide">{tab.label}</span>
                                </button>
                            )
                        })}
                    </nav>

                    <PermissionGuard permission="member-delete">
                        <ConfirmDialog onConfirm={handleDelete} message="Are you want to delete the member">
                            <div className="pt-6 border-t border-edge-brand/40">
                                <button className="w-full p-3 rounded-xl flex justify-center bg-surface/10 hover:bg-surface/20 transition-all border border-surface/10 text-primary-foreground">
                                    <Trash2 className="h-5 w-5" />
                                </button>
                            </div>
                        </ConfirmDialog>
                    </PermissionGuard>
                </div>

                {/* CONTENT */}
                <div className="flex-1 bg-surface-muted flex flex-col relative overflow-hidden">
                    <button
                        onClick={() => setVisibility(false)}
                        className="absolute top-6 right-8 z-10 w-10 h-10 rounded-xl bg-surface shadow-sm border border-edge flex items-center justify-center text-ink-subtle hover:text-danger transition-all"
                    >
                        <i className="ri-close-line text-2xl" />
                    </button>

                    <PermissionGuard permission="member-update">
                        {activeTab === 'profile' && (
                            <button
                                onClick={() => setShowUpdate(true)}
                                className="absolute bottom-10 right-10 w-14 h-14 bg-primary-muted hover:bg-primary text-primary-foreground rounded-full shadow-2xl flex items-center justify-center z-50 hover:-translate-y-1 transition-all duration-300"
                            >
                                <Edit className="w-6 h-6" />
                            </button>
                        )}
                    </PermissionGuard>

                    <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                        {activeTab === 'profile' && <MemberProfileOverviewComp memberId={memberId} />}

                        <PermissionGuard permission="member-attendance-view">
                            {activeTab === 'attendance' && (<MemberAttedanceComp memberId={memberId} />)}
                        </PermissionGuard>

                        <PermissionGuard permission="member-financial-view">
                            {activeTab === 'salary' && <MemberFinancialHub memberId={memberId} />}
                        </PermissionGuard>

                        <PermissionGuard permission="member-documents-view">
                            {activeTab === 'documents' && <MemberDocumentsComp memberId={memberId} />}
                        </PermissionGuard>

                        <PermissionGuard permission="member-class-partnership-view">
                            {activeTab === 'classPartnership' && <ClassPartnership memberId={memberId} />}
                        </PermissionGuard>
                    </div>
                </div>

            </div>
        </div>
    )
}

function StatCard({ label, val, icon, color }) {
    const colors = {
        green: "text-success bg-success-muted",
        red: "text-danger bg-danger-muted",
        orange: "text-warning bg-warning-muted",
        blue: "text-primary bg-primary-muted"
    }
    return (
        <div className="bg-surface p-6 rounded-3xl border border-edge flex flex-col items-center shadow-sm hover:border-edge-brand transition-all">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colors[color]}`}>
                <i className={`${icon} text-lg`} />
            </div>
            <p className="text-[10px] font-black text-ink-subtle uppercase mb-1">{label}</p>
            <p className="text-xl font-black text-ink">{val || 0}</p>
        </div>
    )
}


