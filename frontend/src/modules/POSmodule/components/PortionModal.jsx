import { X } from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
//  PortionModal
//
//  Opens when the cashier clicks on a cart item name.
//  Lets them change the portion type: Full price / Half price / Custom price.
//
//  Props:
//    product               — the cart item being edited
//    selectedPortionType   — current selection: "full" | "half" | "custom"
//    setSelectedPortionType — updates the selection
//    customPrice           — custom price input value
//    setCustomPrice        — updates the custom price
//    onClose               — closes the modal without saving
//    onConfirm             — applies the change to the cart
//    language              — "en" or "ur"
// ─────────────────────────────────────────────────────────────────────────────
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

    // Base price of this item (before any portion split)
    // Try originalPrice first (stored when item was added), fall back to unitPrice
    const basePrice = Number(product.originalPrice) || Number(product.unitPrice) || 0;

    const PORTIONS = [
        { key: "full",   label: language === "en" ? "Full"         : "پورا",       price: basePrice          },
        { key: "half",   label: language === "en" ? "Half"         : "آدھا",       price: basePrice / 2      },
        { key: "custom", label: language === "en" ? "Custom Price" : "کسٹم قیمت",  price: null               },
    ];

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl p-6 w-96">

                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-gray-800">
                        {language === "en" ? "Select Portion" : "حصہ منتخب کریں"}
                    </h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <p className="text-base font-medium text-gray-700 mb-5">{product.name}</p>

                {/* Portion buttons */}
                <div className="grid grid-cols-3 gap-2 mb-6">
                    {PORTIONS.map(({ key, label, price }) => (
                        <button
                            key={key}
                            onClick={() => {
                                setSelectedPortionType(key);
                                if (key !== "custom") setCustomPrice("");
                            }}
                            className={`px-4 py-3 rounded-lg text-sm font-semibold transition text-center
                                ${selectedPortionType === key
                                    ? "bg-blue-600 text-white shadow-md"
                                    : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
                                }`}
                        >
                            {label}
                            {price !== null && (
                                <span className="block text-xs font-normal mt-0.5">
                                    Rs {price.toFixed(0)}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Custom price input — only shown when "custom" is selected */}
                {selectedPortionType === "custom" && (
                    <div className="mb-6">
                        <label className="block text-sm text-gray-600 mb-1">
                            {language === "en" ? "Enter Custom Price" : "کسٹم قیمت درج کریں"}
                        </label>
                        <input
                            type="number"
                            autoFocus
                            value={customPrice}
                            onChange={(e) => setCustomPrice(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && onConfirm()}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                )}

                {/* Action buttons */}
                <div className="flex justify-end gap-3">
                    <button onClick={onClose}
                        className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition text-gray-700">
                        {language === "en" ? "Cancel" : "منسوخ کریں"}
                    </button>
                    <button onClick={onConfirm}
                        className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition">
                        {language === "en" ? "Update Cart" : "اپ ڈیٹ کریں"}
                    </button>
                </div>
            </div>
        </div>
    );
}
