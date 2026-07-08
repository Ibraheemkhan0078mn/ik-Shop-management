import React, { useState, useEffect } from "react";
import { X, Printer, Camera, Globe, Store, Lock, Check, Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { useGetSettingsQuery, useUpdateSettingsMutation, useUpdateShopSettingsMutation, useUpdatePrinterSettingsMutation, useUpdateCameraSettingsMutation, useUpdateLanguageSettingsMutation, useUpdateModuleSettingsMutation } from "../api/settings.api.js";

export default function SettingsPage() {
    const navigate = useNavigate();
    const { id: userId } = useSelector(s => s.auth) || {};
    const { data: settingsData, isLoading } = useGetSettingsQuery(userId, { skip: !userId });
    const [updateSettings] = useUpdateSettingsMutation();
    const [updateShopSettings] = useUpdateShopSettingsMutation();
    const [updatePrinterSettings] = useUpdatePrinterSettingsMutation();
    const [updateCameraSettings] = useUpdateCameraSettingsMutation();
    const [updateLanguageSettings] = useUpdateLanguageSettingsMutation();
    const [updateModuleSettings] = useUpdateModuleSettingsMutation();

    const [activeTab, setActiveTab] = useState("shop");
    const [shopName, setShopName] = useState("");
    const [shopImage, setShopImage] = useState(null);
    const [shopImagePreview, setShopImagePreview] = useState("");
    const [printerHeight, setPrinterHeight] = useState(300);
    const [printerWidth, setPrinterWidth] = useState(80);
    const [printMode, setPrintMode] = useState("preview");
    const [language, setLanguage] = useState("en");
    const [selectedCamera, setSelectedCamera] = useState("");
    const [availableCameras, setAvailableCameras] = useState([]);
    const [modules, setModules] = useState({});
    const [showModuleSettings, setShowModuleSettings] = useState(false);
    const [modulePassword, setModulePassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (settingsData?.data) {
            const s = settingsData.data;
            setShopName(s.shop?.name || "");
            setShopImagePreview(s.shop?.imageUrl || "");
            setPrinterHeight(s.printer?.height || 300);
            setPrinterWidth(s.printer?.width || 80);
            setPrintMode(s.printer?.printMode || "preview");
            setLanguage(s.language || "en");
            setSelectedCamera(s.camera?.selectedDeviceId || "");
            setModules(s.modules || {});
        }
    }, [settingsData]);

    useEffect(() => {
        // Enumerate cameras
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

    const handleShopImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setShopImage(file);
            setShopImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSaveShopSettings = async () => {
        const formData = new FormData();
        formData.append("userId", userId);
        formData.append("name", shopName);
        if (shopImage) {
            formData.append("shopImage", shopImage);
        }

        try {
            await updateShopSettings(formData).unwrap();
            toast.success("Shop settings saved successfully");
        } catch (error) {
            toast.error("Failed to save shop settings");
        }
    };

    const handleSavePrinterSettings = async () => {
        try {
            await updatePrinterSettings({ userId, height: printerHeight, width: printerWidth, printMode }).unwrap();
            toast.success("Printer settings saved successfully");
        } catch (error) {
            toast.error("Failed to save printer settings");
        }
    };

    const handleSaveCameraSettings = async () => {
        const selectedCameraObj = availableCameras.find(c => c.deviceId === selectedCamera);
        try {
            await updateCameraSettings({ 
                userId,
                selectedDeviceId: selectedCamera, 
                deviceName: selectedCameraObj?.label || "Unknown Camera" 
            }).unwrap();
            toast.success("Camera settings saved successfully");
        } catch (error) {
            toast.error("Failed to save camera settings");
        }
    };

    const handleSaveLanguageSettings = async () => {
        try {
            await updateLanguageSettings({ userId, language }).unwrap();
            toast.success("Language settings saved successfully");
        } catch (error) {
            toast.error("Failed to save language settings");
        }
    };

    const handleModulePasswordSubmit = () => {
        if (modulePassword === "ikmunibshop") {
            setShowModuleSettings(true);
            setModulePassword("");
            toast.success("Module settings unlocked");
        } else {
            toast.error("Incorrect password");
        }
    };

    const handleSaveModuleSettings = async () => {
        try {
            await updateModuleSettings({ userId, modules }).unwrap();
            toast.success("Module settings saved successfully");
            setShowModuleSettings(false);
        } catch (error) {
            toast.error("Failed to save module settings");
        }
    };

    const handleModuleToggle = (moduleKey) => {
        setModules(prev => ({
            ...prev,
            [moduleKey]: !prev[moduleKey]
        }));
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <p className="text-[var(--muted)]">Loading settings...</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold text-[var(--ink)]">Settings</h1>
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-[var(--surface-muted)] rounded-lg">
                    <X size={20} className="text-[var(--muted)]" />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 p-4 border-b border-[var(--border)] mb-6">
                <button
                    onClick={() => setActiveTab("shop")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                        activeTab === "shop" ? "bg-[var(--accent-2)] text-white" : "text-[var(--muted)] hover:bg-[var(--surface-muted)]"
                    }`}
                >
                    <Store size={18} />
                    Shop
                </button>
                <button
                    onClick={() => setActiveTab("printer")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                        activeTab === "printer" ? "bg-[var(--accent-2)] text-white" : "text-[var(--muted)] hover:bg-[var(--surface-muted)]"
                    }`}
                >
                    <Printer size={18} />
                    Printer
                </button>
                <button
                    onClick={() => setActiveTab("camera")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                        activeTab === "camera" ? "bg-[var(--accent-2)] text-white" : "text-[var(--muted)] hover:bg-[var(--surface-muted)]"
                    }`}
                >
                    <Camera size={18} />
                    Camera
                </button>
                <button
                    onClick={() => setActiveTab("language")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                        activeTab === "language" ? "bg-[var(--accent-2)] text-white" : "text-[var(--muted)] hover:bg-[var(--surface-muted)]"
                    }`}
                >
                    <Globe size={18} />
                    Language
                </button>
                <button
                    onClick={() => setActiveTab("modules")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                        activeTab === "modules" ? "bg-[var(--accent-2)] text-white" : "text-[var(--muted)] hover:bg-[var(--surface-muted)]"
                    }`}
                >
                    <Lock size={18} />
                    Modules
                </button>
            </div>

            {/* Content */}
            <div className="card p-6">
                {/* Shop Settings */}
                {activeTab === "shop" && (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-[var(--ink)] mb-2">Shop Name</label>
                            <input
                                type="text"
                                value={shopName}
                                onChange={(e) => setShopName(e.target.value)}
                                className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--ink)]"
                                placeholder="Enter shop name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--ink)] mb-2">Shop Image</label>
                            <div className="flex items-center gap-4">
                                {shopImagePreview && (
                                    <img src={shopImagePreview} alt="Shop" className="w-24 h-24 object-cover rounded-lg border border-[var(--border)]" />
                                )}
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleShopImageChange}
                                    className="flex-1 px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--ink)]"
                                />
                            </div>
                        </div>
                        <button onClick={handleSaveShopSettings} className="btn-add">
                            Save Shop Settings
                        </button>
                    </div>
                )}

                {/* Printer Settings */}
                {activeTab === "printer" && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--ink)] mb-2">Height (mm)</label>
                                <input
                                    type="number"
                                    value={printerHeight}
                                    onChange={(e) => setPrinterHeight(Number(e.target.value))}
                                    className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--ink)]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--ink)] mb-2">Width (mm)</label>
                                <input
                                    type="number"
                                    value={printerWidth}
                                    onChange={(e) => setPrinterWidth(Number(e.target.value))}
                                    className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--ink)]"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--ink)] mb-2">Print Mode</label>
                            <select
                                value={printMode}
                                onChange={(e) => setPrintMode(e.target.value)}
                                className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--ink)]"
                            >
                                <option value="preview">Preview</option>
                                <option value="direct">Direct Print</option>
                            </select>
                        </div>
                        <button onClick={handleSavePrinterSettings} className="btn-add">
                            Save Printer Settings
                        </button>
                    </div>
                )}

                {/* Camera Settings */}
                {activeTab === "camera" && (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-[var(--ink)] mb-2">Select Camera</label>
                            <select
                                value={selectedCamera}
                                onChange={(e) => setSelectedCamera(e.target.value)}
                                className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--ink)]"
                            >
                                <option value="">Select a camera...</option>
                                {availableCameras.map((camera) => (
                                    <option key={camera.deviceId} value={camera.deviceId}>
                                        {camera.label || `Camera ${camera.deviceId.slice(0, 8)}`}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <button onClick={handleSaveCameraSettings} className="btn-add">
                            Save Camera Settings
                        </button>
                    </div>
                )}

                {/* Language Settings */}
                {activeTab === "language" && (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-[var(--ink)] mb-2">Language</label>
                            <select
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--ink)]"
                            >
                                <option value="en">English</option>
                                <option value="ur">Urdu</option>
                                <option value="en-ur">English / Urdu</option>
                            </select>
                        </div>
                        <button onClick={handleSaveLanguageSettings} className="btn-add">
                            Save Language Settings
                        </button>
                    </div>
                )}

                {/* Module Settings */}
                {activeTab === "modules" && (
                    <div className="space-y-6">
                        {!showModuleSettings ? (
                            <div className="text-center py-8">
                                <Lock size={48} className="text-[var(--muted)] mx-auto mb-4" />
                                <p className="text-[var(--muted)] mb-4">Module visibility settings are password protected</p>
                                <div className="flex items-center gap-2 justify-center">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={modulePassword}
                                        onChange={(e) => setModulePassword(e.target.value)}
                                        placeholder="Enter password"
                                        className="px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--ink)]"
                                    />
                                    <button
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="p-2 hover:bg-[var(--surface-muted)] rounded-lg"
                                    >
                                        {showPassword ? <EyeOff size={18} className="text-[var(--muted)]" /> : <Eye size={18} className="text-[var(--muted)]" />}
                                    </button>
                                    <button onClick={handleModulePasswordSubmit} className="btn-add">
                                        Unlock
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-sm text-[var(--muted)]">Select which modules should be visible in the sidebar</p>
                                {Object.entries(modules).map(([key, value]) => (
                                    <div key={key} className="flex items-center justify-between p-3 border border-[var(--border)] rounded-lg">
                                        <span className="capitalize text-[var(--ink)]">{key}</span>
                                        <button
                                            onClick={() => handleModuleToggle(key)}
                                            className={`w-12 h-6 rounded-full transition-colors ${
                                                value ? "bg-[var(--accent-2)]" : "bg-gray-300"
                                            }`}
                                        >
                                            <div className={`w-5 h-5 bg-white rounded-full transition-transform ${
                                                value ? "translate-x-6" : "translate-x-0.5"
                                            }`} />
                                        </button>
                                    </div>
                                ))}
                                <button onClick={handleSaveModuleSettings} className="btn-add">
                                    Save Module Settings
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
