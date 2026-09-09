import React, { useState } from "react";
import { RefreshCw, AlertTriangle, CheckCircle } from "lucide-react";
import { useRecalculateAllDataMutation } from "../api/settings.api.js";
import { showSuccess, showError } from "../../../shared/utilities/toastHelpers.js";

export default function RecalculationSettings({ labels = {} }) {
    const [isRecalculating, setIsRecalculating] = useState(false);
    const [lastRecalculated, setLastRecalculated] = useState(null);
    const [recalculateAllData] = useRecalculateAllDataMutation();

    const handleRecalculateAll = async () => {
        if (isRecalculating) return;

        setIsRecalculating(true);
        try {
            await recalculateAllData().unwrap();
            setLastRecalculated(new Date().toLocaleString());
            showSuccess("All data recalculated successfully");
        } catch (error) {
            console.error("Recalculation failed:", error);
            showError(error?.data?.message || "Failed to recalculate data. Please try again.");
        } finally {
            setIsRecalculating(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-semibold mb-2" style={{ color: "#1f2937" }}>
                    {labels.recalculationTitle || "Data Recalculation"}
                </h3>
                <p className="text-sm" style={{ color: "#6b7280" }}>
                    {labels.recalculationDescription || "Recalculate all business data including purchases, suppliers, customers, orders, returns, wastages, and product stock."}
                </p>
            </div>

            <div 
                className="border rounded-lg p-6"
                style={{ borderColor: "#e5e7eb", backgroundColor: "#f9fafb" }}
            >
                <div className="flex items-start gap-4">
                    <div 
                        className="p-3 rounded-full"
                        style={{ backgroundColor: "rgba(239, 68, 68, 0.1)" }}
                    >
                        <AlertTriangle size={24} style={{ color: "#ef4444" }} />
                    </div>
                    <div className="flex-1">
                        <h4 className="font-semibold mb-2" style={{ color: "#1f2937" }}>
                            {labels.warningTitle || "Important Notice"}
                        </h4>
                        <p className="text-sm mb-4" style={{ color: "#6b7280" }}>
                            {labels.warningMessage || "This operation will recalculate all financial data across the system. It may take a few minutes to complete. Ensure you have a stable internet connection before proceeding."}
                        </p>
                        
                        <div className="text-sm space-y-1" style={{ color: "#4b5563" }}>
                            <p className="font-medium">{labels.recalculationScope || "This will recalculate:"}</p>
                            <ul className="list-disc list-inside pl-4 space-y-1">
                                <li>All purchases and purchase payments</li>
                                <li>Supplier credits and debits</li>
                                <li>Customer credits and debits</li>
                                <li>All orders and order payments</li>
                                <li>All order returns</li>
                                <li>All purchase returns</li>
                                <li>All wastages</li>
                                <li>All product stock levels</li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {lastRecalculated && (
                            <div className="flex items-center gap-2 text-sm" style={{ color: "#16a34a" }}>
                                <CheckCircle size={16} />
                                <span>{labels.lastRecalculated || "Last recalculated"}: {lastRecalculated}</span>
                            </div>
                        )}
                    </div>
                    
                    <button
                        onClick={handleRecalculateAll}
                        disabled={isRecalculating}
                        className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                    >
                        {isRecalculating ? (
                            <>
                                <RefreshCw size={18} className="animate-spin" />
                                <span>{labels.recalculating || "Recalculating..."}</span>
                            </>
                        ) : (
                            <>
                                <RefreshCw size={18} />
                                <span>{labels.recalculateAll || "Recalculate All Data"}</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {isRecalculating && (
                <div 
                    className="border rounded-lg p-4 flex items-center gap-3"
                    style={{ borderColor: "#e5e7eb", backgroundColor: "#fef3c7" }}
                >
                    <RefreshCw size={20} className="animate-spin" style={{ color: "#d97706" }} />
                    <div>
                        <p className="font-medium" style={{ color: "#92400e" }}>
                            {labels.inProgress || "Recalculation in Progress"}
                        </p>
                        <p className="text-sm" style={{ color: "#b45309" }}>
                            {labels.inProgressMessage || "Please wait while we recalculate all your business data. Do not close this window."}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
