import React, {  useEffect, useRef, useState } from 'react'
import AdminSideMemberFilteration from '../parts/AdminSideMemberFilteration'
import { CirclePlus, Filter } from 'lucide-react'
import ScreenTabButton from '../../../common/components/ScreenTabButton'
import EachMemberDataComp from '../parts/EachInvestorDataComp'
import MemberCreate from '../parts/InvestorCreate'
import { useGetAllMembersQuery } from '../../member/api/member.rtk.api.js'
import { useHotkeys } from 'react-hotkeys-hook'
import { PermissionGuard } from '@shared/components/PermissionGuard'





const AllInvestors = () => {
    let { data: allMembersData } = useGetAllMembersQuery()
    let AdminStudentPageRef = useRef()
    // const [allMembersData, setAllMemberData] = useState([])



    let [memberFilterationPanelVisibility, setMemberFilterationPanelVisibility] = useState(false)
    let [currentClickedMemberId, setCurrentClickedMemberId] = useState(null)
    let [memberDataPanelVisibility, setMemberDataPanelVisibility] = useState(false)
    let [memberCreationCompVisibility, setMemberCreationCompVisibility] = useState(false)
    const [allInvestorData, setallInvestorData] = useState([])


    useHotkeys("ctrl+n", () => { setMemberCreationCompVisibility(true) }, [])


    useEffect(() => {
        if (allMembersData?.length > 0) {
            setallInvestorData(allMembersData.filter(t => t?.post == "investor"))
        }
    }, [allMembersData])














    return (
        // MAIN CONTAINER
        <div className='h-full overflow-hidden relative flex   '>






            {/* <Navbar /> */}





            <AdminSideMemberFilteration setMemberFilterationPanelVisibility={setMemberFilterationPanelVisibility} memberFilterationPanelVisibility={memberFilterationPanelVisibility} />
            {memberDataPanelVisibility && <EachMemberDataComp memberId={currentClickedMemberId} setVisibility={setMemberDataPanelVisibility} />}
            {memberCreationCompVisibility && <MemberCreate setVisibility={setMemberCreationCompVisibility} />}




            {/* CONTAINER */}
            <div
                ref={AdminStudentPageRef}
                onWheel={(e) => {
                    AdminStudentPageRef.current.scrollTop += e.deltaY
                }}
                className="h-screen overflow-y-scroll flex-1 p-10 font-sans">








                {/* Header Section */}
                <div className="mb-10">
                    <h1 className="w-max app-gradient bg-clip-text text-4xl font-bold text-transparent">
                        Investor
                    </h1>
                    <p className="text-ink-muted text-lg font-medium">
                        All Investor are present here.
                    </p>
                </div>






                <div className="flex gap-5">



                    <PermissionGuard permission={"investor-create"}>
                        <div onClick={() => {
                            setMemberCreationCompVisibility(true)
                        }}>
                            <ScreenTabButton text={"Add Investor"} lucideIcon={CirclePlus} />
                        </div>
                    </PermissionGuard>




                    {/* 
                    <PermissionGuard permission={"member-attendance-view"}>
                        <div onClick={() => { setMemberAttendanceVisibility(true) }}
                        >
                            <ScreenTabButton text={"Attendance"} lucideIcon={CalendarCheck} />
                        </div>
                    </PermissionGuard> */}


                    <div
                        onClick={() => { setMemberFilterationPanelVisibility(prev => !prev) }}
                    >
                        <ScreenTabButton text={"Filter"} lucideIcon={Filter} />
                    </div>
                </div>















                <PermissionGuard permission={"investor-view"}>
                    <div className="h-max w-full overflow-x-hidden flex flex-wrap gap-5 p-10 pt-10  justify-center items-center">
                        {
                            allInvestorData?.length > 0
                                ?




                                allInvestorData?.map((eachMemberData, index) => {





                                   if (true) {




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
                                                className="group p-6 bg-surface rounded-[2rem] shadow-sm border border-edge flex flex-col items-center transition-all duration-300 hover:shadow-xl hover:-translate-y-2 cursor-pointer w-72 xl:w-80"
                                            >
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
                                                <p className="text-xs font-semibold text-ink-subtle uppercase tracking-widest mb-4">
                                                    {eachMemberData?.post || "Faculty"}
                                                </p>

                                                {/* Info Box (Gray container from image) */}
                                                <div className="w-full flex justify-between items-center bg-surface-muted rounded-2xl px-4 py-3 mt-auto group-hover:bg-primary-muted transition-colors">
                                                    <div className="text-left">
                                                        <p className="text-[10px] text-ink-subtle font-bold uppercase tracking-tighter">Institute ID</p>
                                                        <p className="text-xs font-bold text-ink">#{eachMemberData?.instituteId || "N/A"}</p>
                                                    </div>

                                                    {/* Action Icon */}
                                                    <div className="w-8 h-8 rounded-full bg-surface text-ink-subtle group-hover:text-primary flex items-center justify-center shadow-sm transition-colors">
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
                                <div className='text-ink-muted h-[50vh] w-full flex justify-center items-center'>No Investors found</div>
                        }
                    </div>

                </PermissionGuard>




















            </div>











        </div>
    )
}

export default AllInvestors
