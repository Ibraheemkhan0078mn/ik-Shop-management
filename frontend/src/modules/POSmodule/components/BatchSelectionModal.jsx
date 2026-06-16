import { useState }                                    from "react";
import { X, CheckCircle2, ChevronRight, PackageOpen }  from "lucide-react";
import { useBatchesByProduct } from "../../productPurchases/services/batch.service";

// ─────────────────────────────────────────────────────────────────────────────
//  BatchSelectionModal
//
//  Opens when a product has batches and the cashier needs to pick one.
//  Shows all batches sorted by expiry date (soonest first).
//  Highlights out-of-stock and expiring-soon batches.
//  Option to "Save as default" so the same batch is used next time.
//
//  Props:
//    product        — the product whose batches we are listing
//    initialIsSticky — whether this product already has a saved default batch
//    onClose        — closes the modal
//    onConfirm(product, batch, isSticky) — called when cashier confirms selection
//    language       — "en" or "ur"
// ─────────────────────────────────────────────────────────────────────────────
export default function BatchSelectionModal({ product, initialIsSticky = false, onClose, onConfirm, language }) {
    const { data: batches = [], isLoading } = useBatchesByProduct(product?._id, { skip: !product?._id });

    const [selectedBatchId, setSelectedBatchId] = useState(null);
    const [isSticky,        setIsSticky]        = useState(initialIsSticky);

    if (!product) return null;

    // Sort batches so those expiring soonest appear at the top
    const sortedBatches = [...batches].sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

    const handleConfirm = () => {
        if (!selectedBatchId) return;
        const batch = batches.find((b) => b._id === selectedBatchId);
        onConfirm(product, batch, isSticky);
        onClose();
    };

    // Fallback: sell without a batch (uses product's static price)
    const handleSellWithoutBatch = () => { onConfirm(product, null, false); onClose(); };

    // A batch is expiring soon if its expiry is within the next 30 days
    const isExpiringSoon = (expiryDate) =>
        expiryDate && new Date(expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <PackageOpen className="w-5 h-5 text-indigo-500" />
                            {language === "en" ? "Select Batch" : "بیچ منتخب کریں"}
                        </h2>
                        <p className="text-sm text-gray-500 mt-0.5">{product.name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition text-gray-500">
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
                            <p className="text-sm text-gray-500 mb-6">
                                {language === "en"
                                    ? "No batches tracked for this product. Selling at its default price."
                                    : "اس پروڈکٹ کا کوئی بیچ نہیں۔ ڈیفالٹ قیمت پر بیچیں۔"}
                            </p>
                            <button onClick={handleSellWithoutBatch}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 px-6 rounded-xl shadow-sm transition">
                                {language === "en" ? `Sell (Rs ${product.price})` : `بیچیں (Rs ${product.price})`}
                            </button>
                        </div>
                    ) : (
                        <div className="grid gap-4">
                            {sortedBatches.map((batch) => {
                                const isSelected    = selectedBatchId === batch._id;
                                const outOfStock    = batch.quantity <= 0;
                                const nearExpiry    = isExpiringSoon(batch.expiryDate);

                                return (
                                    <div
                                        key={batch._id}
                                        onClick={() => setSelectedBatchId(batch._id)}
                                        className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all
                                            ${isSelected ? "border-indigo-500 bg-indigo-50/50" : "border-gray-200 bg-white hover:border-indigo-300"}
                                            ${outOfStock ? "opacity-75" : ""}`}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h4 className={`font-bold text-lg ${isSelected ? "text-indigo-900" : "text-gray-900"}`}>
                                                        {batch.batchNumber}
                                                    </h4>
                                                    {outOfStock && (
                                                        <span className="px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-700 rounded-full">
                                                            Out of Stock
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex flex-wrap gap-x-6 gap-y-2 mt-3 text-sm">
                                                    <span>
                                                        <span className="text-gray-500">Price: </span>
                                                        <span className="font-semibold text-gray-900">Rs {batch.sellingPrice}</span>
                                                    </span>
                                                    <span>
                                                        <span className="text-gray-500">Stock: </span>
                                                        <span className={`font-semibold ${outOfStock ? "text-red-600" : "text-gray-900"}`}>
                                                            {batch.quantity} units
                                                        </span>
                                                    </span>
                                                    {batch.expiryDate && (
                                                        <span>
                                                            <span className="text-gray-500">Expires: </span>
                                                            <span className={`font-semibold ${nearExpiry ? "text-amber-600" : "text-gray-900"}`}>
                                                                {new Date(batch.expiryDate).toLocaleDateString()}
                                                            </span>
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Selection indicator */}
                                            <div className="shrink-0">
                                                {isSelected
                                                    ? <CheckCircle2 className="w-6 h-6 text-indigo-600" />
                                                    : <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                                                }
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer (only shown when batches exist) */}
                {batches.length > 0 && !isLoading && (
                    <div className="bg-white px-6 py-4 border-t border-gray-200 flex justify-between items-center shrink-0">

                        {/* "Save as default batch" checkbox */}
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox" checked={isSticky} onChange={(e) => setIsSticky(e.target.checked)}
                                className="w-4 h-4 accent-indigo-600"
                            />
                            <span className="text-sm text-gray-700">
                                {language === "en" ? "Save as default batch" : "بطور ڈیفالٹ بیچ محفوظ کریں"}
                            </span>
                        </label>

                        <div className="flex gap-3">
                            <button onClick={onClose}
                                className="px-5 py-2.5 rounded-xl font-medium text-gray-700 hover:bg-gray-100 transition">
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirm} disabled={!selectedBatchId}
                                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-white transition shadow-sm
                                    ${!selectedBatchId ? "bg-gray-300 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700 active:scale-95"}`}
                            >
                                Confirm <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
