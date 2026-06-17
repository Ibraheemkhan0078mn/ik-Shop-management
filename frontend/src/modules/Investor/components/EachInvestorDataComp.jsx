

import React, { useEffect, useState } from 'react';
import boy_empty_user from '../../../assets/images/boy-user.jpg'

import MemberUpdate from './InvestorUpdate.jsx';
import { Edit, Trash2 } from 'lucide-react';
import MemberDocumentsComp from './InvestorDocuemntsComp.jsx';
import { useDeleteMemberMutation, useGetMemberByIdQuery } from '../../member/api/member.rtk.api.js';
import { useHotkeys } from 'react-hotkeys-hook'
import PartnershipInvestment from './PartnershipInvestment.jsx';
import ClassPartnership from './ClassPartnerShip.jsx';
import { PermissionGuard } from '@shared/components/PermissionGuard.jsx';
import ConfirmDialog from '../../../common/components/ConfirmationDialog.jsx';
import InvestorFinancialHub from './InvestorFinancialHub.jsx';
import { backendBaseUrl } from '../../../common/constants/constants.js';

export default function EachMemberDataComp({ memberId, setVisibility }) {




    const { data: memberData } = useGetMemberByIdQuery(memberId);
    const [deleteMember] = useDeleteMemberMutation();


    // Agar tum chahte ho 'Escape' dabane par band ho:
    useHotkeys('esc', () => setVisibility(false));



    const [activeTab, setActiveTab] = useState('profile');
    const [showUpdate, setShowUpdate] = useState(false);





    if (!memberId) return null;




    async function handleMemberDeleteIconClick() {
        await deleteMember(memberId).unwrap()
        setVisibility(false)
    }









    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 app-overlay app-enter" onClick={() => { setVisibility(false) }} />

            {showUpdate && <MemberUpdate memberId={memberId} setVisibility={setShowUpdate} />}

            {/* Main Modal Container - Side-by-side Layout */}
            <div className="relative w-full max-w-[80%] h-[85vh] bg-surface rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row overflow-hidden app-enter">

                {/* LEFT SIDEBAR (Original Visual Theme Preserved) */}
                <div className="w-full relative md:w-80 app-gradient-vertical p-8 flex flex-col text-primary-foreground">

                    <div className="absolute top-0 right-0 w-64 h-64 bg-surface/10 rounded-full -mr-32 -mt-32"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full -ml-32 -mb-32"></div>



                    <div className="mb-10">
                        <div className="  rounded-2xl overflow-hidden flex items-center justify-center mb-6 ">
                            <img
                                className='rounded-2xl h-40 w-40'
                                src={(`http://localhost:4000/uploads/${memberData?.profileImage}` && memberData?.profileImage) ? `http://localhost:4000/uploads/${memberData.profileImage}` : boy_empty_user} alt="" />
                        </div>
                        <h2 className="text-2xl font-black tracking-tight leading-tightv text-center">
                            {memberData?.name || "Loading..."}
                        </h2>
                        <p className="text-accent text-center text-xs font-bold uppercase tracking-widest mt-1">
                            ID: {memberData?.instituteId}
                        </p>
                    </div>

                    <nav className="flex-1 space-y-3 overflow-y-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                        {[
                            { id: 'profile', label: 'Overview', icon: 'ri-fingerprint-line' },
                            { id: "documents", label: "Documents", icon: 'ri-file-line' },
                            { id: "investment", label: "Investments", icon: "ri-file-line" },
                            { id: 'salary', label: 'Payments', icon: 'ri-bank-card-line' },
                            // { id: "classPartnership", label: "Class Partnership", icon: "ri-file-line" }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center text-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 ${activeTab === tab.id
                                    ? 'bg-surface text-primary shadow-xl font-black scale-105'
                                    : 'text-primary-foreground/90 hover:bg-surface/10 font-medium'
                                    }`}
                            >
                                <i className={`${tab.icon} text-xl`}></i>
                                <span className="text-sm tracking-wide">{tab.label}</span>
                            </button>
                        ))}
                    </nav>



                    <PermissionGuard permission={"member-delete"}>
                        <ConfirmDialog onConfirm={() => { handleMemberDeleteIconClick() }} message='Are you want to delete the invester' >

                            <div className="pt-6 border-t border-edge-brand/40 flex gap-3">
                                <button className="flex-1 p-3 rounded-xl flex justify-center bg-surface/10 hover:bg-surface/20 transition-all border border-surface/10 text-primary-foreground">
                                    <Trash2 className='h-5 w-5' />
                                </button>
                            </div>
                        </ConfirmDialog>
                    </PermissionGuard>



                </div>

                {/* RIGHT CONTENT (Inspired by Student Data Representation) */}
                <div className="flex-1 bg-surface-muted flex flex-col relative overflow-hidden">
                    <button
                        onClick={() => { setVisibility(false) }}
                        className="absolute top-6 right-8 z-10 w-10 h-10 rounded-xl bg-surface shadow-sm border border-edge flex items-center justify-center text-ink-subtle hover:text-danger transition-all"
                    >
                        <i className="ri-close-line text-2xl"></i>
                    </button>


                    <PermissionGuard permission={"member-update"}>
                        {
                            activeTab == "profile" &&
                            <button
                                onClick={() => { setShowUpdate(true) }}
                                className="absolute bottom-10 right-10 w-14 h-14 bg-primary-muted hover:bg-primary text-primary-foreground rounded-full shadow-2xl flex items-center justify-center z-50   hover:-translate-y-1 transition-all duration-300 hover:shadow-3xl">
                                <Edit className="w-6 h-6" />
                            </button>
                        }
                    </PermissionGuard>











                    <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">

                        <div className="">
                            {activeTab === 'profile' && (
                                <div className="app-enter space-y-8 relative">


                                    {/* Top Row: Enhanced Side-by-Side Cards */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                                        {/* Employment Card */}
                                        <section className="relative overflow-hidden bg-surface p-8 rounded-[2rem] border border-edge/50 shadow-xl shadow-slate-200/20">





                                            {/* Subtle Accent Gradient */}
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-muted rounded-full -mr-16 -mt-16" />

                                            <div className="relative">
                                                <div className="flex items-center gap-3 mb-8">
                                                    <div className="p-2 bg-primary-muted rounded-lg">
                                                        <div className="w-1.5 h-1.5 bg-primary rounded-full " />
                                                    </div>
                                                    <h3 className="text-[11px] font-bold text-ink-subtle uppercase tracking-[0.2em]">Employment Details</h3>
                                                </div>

                                                <div className="space-y-4">
                                                    {[
                                                        { label: "Designation", value: memberData?.post || "Senior Faculty", icon: "💼" },
                                                        { label: "Education", value: memberData?.education || "Post Graduate", icon: "🎓" },
                                                        { label: "Joined Date", value: memberData?.createdAt ? new Date(memberData?.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "N/A", icon: "📅" },
                                                        // { label: "Status", value: "Permanent", icon: "🛡️" }
                                                    ].map((item, i) => (
                                                        <div key={i} className="p-4 rounded-2xl bg-surface-muted border border-edge/50">
                                                            <p className="text-[10px] font-bold text-ink-subtle uppercase mb-1">{item.label}</p>
                                                            <p className={`text-sm font-semibold ${item.color} truncate capitalize`}>{item.value}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </section>

                                        {/* Contact Card */}
                                        <section className="relative overflow-hidden bg-surface p-8 rounded-[2rem] border border-edge/50 shadow-xl shadow-slate-200/20">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-primary-muted rounded-full -mr-16 -mt-16" />

                                            <div className="relative">
                                                <div className="flex items-center gap-3 mb-8">
                                                    <div className="p-2 bg-indigo-50 rounded-lg">
                                                        <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />
                                                    </div>
                                                    <h3 className="text-[11px] font-bold text-ink-subtle uppercase tracking-[0.2em]">Contact Matrix</h3>
                                                </div>

                                                <div className="space-y-4">
                                                    {[
                                                        { label: "Phone", value: memberData?.phoneNo || "Hidden", color: "text-ink" },
                                                        { label: "Email", value: memberData?.email || "Not Linked", color: "text-primary" },
                                                        { label: "Location", value: memberData?.address || "Global", color: "text-ink" }
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

                                    {/* --- Rest of the Full Width Containers --- */}

                                    {/* Skills */}
                                    <section className="bg-surface p-8 rounded-[2.5rem] border border-edge/60 shadow-sm relative overflow-hidden">
                                        {/* Decorative subtle mesh gradient in the background */}
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-muted/30 rounded-full -mr-32 -mt-32" />

                                        <div className="relative">
                                            <div className="flex items-center justify-between mb-8">
                                                <div>
                                                    <h3 className="text-[11px] font-black text-primary uppercase tracking-[0.2em]">Expertise</h3>
                                                    <div className="h-0.5 w-8 bg-primary-muted mt-1 rounded-full" />
                                                </div>
                                                <span className="text-[10px] font-bold text-ink-subtle bg-surface-muted px-3 py-1 rounded-full uppercase">
                                                    {memberData?.skills?.length} Skills Listed
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap gap-3">
                                                {memberData?.skills?.map((skill) => (
                                                    <div
                                                        key={skill}
                                                        className="group relative px-5 py-3 bg-surface border border-edge/80 text-ink-muted text-xs font-bold rounded-2xl 
                     hover:border-edge-brand/50 hover:shadow-md hover:shadow-sm/5 transition-all duration-300 cursor-default uppercase
                     flex items-center gap-2"
                                                    >
                                                        {/* Small decorative dot that turns cyan on hover */}
                                                        <div className="w-1.5 h-1.5 rounded-full bg-border group-hover:bg-primary-muted transition-colors" />
                                                        {skill}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </section>

                                    {/* Education */}
                                    <section className="bg-surface p-10 rounded-[2rem] border border-edge/60">
                                        <h3 className="text-[11px] font-bold text-ink-subtle uppercase tracking-[0.2em] mb-8">Educational Degrees</h3>
                                        <div className="flex flex-wrap">
                                            {memberData?.educationDegrees?.map((degree, i) => (
                                                <div
                                                    key={i}
                                                    className="group relative px-5 py-3 bg-surface border border-edge/80 text-ink-muted text-xs font-bold rounded-2xl 
                     hover:border-edge-brand/50 hover:shadow-md hover:shadow-sm/5 transition-all duration-300 cursor-default uppercase
                     flex items-center gap-2"
                                                >
                                                    {/* Small decorative dot that turns cyan on hover */}
                                                    <div className="w-1.5 h-1.5 rounded-full bg-border group-hover:bg-primary-muted transition-colors" />
                                                    {degree}
                                                </div>
                                            ))}
                                        </div>
                                    </section>

                                    {/* Experience */}
                                    <section className="bg-surface p-10 rounded-[2rem] border border-edge/60">
                                        <h3 className="text-[11px] font-bold text-ink-subtle uppercase tracking-[0.2em] mb-6">Professional Experiences</h3>

                                        {
                                            memberData?.experiences?.map((e) => {
                                                return (
                                                    <p className="text-ink-muted text-lg leading-relaxed font-medium italic border-l-4 border-edge-brand pl-6">
                                                        {e}
                                                    </p>
                                                )
                                            })
                                        }
                                        {/* <p className="text-ink-muted text-lg leading-relaxed font-medium italic border-l-4 border-edge-brand pl-6">
                                            "A results-driven educator with a passion for building scalable web applications and mentoring the next generation of software engineers. Specialized in full-stack ecosystems and modern pedagogical methods."
                                        </p> */}
                                    </section>

                                    {/* Languages */}
                                    <section className="bg-surface-muted p-8 rounded-[2rem] border border-dashed border-edge">
                                        <h3 className="text-[11px] font-bold text-ink-subtle uppercase tracking-[0.2em] mb-6 ">Linguistic Profile</h3>
                                        <div className="flex  gap-8">
                                            {memberData?.languages?.map((lang) => (
                                                <div
                                                    key={lang}
                                                    className="group relative px-5 py-3 bg-surface border border-edge/80 text-ink-muted text-xs font-bold rounded-2xl 
                     hover:border-edge-brand/50 hover:shadow-md hover:shadow-sm/5 transition-all duration-300 cursor-default uppercase
                     flex items-center gap-2"
                                                >
                                                    {/* Small decorative dot that turns cyan on hover */}
                                                    <div className="w-1.5 h-1.5 rounded-full bg-border group-hover:bg-primary-muted transition-colors" />
                                                    {lang}
                                                </div>
                                            ))}
                                        </div>
                                    </section>

                                </div>
                            )}
                        </div>

                        {/* Tab 2: Attendance Representation */}
                        {/* <PermissionGuard permission={"member-attendance-view"}>
                            {activeTab === 'attendance' && (
                                <div className="app-enter space-y-8">
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                        <StatCard label="Present" val={attendanceData?.presence} icon="ri-checkbox-circle-line" color="green" />
                                        <StatCard label="Absent" val={attendanceData?.absence} icon="ri-close-circle-line" color="red" />
                                        <StatCard label="Leave" val={attendanceData?.leave} icon="ri-information-line" color="orange" />
                                        <StatCard label="Total Working" val={attendanceData?.totalClasses} icon="ri-calendar-line" color="blue" />
                                    </div>

                                    <div className="bg-surface p-10 rounded-[3rem] border border-edge shadow-sm flex flex-col items-center">
                                        <div className="w-48 h-48 rounded-full border-[12px] border-edge flex flex-col items-center justify-center mb-8 relative">
                                            <span className="text-4xl font-black text-ink">{attendanceData?.presencePercentage?.toFixed(0)}%</span>
                                            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Efficiency</span>
                                            <div className="absolute inset-0 rounded-full border-[12px] border-edge-brand border-t-transparent  duration-[4000ms]"></div>
                                        </div>

                                    </div>
                                </div>
                            )}
                        </PermissionGuard> */}










                        <PermissionGuard permission={"investor-financial-view"}>
                            {
                                activeTab === 'salary' && <InvestorFinancialHub memberId={memberId} memberData={memberData} />
                            }
                        </PermissionGuard>





                        <PermissionGuard permission={"investor-documents-view"}>
                            {
                                activeTab == "documents" && (
                                    <MemberDocumentsComp memberData={memberData} />
                                )
                            }
                        </PermissionGuard>




                        <PermissionGuard permission={"investor-investment-view"}>
                            {
                                activeTab == "investment" && <PartnershipInvestment memberId={memberId} memberData={memberData} />
                            }
                        </PermissionGuard>


                        <PermissionGuard permission={"investor-class-partnership-view"}>
                            {
                                activeTab == "classPartnership" && <ClassPartnership memberId={memberId} />
                            }
                        </PermissionGuard>

                    </div>

                    {/* Footer / Danger Zone */}
                    {/* <div className="px-10 py-6 bg-surface border-t border-edge flex justify-between items-center">
                        <span className="text-[10px] font-bold text-ink-subtle uppercase tracking-widest">Faculty Management System v2.0</span>
                        <button
                            onClick={async () => {
                                const res = await api.post("/memberRoute/memberDelete", { memberDocId: memberId });
                                if (res.data.success) { setVisibility(false);; }
                                // }
                            }}
                            className="flex items-center gap-2 text-rose-400 hover:text-danger font-bold text-xs uppercase tracking-tighter transition-colors"
                        >
                            <i className="ri-delete-bin-7-line"></i> Terminate Contract
                        </button>
                    </div> */}
                </div>

            </div>
        </div>
    );
}

// Atomic UI Components (Inspired by Student component structure)
function InfoRow({ label, value }) {
    return (
        <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black text-ink-subtle uppercase tracking-widest">{label}</span>
            <span className="text-ink font-bold">{value || "—"}</span>
        </div>
    );
}

function StatCard({ label, val, icon, color }) {
    const colors = {
        green: "text-success bg-success-muted",
        red: "text-danger bg-danger-muted",
        orange: "text-warning bg-warning-muted",
        blue: "text-primary bg-primary-muted"
    };
    return (
        <div className="bg-surface p-6 rounded-3xl border border-edge flex flex-col items-center shadow-sm hover:border-edge-brand transition-all">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colors[color]}`}>
                <i className={`${icon} text-lg`}></i>
            </div>
            <p className="text-[10px] font-black text-ink-subtle uppercase mb-1">{label}</p>
            <p className="text-xl font-black text-ink">{val || 0}</p>
        </div>
    );
}