import { useState } from "react";

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
//    language   — "en" or "ur"
// ─────────────────────────────────────────────────────────────────────────────
export default function FreeFoodModal({ onClose, onConfirm, language }) {
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
                    {language === "en" ? "Manager Approval Required" : "منیجر کی منظوری ضروری ہے"}
                </h3>

                <div className="mb-5">
                    <label className="block text-sm text-gray-600 mb-1">
                        {language === "en" ? "Manager Code" : "منیجر کا کوڈ"}
                    </label>
                    <input
                        type="password"
                        value={managerCode}
                        autoFocus
                        onChange={(e) => { setManagerCode(e.target.value); setHasError(false); }}
                        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                        className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500
                            ${hasError ? "border-red-500" : "border-gray-300"}`}
                        placeholder={language === "en" ? "Enter manager code" : "کوڈ درج کریں"}
                    />
                    {hasError && (
                        <p className="text-xs text-red-500 mt-1">
                            {language === "en" ? "Code is required." : "کوڈ ضروری ہے۔"}
                        </p>
                    )}
                </div>

                <div className="flex justify-end gap-3">
                    <button onClick={onClose}
                        className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition text-gray-700">
                        {language === "en" ? "Cancel" : "منسوخ کریں"}
                    </button>
                    <button onClick={handleSubmit}
                        className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm transition">
                        {language === "en" ? "Approve & Print" : "منظوری اور پرنٹ کریں"}
                    </button>
                </div>
            </div>
        </div>
    );
}
