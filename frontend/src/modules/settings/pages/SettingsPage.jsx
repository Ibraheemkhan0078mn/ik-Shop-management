import React, { useState, useEffect } from "react";
import { X, Printer, Camera, Globe, Store, Lock, User, CreditCard, Palette, Cloud, FileSpreadsheet, Download } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useSettings } from "../hooks/useSettings.js";
import { getSettingsLabels } from "../../../labels/settingsLabels.js";
import { getItem, setItem } from "../../../shared/utilities/localStorage.js";
import ShopSettings from "../components/ShopSettings.jsx";
import PrinterSettings from "../components/PrinterSettings.jsx";
import CameraSettings from "../components/CameraSettings.jsx";
import LanguageSettings from "../components/LanguageSettings.jsx";
import ModuleSettings from "../components/ModuleSettings.jsx";
import ProfileSettings from "../components/ProfileSettings.jsx";
import PaymentMethodsSettings from "../components/PaymentMethodsSettings.jsx";
import ThemeSettings from "../components/ThemeSettings.jsx";
import BackupSettings from "../components/BackupSettings.jsx";
import FileBackup from "../components/FileBackup.jsx";
import AppUpdateSettings from "../components/AppUpdateSettings.jsx";

export default function SettingsPage() {
    const navigate = useNavigate();
    const { settings: settingsData, isLoading } = useSettings();
    const { id: userId } = useSelector(s => s.auth) || {};
    
    const settingsLanguage = settingsData?.language || "en";
    const labels = getSettingsLabels(settingsLanguage);
    
    // Get saved active tab from localStorage or default to "shop"
    const savedActiveTab = getItem("settingsActiveTab") || "shop";
    const [activeTab, setActiveTab] = useState(savedActiveTab);

    // Save active tab to localStorage when it changes
    useEffect(() => {
        setItem("settingsActiveTab", activeTab);
    }, [activeTab]);

    if (isLoading) {
        return <div className="flex items-center justify-center h-screen"><p className="text-(--muted)">Loading...</p></div>;
    }

    const tabs = [
        { id: "shop", icon: Store, label: labels.shop },
        { id: "printer", icon: Printer, label: labels.printer },
        { id: "camera", icon: Camera, label: labels.camera },
        { id: "language", icon: Globe, label: labels.language },
        { id: "modules", icon: Lock, label: labels.modules },
        { id: "theme", icon: Palette, label: labels.theme },
        { id: "paymentMethods", icon: CreditCard, label: labels.paymentMethods },
        { id: "profile", icon: User, label: labels.profile },
        { id: "backup", icon: Cloud, label: labels.backup },
        { id: "fileBackup", icon: FileSpreadsheet, label: "File Backup" },
        { id: "appUpdate", icon: Download, label: "App Update" },
    ];

    // Only add permission password tab for admin users
    // if (role === "admin") {
    //     tabs.push({ id: "permissionPassword", icon: Shield, label: labels.permissionPassword });
    // }

    return (
        <div className="container mx-auto p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold text-(--ink)">{labels.settings}</h1>
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-(--surface-muted) rounded-lg">
                    <X size={20} className="text-(--muted)" />
                </button>
            </div>

            <div className="flex flex-wrap gap-2 p-4 border-b border-(--border) mb-6">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap ${
                            activeTab === tab.id ? "bg-(--accent-2) text-white" : "text-(--muted) hover:bg-(--surface-muted)"
                        }`}
                    >
                        <tab.icon size={18} />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="card p-6">
                {activeTab === "shop" && <ShopSettings settingsData={settingsData} userId={userId} labels={labels} />}
                {activeTab === "printer" && <PrinterSettings settingsData={settingsData} userId={userId} labels={labels} />}
                {activeTab === "camera" && <CameraSettings settingsData={settingsData} userId={userId} labels={labels} />}
                {activeTab === "language" && <LanguageSettings settingsData={settingsData} userId={userId} labels={labels} />}
                {activeTab === "modules" && <ModuleSettings settingsData={settingsData} userId={userId} labels={labels} />}
                {activeTab === "theme" && <ThemeSettings labels={labels} />}
                {activeTab === "paymentMethods" && <PaymentMethodsSettings labels={labels} />}
                {activeTab === "profile" && <ProfileSettings labels={labels} />}
                {activeTab === "backup" && <BackupSettings settingsData={settingsData} userId={userId} labels={labels} />}
                {activeTab === "fileBackup" && <FileBackup labels={labels} />}
                {activeTab === "appUpdate" && <AppUpdateSettings labels={labels} />}
                {/* {activeTab === "permissionPassword" && <PermissionPasswordSettings settingsData={settingsData} userId={userId} labels={labels} />} */}
            </div>
        </div>
    );
}
