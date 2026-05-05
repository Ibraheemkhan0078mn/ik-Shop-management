// ============================================
// 9. components/modals/SplitBillModal.jsx
// ============================================
import React, { useState } from "react";

export default function SplitBillModal({ onClose, onConfirm, language }) {
    const [splitCount, setSplitCount] = useState(2);

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 w-80">
                <h3 className="text-lg font-semibold text-gray-800 mb-5">
                    {language === "en" ? "Divide Bill" : "بل تقسیم کریں"}
                </h3>

                <div className="relative w-full mb-5">
                    <input
                        type="number"
                        id="splitCount"
                        placeholder=" "
                        value={splitCount}
                        onChange={(e) => setSplitCount(Number(e.target.value))}
                        onKeyDown={(e) =>
                            e.key === "Enter" && onConfirm(splitCount)
                        }
                        className="block w-full px-3 pt-4 pb-2 text-sm text-gray-900 bg-transparent border border-gray-400 rounded-lg appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 peer"
                    />
                    <label
                        htmlFor="splitCount"
                        className={`absolute left-3 z-10 px-1 bg-white text-gray-500 text-sm duration-300 transform origin-[0] ${
                            splitCount
                                ? "top-2 -translate-y-4 scale-75 text-blue-500"
                                : "top-1/2 -translate-y-1/2 scale-100"
                        } peer-focus:top-2 peer-focus:-translate-y-4 peer-focus:scale-75 peer-focus:text-blue-500`}
                    >
                        {language === "en"
                            ? "Number of people"
                            : "لوگوں کی تعداد"}
                    </label>
                </div>

                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm border border-gray-400 rounded-lg hover:bg-gray-100 transition"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => onConfirm(splitCount)}
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition"
                    >
                        {language === "en" ? "Divide Bill" : "بل تقسیم کریں"}
                    </button>
                </div>
            </div>
        </div>
    );
}
