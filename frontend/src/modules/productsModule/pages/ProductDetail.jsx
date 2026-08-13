import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Package, RefreshCw, Trash2 } from "lucide-react";
import { useProduct, useRecalculateProductStock } from "../services/product.service";
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
    
    const { data: productData, isLoading, refetch } = useProduct(id, { skip: !id });
    const { data: batchesData } = useBatchesByProduct(id, { skip: !id });
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
        if (isExpired(batch.expiryDate)) return 'expired';
        if (batch.quantity <= 0) return 'empty';
        if (batch.quantity <= 10) return 'low';
        return 'in-stock';
    };

    const getBatchStatusBadge = (status) => {
        const statusConfig = {
            'expired': { label: 'Expired', className: 'bg-red-100 text-red-700' },
            'empty': { label: 'Empty', className: 'bg-red-100 text-red-700' },
            'low': { label: 'Low Stock', className: 'bg-amber-100 text-amber-700' },
            'in-stock': { label: 'In Stock', className: 'bg-green-100 text-green-700' },
        };
        const config = statusConfig[status] || statusConfig['in-stock'];
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
                                <p className="font-medium text-[var(--ink)] truncate">{product.maxDiscountPercent}% ({product.discountLimitType || 'percentage'})</p>
                            </div>
                        )}

                        {/* Tax Section */}
                        <div className="sm:col-span-2 lg:col-span-3 pt-4 border-t border-[var(--border)]">
                            <h4 className="text-xs font-semibold uppercase tracking-wider mb-3 text-[var(--muted)]">Tax Applied in POS</h4>
                        </div>
                        {product.taxPercent !== undefined && product.taxPercent !== null && (
                            <div className="min-w-0">
                                <label className="text-sm text-[var(--muted)]">Tax Rate</label>
                                <p className="font-medium text-[var(--ink)] truncate">{product.taxPercent}% ({product.taxType || 'percentage'})</p>
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
