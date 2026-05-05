// ============================================
// 10. components/modals/FreeFoodModal.jsx
// ============================================
import React, { useState } from "react";

export default function FreeFoodModal({ onClose, onConfirm, language }) {
    const [managerCode, setManagerCode] = useState("");
    const [managerCodeInvalid, setManagerCodeInvalid] = useState(false);

    const handleSubmit = () => {
        if (!managerCode.trim()) {
            setManagerCodeInvalid(true);
            return;
        }
        onConfirm(managerCode);
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg p-5 w-full max-w-sm">
                <h3 className="text-lg font-semibold mb-4">
                    {language === "en" ? "Manager Approval" : "منیجر کی منظوری"}
                </h3>

                <div className="relative w-full mb-4">
                    <input
                        type="password"
                        id="managerCode"
                        value={managerCode}
                        onChange={(e) => {
                            setManagerCode(e.target.value);
                            setManagerCodeInvalid(false);
                        }}
                        placeholder=" "
                        className={`block w-full px-2.5 pb-2.5 pt-4 text-sm text-gray-900 bg-transparent border rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 peer ${
                            managerCodeInvalid
                                ? "border-red-500"
                                : "border-gray-400"
                        }`}
                    />
                    <label
                        htmlFor="managerCode"
                        className={`absolute left-2.5 z-10 px-1 bg-white text-gray-500 text-sm duration-300 transform origin-[0] ${
                            managerCode
                                ? "top-2 -translate-y-4 scale-75 text-blue-500"
                                : "top-1/2 -translate-y-1/2 scale-100 text-gray-400"
                        } peer-focus:top-2 peer-focus:-translate-y-4 peer-focus:scale-75 peer-focus:text-blue-500`}
                    >
                        {language === "en"
                            ? "Enter Manager Code"
                            : "منیجر کا کوڈ درج کریں"}
                    </label>
                </div>

                <div className="flex justify-end gap-2 mt-3">
                    <button
                        onClick={onClose}
                        className="px-3 py-1.5 border border-gray-400 rounded-md text-gray-700 hover:bg-gray-100 transition"
                    >
                        {language === "en" ? "Cancel" : "منسوخ کریں"}
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 transition"
                    >
                        {language === "en"
                            ? "Approve & Print"
                            : "منظوری اور پرنٹ کریں"}
                    </button>
                </div>
            </div>
        </div>
    );
}
