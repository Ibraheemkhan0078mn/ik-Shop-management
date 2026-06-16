import React, { useContext, useEffect, useRef, useState } from 'react'
import AdminSideMemberFilteration from '../parts/AdminSideMemberFilteration'
import { CalendarCheck, CirclePlus, Filter } from 'lucide-react'
import ScreenTabButton from '../../../shared/components/ScreenTabButton'
import EachMemberDataComp from '../parts/EachMemberDataComp'
import { MemberMakingAttendenceComp } from '../parts/MemberMakingAttendanceComp'
import { useHotkeys } from 'react-hotkeys-hook'
import { PermissionGuard } from '../../../shared/components/PermissionGaurd'
import { useGetAllMembersQuery } from '../api/member.rtk.api'
import MemberCrudModel from '../parts/MemberCrudMode'
const AllMembers = () => {

    
    let [MemberFilterationObj, setMemberFilterationObj] = useState({
        memberInstituteId: "",
        memberName: "",
        post: "",
        isActive: true
    })


    let { data: allMembersDataQuery } = useGetAllMembersQuery({filter: {}})
    const [allMembersData, setAllMembersData] = useState([])



    let AdminStudentPageRef = useRef()
    let [memberAttendanceVisibility, setMemberAttendanceVisibility] = useState(false)





    let [memberFilterationPanelVisibility, setMemberFilterationPanelVisibility] = useState(false)
    let [currentClickedMemberId, setCurrentClickedMemberId] = useState(null)
    let [memberDataPanelVisibility, setMemberDataPanelVisibility] = useState(false)
    let [memberCreationCompVisibility, setMemberCreationCompVisibility] = useState(false)



    useHotkeys("ctrl+n", () => { setMemberCreationCompVisibility(true) }, [])





    // filter the investors form the members
    useEffect(() => { setAllMembersData((allMembersDataQuery && allMembersDataQuery?.length != 0) ? allMembersDataQuery.filter(t => t.post != "investor") : []) }, [allMembersDataQuery])













    return (
        // MAIN CONTAINER
        <div className='h-full overflow-hidden relative flex   '>






            {/* <Navbar /> */}





            {memberAttendanceVisibility && <MemberMakingAttendenceComp setVisibility={setMemberAttendanceVisibility} />}
            <AdminSideMemberFilteration MemberFilterationObj={MemberFilterationObj} setMemberFilterationObj={setMemberFilterationObj} setMemberFilterationPanelVisibility={setMemberFilterationPanelVisibility} memberFilterationPanelVisibility={memberFilterationPanelVisibility} />
            {memberDataPanelVisibility && <EachMemberDataComp memberId={currentClickedMemberId} setVisibility={setMemberDataPanelVisibility} />}
            {memberCreationCompVisibility && <MemberCrudModel operation="create" setVisibility={setMemberCreationCompVisibility} />}




            {/* CONTAINER */}
            <div
                ref={AdminStudentPageRef}
                onWheel={(e) => {
                    AdminStudentPageRef.current.scrollTop += e.deltaY
                }}
                className="h-screen overflow-y-scroll flex-1 p-10 font-sans app-page-bg">








                {/* Header Section */}
                <div className="mb-10">
                    <h1 className="app-gradient-text text-4xl font-bold">
                        Members
                    </h1>
                    <p className="text-ink-muted text-lg font-medium">
                        All Members & Interns are present here.
                    </p>
                </div>






                <div className="flex gap-5">



                    <PermissionGuard permission={"member-create"}>
                        <div onClick={() => {
                            setMemberCreationCompVisibility(true)
                        }}>
                            <ScreenTabButton text={"Add Member"} lucideIcon={CirclePlus} />
                        </div>
                    </PermissionGuard>





                    <PermissionGuard permission={"member-attendance-view"}>
                        <div onClick={() => { setMemberAttendanceVisibility(true) }}
                        >
                            <ScreenTabButton text={"Attendance"} lucideIcon={CalendarCheck} />
                        </div>
                    </PermissionGuard>


                    <div
                        onClick={() => { setMemberFilterationPanelVisibility(prev => !prev) }}
                    >
                        <ScreenTabButton text={"Filter"} lucideIcon={Filter} variant="secondary" />
                    </div>
                </div>















                <PermissionGuard permission={"member-view"}>
                    <div className="h-max w-full overflow-x-hidden flex flex-wrap gap-5 p-10 pt-10  justify-center items-center">
                        {
                            allMembersData?.length > 0
                                ?




                                allMembersData?.map((eachMemberData, index) => {





                                    let memberNameMatching = !MemberFilterationObj?.memberName || eachMemberData?.name?.toLowerCase().includes(MemberFilterationObj?.memberName?.toLowerCase())
                                    let memberIdMatching = !MemberFilterationObj?.memberInstituteId || eachMemberData?.instituteId?.toLowerCase()?.includes(MemberFilterationObj.memberInstituteId?.toLowerCase())
                                    let memberPostMatching = !MemberFilterationObj?.post || eachMemberData.post?.toLowerCase() == MemberFilterationObj.post?.toLowerCase()
                                    let memberIsActiveMatching = MemberFilterationObj?.isActive === eachMemberData.isActive
                                 
                                 
                                 
                                    if (memberNameMatching && memberIdMatching && memberPostMatching && memberIsActiveMatching && memberIsActiveMatching) {





                                        const InitialLetter = eachMemberData?.name
                                            ?.trim()
                                            .split(" ")
                                            .slice(0, 2)
                                            .map(word => word[0])
                                            .join("")





                                        return (

                                            <div
                                                key={index}
                                                onClick={() => {
                                                    //  Navigate(`/eachMemberDataPage/${eachMemberData?._id}`)
                                                    setCurrentClickedMemberId(eachMemberData?._id)
                                                    console.log(eachMemberData?._id)
                                                    setMemberDataPanelVisibility(true)
                                                }
                                                }
                                                className="group app-card p-6 rounded-[2rem] flex flex-col items-center hover:-translate-y-1 cursor-pointer w-72 xl:w-80"
                                            >
                                                {/* Avatar Section */}
                                                <div className="w-24 h-24 mb-4 relative">
                                                    {/* If no image exists, use your gradient InitialLetter circle */}
                                                    {eachMemberData?.profileImage ? (
                                                        <img
                                                            className="w-full h-full capitalize rounded-full border-4 border-surface shadow-md flex items-center justify-center app-gradient text-primary-foreground text-2xl font-bold transition-transform group-hover:scale-105"
                                                            src={`http://localhost:4000/uploads/${eachMemberData.profileImage}`}
                                                            alt=""
                                                            onError={(e) => {
                                                                e.target.style.display = 'none'
                                                                e.target.nextSibling.style.display = 'flex'
                                                            }}
                                                        />
                                                    ) : null}

                                                    <div
                                                        className="w-full h-full capitalize rounded-full border-4 border-surface shadow-md flex items-center justify-center app-gradient text-primary-foreground text-2xl font-bold transition-transform group-hover:scale-105"
                                                        style={{ display: eachMemberData?.profileImage ? 'none' : 'flex' }}
                                                    >
                                                        {InitialLetter}
                                                    </div>

                                                    {/* Status Badge (The green dot from the image) */}
                                                    {/* <div className="absolute bottom-1 right-1 w-5 h-5 bg-accent border-2 border-surface rounded-full"></div> */}
                                                </div>

                                                {/* Name and Post */}
                                                <h3 className="text-lg font-bold text-ink group-hover:text-primary transition-colors uppercase truncate w-full text-center">
                                                    {eachMemberData.name}
                                                </h3>
                                                <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-4">
                                                    {eachMemberData?.post || "Faculty"}
                                                </p>

                                                {/* Info Box (Gray container from image) */}
                                                <div className="w-full flex justify-between items-center bg-surface-muted rounded-2xl px-4 py-3 mt-auto group-hover:bg-primary-muted transition-colors">
                                                    <div className="text-left">
                                                        <p className="text-[10px] text-ink-subtle font-bold uppercase tracking-tighter">Institute ID</p>
                                                        <p className="text-xs font-bold text-primary">#{eachMemberData?.instituteId || "N/A"}</p>
                                                    </div>

                                                    {/* Action Icon */}
                                                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground group-hover:bg-primary-hover flex items-center justify-center shadow-sm transition-colors">
                                                        <i className="ri-arrow-right-line text-lg"></i>
                                                    </div>
                                                </div>

                                                {/* Hidden Detail Footer (Optional tags for Phone/Education) */}
                                                {/* <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                                <span className="text-[9px] bg-primary-muted text-primary px-2 py-1 rounded-md font-bold uppercase">
                                                    {eachMemberData.phoneNo}
                                                </span>
                                            </div> */}
                                            </div>
                                        )



                                    } else {
                                        return null;
                                    }




                                })
                                :
                                <div className='text-ink-muted h-[50vh] w-full flex justify-center items-center'>No Members found</div>
                        }
                    </div>

                </PermissionGuard>




















            </div>











        </div>
    )
}

export default AllMembers
