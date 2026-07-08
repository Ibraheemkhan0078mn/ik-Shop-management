import React, { useState, useEffect } from "react";
import { X, Printer, Camera, Globe, Store, Lock, Check, Eye, EyeOff, User, Mail, Phone, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { useUpdateSettingsMutation, useUpdateShopSettingsMutation, useUpdatePrinterSettingsMutation, useUpdateCameraSettingsMutation, useUpdateLanguageSettingsMutation, useUpdateModuleSettingsMutation } from "../api/settings.api.js";
import { getSettingsLabels } from "../../../labels/settingsLabels.js";
import { useSettings } from "../hooks/useSettings.js";

export default function SettingsPage() {
    const navigate = useNavigate();
    const { id: userId, name, email, phoneNo, role } = useSelector(s => s.auth) || {};
    const { settings: settingsData, isLoading } = useSettings();
    
    // Get language from settings data, fallback to "en"
    const settingsLanguage = settingsData?.language || "en";
    const labels = getSettingsLabels(settingsLanguage);
    
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
    const [languageState, setLanguageState] = useState(settingsLanguage);
    const [selectedCamera, setSelectedCamera] = useState("");
    const [availableCameras, setAvailableCameras] = useState([]);
    const [modules, setModules] = useState({});
    const [showModuleSettings, setShowModuleSettings] = useState(false);
    const [modulePassword, setModulePassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [profileName, setProfileName] = useState("");
    const [profileEmail, setProfileEmail] = useState("");
    const [profilePhone, setProfilePhone] = useState("");

    useEffect(() => {
        if (settingsData) {
            setShopName(settingsData.shop?.name || "");
            setShopImagePreview(settingsData.shop?.imageUrl || "");
            setPrinterHeight(settingsData.printer?.height || 300);
            setPrinterWidth(settingsData.printer?.width || 80);
            setPrintMode(settingsData.printer?.printMode || "preview");
            setLanguageState(settingsData.language || "en");
            setSelectedCamera(settingsData.camera?.selectedDeviceId || "");
            setModules(settingsData.modules || {});
        }
        // Initialize profile from auth state
        setProfileName(name || "");
        setProfileEmail(email || "");
        setProfilePhone(phoneNo || "");
    }, [settingsData, name, email, phoneNo]);

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
            toast.success(labels.shopSettingsSaved);
        } catch (error) {
            toast.error(labels.failedToSave);
        }
    };

    const handleSavePrinterSettings = async () => {
        try {
            await updatePrinterSettings({ userId, height: printerHeight, width: printerWidth, printMode }).unwrap();
            toast.success(labels.printerSettingsSaved);
        } catch (error) {
            toast.error(labels.failedToSave);
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
            toast.success(labels.cameraSettingsSaved);
        } catch (error) {
            toast.error(labels.failedToSave);
        }
    };

    const handleSaveLanguageSettings = async () => {
        try {
            await updateLanguageSettings({ userId, language: languageState }).unwrap();
            toast.success(labels.languageSettingsSaved);
        } catch (error) {
            toast.error(labels.failedToSave);
        }
    };

    const handleModulePasswordSubmit = () => {
        if (modulePassword === "ikmunibshop") {
            setShowModuleSettings(true);
            setModulePassword("");
            toast.success(labels.moduleSettingsUnlocked);
        } else {
            toast.error(labels.incorrectPassword);
        }
    };

    const handleSaveModuleSettings = async () => {
        try {
            await updateModuleSettings({ userId, modules }).unwrap();
            toast.success(labels.moduleSettingsSaved);
            setShowModuleSettings(false);
        } catch (error) {
            toast.error(labels.failedToSave);
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
                <h1 className="text-2xl font-semibold text-[var(--ink)]">{labels.settings}</h1>
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-[var(--surface-muted)] rounded-lg">
                    <X size={20} className="text-[var(--muted)]" />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 p-4 border-b border-[var(--border)] mb-6 overflow-x-auto">
                <button
                    onClick={() => setActiveTab("shop")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap ${
                        activeTab === "shop" ? "bg-[var(--accent-2)] text-white" : "text-[var(--muted)] hover:bg-[var(--surface-muted)]"
                    }`}
                >
                    <Store size={18} />
                    {labels.shop}
                </button>
                <button
                    onClick={() => setActiveTab("printer")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap ${
                        activeTab === "printer" ? "bg-[var(--accent-2)] text-white" : "text-[var(--muted)] hover:bg-[var(--surface-muted)]"
                    }`}
                >
                    <Printer size={18} />
                    {labels.printer}
                </button>
                <button
                    onClick={() => setActiveTab("camera")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap ${
                        activeTab === "camera" ? "bg-[var(--accent-2)] text-white" : "text-[var(--muted)] hover:bg-[var(--surface-muted)]"
                    }`}
                >
                    <Camera size={18} />
                    {labels.camera}
                </button>
                <button
                    onClick={() => setActiveTab("language")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap ${
                        activeTab === "language" ? "bg-[var(--accent-2)] text-white" : "text-[var(--muted)] hover:bg-[var(--surface-muted)]"
                    }`}
                >
                    <Globe size={18} />
                    {labels.language}
                </button>
                <button
                    onClick={() => setActiveTab("modules")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap ${
                        activeTab === "modules" ? "bg-[var(--accent-2)] text-white" : "text-[var(--muted)] hover:bg-[var(--surface-muted)]"
                    }`}
                >
                    <Lock size={18} />
                    {labels.modules}
                </button>
                <button
                    onClick={() => setActiveTab("profile")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap ${
                        activeTab === "profile" ? "bg-[var(--accent-2)] text-white" : "text-[var(--muted)] hover:bg-[var(--surface-muted)]"
                    }`}
                >
                    <User size={18} />
                    {labels.profile}
                </button>
            </div>

            {/* Content */}
            <div className="card p-6">
                {/* Shop Settings */}
                {activeTab === "shop" && (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-[var(--ink)] mb-2">{labels.shopName}</label>
                            <input
                                type="text"
                                value={shopName}
                                onChange={(e) => setShopName(e.target.value)}
                                className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--ink)]"
                                placeholder={labels.enterShopName}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--ink)] mb-2">{labels.shopImage}</label>
                            <div className="flex items-center gap-4">
                                {shopImagePreview && (
                                    <div className="relative">
                                        <img 
                                            src={shopImagePreview} 
                                            alt="Shop" 
                                            className="w-24 h-24 object-cover rounded-lg border border-[var(--border)]" 
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShopImagePreview("");
                                                setShopImage(null);
                                            }}
                                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                                        >
                                            ×
                                        </button>
                                    </div>
                                )}
                                <div className="flex-1">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleShopImageChange}
                                        className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--ink)]"
                                    />
                                    {shopImagePreview && (
                                        <p className="text-xs text-[var(--muted)] mt-1">{labels.changeImage}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                        <button onClick={handleSaveShopSettings} className="btn-add">
                            {labels.save} {labels.shop}
                        </button>
                    </div>
                )}

                {/* Printer Settings */}
                {activeTab === "printer" && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-[var(--ink)] mb-2">{labels.printerHeight}</label>
                                <input
                                    type="number"
                                    value={printerHeight}
                                    onChange={(e) => setPrinterHeight(Number(e.target.value))}
                                    className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--ink)]"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[var(--ink)] mb-2">{labels.printerWidth}</label>
                                <input
                                    type="number"
                                    value={printerWidth}
                                    onChange={(e) => setPrinterWidth(Number(e.target.value))}
                                    className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--ink)]"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--ink)] mb-2">{labels.printMode}</label>
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
                            {labels.save} {labels.printer}
                        </button>
                    </div>
                )}

                {/* Camera Settings */}
                {activeTab === "camera" && (
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
                        <button onClick={handleSaveCameraSettings} className="btn-add">
                            {labels.save} {labels.camera}
                        </button>
                    </div>
                )}

                {/* Language Settings */}
                {activeTab === "language" && (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-[var(--ink)] mb-2">{labels.selectLanguage}</label>
                            <select
                                value={languageState}
                                onChange={(e) => setLanguageState(e.target.value)}
                                className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--ink)]"
                            >
                                <option value="en">{labels.english}</option>
                                <option value="ur">{labels.urdu}</option>
                                <option value="ur_en">{labels.urduEnglish}</option>
                            </select>
                        </div>
                        <button onClick={handleSaveLanguageSettings} className="btn-add">
                            {labels.save} {labels.language}
                        </button>
                    </div>
                )}

                {/* Module Settings */}
                {activeTab === "modules" && (
                    <div className="space-y-6">
                        {!showModuleSettings ? (
                            <div className="text-center py-8">
                                <Lock size={48} className="text-[var(--muted)] mx-auto mb-4" />
                                <p className="text-[var(--muted)] mb-4">{labels.moduleVisibility} {labels.enterPassword}</p>
                                <div className="flex items-center gap-2 justify-center">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={modulePassword}
                                        onChange={(e) => setModulePassword(e.target.value)}
                                        placeholder={labels.enterPassword}
                                        className="px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--ink)]"
                                    />
                                    <button
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="p-2 hover:bg-[var(--surface-muted)] rounded-lg"
                                    >
                                        {showPassword ? <EyeOff size={18} className="text-[var(--muted)]" /> : <Eye size={18} className="text-[var(--muted)]" />}
                                    </button>
                                    <button onClick={handleModulePasswordSubmit} className="btn-add">
                                        {labels.unlock}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <p className="text-sm text-[var(--muted)]">{labels.moduleVisibility}</p>
                                {Object.entries(modules).map(([key, value]) => (
                                    <div key={key} className="flex items-center justify-between p-3 border border-[var(--border)] rounded-lg">
                                        <span className="capitalize text-[var(--ink)]">{labels[key] || key}</span>
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
                                    {labels.save} {labels.modules}
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* Profile Settings */}
                {activeTab === "profile" && (
                    <div className="space-y-6">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-16 h-16 rounded-full bg-[var(--surface-muted)] flex items-center justify-center border border-[var(--border)]">
                                <User size={32} className="text-[var(--muted)]" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-[var(--ink)]">{labels.profileSettings}</h3>
                                <p className="text-sm text-[var(--muted)]">{labels.role}: {role}</p>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--ink)] mb-2 flex items-center gap-2">
                                <User size={16} />
                                {labels.name}
                            </label>
                            <input
                                type="text"
                                value={profileName}
                                onChange={(e) => setProfileName(e.target.value)}
                                className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--ink)]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--ink)] mb-2 flex items-center gap-2">
                                <Mail size={16} />
                                {labels.email}
                            </label>
                            <input
                                type="email"
                                value={profileEmail}
                                onChange={(e) => setProfileEmail(e.target.value)}
                                className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--ink)]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--ink)] mb-2 flex items-center gap-2">
                                <Phone size={16} />
                                {labels.phone}
                            </label>
                            <input
                                type="text"
                                value={profilePhone}
                                onChange={(e) => setProfilePhone(e.target.value)}
                                className="w-full px-4 py-2 border border-[var(--border)] rounded-lg bg-[var(--surface)] text-[var(--ink)]"
                            />
                        </div>
                        <button className="btn-add">
                            {labels.updateProfile}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
