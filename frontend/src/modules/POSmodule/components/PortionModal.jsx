// ============================================
// 11. components/modals/PortionModal.jsx
// ============================================
import React from "react";
import { X } from "lucide-react";

export default function PortionModal({
    product,
    selectedPortionType,
    setSelectedPortionType,
    customPrice,
    setCustomPrice,
    onClose,
    onConfirm,
    language,
}) {
    if (!product) return null;

    const fullPrice =
        product.originalPrice ||
        product.price - (product.price * (product.discount || 0)) / 100;

    return (
        <div className="fixed right-10 top-5 rounded-full bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 w-96">
                <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center justify-between">
                    <span>
                        {language === "en"
                            ? "Select Portion"
                            : "حصہ منتخب کریں"}
                    </span>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </h3>
                <p className="text-lg font-medium mb-4">{product.name}</p>

                <div className="mb-6 grid grid-cols-3 gap-2">
                    <button
                        onClick={() => {
                            setSelectedPortionType("full");
                            setCustomPrice("");
                        }}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                            selectedPortionType === "full"
                                ? "bg-blue-600 text-white shadow-md"
                                : "bg-white text-gray-700 border border-gray-400 hover:bg-gray-100"
                        }`}
                    >
                        {language === "en" ? "Full" : "پورا"}
                        <br />
                        <span className="text-xs font-normal">
                            Rs {fullPrice.toFixed(0)}
                        </span>
                    </button>

                    <button
                        onClick={() => {
                            setSelectedPortionType("half");
                            setCustomPrice("");
                        }}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                            selectedPortionType === "half"
                                ? "bg-blue-600 text-white shadow-md"
                                : "bg-white text-gray-700 border border-gray-400 hover:bg-gray-100"
                        }`}
                    >
                        {language === "en" ? "Half" : "آدھا"}
                        <br />
                        <span className="text-xs font-normal">
                            Rs {(fullPrice / 2).toFixed(0)}
                        </span>
                    </button>

                    <button
                        onClick={() => setSelectedPortionType("custom")}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                            selectedPortionType === "custom"
                                ? "bg-blue-600 text-white shadow-md"
                                : "bg-white text-gray-700 border border-gray-400 hover:bg-gray-100"
                        }`}
                    >
                        {language === "en" ? "Custom Price" : "کسٹم قیمت"}
                    </button>
                </div>

                {selectedPortionType === "custom" && (
                    <div className="relative w-full mb-6">
                        <input
                            type="number"
                            id="customPrice"
                            autoFocus
                            placeholder=" "
                            value={customPrice}
                            onChange={(e) => setCustomPrice(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && onConfirm()}
                            className="block w-full px-3 pt-4 pb-2 text-sm text-gray-900 bg-white border border-gray-400 rounded-lg appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 peer"
                        />
                        <label
                            htmlFor="customPrice"
                            className="absolute left-3 z-10 px-1 bg-white text-gray-500 text-sm duration-300 transform origin-[0] top-2 -translate-y-4 scale-75 peer-focus:text-blue-500"
                        >
                            {language === "en"
                                ? "Enter Custom Price"
                                : "کسٹم قیمت درج کریں"}
                        </label>
                    </div>
                )}

                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm border border-gray-400 rounded-lg hover:bg-gray-100 transition"
                    >
                        {language === "en" ? "Cancel" : "منسوخ کریں"}
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-sm transition"
                    >
                        {language === "en" ? "Update Cart" : "اپ ڈیٹ کریں"}
                    </button>
                </div>
            </div>
        </div>
    );
}
