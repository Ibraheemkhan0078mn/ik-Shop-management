import { BrowserMultiFormatReader, BrowserCodeReader } from "@zxing/browser";
import { useEffect, useRef, useState } from "react";
// Assuming these are your custom UI components
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/Select";

export const Scanner = ({ isOpen, setIsOpen, valueSetter }) => {
    const controlsRef = useRef(null);
    const videoRef = useRef(null);
    const [availableDevices, setAvailableDevices] = useState([]);
    const [selectedDevice, setSelectedDevice] = useState("");
    const [error, setError] = useState("");

    // 1. Initial Load: Get list of cameras
    useEffect(() => {
        if (!isOpen) return;

        const initDevices = async () => {
            try {
                const devices = await BrowserCodeReader.listVideoInputDevices();
                setAvailableDevices(devices);

                if (devices.length > 0) {
                    // Try to default to the back camera
                    const back = devices.find((d) =>
                        /back|rear|environment/i.test(d.label),
                    );
                    setSelectedDevice(
                        back ? back.deviceId : devices[0].deviceId,
                    );
                }
            } catch (err) {
                setError("Could not access cameras.");
            }
        };

        initDevices();
    }, [isOpen]);

    // 2. Start/Restart Scanner whenever selectedDevice changes
    useEffect(() => {
        if (!isOpen || !selectedDevice) return;

        const scan = new BrowserMultiFormatReader();

        const startScanning = async () => {
            // Stop any existing stream before starting a new one
            if (controlsRef.current) {
                controlsRef.current.stop();
            }

            try {
                controlsRef.current = await scan.decodeFromVideoDevice(
                    selectedDevice,
                    videoRef.current,
                    (res) => {
                        if (res) {
                            const text = res.getText();
                            valueSetter(text);
                            setIsOpen(false); // Close on success
                        }
                    },
                );
            } catch (err) {
                setError("Failed to start camera: " + err.message);
            }
        };

        startScanning();

        // 3. Cleanup: Stop camera when component unmounts or modal closes
        return () => {
            if (controlsRef.current) {
                controlsRef.current.stop();
                controlsRef.current = null;
            }
        };
    }, [isOpen, selectedDevice, setIsOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
            <div className="relative w-full max-w-sm rounded-xl bg-black p-4 overflow-hidden">
                {/* Device Selector */}
                {availableDevices.length > 1 ? (
                    <div className="mb-4">
                        <select
                            value={selectedDevice}
                            onChange={(e) => setSelectedDevice(e.target.value)}
                            className="w-full p-2 bg-(--ink) text-white rounded border border-(--border)"
                        >
                            {availableDevices.map((d) => (
                                <option key={d.deviceId} value={d.deviceId}>
                                    {d.label ||
                                        `Camera ${d.deviceId.slice(0, 5)}`}
                                </option>
                            ))}
                        </select>
                    </div>
                ) : (
                    <p className="text-white">No Camera found!</p>
                )}

                {/* Camera Feed */}
                <div className="relative overflow-hidden rounded-lg bg-(--ink)">
                    <video
                        ref={videoRef}
                        className="w-full h-[350px] object-cover"
                        style={{ transform: "scaleX(-1)" }} // Mirroring Left to Right
                        muted
                        playsInline
                    />

                    {/* Visual Viewfinder Overlay */}
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <div className="h-48 w-64 rounded-lg border-2 border-(--accent-2) bg-white/5 shadow-[0_0_0_1000px_rgba(0,0,0,0.5)]">
                            {/* Animated Scan Line */}
                            <div className="w-full h-0.5 bg-(--accent) shadow-[0_0_10px_red] scan-line" />
                        </div>
                    </div>
                </div>

                {/* Close Button */}
                <button
                    onClick={() => setIsOpen(false)}
                    className="mt-4 w-full py-2 text-(--muted) hover:text-white text-sm"
                >
                    Cancel
                </button>

                {error && (
                    <p className="mt-2 text-center text-xs text-(--accent)">
                        {error}
                    </p>
                )}
            </div>
        </div>
    );
};
