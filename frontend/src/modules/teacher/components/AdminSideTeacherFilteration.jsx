import React, { useContext, useEffect } from 'react'
import { MyContext } from '@shared/context/MyContext'

const AdminSideTeacherFilteration = ({ setTeacherFilterationPanelVisibility, teacherFilterationPanelVisibility }) => {





    let {
        TeacherFilterationObjContextState,
        setTeacherFilterationObjContextState
    } = useContext(MyContext)














    async function handleRemoveAllTeacherFilterFunction() {
        setTeacherFilterationObjContextState({
            teacherInstituteId: "",
            teacherName: ""
        })
    }












    return (
        // MAIN CONTAINER
        <div className={`h-[90%] w-96  absolute top-1/2 -translate-y-1/2 z-50 ${teacherFilterationPanelVisibility ? "right-0" : "right-[-400px]"} text-zinc-800  transition-all duration-400 backdrop-blur-3xl border-t-2  border-l-2 border-b-2 border-zinc-400  rounded-l-2xl rounded-r-sm flex flex-col items-center   `}>




            {/* ICON OF CROSS */}
            <div className="w-full flex justify-end mt-5 mr-10  text-lg">
                <i
                    onClick={() => { setTeacherFilterationPanelVisibility(prev => !prev) }}
                    className="ri-close-line   font-bold text-xl"></i>
            </div>






            {/* UPPER HEADING  */}
            <h3 className=' font-semibold mt-20 text-2xl flex items-center ' >
                Teacher Filteration
                <i
                    onClick={handleRemoveAllTeacherFilterFunction}
                    className="ri-filter-off-line     text-lg ml-5"></i>
            </h3>

















            {/* CONTAINER CONTAINING INPUT WHICH VALUE FIT IN THE OBJECT IN CONTEXT AND THEN ON THE BASIS OF WHICH I APPLY THE FILTERRATION */}
            <div className="flex flex-col gap-2 mt-10 px-20 text-sm">




                {/* FOR ID BASED FILTERATION */}
                <input
                    className=' border-2 border-zinc-400 rounded-full p-2 px-3  text-sm   '
                    type="text"
                    value={TeacherFilterationObjContextState.teacherInstituteId}
                    onChange={(e) => { setTeacherFilterationObjContextState({ ...TeacherFilterationObjContextState, teacherInstituteId: e.target.value }) }}
                    placeholder='Enter teacher id.......' />





                {/* FOR ID BASED FILTERATION */}
                <input
                    className=' border-2 border-zinc-400 rounded-full p-2 px-3  text-sm   '
                    type="text"
                    value={TeacherFilterationObjContextState.teacherName}
                    onChange={(e) => { setTeacherFilterationObjContextState({ ...TeacherFilterationObjContextState, teacherName: e.target.value }) }}
                    placeholder='Enter teacher name.......' />




                <select
                className=' border-2 border-zinc-400 rounded-full p-2 px-3  text-sm   '
                    onChange={(e) => { setTeacherFilterationObjContextState({ ...TeacherFilterationObjContextState, post: e.target.value }) }}
                    value={TeacherFilterationObjContextState.post}>
                    <option value="">Select Member Post....</option>
                    <option value="teacher">Teacher</option>
                    <option value="intern">Intern</option>
                </select>


            </div>


        </div>
    )
}

export default AdminSideTeacherFilteration


