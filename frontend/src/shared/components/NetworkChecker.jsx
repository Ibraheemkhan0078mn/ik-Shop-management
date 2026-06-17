import { Wifi, WifiOff } from "lucide-react";
import { useState, useEffect } from "react";

function NetworkStatusSpan() {
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    return (
        <span
            className={`mx-auto
        px-2 py-1 rounded-full flex items-center gap-2 font-medium text-xs
        ${isOnline ? "bg-(--accent-2) text-white" : "bg-(--accent) text-white"}
      `}
        >
            {isOnline ? <Wifi size={16} /> : <WifiOff size={16} />}
            {isOnline ? "Connected" : "Offline"}
        </span>
    );
}

export default NetworkStatusSpan;
