import React, { useRef, useState } from 'react'
import Navbar from '../../../shared/components/Navbar'
import { useParams } from 'react-router-dom'
import api from "@shared/services/axiosInstance.js"

const TeacherTimeBasedAttendanceCalculation = () => {



    let teacherAttendenceCalcConrtainerRef = useRef()
    let param = useParams()



    let [formData, setFormData] = useState({
        fromDate: "",
        tillDate: ""
    })



    let [attendenceCalculatedData, setAttendenceCalculatedData] = useState({
        presence: 0,
        absence: 0,
        leave: 0,
        totalClass: 0,
        percentage: 0
    })























    async function handleSubmit(e) {
        try {
            let formDataToSend = { ...formData, teacherDocId: param?.id }

            let response = await api.post("/teacherRoute/fromTillTimeAttendenceCalculation", formDataToSend)
            if (response?.data?.success == true) {
                let data = response?.data
                setAttendenceCalculatedData({
                    presence: data.presence,
                    absence: data?.absence,
                    leave: data?.leave,
                    totalClass: data?.totalClasses,
                    percentage: data?.presencePercentage
                })
            }
        } catch (error) {
            console.error(error)
        }
    }









    return (
        // MAIN CONTAINER
        <div className="h-full ml-60 overflow-hidden relative">

            {/* ADMIN NAVBAR */}
            {/* <Navbar /> */}

            {/* CONTAINER */}
            <div
                ref={teacherAttendenceCalcConrtainerRef}
                onWheel={(e) => {
                    teacherAttendenceCalcConrtainerRef.current.scrollTop += e.deltaY
                }}
                className="h-[96%] m-5 bg-white shadow-md p-6 rounded-2xl select-none overflow-hidden relative"
            >

                {/* HEADING */}
                <div className="px-5 w-full border-b border-zinc-300">
                    <h1 className="w-max font-bold text-4xl text-zinc-700 flex items-center relative p-5">
                        Timebased Attendance Calculation
                    </h1>
                </div>

                {/* FORM SECTION */}
                <div className="w-full flex flex-col gap-10 p-10 items-center">

                    <div className="flex gap-10 flex-wrap justify-center mt-5">
                        <label className="flex flex-col text-xl gap-2 font-semibold text-zinc-700">
                            From Date
                            <input
                                value={formData.fromDate}
                                type="date"
                                onChange={(e) => setFormData({ ...formData, fromDate: e.target.value })}
                                className="h-14 w-80 text-lg font-medium border border-zinc-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-300 outline-none"
                            />
                        </label>

                        <label className="flex flex-col text-xl gap-2 font-semibold text-zinc-700">
                            Till Date
                            <input
                                type="date"
                                value={formData.tillDate}
                                onChange={(e) => setFormData({ ...formData, tillDate: e.target.value })}
                                className="h-14 w-80 text-lg font-medium border border-zinc-300 rounded-xl p-3 focus:ring-2 focus:ring-blue-300 outline-none"
                            />
                        </label>
                    </div>

                    <button
                        onClick={handleSubmit}
                        className="h-14 w-80 mt-3 p-2 rounded-xl bg-green-500 hover:bg-green-600 transition-all duration-200 text-white text-2xl font-bold shadow-md"
                    >
                        Submit
                    </button>
                </div>

                {/* RESULT CARDS */}
                <div className="w-full p-10 flex gap-6 justify-center text-center flex-wrap">

                    {[
                        ["Presence", attendenceCalculatedData?.presence],
                        ["Absence", attendenceCalculatedData?.absence],
                        ["Leave", attendenceCalculatedData?.leave],
                        ["Total", attendenceCalculatedData?.totalClass],
                        ["Percentage", `${attendenceCalculatedData?.percentage} %`],
                    ].map(([label, value]) => (
                        <div
                            key={label}
                            className="min-w-[160px] bg-zinc-100 border border-zinc-300 rounded-xl p-6 px-10 shadow-sm"
                        >
                            <h3 className="font-semibold text-xl text-zinc-700">{label}</h3>
                            <h3 className="text-zinc-500 mt-3 text-lg font-medium">{value}</h3>
                        </div>
                    ))}

                </div>

            </div>
        </div>

    )
}

export default TeacherTimeBasedAttendanceCalculation
