

import React from 'react'
import { useGetMemberAttendanceQuery } from '../api/member.rtk.api'










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









const MemberAttedanceComp = ({ memberId }) => {
    const { data: attendanceData } = useGetMemberAttendanceQuery(memberId)

    return (
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
                    <div className="absolute inset-0 rounded-full border-[12px] border-edge-brand border-t-transparent" />
                </div>
            </div>
        </div>
    )
}

export default MemberAttedanceComp