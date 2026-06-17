import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'
import { useSelector } from 'react-redux'
import { CirclePlus, CalendarDays, Search, X, Sparkles, CheckCircle2, XCircle, Clock, ChevronLeft, Calendar } from 'lucide-react'
import api from "@shared/services/axiosInstance.js"
import { useQueryClient } from '@tanstack/react-query'

export const TeacherAttendenceComp = ({ setVisibility }) => {
    let queryClient = useQueryClient()
    const navigate = useNavigate()
    let nowDate = new Date()

    const [teacherAttendeceData, setTeacherAttendenceData] = useState(null)
    const [dateForWhichAttendenceRequired, setDateForWhichAttendenceRequired] = useState(nowDate)
    const [timeSelectionPopupPanelVisible, setTimeSelectionPopupPanelVisible] = useState(false)

    async function getSeletedDayTeacherAttendenceDataFunction() {
        try {
            let response = await api.post("/teacherRoute/getSelectedDayTeachersAttendenceData", { date: dateForWhichAttendenceRequired })
            if (response?.data?.success === true) {
                setTeacherAttendenceData(response?.data?.teacherAttendence)
            } else {
                setTeacherAttendenceData(null)
            }
            setTimeSelectionPopupPanelVisible(false)
            // toast.success(response?.data?.msg)
        } catch (error) { console.error(error) }
    }

    useEffect(() => {
        getSeletedDayTeacherAttendenceDataFunction()
    }, [])

    async function handleCreateTeacherAttendence() {
        try {
            let response = await api.post("/teacherRoute/createdSeletedDayTeacherAttendence", { date: dateForWhichAttendenceRequired })
            if (response?.data?.success === true) {
                setTeacherAttendenceData(response?.data?.teacherAttendence)
            }
            // toast.success(response?.data?.msg)
        } catch (error) { console.error(error) }
    }

    async function handleTeacherCardAttendenceButtonClick(teacherAttendenceDataParam, currentPresenceStatus) {
        try {
            let response = await api.post("/teacherRoute/setTeacherAttendence",
                { teacherDocId: teacherAttendenceDataParam?.id, presenceStatus: currentPresenceStatus, currentAttendenceDocumentId: teacherAttendeceData?._id }
            )
            if (response?.data?.success === true) {
                setTeacherAttendenceData(response?.data?.attendenceData)
                queryClient.removeQueries({ queryKey: ["teacherAttendance"], exact: false })
            }
            // toast.success("Updated")
        } catch (error) { console.error(error) }
    }

    // Status styling configuration following the provided layout style
    const statusConfig = {
        present: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-100", dot: "bg-emerald-500" },
        absent: { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-100", dot: "bg-rose-500" },
        leave: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-100", dot: "bg-amber-500" },
        pending: { bg: "bg-slate-50", text: "text-slate-500", border: "border-slate-200", dot: "bg-slate-300" }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
            {/* Backdrop with Blur */}
            <div
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300"
                onClick={() => setVisibility(false)}
            />

            {/* Centered Modal Container (85vh height as per layout code) */}
            <div className="relative w-full max-w-5xl h-[85vh] bg-white rounded-[2.5rem] shadow-2xl shadow-cyan-900/20 border border-white flex flex-col overflow-hidden animate-in zoom-in-95 fade-in duration-300">


                <button
                    onClick={() => setTimeSelectionPopupPanelVisible(true)}
                    className="absolute bottom-8 right-13 flex items-center gap-4 h-10 px-4 py-1.5 bg-cyan-600 hover:bg-cyan-700 hover:scale-105 text-cyan-50 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-cyan-600 hover:text-white transition-all shadow-sm"
                >
                    <Calendar className='h-5 w-5' />
                    <p className='text-[14px]'>Change Date</p>
                </button>


                {/* Glossy Header Area */}
                <div className="relative p-8 border-b border-slate-100 bg-gradient-to-br from-white via-white to-cyan-50/30">
                    <button
                        onClick={() => setVisibility(false)}
                        className="absolute top-0 right-0 h-10 w-10 rounded-full flex justify-center items-center bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500 hover:rotate-90 transition-all duration-300"
                    >
                        <X size={20} />
                    </button>

                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-cyan-500 rounded-xl shadow-lg shadow-cyan-200 text-white">
                                <Sparkles size={24} />
                            </div>
                            <h1 className="text-3xl font-black text-slate-800 tracking-tighter">
                                Teacher <span className="text-cyan-500">Attendance</span>
                            </h1>
                        </div>

                        <p className="text-sm font-semibold text-slate-400 ml-1 flex items-center gap-2">
                            <CalendarDays size={16} className="text-cyan-400" />
                            {dateForWhichAttendenceRequired?.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>

                    </div>
                </div>

                {/* List Container (Main Grid) */}
                <div className="flex-1 overflow-y-auto p-8 pt-4 custom-scrollbar bg-slate-50/30">
                    {teacherAttendeceData ? (
                        <div className="flex flex-wrap gap-4">
                            {teacherAttendeceData?.teachers?.map((eachTeacher, index) => {
                                const status = eachTeacher?.presenceStatus?.toLowerCase() || 'pending';
                                const style = statusConfig[status] || statusConfig.pending;

                                return (
                                    <div
                                        key={index}
                                        className="bg-white w-max border border-slate-100 rounded-3xl p-5 hover:border-cyan-200 transition-all duration-300 shadow-sm hover:shadow-md group"
                                    >
                                        <div className="flex gap-7 items-center justify-between  mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center font-black text-slate-400 group-hover:bg-cyan-500 group-hover:text-white transition-all">
                                                    {eachTeacher?.name?.charAt(0)}
                                                </div>
                                                <div className="space-y-0.5 ">
                                                    <h2 className="font-bold text-slate-800 tracking-tight group-hover:text-cyan-600 transition-colors">
                                                        {eachTeacher?.name?.toUpperCase()}
                                                    </h2>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">ID: {eachTeacher?.instituteId}</p>
                                                </div>
                                            </div>
                                            <div className={`${style.bg} ${style.text} ${style.border} border px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter flex items-center gap-1.5`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${style.dot} animate-pulse`}></span>
                                                {status}
                                            </div>
                                        </div>

                                        {/* Actions Grid */}
                                        <div className="flex gap-1.5 bg-slate-50 p-1 rounded-2xl border border-slate-100">
                                            {['present', 'leave', 'absent'].map((act) => (
                                                <button
                                                    key={act}
                                                    onClick={() => handleTeacherCardAttendenceButtonClick(eachTeacher, act)}
                                                    className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold uppercase transition-all duration-200 ${eachTeacher.presenceStatus === act
                                                        ? 'bg-white text-cyan-600 shadow-sm ring-1 ring-slate-200/50 scale-[1.02]'
                                                        : 'text-slate-400 hover:text-slate-600 hover:bg-white/50'
                                                        }`}
                                                >
                                                    {act}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        /* Enhanced Empty State Layout */
                        <div className="h-full flex flex-col items-center justify-center p-12">
                            <div className="relative mb-8">
                                <div className="absolute inset-0 bg-cyan-200 blur-3xl opacity-20 animate-pulse"></div>
                                <div className="relative w-24 h-24 bg-white rounded-[2rem] shadow-xl flex items-center justify-center text-cyan-500 border border-cyan-50">
                                    <Search size={48} />
                                </div>
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">Records Empty</h3>
                            <p className="text-slate-400 font-medium text-sm mb-10 max-w-[250px] text-center">
                                No attendance data exists for this specific timeline.
                            </p>
                            <button
                                onClick={handleCreateTeacherAttendence}
                                className="px-10 py-4 bg-slate-900 text-white rounded-[1.5rem] font-bold shadow-2xl shadow-slate-200 hover:bg-cyan-600 hover:shadow-cyan-200 transition-all duration-300 flex items-center gap-3 active:scale-95"
                            >
                                <CirclePlus size={20} />
                                Initialize Today
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer Style Action Button */}
                {/* <Link
                    to="/teacherCreation"
                    className="absolute bottom-10 right-10 h-14 w-14 rounded-2xl bg-slate-900 text-white shadow-2xl flex items-center justify-center hover:bg-cyan-600 hover:rotate-90 transition-all duration-500"
                >
                    <CirclePlus size={28} />
                </Link> */}
            </div>

            {/* --- REUSED DATE SELECTION MODAL --- */}
            {timeSelectionPopupPanelVisible && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
                    <div onClick={() => setTimeSelectionPopupPanelVisible(false)} className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300"></div>
                    <div className="relative w-full max-w-sm bg-white rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95 duration-500">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-black text-slate-800 uppercase italic">Set Timeline</h2>
                        </div>
                        <input
                            type="date"
                            value={dateForWhichAttendenceRequired.toISOString().split("T")[0]}
                            onChange={(e) => setDateForWhichAttendenceRequired(new Date(e.target.value))}
                            className='w-full bg-slate-50 p-5 rounded-2xl border border-slate-100 mb-6 text-xl font-bold text-slate-800 outline-none'
                        />
                        <button
                            onClick={getSeletedDayTeacherAttendenceDataFunction}
                            className='w-full py-5 rounded-2xl bg-cyan-600 text-white font-black text-lg hover:bg-slate-900 transition-all duration-300 active:scale-95'
                        >
                            Load Records
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}