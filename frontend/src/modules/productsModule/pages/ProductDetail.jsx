import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Package, RefreshCw, Trash2, History, ChevronDown, X, ChevronUp, Calendar, FileText, ShoppingCart, RotateCcw, Trash2 as WastageIcon } from "lucide-react";
import { useProduct, useRecalculateProductStock, useStockHistory } from "../services/product.service";
import { getProductLabels } from "../labels/productLabels.js";
import { useSettings } from "../../settings/hooks/useSettings.js";
import { useBatchesByProduct, useDeleteBatch } from "../../../modules/productPurchases/services/batch.service.js";
import { showSuccess, showError } from "../../../shared/utilities/toastHelpers.js";
import PermissionGuard from "../../../shared/components/PermissionGuard.jsx";
import Barcode from "react-barcode";

const IMAGE_BASE = "http://localhost:5001/uploads";

export default function ProductDetail() {
    const navigate = useNavigate();
    const { id } = useParams();
    
    const { settings } = useSettings();
    const language = settings?.language || "en";
    const labels = getProductLabels(language);
    
    const [activeTab, setActiveTab] = useState("details");
    const [showStockHistory, setShowStockHistory] = useState(false);
    const [selectedHistoryBatch, setSelectedHistoryBatch] = useState(null);
    const [selectedHistoryCategory, setSelectedHistoryCategory] = useState(null);
    
    const { data: productData, isLoading, refetch } = useProduct(id, { skip: !id });
    const { data: batchesData } = useBatchesByProduct(id, { skip: !id });
    const { data: stockHistoryData } = useStockHistory(id, { skip: !id });
    const [deleteBatch] = useDeleteBatch();
    const [recalculateStock, { isLoading: isRecalculating }] = useRecalculateProductStock();

    const product = productData;
    const batches = batchesData || [];

    const handleRecalculateStock = async () => {
        try {
            await recalculateStock(id).unwrap();
            showSuccess("Stock recalculated successfully");
            refetch();
        } catch (error) {
            showError(error?.data?.message || "Failed to recalculate stock");
        }
    };

    const isExpired = (expiryDate) => {
        if (!expiryDate) return false;
        const expiry = new Date(expiryDate);
        const today = new Date();
        // Reset time to midnight for accurate date comparison
        today.setHours(0, 0, 0, 0);
        expiry.setHours(0, 0, 0, 0);
        return expiry < today;
    };

    const getBatchStatus = (batch) => {
        // Check expiry first (not handled by backend)
        if (isExpired(batch.expiryDate)) return 'expired';
        // Use backend stockStatus if available
        if (batch.stockStatus) return batch.stockStatus;
        // Fallback to old logic if stockStatus not available
        if (batch.quantity <= 0) return 'empty';
        if (batch.quantity <= 10) return 'low';
        return 'in-stock';
    };

    const getBatchStatusBadge = (status) => {
        const statusConfig = {
            'expired': { label: 'Expired', className: 'bg-red-100 text-red-700' },
            'empty': { label: 'Empty', className: 'bg-red-100 text-red-700' },
            'low_stock': { label: 'Low Stock', className: 'bg-amber-100 text-amber-700' },
            'normal_stock': { label: 'In Stock', className: 'bg-green-100 text-green-700' },
            'max_stock': { label: 'Max Stock', className: 'bg-blue-100 text-blue-700' },
            // Fallback for old frontend status values
            'low': { label: 'Low Stock', className: 'bg-amber-100 text-amber-700' },
            'in-stock': { label: 'In Stock', className: 'bg-green-100 text-green-700' },
        };
        const config = statusConfig[status] || statusConfig['normal_stock'];
        return <span className={`px-2 py-1 text-xs rounded-full ${config.className}`}>{config.label}</span>;
    };

    const handleDeleteBatch = async (batch) => {
        if (batch.quantity > 0) {
            showError("Cannot delete batch: It has stock (quantity: " + batch.quantity + ")");
            return;
        }
        try {
            await deleteBatch(batch._id).unwrap();
            showSuccess("Batch deleted successfully");
            refetch();
        } catch (error) {
            showError(error?.data?.message || "Failed to delete batch");
        }
    };

    if (isLoading) {
        return <div className="p-6 text-center">{labels.loading}</div>;
    }

    if (!product) {
        return <div className="p-6 text-center">Product not found</div>;
    }

    return (
        <div className="p-6 bg-[var(--app-bg)] min-h-screen">
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate("/products")}
                    className="p-2 hover:bg-[var(--hover)] rounded-md"
                >
                    <ArrowLeft size={20} className="text-[var(--ink)]" />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-[var(--ink)] font-display">{product.name}</h1>
                    <p className="text-sm text-[var(--muted)]">{product.productCode || "No product code"}</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowStockHistory(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-[var(--surface-muted)] text-[var(--ink)] rounded-lg hover:bg-[var(--hover)] border border-[var(--border)]"
                    >
                        <History size={16} />
                        Stock History
                    </button>
                    <PermissionGuard 
                        execute={handleRecalculateStock} 
                        permission="products.update" 
                        isConfirmation={false}
                    >
                        <button
                            disabled={isRecalculating}
                            className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-2)] text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <RefreshCw size={16} className={isRecalculating ? "animate-spin" : ""} />
                            {isRecalculating ? "Recalculating..." : "Recalculate Stock"}
                        </button>
                    </PermissionGuard>
                </div>
            </div>

            {/* Stock History Dropdown */}
            {showStockHistory && (
                <div className="card p-6 mt-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-[var(--ink)]">Stock History</h3>
                        <button
                            onClick={() => setShowStockHistory(false)}
                            className="p-2 hover:bg-[var(--surface-muted)] rounded-md"
                        >
                            <X size={18} className="text-[var(--muted)]" />
                        </button>
                    </div>
                    
                    {!stockHistoryData || stockHistoryData.batches.length === 0 ? (
                        <div className="text-center py-8 text-[var(--muted)]">No stock history available</div>
                    ) : (
                        <div className="space-y-4">
                            {stockHistoryData.batches.map((batch) => (
                                <div key={batch.batchId} className="border border-[var(--border)] rounded-xl overflow-hidden">
                                    <button
                                        onClick={() => setSelectedHistoryBatch(selectedHistoryBatch === batch.batchId ? null : batch.batchId)}
                                        className="w-full p-4 flex items-center justify-between hover:bg-[var(--surface-muted)] transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Package size={16} className="text-[var(--accent-2)]" />
                                            <div className="text-left">
                                                <p className="font-semibold text-[var(--ink)]">{batch.batchNumber}</p>
                                                <p className="text-xs text-[var(--muted)]">Current Stock: {batch.currentStock}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-lg font-bold text-[var(--accent-2)]">{batch.summary.finalStock}</span>
                                            {selectedHistoryBatch === batch.batchId ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                        </div>
                                    </button>
                                    
                                    {selectedHistoryBatch === batch.batchId && (
                                        <div className="p-4 border-t border-[var(--border)] bg-[var(--surface-muted)]">
                                            {/* Summary Cards */}
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
                                                <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                                                    <p className="text-xs text-gray-600 mb-1">Purchases</p>
                                                    <p className="text-lg font-bold text-green-600">+{batch.summary.purchases}</p>
                                                </div>
                                                <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                                                    <p className="text-xs text-gray-600 mb-1">Purchase Returns</p>
                                                    <p className="text-lg font-bold text-red-600">-{batch.summary.purchaseReturns}</p>
                                                </div>
                                                <div className="p-3 rounded-lg bg-orange-50 border border-orange-200">
                                                    <p className="text-xs text-gray-600 mb-1">Sales</p>
                                                    <p className="text-lg font-bold text-orange-600">-{batch.summary.orders}</p>
                                                </div>
                                                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                                                    <p className="text-xs text-gray-600 mb-1">Order Returns</p>
                                                    <p className="text-lg font-bold text-blue-600">+{batch.summary.orderReturns}</p>
                                                </div>
                                                <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
                                                    <p className="text-xs text-gray-600 mb-1">Wastage</p>
                                                    <p className="text-lg font-bold text-purple-600">-{batch.summary.wastage}</p>
                                                </div>
                                                <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                                                    <p className="text-xs text-gray-600 mb-1">Final Stock</p>
                                                    <p className="text-lg font-bold text-gray-800">{batch.summary.finalStock}</p>
                                                </div>
                                            </div>
                                            
                                            {/* Detailed History Categories */}
                                            <div className="space-y-3">
                                                {Object.entries(batch.history).map(([category, itemsByDate]) => {
                                                    const categoryConfig = {
                                                        purchases: { label: "Purchases", icon: ShoppingCart, color: "text-green-600", bgColor: "bg-green-50" },
                                                        purchaseReturns: { label: "Purchase Returns", icon: RotateCcw, color: "text-red-600", bgColor: "bg-red-50" },
                                                        orders: { label: "Sales", icon: FileText, color: "text-orange-600", bgColor: "bg-orange-50" },
                                                        orderReturns: { label: "Order Returns", icon: RotateCcw, color: "text-blue-600", bgColor: "bg-blue-50" },
                                                        wastage: { label: "Wastage", icon: WastageIcon, color: "text-purple-600", bgColor: "bg-purple-50" }
                                                    };
                                                    const config = categoryConfig[category];
                                                    const isOpen = selectedHistoryCategory === `${batch.batchId}-${category}`;
                                                    
                                                    return (
                                                        <div key={category} className="border border-[var(--border)] rounded-lg overflow-hidden">
                                                            <button
                                                                onClick={() => setSelectedHistoryCategory(isOpen ? null : `${batch.batchId}-${category}`)}
                                                                className={`w-full p-3 flex items-center justify-between hover:opacity-80 transition-opacity ${config.bgColor}`}
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <config.icon size={16} className={config.color} />
                                                                    <span className="font-semibold text-gray-700">{config.label}</span>
                                                                </div>
                                                                <div className="flex items-center gap-3">
                                                                    <span className={`font-bold ${config.color}`}>
                                                                        {category === 'purchases' || category === 'orderReturns' ? '+' : '-'}
                                                                        {Object.values(itemsByDate).flat().reduce((sum, item) => sum + (item.quantity || 0), 0)}
                                                                    </span>
                                                                    {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                                                </div>
                                                            </button>
                                                            
                                                            {isOpen && (
                                                                <div className="p-3 border-t border-[var(--border)] bg-white">
                                                                    {Object.entries(itemsByDate)
                                                                        .sort(([a], [b]) => new Date(b) - new Date(a))
                                                                        .map(([date, items]) => (
                                                                            <div key={date} className="mb-3 last:mb-0">
                                                                                <div className="flex items-center gap-2 mb-2">
                                                                                    <Calendar size={12} className="text-gray-400" />
                                                                                    <span className="text-xs font-semibold text-gray-600">{date}</span>
                                                                                </div>
                                                                                {items.map((item, idx) => (
                                                                                    <div key={idx} className="p-2 rounded bg-[var(--surface-muted)] mb-1 last:mb-0">
                                                                                        <div className="flex justify-between items-center mb-1">
                                                                                            <span className="text-xs text-gray-700">{item.itemName}</span>
                                                                                            <span className={`text-xs font-bold ${config.color}`}>
                                                                                                {category === 'purchases' || category === 'orderReturns' ? '+' : '-'}
                                                                                                {item.quantity}
                                                                                            </span>
                                                                                        </div>
                                                                                        <span className="text-xs text-gray-400">
                                                                                            {item.invoiceNumber || item.returnNumber || item.orderNumber || item.wastageNumber || item._id}
                                                                                        </span>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        ))}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-[var(--border)]">
                {["details", "batches"].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 capitalize ${
                            activeTab === tab
                                ? "border-b-2 border-[var(--accent-2)] text-[var(--accent-2)]"
                                : "text-[var(--muted)] hover:text-[var(--ink)]"
                        }`}
                    >
                        {tab === "details" ? "Product Details" : "Batches"}
                    </button>
                ))}
            </div>

            {/* Details Tab */}
            {activeTab === "details" && (
                <div className="card p-4 sm:p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        <div className="sm:col-span-2 lg:col-span-3 flex flex-col sm:flex-row items-start gap-4 pb-4 border-b border-[var(--border)]">
                            {product.image
                                ? <img src={`${IMAGE_BASE}/${product.image}`} alt={product.name} className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl object-cover ring-1 ring-[var(--border)] shrink-0" />
                                : <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-[var(--surface-muted)] flex items-center justify-center text-3xl font-bold text-[var(--muted)] shrink-0">
                                    {product.name?.charAt(0).toUpperCase()}
                                </div>
                            }
                            <div className="flex-1 min-w-0">
                                <h3 className="text-lg font-semibold text-[var(--ink)] break-words">{product.name}</h3>
                                {product.description && <p className="text-sm text-[var(--muted)] mt-1 break-words">{product.description}</p>}
                            </div>
                        </div>
                        {product.productCode && (
                            <div className="min-w-0">
                                <label className="text-sm text-[var(--muted)]">Product Code</label>
                                <p className="font-medium text-[var(--ink)] truncate">{product.productCode}</p>
                            </div>
                        )}
                        {product.barcode && (
                            <div className="min-w-0">
                                <label className="text-sm text-[var(--muted)]">Barcode</label>
                                <p className="font-medium text-[var(--ink)] truncate">{product.barcode}</p>
                            </div>
                        )}
                        {product.brandName && (
                            <div className="min-w-0">
                                <label className="text-sm text-[var(--muted)]">Brand</label>
                                <p className="font-medium text-[var(--ink)] truncate">{product.brandName}</p>
                            </div>
                        )}
                        {product.categoryName && (
                            <div className="min-w-0">
                                <label className="text-sm text-[var(--muted)]">Category</label>
                                <p className="font-medium text-[var(--ink)] break-words">{product.categoryName || "—"}</p>
                            </div>
                        )}
                        {product.subCategoryName && (
                            <div className="min-w-0">
                                <label className="text-sm text-[var(--muted)]">Sub Category</label>
                                <p className="font-medium text-[var(--ink)] break-words">{product.subCategoryName || "—"}</p>
                            </div>
                        )}
                        {product.minStockLevel !== undefined && product.minStockLevel !== null && (
                            <div className="min-w-0">
                                <label className="text-sm text-[var(--muted)]">Min Stock Level</label>
                                <p className="font-medium text-[var(--ink)] truncate">{product.minStockLevel}</p>
                            </div>
                        )}
                        {product.maxStockLevel !== undefined && product.maxStockLevel !== null && (
                            <div className="min-w-0">
                                <label className="text-sm text-[var(--muted)]">Max Stock Level</label>
                                <p className="font-medium text-[var(--ink)] truncate">{product.maxStockLevel}</p>
                            </div>
                        )}
                        {product.currentStockLevel !== undefined && product.currentStockLevel !== null && (
                            <div className="min-w-0">
                                <label className="text-sm text-[var(--muted)]">Current Stock</label>
                                <p className="font-medium text-[var(--ink)] truncate">{product.currentStockLevel}</p>
                            </div>
                        )}
                        {product.rackLocation && (
                            <div className="min-w-0">
                                <label className="text-sm text-[var(--muted)]">Rack Location</label>
                                <p className="font-medium text-[var(--ink)] truncate">{product.rackLocation}</p>
                            </div>
                        )}

                        {/* Discount Section */}
                        <div className="sm:col-span-2 lg:col-span-3 pt-4 border-t border-[var(--border)]">
                            <h4 className="text-xs font-semibold uppercase tracking-wider mb-3 text-[var(--muted)]">Discount Settings</h4>
                        </div>
                        <div className="min-w-0">
                            <label className="text-sm text-[var(--muted)] block mb-1">Discount Allowed</label>
                            <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${product.isDiscountAllowed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {product.isDiscountAllowed ? "Yes" : "No"}
                            </span>
                        </div>
                        {product.isDiscountAllowed && product.maxDiscountPercent !== undefined && product.maxDiscountPercent !== null && (
                            <div className="min-w-0">
                                <label className="text-sm text-[var(--muted)]">Discount Limit</label>
                                <p className="font-medium text-[var(--ink)] truncate">
                                    {product.discountLimitType === 'fixed' 
                                        ? `Rs ${product.maxDiscountPercent} (fixed)` 
                                        : `${product.maxDiscountPercent}% (percentage)`
                                    }
                                </p>
                            </div>
                        )}

                        {/* Tax Section */}
                        <div className="sm:col-span-2 lg:col-span-3 pt-4 border-t border-[var(--border)]">
                            <h4 className="text-xs font-semibold uppercase tracking-wider mb-3 text-[var(--muted)]">Tax Applied in POS</h4>
                        </div>
                        {product.taxPercent !== undefined && product.taxPercent !== null && (
                            <div className="min-w-0">
                                <label className="text-sm text-[var(--muted)]">Tax Rate</label>
                                <p className="font-medium text-[var(--ink)] truncate">
                                    {product.taxType === 'fixed' 
                                        ? `Rs ${product.taxPercent} (fixed)` 
                                        : `${product.taxPercent}% (percentage)`
                                    }
                                </p>
                            </div>
                        )}

                        <div className="min-w-0">
                            <label className="text-sm text-[var(--muted)] block mb-1">Status</label>
                            <span className={`px-2 py-1 text-xs rounded-full whitespace-nowrap ${product.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {product.isActive ? "Active" : "Inactive"}
                            </span>
                        </div>
                        {product.barcode && (
                            <div className="sm:col-span-2 lg:col-span-3 flex flex-col items-center justify-center p-4 rounded-xl" style={{ background: "var(--surface-muted)", border: "1px solid var(--border)" }}>
                                <label className="text-sm text-[var(--muted)] mb-2">Barcode</label>
                                <Barcode 
                                    value={product.barcode} 
                                    width={2} 
                                    height={60} 
                                    fontSize={14} 
                                    displayValue={true}
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Batches Tab */}
            {activeTab === "batches" && (
                <div className="card p-6">
                    <h3 className="text-lg font-semibold text-[var(--ink)] mb-4">Product Batches</h3>
                    {batches.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead style={{ background: "var(--surface-muted)" }}>
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">Batch Number</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">Supplier</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">Stock</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">Purchase Price</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">Selling Price</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">MFG Date</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">Expiry Date</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-[var(--muted)]">Status</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-[var(--muted)]">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                                    {batches.map((batch) => {
                                        const status = getBatchStatus(batch);
                                        return (
                                            <tr key={batch._id} className="hover:bg-[var(--surface-muted)]">
                                                <td className="px-4 py-3 text-sm font-medium text-[var(--ink)]">{batch.batchNumber}</td>
                                                <td className="px-4 py-3 text-sm text-[var(--muted)]">{batch.supplier?.name || "—"}</td>
                                                <td className="px-4 py-3 text-sm font-semibold text-right text-[var(--accent-2)]">{batch.quantity || 0}</td>
                                                <td className="px-4 py-3 text-sm text-right text-[var(--ink)]">Rs {batch.purchasePrice || 0}</td>
                                                <td className="px-4 py-3 text-sm text-right text-[var(--ink)]">Rs {batch.sellingPrice || 0}</td>
                                                <td className="px-4 py-3 text-sm text-[var(--muted)]">{batch.mfgDate ? new Date(batch.mfgDate).toLocaleDateString() : "—"}</td>
                                                <td className={`px-4 py-3 text-sm ${status === 'expired' ? 'text-red-500' : 'text-[var(--ink)]'}`}>
                                                    {batch.expiryDate ? new Date(batch.expiryDate).toLocaleDateString() : "—"}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    {getBatchStatusBadge(status)}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <PermissionGuard execute={() => handleDeleteBatch(batch)} permission="product.delete" isConfirmation={true}>
                                                        <button
                                                            disabled={batch.quantity > 0}
                                                            className={`p-2 rounded-lg transition-all ${
                                                                batch.quantity > 0
                                                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                    : 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white'
                                                            }`}
                                                            title={batch.quantity > 0 ? "Cannot delete: Has stock" : "Delete batch"}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </PermissionGuard>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Package size={48} className="text-[var(--muted)] mb-4 mx-auto" />
                            <p className="text-[var(--muted)]">No batches found for this product</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
