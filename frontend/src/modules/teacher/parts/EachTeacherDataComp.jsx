

import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import boy_empty_user from '../../../assets/images/boy-user.jpg'

import TeacherSalaryPaymentCreationComp from './TeacherSalaryPaymentCreationComp.jsx';
import SeeAllTeacherPayments from './SeeAllTeacherPayments.jsx';
import TeacherUpdate from './TeacherUpdate.jsx';
import api from '../../../services/axiosInstance.js';
import { Edit, Trash2 } from 'lucide-react';
import TeacherDocumentsComp from './TeacherDocuemntsComp.jsx';
import TeacherFinancialRecord from './TeacherInvoicesAndFeeDeposits.jsx';
import { useGetTeacherFinancialRecord, useRecalculateTeacherFinancials } from '../api/teacherFinance.api.js';
import { useGetTimeBasesTeacherAttendance } from '../api/teacherAttendance.api.js';
import { useDeleteTeacher, useGetTeacherDataById } from '../api/teacher.api.js';
import { useHotkeys } from 'react-hotkeys-hook'
import PartnershipInvestment from './PartnershipInvestment.jsx';

import TeacherFinancialHub from './TeacherFinancialHub.jsx';
import { PermissionGuard } from '../../../common/components/PermissionGaurd.jsx';
import ConfirmDialog from '../../../common/components/ConfirmationDialog.jsx';

