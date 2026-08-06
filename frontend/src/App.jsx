










import AppRoutes from "./routes/AppRoutes";
import Sidebar from "./shared/components/SideBar.jsx";
import { Toaster } from "sonner";
import { useLocation, useNavigate } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { useEffect } from "react";
import { applyTheme, getApiUrl } from "./shared/utilities/themeApplier.js";
import { useSelector } from "react-redux";
import { useSyncRequiredMutation } from "./modules/backup/api/backup.api.js";

const NO_CHROME_ROUTES = ["/", "/login", "/signup", "/pos"];

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const showChrome = !NO_CHROME_ROUTES.includes(location.pathname);
  const { id: userId } = useSelector(s => s.auth) || {};
  const [syncRequired] = useSyncRequiredMutation();

  useEffect(() => {
    fetch(getApiUrl("/api/theme/active"))
      .then((res) => res.json())
      .then((theme) => applyTheme(theme?.colors))
      .catch(() => {});
  }, []);

  // Apply zoom on app startup
  useEffect(() => {
    const applyZoom = (zoomLevel) => {
      // Try to use Electron's electronAPI if available
      if (window.electronAPI && window.electronAPI.setZoom) {
        window.electronAPI.setZoom(zoomLevel);
      } else {
        // Fallback to CSS transform for web
        document.body.style.transform = `scale(${zoomLevel})`;
        document.body.style.transformOrigin = 'top left';
        document.body.style.width = `${100 / zoomLevel}%`;
      }
    };

    // Load zoom from localStorage first
    const localZoom = localStorage.getItem('appZoom');
    if (localZoom) {
      applyZoom(parseFloat(localZoom));
    }
  }, []);

  // Auto-sync on app start when user is logged in
  useEffect(() => {
    if (userId) {
      const performInitialSync = async () => {
        try {
          console.log("Performing initial sync on app start...");
          await syncRequired().unwrap();
          console.log("Initial sync completed successfully");
        } catch (error) {
          console.error("Initial sync failed:", error);
        }
      };
      
      // Delay sync slightly to ensure app is fully loaded
      const timer = setTimeout(performInitialSync, 3000);
      return () => clearTimeout(timer);
    }
  }, [userId, syncRequired]);



  return (
    <div className="flex w-screen">
      <Toaster position="top-right" />
      {showChrome && <Sidebar />}

      <div className={`flex-1 w-[70%] ${showChrome ? "p-5" : "p-0"}`}>
        <AppRoutes />
      </div>

      {showChrome && (
        <button
          onClick={() => navigate("/pos")}
          className="fixed bottom-6 right-6 w-16 h-16 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 z-50"
          style={{ background: "var(--accent-2)", color: "white" }}
        >
          <ShoppingCart size={28} />
        </button>
      )}
    </div>
  );
}

export default App;






























