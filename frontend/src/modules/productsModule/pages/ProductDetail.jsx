import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Edit, Package, Calendar, DollarSign, AlertTriangle, Trash2 } from "lucide-react";
import { useProduct } from "../services/product.service";
import { getProductLabels } from "../labels/productLabels.js";
import { useSettings } from "../../settings/hooks/useSettings.js";
import { useBatchesByProduct, useDeleteBatch } from "../../../modules/productPurchases/services/batch.service.js";
import { showSuccess, showError } from "../../../shared/utilities/toastHelpers.js";

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

    const product = productData;
    const batches = batchesData || [];

    const handleDeleteBatch = async (batch) => {
        if (batch.currentStock > 0) {
            showError("Cannot delete batch: It has stock (quantity: " + batch.currentStock + ")");
            return;
        }
        if (window.confirm("Are you sure you want to delete this batch?")) {
            try {
                await deleteBatch(batch._id).unwrap();
                showSuccess("Batch deleted successfully");
                refetch();
            } catch (error) {
                showError(error?.data?.message || "Failed to delete batch");
            }
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
                <button
                    onClick={() => navigate(`/products/edit/${id}`)}
                    className="btn-add"
                >
                    <Edit size={16} /> {labels.edit}
                </button>
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
                <div className="card p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2 flex items-start gap-4">
                            {product.image
                                ? <img src={`${IMAGE_BASE}/${product.image}`} alt={product.name} className="w-24 h-24 rounded-xl object-cover ring-1 ring-[var(--border)]" />
                                : <div className="w-24 h-24 rounded-xl bg-[var(--surface-muted)] flex items-center justify-center text-3xl font-bold text-[var(--muted)]">
                                    {product.name?.charAt(0).toUpperCase()}
                                </div>
                            }
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-[var(--ink)]">{product.name}</h3>
                                <p className="text-sm text-[var(--muted)] mt-1">{product.description || "No description"}</p>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm text-[var(--muted)]">Product Code</label>
                            <p className="font-medium text-[var(--ink)]">{product.productCode || "—"}</p>
                        </div>
                        <div>
                            <label className="text-sm text-[var(--muted)]">Barcode</label>
                            <p className="font-medium text-[var(--ink)]">{product.barcode || "—"}</p>
                        </div>
                        <div>
                            <label className="text-sm text-[var(--muted)]">Brand</label>
                            <p className="font-medium text-[var(--ink)]">{product.brandName || "—"}</p>
                        </div>
                        <div>
                            <label className="text-sm text-[var(--muted)]">Category</label>
                            <p className="font-medium text-[var(--ink)]">{product.category?.name || "—"} {product.subCategory?.name && `› ${product.subCategory.name}`}</p>
                        </div>
                        <div>
                            <label className="text-sm text-[var(--muted)]">Unit</label>
                            <p className="font-medium text-[var(--ink)] capitalize">{product.unit || "—"}</p>
                        </div>
                        <div>
                            <label className="text-sm text-[var(--muted)]">Cost Price</label>
                            <p className="font-medium text-[var(--ink)]">Rs {product.defaultCostPrice || 0}</p>
                        </div>
                        <div>
                            <label className="text-sm text-[var(--muted)]">Sale Price</label>
                            <p className="font-medium text-[var(--accent-2)]">Rs {product.defaultSalePrice || 0}</p>
                        </div>
                        <div>
                            <label className="text-sm text-[var(--muted)]">Tax %</label>
                            <p className="font-medium text-[var(--ink)]">{product.taxPercent || 0}%</p>
                        </div>
                        <div>
                            <label className="text-sm text-[var(--muted)]">Tax Type</label>
                            <p className="font-medium text-[var(--ink)] capitalize">{product.taxType || "—"}</p>
                        </div>
                        <div>
                            <label className="text-sm text-[var(--muted)]">Min Stock Level</label>
                            <p className="font-medium text-[var(--ink)]">{product.minStockLevel || 0}</p>
                        </div>
                        <div>
                            <label className="text-sm text-[var(--muted)]">Max Stock Level</label>
                            <p className="font-medium text-[var(--ink)]">{product.maxStockLevel || 0}</p>
                        </div>
                        <div>
                            <label className="text-sm text-[var(--muted)]">Current Stock</label>
                            <p className="font-medium text-[var(--ink)]">{product.currentStockLevel || 0}</p>
                        </div>
                        <div>
                            <label className="text-sm text-[var(--muted)]">Rack Location</label>
                            <p className="font-medium text-[var(--ink)]">{product.rackLocation || "—"}</p>
                        </div>
                        <div>
                            <label className="text-sm text-[var(--muted)]">Allow Negative Stock</label>
                            <span className={`px-2 py-1 text-xs rounded-full ${product.allowNegativeStock ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {product.allowNegativeStock ? "Yes" : "No"}
                            </span>
                        </div>
                        <div>
                            <label className="text-sm text-[var(--muted)]">Discount Allowed</label>
                            <span className={`px-2 py-1 text-xs rounded-full ${product.isDiscountAllowed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {product.isDiscountAllowed ? "Yes" : "No"}
                            </span>
                        </div>
                        {product.isDiscountAllowed && (
                            <>
                                <div>
                                    <label className="text-sm text-[var(--muted)]">Max Discount %</label>
                                    <p className="font-medium text-[var(--ink)]">{product.maxDiscountPercent || 0}%</p>
                                </div>
                                <div>
                                    <label className="text-sm text-[var(--muted)]">Discount Limit</label>
                                    <p className="font-medium text-[var(--ink)]">Rs {product.discountLimit || 0}</p>
                                </div>
                            </>
                        )}
                        <div>
                            <label className="text-sm text-[var(--muted)]">Status</label>
                            <span className={`px-2 py-1 text-xs rounded-full ${product.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {product.isActive ? "Active" : "Inactive"}
                            </span>
                        </div>
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
                                    {batches.map((batch) => (
                                        <tr key={batch._id} className="hover:bg-[var(--surface-muted)]">
                                            <td className="px-4 py-3 text-sm font-medium text-[var(--ink)]">{batch.batchNumber}</td>
                                            <td className="px-4 py-3 text-sm text-[var(--muted)]">{batch.supplier?.name || "—"}</td>
                                            <td className="px-4 py-3 text-sm font-semibold text-right text-[var(--accent-2)]">{batch.currentStock || 0}</td>
                                            <td className="px-4 py-3 text-sm text-right text-[var(--ink)]">Rs {batch.purchasePrice || 0}</td>
                                            <td className="px-4 py-3 text-sm text-right text-[var(--ink)]">Rs {batch.sellingPrice || 0}</td>
                                            <td className="px-4 py-3 text-sm text-[var(--muted)]">{batch.mfgDate ? new Date(batch.mfgDate).toLocaleDateString() : "—"}</td>
                                            <td className={`px-4 py-3 text-sm ${batch.expiryDate && new Date(batch.expiryDate) < new Date() ? 'text-red-500' : 'text-[var(--ink)]'}`}>
                                                {batch.expiryDate ? new Date(batch.expiryDate).toLocaleDateString() : "—"}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                {batch.expiryDate && new Date(batch.expiryDate) < new Date() ? (
                                                    <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">Expired</span>
                                                ) : batch.currentStock <= 0 ? (
                                                    <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700">Empty</span>
                                                ) : batch.currentStock <= 10 ? (
                                                    <span className="px-2 py-1 text-xs rounded-full bg-amber-100 text-amber-700">Low Stock</span>
                                                ) : (
                                                    <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">In Stock</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => handleDeleteBatch(batch)}
                                                    disabled={batch.currentStock > 0}
                                                    className={`p-2 rounded-lg transition-all ${
                                                        batch.currentStock > 0
                                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                            : 'bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white'
                                                    }`}
                                                    title={batch.currentStock > 0 ? "Cannot delete: Has stock" : "Delete batch"}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
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
