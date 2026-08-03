import { useState } from "react";
import { useSettings } from "../../settings/hooks/useSettings.js";
import { getPosLabels } from "../labels/posLabels.js";

// ─────────────────────────────────────────────────────────────────────────────
//  FreeFoodModal
//
//  Appears when the cashier clicks "Free Food".
//  Requires a manager code to authorize giving away the order for free.
//  The code is verified by the backend — only the manager knows it.
//
//  Props:
//    onClose    — closes the modal
//    onConfirm(managerCode) — sends the code to PosPage for verification
// ─────────────────────────────────────────────────────────────────────────────
export default function FreeFoodModal({ onClose, onConfirm }) {
    const { settings } = useSettings();
    const language = settings?.language || "en";
    const labels = getPosLabels(language);

    const [managerCode, setManagerCode] = useState("");
    const [hasError,    setHasError]    = useState(false);

    const handleSubmit = () => {
        if (!managerCode.trim()) { setHasError(true); return; }
        onConfirm(managerCode);
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">

                <h3 className="text-lg font-semibold text-gray-800 mb-5">
                    {labels.managerApprovalRequired}
                </h3>

                <div className="mb-5">
                    <label className="block text-sm text-gray-600 mb-1">
                        {labels.managerCode}
                    </label>
                    <input
                        type="password"
                        value={managerCode}
                        autoFocus
                        onChange={(e) => { setManagerCode(e.target.value); setHasError(false); }}
                        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                            ${hasError ? "border-red-500" : "border-gray-300"}`}
                        placeholder={labels.enterManagerCode}
                    />
                    {hasError && (
                        <p className="text-xs text-red-500 mt-1">
                            {labels.codeRequired}
                        </p>
                    )}
                </div>

                <div className="flex justify-end gap-3">
                    <button onClick={onClose}
                        className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition text-gray-700">
                        {labels.cancel}
                    </button>
                    <button onClick={handleSubmit}
                        className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm transition">
                        {labels.approveAndPrint}
                    </button>
                </div>
            </div>
        </div>
    );
}