export default function EachTeacherDataComp({ teacherId, setVisibility }) {




    let { data: attendanceData } = useGetTimeBasesTeacherAttendance(teacherId)
    const { data: teacherData } = useGetTeacherDataById(teacherId);
    const { data: responseData } = useGetTeacherFinancialRecord(teacherId)
    const { mutateAsync: deleteTeacher } = useDeleteTeacher();


    // Agar tum chahte ho 'Escape' dabane par band ho:
    useHotkeys('esc', () => setVisibility(false));


    
    const [activeTab, setActiveTab] = useState('profile');
    const [showUpdate, setShowUpdate] = useState(false);





    if (!teacherId) return null;




    async function handleTeacherDeleteIconClick() {
        await deleteTeacher(teacherId)
        setVisibility(false)
    }









    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-500" onClick={() => { setVisibility(false) }} />

            {showUpdate && <TeacherUpdate teacherId={teacherId} setVisibility={setShowUpdate} />}

            {/* Main Modal Container - Side-by-side Layout */}
            <div className="relative w-full max-w-[80%] h-[85vh] bg-white rounded-[2.5rem] shadow-2xl flex flex-col md:flex-row overflow-hidden animate-in zoom-in-95 duration-500">

                {/* LEFT SIDEBAR (Original Visual Theme Preserved) */}
                <div className="w-full relative md:w-80 bg-linear-to-b from-cyan-600 to-cyan-800 p-8 flex flex-col text-white">

                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full -ml-32 -mb-32 blur-3xl"></div>



                    <div className="mb-10">
                        <div className="  rounded-2xl overflow-hidden flex items-center justify-center mb-6 ">
                            <img
                                className='rounded-2xl h-40 w-40'
                                src={(`http:///uploads/${teacherData?.profileImage}` && teacherData?.profileImage) ? `http:///uploads/${teacherData.profileImage}` : boy_empty_user} alt="" />
                        </div>
                        <h2 className="text-2xl font-black tracking-tight leading-tightv text-center">
                            {teacherData?.name || "Loading..."}
                        </h2>
                        <p className="text-cyan-400 text-center text-xs font-bold uppercase tracking-widest mt-1">
                            ID: {teacherData?.instituteId}
                        </p>
                    </div>

                    <nav className="flex-1 space-y-2">
                        {[
                            { id: 'profile', label: 'Overview', icon: 'ri-fingerprint-line' },
                            { id: 'attendance', label: 'Attendance', icon: 'ri-pulse-line' },
                            { id: 'salary', label: 'Financials', icon: 'ri-bank-card-line' },
                            { id: "documents", label: "Documents", icon: 'ri-file-line' },
                            // { id: "investment", label: "Investments", icon: "ri-file-line" },
                            // { id: "classPartnership", label: "Class Partnership", icon: "ri-file-line" }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center text-center gap-4 px-6 py-4 rounded-2xl transition-all duration-300 ${activeTab === tab.id
                                    ? 'bg-white text-cyan-700 shadow-xl font-black scale-105'
                                    : 'text-cyan-50 hover:bg-white/10 font-medium'
                                    }`}
                            >
                                <i className={`${tab.icon} text-xl`}></i>
                                <span className="text-sm tracking-wide">{tab.label}</span>
                            </button>
                        ))}
                    </nav>



                    <PermissionGuard permission={"teacher-delete"}>
                        <ConfirmDialog onConfirm={() => { handleTeacherDeleteIconClick() }} message='Are you want to delete the member' >
                            <div className="pt-6 border-t border-cyan-500/40 flex gap-3">
                                <button className="flex-1 p-3 rounded-xl flex justify-center bg-white/10 hover:bg-white/20 transition-all border border-white/10 text-white">
                                    <Trash2 className='h-5 w-5' />
                                </button>
                            </div>
                        </ConfirmDialog>
                    </PermissionGuard>



                </div>

                {/* RIGHT CONTENT (Inspired by Student Data Representation) */}
                <div className="flex-1 bg-slate-50 flex flex-col relative overflow-hidden">
                    <button
                        onClick={() => { setVisibility(false) }}
                        className="absolute top-6 right-8 z-10 w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all"
                    >
                        <i className="ri-close-line text-2xl"></i>
                    </button>


                    <PermissionGuard permission={"teacher-update"}>
                        {
                            activeTab == "profile" &&
                            <button
                                onClick={() => { setShowUpdate(true) }}
                                className="absolute bottom-10 right-10 w-14 h-14 bg-cyan-500 hover:bg-cyan-600 text-white rounded-full shadow-2xl flex items-center justify-center z-50   hover:-translate-y-1 transition-all duration-300 hover:shadow-3xl">
                                <Edit className="w-6 h-6" />
                            </button>
                        }
                    </PermissionGuard>











                    <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">

                        <div className="">
                            {activeTab === 'profile' && (
                                <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-8 relative">


                                    {/* Top Row: Enhanced Side-by-Side Cards */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                                        {/* Employment Card */}
                                        <section className="relative overflow-hidden bg-white p-8 rounded-[2rem] border border-slate-200/50 shadow-xl shadow-slate-200/20">





                                            {/* Subtle Accent Gradient */}
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-50/50 rounded-full -mr-16 -mt-16 blur-3xl" />

                                            <div className="relative">
                                                <div className="flex items-center gap-3 mb-8">
                                                    <div className="p-2 bg-cyan-50 rounded-lg">
                                                        <div className="w-1.5 h-1.5 bg-cyan-600 rounded-full animate-pulse" />
                                                    </div>
                                                    <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Employment Details</h3>
                                                </div>

                                                <div className="space-y-4">
                                                    {[
                                                        { label: "Designation", value: teacherData?.post || "Senior Faculty", icon: "💼" },
                                                        { label: "Education", value: teacherData?.education || "Post Graduate", icon: "🎓" },
                                                        { label: "Joined Date", value: teacherData?.createdAt ? new Date(teacherData?.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "N/A", icon: "📅" },
                                                        // { label: "Status", value: "Permanent", icon: "🛡️" }
                                                    ].map((item, i) => (
                                                        <div key={i} className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100/50">
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{item.label}</p>
                                                            <p className={`text-sm font-semibold ${item.color} truncate capitalize`}>{item.value}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </section>

                                        {/* Contact Card */}
                                        <section className="relative overflow-hidden bg-white p-8 rounded-[2rem] border border-slate-200/50 shadow-xl shadow-slate-200/20">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full -mr-16 -mt-16 blur-3xl" />

                                            <div className="relative">
                                                <div className="flex items-center gap-3 mb-8">
                                                    <div className="p-2 bg-indigo-50 rounded-lg">
                                                        <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full" />
                                                    </div>
                                                    <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em]">Contact Matrix</h3>
                                                </div>

                                                <div className="space-y-4">
                                                    {[
                                                        { label: "Phone", value: teacherData?.phoneNo || "Hidden", color: "text-slate-800" },
                                                        { label: "Email", value: teacherData?.email || "Not Linked", color: "text-cyan-600" },
                                                        { label: "Location", value: teacherData?.address || "Global", color: "text-slate-800" }
                                                    ].map((item, i) => (
                                                        <div key={i} className="p-4 rounded-2xl bg-slate-50/50 border border-slate-100/50">
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">{item.label}</p>
                                                            <p className={`text-sm font-semibold ${item.color} truncate`}>{item.value}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </section>
                                    </div>

                                    {/* --- Rest of the Full Width Containers --- */}

                                    {/* Skills */}
                                    <section className="bg-gradient-to-br from-slate-50 to-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm relative overflow-hidden">
                                        {/* Decorative subtle mesh gradient in the background */}
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-100/30 rounded-full blur-3xl -mr-32 -mt-32" />

                                        <div className="relative">
                                            <div className="flex items-center justify-between mb-8">
                                                <div>
                                                    <h3 className="text-[11px] font-black text-cyan-600 uppercase tracking-[0.2em]">Expertise</h3>
                                                    <div className="h-0.5 w-8 bg-cyan-500 mt-1 rounded-full" />
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-full uppercase">
                                                    {teacherData?.skills?.length} Skills Listed
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap gap-3">
                                                {teacherData?.skills?.map((skill) => (
                                                    <div
                                                        key={skill}
                                                        className="group relative px-5 py-3 bg-white border border-slate-200/80 text-slate-600 text-xs font-bold rounded-2xl 
                     hover:border-cyan-500/50 hover:shadow-md hover:shadow-cyan-500/5 transition-all duration-300 cursor-default uppercase
                     flex items-center gap-2"
                                                    >
                                                        {/* Small decorative dot that turns cyan on hover */}
                                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-cyan-500 transition-colors" />
                                                        {skill}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </section>

                                    {/* Education */}
                                    <section className="bg-white p-10 rounded-[2rem] border border-slate-200/60">
                                        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-8">Educational Degrees</h3>
                                        <div className="flex flex-wrap">
                                            {teacherData?.educationDegrees?.map((degree, i) => (
                                                <div
                                                    key={i}
                                                    className="group relative px-5 py-3 bg-white border border-slate-200/80 text-slate-600 text-xs font-bold rounded-2xl 
                     hover:border-cyan-500/50 hover:shadow-md hover:shadow-cyan-500/5 transition-all duration-300 cursor-default uppercase
                     flex items-center gap-2"
                                                >
                                                    {/* Small decorative dot that turns cyan on hover */}
                                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-cyan-500 transition-colors" />
                                                    {degree}
                                                </div>
                                            ))}
                                        </div>
                                    </section>

                                    {/* Experience */}
                                    <section className="bg-white p-10 rounded-[2rem] border border-slate-200/60">
                                        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-6">Professional Experiences</h3>

                                        {
                                            teacherData?.experiences?.map((e) => {
                                                return (
                                                    <p className="text-slate-600 text-lg leading-relaxed font-medium italic border-l-4 border-cyan-500 pl-6">
                                                        {e}
                                                    </p>
                                                )
                                            })
                                        }
                                        {/* <p className="text-slate-600 text-lg leading-relaxed font-medium italic border-l-4 border-cyan-500 pl-6">
                                            "A results-driven educator with a passion for building scalable web applications and mentoring the next generation of software engineers. Specialized in full-stack ecosystems and modern pedagogical methods."
                                        </p> */}
                                    </section>

                                    {/* Languages */}
                                    <section className="bg-slate-50/50 p-8 rounded-[2rem] border border-dashed border-slate-300">
                                        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-6 ">Linguistic Profile</h3>
                                        <div className="flex  gap-8">
                                            {teacherData?.languages?.map((lang) => (
                                                <div
                                                    key={lang}
                                                    className="group relative px-5 py-3 bg-white border border-slate-200/80 text-slate-600 text-xs font-bold rounded-2xl 
                     hover:border-cyan-500/50 hover:shadow-md hover:shadow-cyan-500/5 transition-all duration-300 cursor-default uppercase
                     flex items-center gap-2"
                                                >
                                                    {/* Small decorative dot that turns cyan on hover */}
                                                    <div className="w-1.5 h-1.5 rounded-full bg-slate-200 group-hover:bg-cyan-500 transition-colors" />
                                                    {lang}
                                                </div>
                                            ))}
                                        </div>
                                    </section>

                                </div>
                            )}
                        </div>

                        {/* Tab 2: Attendance Representation */}
                        <PermissionGuard permission={"teacher-attendance-view"}>
                            {activeTab === 'attendance' && (
                                <div className="animate-in zoom-in-95 duration-500 space-y-8">
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                        <StatCard label="Present" val={attendanceData?.presence} icon="ri-checkbox-circle-line" color="green" />
                                        <StatCard label="Absent" val={attendanceData?.absence} icon="ri-close-circle-line" color="red" />
                                        <StatCard label="Leave" val={attendanceData?.leave} icon="ri-information-line" color="orange" />
                                        <StatCard label="Total Working" val={attendanceData?.totalClasses} icon="ri-calendar-line" color="blue" />
                                    </div>

                                    <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col items-center">
                                        <div className="w-48 h-48 rounded-full border-[12px] border-slate-50 flex flex-col items-center justify-center mb-8 relative">
                                            <span className="text-4xl font-black text-slate-800">{attendanceData?.presencePercentage?.toFixed(0)}%</span>
                                            <span className="text-[10px] font-bold text-cyan-600 uppercase tracking-widest">Efficiency</span>
                                            <div className="absolute inset-0 rounded-full border-[12px] border-cyan-500 border-t-transparent animate-spin duration-[4000ms]"></div>
                                        </div>

                                    </div>
                                </div>
                            )}
                        </PermissionGuard>










                        <PermissionGuard permission={"teacher-financial-view"}>
                            {
                                activeTab === 'salary' && <TeacherFinancialHub teacherId={teacherId} teacherData={teacherData} responseData={responseData} />
                            }
                        </PermissionGuard>





                        <PermissionGuard permission={"teacher-documents-view"}>
                            {
                                activeTab == "documents" && (
                                    <TeacherDocumentsComp teacherData={teacherData} />
                                )
                            }
                        </PermissionGuard>


                        {/* 

                        <PermissionGuard permission={"teacher-investment-view"}>
                            {
                                activeTab == "investment" && <PartnershipInvestment teacherId={teacherId} teacherData={teacherData} />
                            }
                        </PermissionGuard> */}


                        {/* <PermissionGuard permission={"teacher-class-partnership-view"}>
                            {
                                activeTab == "classPartnership" && <ClassPartnership teacherId={teacherId} />
                            }
                        </PermissionGuard> */}

                    </div>

                    {/* Footer / Danger Zone */}
                    {/* <div className="px-10 py-6 bg-white border-t border-slate-100 flex justify-between items-center">
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Faculty Management System v2.0</span>
                        <button
                            onClick={async () => {
                                const res = await api.post("/teacherRoute/teacherDelete", { teacherDocId: teacherId });
                                if (res.data.success) { setVisibility(false);; }
                                // }
                            }}
                            className="flex items-center gap-2 text-rose-400 hover:text-rose-600 font-bold text-xs uppercase tracking-tighter transition-colors"
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
            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{label}</span>
            <span className="text-slate-700 font-bold">{value || "—"}</span>
        </div>
    );
}

function StatCard({ label, val, icon, color }) {
    const colors = {
        green: "text-green-600 bg-green-50",
        red: "text-red-600 bg-red-50",
        orange: "text-orange-600 bg-orange-50",
        blue: "text-blue-600 bg-blue-50"
    };
    return (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 flex flex-col items-center shadow-sm hover:border-cyan-200 transition-all">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${colors[color]}`}>
                <i className={`${icon} text-lg`}></i>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase mb-1">{label}</p>
            <p className="text-xl font-black text-slate-800">{val || 0}</p>
        </div>
    );
}