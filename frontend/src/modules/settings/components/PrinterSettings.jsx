import { useState, useEffect } from "react";
import { useUpdatePrinterSettingsMutation } from "../api/settings.api.js";
import { toast } from "sonner";

export default function PrinterSettings({ settingsData, userId, labels }) {
    const [updatePrinterSettings] = useUpdatePrinterSettingsMutation();
    const [printerHeight, setPrinterHeight] = useState(300);
    const [printerWidth, setPrinterWidth] = useState(80);
    const [printMode, setPrintMode] = useState("preview");
    const [posDirectPrint, setPosDirectPrint] = useState(false);

    useEffect(() => {
        if (settingsData) {
            setPrinterHeight(settingsData.printer?.height || 300);
            setPrinterWidth(settingsData.printer?.width || 80);
            setPrintMode(settingsData.printer?.printMode || "preview");
            setPosDirectPrint(settingsData.printer?.posDirectPrint || false);
        }
    }, [settingsData]);

    const handleSave = async () => {
        try {
            await updatePrinterSettings({ userId, height: printerHeight, width: printerWidth, printMode, posDirectPrint }).unwrap();
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
            <div>
                <label className="flex items-center gap-3 cursor-pointer">
                    <div className="relative">
                        <input
                            type="checkbox"
                            checked={posDirectPrint}
                            onChange={(e) => setPosDirectPrint(e.target.checked)}
                            className="sr-only peer"
                        />
                        <div className={`w-11 h-6 rounded-full transition-colors duration-200 ${
                            posDirectPrint ? 'bg-[var(--accent-2)]' : 'bg-[var(--muted)]'
                        }`}></div>
                        <div className={`absolute top-0.5 left-0.5 bg-white w-5 h-5 rounded-full transition-transform duration-200 ${
                            posDirectPrint ? 'translate-x-5' : ''
                        }`}></div>
                    </div>
                    <span className="text-sm font-medium text-[var(--ink)]">POS Direct Print</span>
                </label>
                <p className="text-xs text-[var(--muted)] mt-1">When enabled, POS payment completion will show print popup instead of window</p>
            </div>
            <button onClick={handleSave} className="btn-add">
                {labels.save} {labels.printer}
            </button>
        </div>
    );
}
