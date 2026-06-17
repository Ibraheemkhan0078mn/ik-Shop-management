import React, { useEffect, useState } from "react";
import AppRoutes from "./routes/AppRoutes";
import LoadingBar from "react-top-loading-bar";
import { Toaster } from "sonner"
import Sidebar from "@shared/components/SideBar";
import { useLocation } from "react-router-dom";

function App() {

  let [sideBarShow, setSidebarShow] = useState(true)
  const location = useLocation();
  let notAllowedSideRoutes = ["login", 'register', "pos"]

useEffect(()=>{
    notAllowedSideRoutes.forEach((item) => {
    if (location.pathname.includes(item)) {
      setSidebarShow(false)
    } else {
      setSidebarShow(true)
    }
  })

},[location.pathname])








  return (
    <div className="flex  w-screen">
      <Toaster position="top-center" />
      {sideBarShow && <Sidebar />}

      {/* <LoadingBar height={3} color="#3b82f6" ref={loadingRef} /> */}
    <div className="p-5 flex-1 w-[70%]">
        <AppRoutes />
    </div>
      {/* <ReactQueryDevtools initialIsOpen={false} /> */}
    </div>
  );
}

export default App;

