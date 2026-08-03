import { useState, useEffect } from "react";
import { useUpdateCameraSettingsMutation } from "../api/settings.api.js";
import { toast } from "sonner";

export default function CameraSettings({ settingsData, userId, labels }) {
    const [updateCameraSettings] = useUpdateCameraSettingsMutation();
    const [selectedCamera, setSelectedCamera] = useState("");
    const [availableCameras, setAvailableCameras] = useState([]);

    useEffect(() => {
        if (settingsData) {
            setSelectedCamera(settingsData.camera?.selectedDeviceId || "");
        }
    }, [settingsData]);

    useEffect(() => {
        const getCameras = async () => {
            try {
                const devices = await navigator.mediaDevices.enumerateDevices();
                const cameras = devices.filter(device => device.kind === 'videoinput');
                setAvailableCameras(cameras);
            } catch (error) {
                console.error("Error enumerating cameras:", error);
            }
        };
        getCameras();
    }, []);

    const handleSave = async () => {
        const selectedCameraObj = availableCameras.find(c => c.deviceId === selectedCamera);
        try {
            await updateCameraSettings({ 
                userId,
                selectedDeviceId: selectedCamera, 
                deviceName: selectedCameraObj?.label || "Unknown Camera" 
            }).unwrap();
            toast.success(labels.cameraSettingsSaved);
        } catch (error) {
            toast.error(labels.failedToSave);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-[var(--ink)] mb-2">{labels.selectCamera}</label>
                <select
                    value={selectedCamera}
                    onChange={(e) => setSelectedCamera(e.target.value)}
                    className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--ink)]"
                >
                    <option value="">{labels.availableCameras}</option>
                    {availableCameras.map((camera) => (
                        <option key={camera.deviceId} value={camera.deviceId}>
                            {camera.label || `Camera ${camera.deviceId.slice(0, 8)}`}
                        </option>
                    ))}
                </select>
            </div>
            <button onClick={handleSave} className="btn-add">
                {labels.save} {labels.camera}
            </button>
        </div>
    );
}
