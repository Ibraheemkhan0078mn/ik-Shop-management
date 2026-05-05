import React, { createContext, useContext, useEffect, useRef, useState } from "react";
const MyContext = createContext()




const MyContextProvider = ({ children }) => {


  let abbortSyncApiRef = useRef(null)

  let [TeacherFilterationObjContextState, setTeacherFilterationObjContextState] = useState({
    teacherInstituteId: "",
    teacherName: "",
    post: ""
  })













  return (

    <MyContext.Provider value={{

      abbortSyncApiRef,
      TeacherFilterationObjContextState, setTeacherFilterationObjContextState,

    }}>




      {children}

    </MyContext.Provider>
  )
}






export {
  MyContext,
  MyContextProvider
}





