import { useState, useEffect } from "react";
import { Lock, Eye, EyeOff } from "lucide-react";
import { useUpdateModuleSettingsMutation } from "../api/settings.api.js";
import { toast } from "sonner";

export default function ModuleSettings({ settingsData, userId, labels }) {
    const [updateModuleSettings] = useUpdateModuleSettingsMutation();
    const [modules, setModules] = useState({});
    const [showModuleSettings, setShowModuleSettings] = useState(false);
    const [modulePassword, setModulePassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (settingsData) {
            setModules(settingsData.modules || {});
        }
    }, [settingsData]);

    const handlePasswordSubmit = () => {
        if (modulePassword === "ikmunibshop") {
            setShowModuleSettings(true);
            setModulePassword("");
            toast.success(labels.moduleSettingsUnlocked);
        } else {
            toast.error(labels.incorrectPassword);
        }
    };

    const handleSave = async () => {
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

    return (
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
                        <button onClick={handlePasswordSubmit} className="btn-add">
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
                    <button onClick={handleSave} className="btn-add">
                        {labels.save} {labels.modules}
                    </button>
                </div>
            )}
        </div>
    );
}
