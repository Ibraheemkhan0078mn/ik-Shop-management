import React, { useState } from "react";
import { X, Package, Calendar, FileText, ShoppingCart, RotateCcw, Trash2 } from "lucide-react";
import { useStockHistory } from "../services/product.service";

export default function StockHistoryModal({ productId, productName, onClose }) {
    const [selectedBatch, setSelectedBatch] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState(null);
    
    const { data: stockHistoryData, isLoading } = useStockHistory(productId, { skip: !productId });

    const data = stockHistoryData || { batches: [] };

    const categoryConfig = {
        purchases: { label: "Purchases", icon: ShoppingCart, color: "text-green-600", bgColor: "bg-green-50", borderColor: "border-green-200", sign: "+" },
        purchaseReturns: { label: "Purchase Returns", icon: RotateCcw, color: "text-red-600", bgColor: "bg-red-50", borderColor: "border-red-200", sign: "-" },
        orders: { label: "Sales (Orders)", icon: FileText, color: "text-orange-600", bgColor: "bg-orange-50", borderColor: "border-orange-200", sign: "-" },
        orderReturns: { label: "Order Returns", icon: RotateCcw, color: "text-blue-600", bgColor: "bg-blue-50", borderColor: "border-blue-200", sign: "+" },
        wastage: { label: "Wastage", icon: Trash2, color: "text-purple-600", bgColor: "bg-purple-50", borderColor: "border-purple-200", sign: "-" }
    };

    const renderSummaryCard = (batch) => {
        const { summary } = batch;
        return (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(categoryConfig).map(([key, config]) => (
                    <div key={key} className={`p-3 rounded-xl border ${config.bgColor} ${config.borderColor}`}>
                        <div className="flex items-center gap-2 mb-1">
                            <config.icon size={14} className={config.color} />
                            <span className="text-xs font-semibold text-gray-600">{config.label}</span>
                        </div>
                        <p className={`text-lg font-bold ${config.color}`}>
                            {config.sign}{summary[key] || 0}
                        </p>
                    </div>
                ))}
                <div className="col-span-2 md:col-span-3 p-4 rounded-xl border bg-gray-50 border-gray-200 mt-2">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-600">Final Stock</span>
                        <span className="text-2xl font-black text-gray-800">{summary.finalStock}</span>
                    </div>
                </div>
            </div>
        );
    };

    const renderHistoryItem = (item, category) => {
        const config = categoryConfig[category];
        const refField = {
            purchases: "invoiceNumber",
            purchaseReturns: "returnNumber",
            orders: "orderNumber",
            orderReturns: "returnNumber",
            wastage: "wastageNumber"
        }[category];

        return (
            <div key={item._id} className={`p-3 rounded-lg border ${config.bgColor} ${config.borderColor} mb-2`}>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-500">{item.date}</span>
                    <span className={`text-sm font-bold ${config.color}`}>
                        {config.sign}{item.quantity}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-700">{item.itemName}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">{item[refField] || item._id}</span>
                </div>
            </div>
        );
    };

    const renderHistoryByDate = (history, category) => {
        const config = categoryConfig[category];
        const data = history[category] || {};
        
        if (Object.keys(data).length === 0) {
            return (
                <div className="text-center py-8 text-gray-400 text-sm">
                    No {config.label.toLowerCase()} recorded
                </div>
            );
        }

        return (
            <div>
                {Object.entries(data)
                    .sort(([a], [b]) => new Date(b) - new Date(a))
                    .map(([date, items]) => (
                        <div key={date} className="mb-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Calendar size={14} className="text-gray-400" />
                                <span className="text-sm font-semibold text-gray-700">{date}</span>
                                <span className="text-xs text-gray-400">({items.length} items)</span>
                            </div>
                            {items.map(item => renderHistoryItem(item, category))}
                        </div>
                    ))}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            
            <div className="relative w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-2xl border"
                style={{ background: "var(--surface)", borderColor: "var(--border)", boxShadow: "0 8px 30px rgba(64,45,28,0.12)" }}>
                
                {/* Header */}
                <div className="px-6 py-5" style={{ background: "var(--surface-muted)", borderBottom: "1px solid var(--border)" }}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-11 h-11 rounded-xl flex items-center justify-center"
                                style={{ background: "rgba(15,118,110,0.12)" }}>
                                <Package size={20} className="text-(--accent-2)" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-(--ink)">Stock History</h2>
                                <p className="text-sm text-(--muted)">{productName}</p>
                            </div>
                        </div>
                        <button onClick={onClose}
                            className="p-2 rounded-lg bg-(--surface) border border-(--border) hover:scale-105 transition-all">
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="overflow-y-auto max-h-[calc(90vh-100px)] p-6">
                    {isLoading ? (
                        <div className="text-center py-8 text-gray-400">Loading stock history...</div>
                    ) : !selectedBatch ? (
                        // Batch Selection View
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-(--ink) uppercase tracking-wider">Select Batch</h3>
                            {data.batches.length === 0 ? (
                                <div className="text-center py-8 text-gray-400">No batches found for this product</div>
                            ) : (
                                data.batches.map((batch) => (
                                <div
                                    key={batch.batchId}
                                    onClick={() => setSelectedBatch(batch)}
                                    className="p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.02] hover:border-(--accent-2)"
                                    style={{ background: "var(--surface-muted)", borderColor: "var(--border)" }}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <Package size={16} className="text-(--accent-2)" />
                                            <div>
                                                <p className="font-semibold text-(--ink)">{batch.batchNumber}</p>
                                                <p className="text-xs text-(--muted)">Current Stock: {batch.currentStock}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-black text-(--accent-2)">{batch.summary.finalStock}</p>
                                            <p className="text-xs text-(--muted)">Final Stock</p>
                                        </div>
                                    </div>
                                    {renderSummaryCard(batch)}
                                </div>
                                ))
                            )}
                        </div>
                    ) : (
                        // Batch Detail View
                        <div className="space-y-6">
                            {/* Back Button */}
                            <button
                                onClick={() => setSelectedBatch(null)}
                                className="flex items-center gap-2 text-sm font-semibold text-(--accent-2) hover:underline"
                            >
                                <ArrowLeft size={16} /> Back to Batches
                            </button>

                            {/* Batch Header */}
                            <div className="p-4 rounded-xl border" style={{ background: "var(--surface-muted)", borderColor: "var(--border)" }}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Package size={20} className="text-(--accent-2)" />
                                        <div>
                                            <h3 className="text-lg font-bold text-(--ink)">{selectedBatch.batchNumber}</h3>
                                            <p className="text-sm text-(--muted)">Batch ID: {selectedBatch.batchId}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-3xl font-black text-(--accent-2)">{selectedBatch.summary.finalStock}</p>
                                        <p className="text-xs text-(--muted)">Calculated Stock</p>
                                    </div>
                                </div>
                            </div>

                            {/* Summary */}
                            <div>
                                <h4 className="text-sm font-bold text-(--ink) uppercase tracking-wider mb-3">Stock Summary</h4>
                                {renderSummaryCard(selectedBatch)}
                            </div>

                            {/* History Categories */}
                            <div>
                                <h4 className="text-sm font-bold text-(--ink) uppercase tracking-wider mb-3">Detailed History</h4>
                                {!selectedCategory ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {Object.entries(categoryConfig).map(([key, config]) => (
                                            <button
                                                key={key}
                                                onClick={() => setSelectedCategory(key)}
                                                className={`p-4 rounded-xl border text-left transition-all hover:scale-[1.02] ${config.bgColor} ${config.borderColor}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <config.icon size={20} className={config.color} />
                                                    <div className="flex-1">
                                                        <p className="font-semibold text-gray-700">{config.label}</p>
                                                        <p className={`text-lg font-bold ${config.color}`}>
                                                            {config.sign}{selectedBatch.summary[key] || 0}
                                                        </p>
                                                    </div>
                                                    <ArrowRight size={16} className="text-gray-400" />
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <div>
                                        <button
                                            onClick={() => setSelectedCategory(null)}
                                            className="flex items-center gap-2 text-sm font-semibold text-(--muted) hover:text-(--ink) mb-4"
                                        >
                                            <ArrowLeft size={16} /> Back to Categories
                                        </button>
                                        <div className={`p-4 rounded-xl border ${categoryConfig[selectedCategory].bgColor} ${categoryConfig[selectedCategory].borderColor}`}>
                                            <div className="flex items-center gap-2 mb-4">
                                                {React.createElement(categoryConfig[selectedCategory].icon, { 
                                                    size: 20, 
                                                    className: categoryConfig[selectedCategory].color 
                                                })}
                                                <h3 className="text-lg font-bold text-gray-700">
                                                    {categoryConfig[selectedCategory].label}
                                                </h3>
                                            </div>
                                            {renderHistoryByDate(selectedBatch.history, selectedCategory)}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function ArrowLeft({ size, className }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
    );
}

function ArrowRight({ size, className }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M5 12h14M12 5l7 7-7 7"/>
        </svg>
    );
}
