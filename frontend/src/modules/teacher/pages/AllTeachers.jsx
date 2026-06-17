import React, { use, useContext, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MyContext } from '../../../context/MyContext'
import AdminSideTeacherFilteration from '../parts/AdminSideTeacherFilteration'
import { useSelector } from 'react-redux'
import { CalendarCheck, CirclePlus, Filter } from 'lucide-react'
import ScreenTabButton from '../../../common/components/ScreenTabButton.jsx'
import EachTeacherDataComp from '../parts/EachTeacherDataComp'
import TeacherCreate from '../parts/TeacherCreate'
import { TeacherAttendenceComp } from '../parts/TeacherAttendanceComp'
import { useGetAllTeacherData } from '../api/teacher.api'
import { useHotkeys } from 'react-hotkeys-hook'
import { PermissionGuard } from '@shared/components/PermissionGuard'
const AllTeachers = () => {
    let { data: allTeachersDataQuery } = useGetAllTeacherData()

    const [allTeachersData, setAllTeachersData] = useState([])



    let AdminStudentPageRef = useRef()
    // const [allTeachersData, setAllTeacherData] = useState([])
    let [teacherAttendanceVisibility, setTeacherAttendanceVisibility] = useState(false)
    let {
        TeacherFilterationObjContextState,
    } = useContext(MyContext)


    let [teacherFilterationPanelVisibility, setTeacherFilterationPanelVisibility] = useState(false)
    let [currentClickedTeacherId, setCurrentClickedTeacherId] = useState(null)
    let [teacherDataPanelVisibility, setTeacherDataPanelVisibility] = useState(false)
    let [teacherCreationCompVisibility, setTeacherCreationCompVisibility] = useState(false)



    useHotkeys("ctrl+n", () => { setTeacherCreationCompVisibility(true) }, [])






    useEffect(() => { setAllTeachersData((allTeachersDataQuery && allTeachersDataQuery?.length != 0) ? allTeachersDataQuery.filter(t => t.post != "investor") : []) }, [allTeachersDataQuery])













    return (
        // MAIN CONTAINER
        <div className='h-full overflow-hidden relative flex   '>






            {/* <Navbar /> */}





            {teacherAttendanceVisibility && <TeacherAttendenceComp setVisibility={setTeacherAttendanceVisibility} />}
            <AdminSideTeacherFilteration setTeacherFilterationPanelVisibility={setTeacherFilterationPanelVisibility} teacherFilterationPanelVisibility={teacherFilterationPanelVisibility} />
            {teacherDataPanelVisibility && <EachTeacherDataComp teacherId={currentClickedTeacherId} setVisibility={setTeacherDataPanelVisibility} />}
            {teacherCreationCompVisibility && <TeacherCreate setVisibility={setTeacherCreationCompVisibility} />}




            {/* CONTAINER */}
            <div
                ref={AdminStudentPageRef}
                onWheel={(e) => {
                    AdminStudentPageRef.current.scrollTop += e.deltaY
                }}
                className="h-screen overflow-y-scroll flex-1 p-10 font-sans">








                {/* Header Section */}
                <div className="mb-10">
                    <h1 className="w-max bg-gradient-to-r from-cyan-600 to-blue-800 bg-clip-text text-4xl font-bold text-transparent">
                        Teachers
                    </h1>
                    <p className="text-slate-500 text-lg font-medium">
                        All Teachers & Interns are present here.
                    </p>
                </div>






                <div className="flex gap-5">



                    <PermissionGuard permission={"teacher-create"}>
                        <div onClick={() => {
                            setTeacherCreationCompVisibility(true)
                        }}>
                            <ScreenTabButton text={"Add Teacher"} lucideIcon={CirclePlus} />
                        </div>
                    </PermissionGuard>





                    <PermissionGuard permission={"teacher-attendance-view"}>
                        <div onClick={() => { setTeacherAttendanceVisibility(true) }}
                        >
                            <ScreenTabButton text={"Attendance"} lucideIcon={CalendarCheck} />
                        </div>
                    </PermissionGuard>


                    <div
                        onClick={() => { setTeacherFilterationPanelVisibility(prev => !prev) }}
                    >
                        <ScreenTabButton text={"Filter"} lucideIcon={Filter} />
                    </div>
                </div>















                <PermissionGuard permission={"teacher-view"}>
                    <div className="h-max w-full overflow-x-hidden flex flex-wrap gap-5 p-10 pt-10  justify-center items-center">
                        {
                            allTeachersData?.length > 0
                                ?




                                allTeachersData?.map((eachTeacherData, index) => {





                                    let teacherNameMatching = !TeacherFilterationObjContextState?.teacherName || eachTeacherData?.name?.toLowerCase().includes(TeacherFilterationObjContextState?.teacherName?.toLowerCase())
                                    let teacherIdMatching = !TeacherFilterationObjContextState?.teacherInstituteId || eachTeacherData?.instituteId?.toLowerCase()?.includes(TeacherFilterationObjContextState.teacherInstituteId?.toLowerCase())
                                    let teacherPostMatching = !TeacherFilterationObjContextState?.post || eachTeacherData.post?.toLowerCase() == TeacherFilterationObjContextState.post?.toLowerCase()
                                    if (teacherNameMatching && teacherIdMatching && teacherPostMatching) {





                                        let InitialLetter;
                                        if (eachTeacherData?.name) {

                                            let teacherNameSectionArray = eachTeacherData?.name?.split(" ")

                                            if (teacherNameSectionArray?.length > 0) {
                                                let firstName, SecondName, firstletter, secondLetter;
                                                firstName = teacherNameSectionArray[0]
                                                SecondName = teacherNameSectionArray[1]

                                                firstletter = firstName?.split('')
                                                secondLetter = SecondName?.split("")


                                                if (firstletter[0]) {
                                                    if (secondLetter && secondLetter[0] != undefined) {
                                                        InitialLetter = firstletter[0] + secondLetter[0]
                                                    } else {
                                                        InitialLetter = firstletter[0]
                                                    }
                                                }
                                            }

                                        }






                                        return (

                                            <div
                                                key={index}
                                                onClick={() => {
                                                    //  Navigate(`/eachTeacherDataPage/${eachTeacherData?._id}`)
                                                    setCurrentClickedTeacherId(eachTeacherData?._id)
                                                    setTeacherDataPanelVisibility(true)
                                                }
                                                }
                                                className="group p-6 bg-white rounded-[2rem] shadow-sm border border-gray-100 flex flex-col items-center transition-all duration-300 hover:shadow-xl hover:-translate-y-2 cursor-pointer w-72 xl:w-80"
                                            >
                                                {/* Avatar Section */}
                                                <div className="w-24 h-24 mb-4 relative">
                                                    {/* If no image exists, use your gradient InitialLetter circle */}
                                                    {
                                                        eachTeacherData?.profileImage ?
                                                            <img
                                                                className="w-full h-full rounded-full border-4 border-white shadow-md flex items-center justify-center bg-gradient-to-r from-[#64d9a3] to-[#1c6f48] text-white text-2xl font-bold transition-transform group-hover:scale-105"
                                                                src={`http:///uploads/${eachTeacherData.profileImage}`} alt="" />
                                                            :
                                                            <div className="w-full h-full capitalize rounded-full border-4 border-white shadow-md flex items-center justify-center bg-gradient-to-r from-[#64d9a3] to-[#1c6f48] text-white text-2xl font-bold transition-transform group-hover:scale-105">
                                                                {InitialLetter}
                                                            </div>
                                                    }


                                                    {/* Status Badge (The green dot from the image) */}
                                                    {/* <div className="absolute bottom-1 right-1 w-5 h-5 bg-teal-500 border-2 border-white rounded-full"></div> */}
                                                </div>

                                                {/* Name and Post */}
                                                <h3 className="text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors uppercase truncate w-full text-center">
                                                    {eachTeacherData.name}
                                                </h3>
                                                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-4">
                                                    {eachTeacherData?.post || "Faculty"}
                                                </p>

                                                {/* Info Box (Gray container from image) */}
                                                <div className="w-full flex justify-between items-center bg-slate-50 rounded-2xl px-4 py-3 mt-auto group-hover:bg-blue-50 transition-colors">
                                                    <div className="text-left">
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Institute ID</p>
                                                        <p className="text-xs font-bold text-slate-700">#{eachTeacherData?.instituteId || "N/A"}</p>
                                                    </div>

                                                    {/* Action Icon */}
                                                    <div className="w-8 h-8 rounded-full bg-white text-slate-300 group-hover:text-blue-600 flex items-center justify-center shadow-sm transition-colors">
                                                        <i className="ri-arrow-right-line text-lg"></i>
                                                    </div>
                                                </div>

                                                {/* Hidden Detail Footer (Optional tags for Phone/Education) */}
                                                {/* <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                <span className="text-[9px] bg-blue-100 text-blue-600 px-2 py-1 rounded-md font-bold uppercase">
                                                    {eachTeacherData.phoneNo}
                                                </span>
                                            </div> */}
                                            </div>
                                        )



                                    } else {
                                        return null;
                                    }




                                })
                                :
                                <div className='text-gray-600 h-[50vh] w-full flex justify-center items-center'>No Teachers found</div>
                        }
                    </div>

                </PermissionGuard>




















            </div>











        </div>
    )
}

export default AllTeachers

