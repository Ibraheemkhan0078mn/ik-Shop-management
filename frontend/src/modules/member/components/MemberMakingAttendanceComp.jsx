


import React, { useState } from 'react'
import { toast } from 'react-toastify'
import { CirclePlus, CalendarDays, Search, X, Sparkles, Calendar, QrCode } from 'lucide-react'
// import Scanner from '../../../common/components/Scanner.jsx'
import {
    useGetAttendanceByDateQuery,
    useMarkScannerAttendanceMutation,
    useCreateDayAttendanceMutation,
    useUpdateMemberAttendanceStatusMutation
} from '../api/member.rtk.api.js'
import { toInputDateFormat } from '@shared/utilities/date.utility.js'

export const MemberMakingAttendenceComp = ({ setVisibility }) => {

    const [dateForWhichAttendenceRequired, setDateForWhichAttendenceRequired] = useState(new Date().toISOString())
    const [scannerOpen, setScannerOpen] = useState(false)
    const [scannerData, setScannerData] = useState(null)
    const [timeSelectionPopupPanelVisible, setTimeSelectionPopupPanelVisible] = useState(false)

    const { data: attendanceResponse, refetch } = useGetAttendanceByDateQuery(
        { date: dateForWhichAttendenceRequired },
        { skip: !dateForWhichAttendenceRequired }
    )
    const memberAttendeceData = attendanceResponse?.memberAttendence ?? null

    const [markScannerAttendance] = useMarkScannerAttendanceMutation()
    const [createDayAttendance] = useCreateDayAttendanceMutation()
    const [updateMemberAttendanceStatus] = useUpdateMemberAttendanceStatusMutation()

    const handleScan = async (value) => {
        setScannerData({ value, ts: Date.now() })
        setScannerOpen(false)
        try {
            const res = await markScannerAttendance({ instituteId: value, date: dateForWhichAttendenceRequired }).unwrap()
            if (res?.success) toast.success('Attendance marked present')
            else toast.error(res?.msg || res?.reason || 'Something went wrong')
        } catch (err) {
            toast.error(err?.data?.msg || 'Something went wrong')
        }
    }

    const handleCreateMemberAttendence = async () => {
        try {
            const res = await createDayAttendance({ date: dateForWhichAttendenceRequired }).unwrap()
            if (!res?.success) toast.error(res?.msg || res?.reason || 'Something went wrong')
        } catch (err) {
            toast.error('Something went wrong')
        }
    }

    const handleMemberCardAttendenceButtonClick = async (eachMember, status) => {
        try {
            await updateMemberAttendanceStatus({
                memberDocId: eachMember?.id,
                presenceStatus: status,
                currentAttendenceDocumentId: memberAttendeceData?._id
            }).unwrap()
        } catch (err) {
            toast.error('Something went wrong')
        }
    }

    const handleDateChange = (e) => {
        setDateForWhichAttendenceRequired(new Date(e.target.value).toISOString())
    }

    const handleLoadRecords = () => {
        refetch()
        setTimeSelectionPopupPanelVisible(false)
    }

    const displayDate = new Date(dateForWhichAttendenceRequired).toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    })

    const inputDateValue = dateForWhichAttendenceRequired.split('T')[0]

    const statusConfig = {
        present: { bg: 'bg-success-muted', text: 'text-success', border: 'border-success-muted', dot: 'bg-success' },
        absent:  { bg: 'bg-danger-muted',    text: 'text-rose-700',    border: 'border-danger',    dot: 'bg-danger'    },
        leave:   { bg: 'bg-warning-muted',   text: 'text-amber-700',   border: 'border-amber-100',   dot: 'bg-warning'   },
        pending: { bg: 'bg-surface-muted',   text: 'text-ink-muted',   border: 'border-edge',   dot: 'bg-border'   }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6">
            <div className="absolute inset-0 app-overlay app-enter" onClick={() => setVisibility(false)} />

            {/* {scannerOpen && (
                <Scanner onScan={handleScan} onClose={() => setScannerOpen(false)} />
            )} */}

            <div className="relative w-full max-w-5xl h-[85vh] bg-surface rounded-[2.5rem] shadow-2xl shadow-sm/20 border border-surface flex flex-col overflow-hidden app-enter">

                <button onClick={() => setTimeSelectionPopupPanelVisible(true)} className="absolute bottom-8 right-13 flex items-center gap-4 h-10 px-4 py-1.5 bg-primary hover:bg-primary hover:scale-105 text-primary-foreground/90 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-sm">
                    <Calendar className='h-5 w-5' />
                    <p className='text-[14px]'>Change Date</p>
                </button>
                <button onClick={() => setScannerOpen(true)} className="absolute bottom-8 right-60 flex items-center gap-4 h-10 px-4 py-1.5 bg-primary hover:bg-primary hover:scale-105 text-primary-foreground/90 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-sm">
                    <QrCode className='h-5 w-5' />
                    <p className='text-[14px]'>Attendance Scanner</p>
                </button>

                <div className="relative p-8 border-b border-edge bg-gradient-to-br from-white via-white to-primary-muted/30">
                    <button onClick={() => setVisibility(false)} className="absolute top-0 right-0 h-10 w-10 rounded-full flex justify-center items-center bg-surface-muted text-ink-subtle hover:bg-danger-muted hover:text-danger hover:rotate-90 transition-all duration-300">
                        <X size={20} />
                    </button>
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary-muted rounded-xl shadow-lg shadow-sm text-primary-foreground">
                                <Sparkles size={24} />
                            </div>
                            <h1 className="text-3xl font-black text-ink tracking-tighter">
                                Member <span className="text-ink">Attendance</span>
                            </h1>
                        </div>
                        <p className="text-sm font-semibold text-ink-subtle ml-1 flex items-center gap-2">
                            <CalendarDays size={16} className="text-accent" />
                            {displayDate}
                        </p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-8 pt-4 custom-scrollbar bg-surface-muted/30">
                    {memberAttendeceData ? (
                        <div className="flex flex-wrap gap-4">
                            {memberAttendeceData?.members?.map((eachMember, index) => {
                                const status = eachMember?.presenceStatus?.toLowerCase() || 'pending'
                                const style = statusConfig[status] || statusConfig.pending
                                return (
                                    <div key={index} className="bg-surface w-max border border-edge rounded-3xl p-5 hover:border-edge-brand transition-all duration-300 shadow-sm hover:shadow-md group">
                                        <div className="flex gap-7 items-center justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-2xl bg-surface-muted border border-edge flex items-center justify-center font-black text-ink-subtle group-hover:bg-primary-muted group-hover:text-primary-foreground transition-all">
                                                    {eachMember?.name?.charAt(0)}
                                                </div>
                                                <div className="space-y-0.5">
                                                    <h2 className="font-bold text-ink tracking-tight group-hover:text-primary transition-colors">{eachMember?.name?.toUpperCase()}</h2>
                                                    <p className="text-[10px] font-bold text-ink-subtle uppercase tracking-tighter">ID: {eachMember?.instituteId}</p>
                                                </div>
                                            </div>
                                            <div className={`${style.bg} ${style.text} ${style.border} border px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter flex items-center gap-1.5`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`}></span>
                                                {status}
                                            </div>
                                        </div>
                                        <div className="flex gap-1.5 bg-surface-muted p-1 rounded-2xl border border-edge">
                                            {['present', 'leave', 'absent'].map((act) => (
                                                <button key={act} onClick={() => handleMemberCardAttendenceButtonClick(eachMember, act)}
                                                    className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold uppercase transition-all duration-200 ${eachMember.presenceStatus === act ? 'bg-surface text-primary shadow-sm ring-1 ring-edge/50 scale-[1.02]' : 'text-ink-subtle hover:text-ink-muted hover:bg-surface/50'}`}>
                                                    {act}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center p-12">
                            <div className="relative mb-8">
                                <div className="absolute inset-0 bg-primary-muted opacity-20"></div>
                                <div className="relative w-24 h-24 bg-surface rounded-[2rem] shadow-xl flex items-center justify-center text-ink border border-edge-brand">
                                    <Search size={48} />
                                </div>
                            </div>
                            <h3 className="text-2xl font-black text-ink mb-2 tracking-tight">Records Empty</h3>
                            <p className="text-ink-subtle font-medium text-sm mb-10 max-w-[250px] text-center">No attendance data exists for this specific timeline.</p>
                            <button onClick={handleCreateMemberAttendence} className="px-10 py-4 bg-inverse text-primary-foreground rounded-[1.5rem] font-bold shadow-2xl shadow-slate-200 hover:bg-primary hover:shadow-sm transition-all duration-300 flex items-center gap-3 active:scale-95">
                                <CirclePlus size={20} />
                                Initialize Today
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {timeSelectionPopupPanelVisible && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
                    <div onClick={() => setTimeSelectionPopupPanelVisible(false)} className="absolute inset-0 app-overlay app-enter"></div>
                    <div className="relative w-full max-w-sm bg-surface rounded-[2.5rem] p-10 shadow-2xl app-enter">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-black text-ink uppercase italic">Set Timeline</h2>
                        </div>
                        <input
                            type="date"
                            max={toInputDateFormat(new Date())}
                            value={inputDateValue}
                            onChange={handleDateChange}
                            className='w-full bg-surface-muted p-5 rounded-2xl border border-edge mb-6 text-xl font-bold text-ink outline-none'
                        />
                        <button onClick={handleLoadRecords} className='w-full py-5 rounded-2xl bg-primary text-primary-foreground font-black text-lg hover:bg-inverse transition-all duration-300 active:scale-95'>
                            Load Records
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}