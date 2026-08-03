import { useState, useEffect } from "react";
import { useUpdateLanguageSettingsMutation } from "../api/settings.api.js";
import { toast } from "sonner";

export default function LanguageSettings({ settingsData, userId, labels }) {
    const [updateLanguageSettings] = useUpdateLanguageSettingsMutation();
    const [languageState, setLanguageState] = useState("en");

    useEffect(() => {
        if (settingsData) {
            setLanguageState(settingsData.language || "en");
        }
    }, [settingsData]);

    const handleSave = async () => {
        try {
            await updateLanguageSettings({ userId, language: languageState }).unwrap();
            localStorage.setItem('appLanguage', languageState);
            toast.success(labels.languageSettingsSaved);
        } catch (error) {
            toast.error(labels.failedToSave);
        }
    };

    return (
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
            <button onClick={handleSave} className="btn-add">
                {labels.save} {labels.language}
            </button>
        </div>
    );
}
