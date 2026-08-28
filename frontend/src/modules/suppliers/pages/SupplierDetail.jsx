import React, { useState, lazy, Suspense } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Phone, Mail, MapPin, Building2, Package, FileText } from "lucide-react";
import { useSupplier } from "../services/suppliers.service.js";
import { getSupplierLabels } from "../labels/supplierLabels.js";
import { useSettings } from "../../settings/hooks/useSettings.js";
import BigViewImage from "../../../shared/components/BigViewImage.jsx";

const SupplierPurchases = lazy(() => import("../components/SupplierPurchases.jsx"));
const SupplierReturns = lazy(() => import("../components/SupplierReturns.jsx"));
const SupplierCredits = lazy(() => import("../components/SupplierCredits.jsx"));

const IMAGE_BASE = "http://localhost:5001/uploads";

export default function SupplierDetail() {
    const navigate = useNavigate();
    const { id } = useParams();
    
    const { settings } = useSettings();
    const language = settings?.language || "en";
    const labels = getSupplierLabels(language);
    
    const [activeTab, setActiveTab] = useState("details");
    const [imageLoadState, setImageLoadState] = useState(undefined);
    const { data: supplierData, isLoading, refetch: refetchSupplier } = useSupplier(id);
    const supplier = supplierData;
    const qarzaAccountId = supplier?.qarzaAccountId;

    const handleImageLoad = () => setImageLoadState(true);
    const handleImageError = () => setImageLoadState(false);

    const PlaceholderImg = ({ size = 16, name = "" }) => (
        <div className={`w-${size} h-${size} rounded-xl bg-(--surface-muted) flex items-center justify-center shrink-0`}>
            {name ? <span className="text-2xl font-bold text-(--muted)">{name.charAt(0).toUpperCase()}</span> : <Package className="w-6 h-6 text-(--muted)" strokeWidth={1.5} />}
        </div>
    );

    if (isLoading) {
        return <div className="p-6 text-center">{labels.loading || "Loading..."}</div>;
    }

    if (!supplier) {
        return <div className="p-6 text-center">Supplier not found</div>;
    }

    return (
        <div className="p-6 bg-[var(--app-bg)] min-h-screen">

            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate("/suppliers")}
                    className="p-2 hover:bg-[var(--hover)] rounded-md transition-all"
                >
                    <ArrowLeft size={20} className="text-[var(--ink)]" />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-[var(--ink)] font-display">{supplier.name}</h1>
                    <p className="text-sm text-[var(--muted)]">{supplier.type || "Supplier"}</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-[var(--border)]">
                {["details", "purchases", "returns", "credits"].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 capitalize font-semibold transition-all ${
                            activeTab === tab
                                ? "border-b-2 border-[var(--accent-2)] text-[var(--accent-2)]"
                                : "text-[var(--muted)] hover:text-[var(--ink)]"
                        }`}
                    >
                        {tab === "details" ? labels.details || "Details" : 
                         tab === "purchases" ? labels.purchases || "Purchases" : 
                         tab === "returns" ? "Returns" :
                         "Credits & Debits"}
                    </button>
                ))}
            </div>

            {/* Details Tab */}
            {activeTab === "details" && (
                <div className="card p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2 flex items-start gap-4 p-4 bg-[var(--surface-muted)] rounded-xl">
                            {supplier.image && imageLoadState === true ? (
                                <BigViewImage 
                                    src={`${IMAGE_BASE}/${supplier.image}`} 
                                    alt={supplier.name} 
                                    className="w-16 h-16 rounded-xl object-cover shrink-0"
                                    onLoad={handleImageLoad}
                                    onError={handleImageError}
                                />
                            ) : (
                                <div className="relative shrink-0">
                                    {supplier.image && imageLoadState === undefined ? (
                                        <BigViewImage 
                                            src={`${IMAGE_BASE}/${supplier.image}`} 
                                            alt={supplier.name} 
                                            className="w-16 h-16 rounded-xl object-cover shrink-0"
                                            onLoad={handleImageLoad}
                                            onError={handleImageError}
                                        />
                                    ) : (
                                        <PlaceholderImg size={16} name={supplier.name} />
                                    )}
                                </div>
                            )}
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-[var(--ink)]">{supplier.name}</h3>
                                <p className="text-sm text-[var(--muted)] mt-1">{supplier.type || "Supplier"}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                <Phone size={18} className="text-primary" />
                            </div>
                            <div>
                                <label className="text-xs text-[var(--muted)] uppercase font-bold">Phone</label>
                                <p className="font-medium text-[var(--ink)]">{supplier.phone || "—"}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                <Mail size={18} className="text-primary" />
                            </div>
                            <div>
                                <label className="text-xs text-[var(--muted)] uppercase font-bold">Email</label>
                                <p className="font-medium text-[var(--ink)]">{supplier.email || "—"}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                <MapPin size={18} className="text-primary" />
                            </div>
                            <div>
                                <label className="text-xs text-[var(--muted)] uppercase font-bold">Address</label>
                                <p className="font-medium text-[var(--ink)]">{supplier.address || "—"}</p>
                            </div>
                        </div>

                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                <Building2 size={18} className="text-primary" />
                            </div>
                            <div>
                                <label className="text-xs text-[var(--muted)] uppercase font-bold">Type</label>
                                <p className="font-medium text-[var(--ink)] capitalize">{supplier.type || "—"}</p>
                            </div>
                        </div>

                        <div className="md:col-span-2 flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                <FileText size={18} className="text-primary" />
                            </div>
                            <div className="flex-1">
                                <label className="text-xs text-[var(--muted)] uppercase font-bold">{labels.notes || "Notes"}</label>
                                <p className="font-medium text-[var(--ink)] whitespace-pre-wrap">{supplier.notes || "—"}</p>
                            </div>
                        </div>

                        <div className="md:col-span-2 flex items-start gap-3">
                            <div>
                                <label className="text-xs text-[var(--muted)] uppercase font-bold">Status</label>
                                <div className="mt-1">
                                    <span className={`px-3 py-1 text-xs rounded-full font-semibold ${supplier.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {supplier.isActive ? labels.active || "Active" : labels.inactive || "Inactive"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Credits & Debits Tab */}
            {activeTab === "credits" && (
                <Suspense fallback={<div className="card p-6 text-center py-12 text-[var(--muted)]">Loading...</div>}>
                    <SupplierCredits 
                        supplier={supplier} 
                        qarzaAccountId={qarzaAccountId} 
                        onSupplierUpdate={refetchSupplier}
                    />
                </Suspense>
            )}

            {/* Purchases Tab */}
            {activeTab === "purchases" && (
                <Suspense fallback={<div className="card p-6 text-center py-12 text-[var(--muted)]">Loading...</div>}>
                    <SupplierPurchases supplierId={id} />
                </Suspense>
            )}

            {/* Returns Tab */}
            {activeTab === "returns" && (
                <Suspense fallback={<div className="card p-6 text-center py-12 text-[var(--muted)]">Loading...</div>}>
                    <SupplierReturns supplierId={id} />
                </Suspense>
            )}
        </div>
    );
}
