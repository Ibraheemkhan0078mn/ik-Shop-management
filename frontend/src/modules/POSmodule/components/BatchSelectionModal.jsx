import React, { useState } from "react";
import { X, CheckCircle2, ChevronRight, PackageOpen } from "lucide-react";
import { useBatches } from "../../stock/services/batch.service";

export default function BatchSelectionModal({ product, initialIsSticky = false, onClose, onConfirm, language }) {
    const { data: batches = [], isLoading } = useBatches(product?._id, {skip: !product?._id});
    const [selectedBatchId, setSelectedBatchId] = useState(null);
    const [isSticky, setIsSticky] = useState(initialIsSticky);

    if (!product) return null;

    // Filter out batches with 0 quantity if we only want to sell available ones,
    // although sometimes they might want to sell anyway (negative stock).
    // For now, let's keep all batches but highlight out-of-stock.
    const sortedBatches = [...batches].sort(
        (a, b) => new Date(a.expiryDate) - new Date(b.expiryDate)
    );

    const handleConfirm = () => {
        if (!selectedBatchId) return;
        const batch = batches.find((b) => b._id === selectedBatchId);
        onConfirm(product, batch, isSticky);
        onClose();
    };

    const handleSellDefault = () => {
        // Sell using the static product price
        onConfirm(product, null, false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 capitalize flex items-center gap-2">
                            <PackageOpen className="w-5 h-5 text-indigo-500" />
                            {language === "en" ? "Select Batch" : "بیچ منتخب کریں"}
                        </h2>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {product.name}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
                            <p>Loading batches...</p>
                        </div>
                    ) : batches.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                <PackageOpen className="w-8 h-8 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-1">
                                {language === "en" ? "No Batches Found" : "کوئی بیچ نہیں ملا"}
                            </h3>
                            <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                                {language === "en"
                                    ? "This product doesn't have any specific batches currently tracked. You can sell it using its default static price."
                                    : "اس پروڈکٹ کا فی الحال کوئی مخصوص بیچ ٹریک نہیں کیا جا رہا ہے۔ آپ اسے اس کی ڈیفالٹ سٹیٹک قیمت کے ساتھ بیچ سکتے ہیں۔"}
                            </p>
                            <button
                                onClick={handleSellDefault}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-6 rounded-xl shadow-sm transition-colors"
                            >
                                {language === "en" ? `Sell Generic (Rs ${product.price})` : `عام بیچیں (Rs ${product.price})`}
                            </button>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {sortedBatches.map((batch) => {
                                const isSelected = selectedBatchId === batch._id;
                                const isOutOfStock = batch.quantity <= 0;
                                const isExpiringSoon =
                                    batch.expiryDate &&
                                    new Date(batch.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

                                return (
                                    <div
                                        key={batch._id}
                                        onClick={() => setSelectedBatchId(batch._id)}
                                        className={`
                                            relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                                            ${isSelected ? "border-indigo-500 bg-indigo-50/50" : "border-gray-200 bg-white hover:border-indigo-300"}
                                            ${isOutOfStock ? "opacity-75" : ""}
                                        `}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h4 className={`font-bold text-lg ${isSelected ? "text-indigo-900" : "text-gray-900"}`}>
                                                        {batch.batchNumber}
                                                    </h4>
                                                    {isOutOfStock && (
                                                        <span className="px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-700 rounded-full">
                                                            Out of Stock
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-3 text-sm">
                                                    <div>
                                                        <span className="text-gray-500">Price: </span>
                                                        <span className="font-semibold text-gray-900 text-base">Rs {batch.sellingPrice}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500">Stock: </span>
                                                        <span className={`font-semibold ${isOutOfStock ? "text-red-600" : "text-gray-900"}`}>
                                                            {batch.quantity} units
                                                        </span>
                                                    </div>
                                                    {batch.expiryDate && (
                                                        <div>
                                                            <span className="text-gray-500">Expires: </span>
                                                            <span className={`font-semibold ${isExpiringSoon ? "text-amber-600" : "text-gray-900"}`}>
                                                                {new Date(batch.expiryDate).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full border-2 border-transparent">
                                                {isSelected ? (
                                                    <CheckCircle2 className="w-6 h-6 text-indigo-600" />
                                                ) : (
                                                    <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}


                        </div>
                    )}
                </div>

                {/* Footer */}
                {batches.length > 0 && !isLoading && (
                    <div className="bg-white px-6 py-4 border-t border-gray-200 flex justify-between items-center shrink-0">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <div className="relative flex items-center justify-center w-5 h-5">
                                <input
                                    type="checkbox"
                                    checked={isSticky}
                                    onChange={(e) => setIsSticky(e.target.checked)}
                                    className="peer appearance-none w-5 h-5 border-2 border-gray-300 rounded hover:border-indigo-400 checked:bg-indigo-600 checked:border-indigo-600 transition-colors cursor-pointer focus:ring-2 focus:ring-indigo-500/30 focus:outline-none"
                                />
                                <CheckCircle2 className="w-3.5 h-3.5 text-white absolute pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" />
                            </div>
                            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 select-none">
                                {language === "en" ? "Save as default batch" : "بطور ڈیفالٹ بیچ محفوظ کریں"}
                            </span>
                        </label>

                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="px-5 py-2.5 rounded-xl font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirm}
                                disabled={!selectedBatchId}
                                className={`
                                    flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-white transition-all shadow-sm
                                    ${!selectedBatchId
                                        ? "bg-gray-300 cursor-not-allowed"
                                        : "bg-indigo-600 hover:bg-indigo-700 hover:shadow-md active:transform active:scale-95"}
                                `}
                            >
                                Confirm Selection
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
