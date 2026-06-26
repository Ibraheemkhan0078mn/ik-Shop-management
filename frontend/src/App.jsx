
import React, { useEffect, useState } from "react";
import AppRoutes from "./routes/AppRoutes";
import LoadingBar from "react-top-loading-bar";
import { Toaster } from "sonner"
import Sidebar from "./shared/components/SideBar.jsx";
import { useLocation, useNavigate } from "react-router-dom";
import { ShoppingCart } from "lucide-react";

function App() {

  const [sideBarShow, setSidebarShow] = useState(true)
  const location = useLocation();
  const navigate = useNavigate();
  const notAllowedSideRoutes = ["/", "login", "signup", "pos"]

  useEffect(() => {
    if (location.pathname == "/") {
      const shouldShowSidebar = !notAllowedSideRoutes.some((item) => location.pathname.includes(item));
      setSidebarShow(shouldShowSidebar);
    }
  }, [location.pathname ])








  return (
    <div className="flex w-screen">
      <Toaster position="top-center" />
      {(location.pathname !== "/") && <Sidebar />}

      {/* <LoadingBar height={3} color="#3b82f6" ref={loadingRef} /> */}
      <div className="p-5 flex-1 w-[70%]">
        <AppRoutes />
      </div>
      
      {/* Floating POS Button */}
      {location.pathname !== "/pos" && location.pathname !== "/login" && location.pathname !== "/signup" && location.pathname !== "/" && (
        <button
          onClick={() => navigate("/pos")}
          className="fixed bottom-6 right-6 w-16 h-16 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 z-50"
          style={{ background: "var(--accent-2)", color: "white" }}
        >
          <ShoppingCart size={28} />
        </button>
      )}
      {/* <ReactQueryDevtools initialIsOpen={false} /> */}
    </div>
  );
}

export default App;

