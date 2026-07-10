import { useState, useEffect } from "react";
import { useUpdatePrinterSettingsMutation } from "../api/settings.api.js";
import { toast } from "sonner";

export default function PrinterSettings({ settingsData, userId, labels }) {
    const [updatePrinterSettings] = useUpdatePrinterSettingsMutation();
    const [printerHeight, setPrinterHeight] = useState(300);
    const [printerWidth, setPrinterWidth] = useState(80);
    const [printMode, setPrintMode] = useState("preview");

    useEffect(() => {
        if (settingsData) {
            setPrinterHeight(settingsData.printer?.height || 300);
            setPrinterWidth(settingsData.printer?.width || 80);
            setPrintMode(settingsData.printer?.printMode || "preview");
        }
    }, [settingsData]);

    const handleSave = async () => {
        try {
            await updatePrinterSettings({ userId, height: printerHeight, width: printerWidth, printMode }).unwrap();
            toast.success(labels.printerSettingsSaved);
        } catch (error) {
            toast.error(labels.failedToSave);
        }
    };

    return (
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
            <button onClick={handleSave} className="btn-add">
                {labels.save} {labels.printer}
            </button>
        </div>
    );
}
