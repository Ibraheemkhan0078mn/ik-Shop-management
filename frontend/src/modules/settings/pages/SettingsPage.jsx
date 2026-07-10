import React, { useState } from "react";
import { X, Printer, Camera, Globe, Store, Lock, User, CreditCard } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useSettings } from "../hooks/useSettings.js";
import { getSettingsLabels } from "../../../labels/settingsLabels.js";
import ShopSettings from "../components/ShopSettings.jsx";
import PrinterSettings from "../components/PrinterSettings.jsx";
import CameraSettings from "../components/CameraSettings.jsx";
import LanguageSettings from "../components/LanguageSettings.jsx";
import ModuleSettings from "../components/ModuleSettings.jsx";
import ProfileSettings from "../components/ProfileSettings.jsx";
import PaymentMethodsSettings from "../components/PaymentMethodsSettings.jsx";

export default function SettingsPage() {
    const navigate = useNavigate();
    const { settings: settingsData, isLoading } = useSettings();
    const { id: userId } = useSelector(s => s.auth) || {};
    
    const settingsLanguage = settingsData?.language || "en";
    const labels = getSettingsLabels(settingsLanguage);
    const [activeTab, setActiveTab] = useState("shop");

    if (isLoading) {
        return <div className="flex items-center justify-center h-screen"><p className="text-[var(--muted)]">Loading...</p></div>;
    }

    const tabs = [
        { id: "shop", icon: Store, label: labels.shop },
        { id: "printer", icon: Printer, label: labels.printer },
        { id: "camera", icon: Camera, label: labels.camera },
        { id: "language", icon: Globe, label: labels.language },
        { id: "modules", icon: Lock, label: labels.modules },
        { id: "paymentMethods", icon: CreditCard, label: "Payment Methods" },
        { id: "profile", icon: User, label: labels.profile },
    ];

    return (
        <div className="container mx-auto p-6">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold text-[var(--ink)]">{labels.settings}</h1>
                <button onClick={() => navigate(-1)} className="p-2 hover:bg-[var(--surface-muted)] rounded-lg">
                    <X size={20} className="text-[var(--muted)]" />
                </button>
            </div>

            <div className="flex gap-2 p-4 border-b border-[var(--border)] mb-6 overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap ${
                            activeTab === tab.id ? "bg-[var(--accent-2)] text-white" : "text-[var(--muted)] hover:bg-[var(--surface-muted)]"
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
                {activeTab === "paymentMethods" && <PaymentMethodsSettings labels={labels} />}
                {activeTab === "profile" && <ProfileSettings labels={labels} />}
            </div>
        </div>
    );
}
