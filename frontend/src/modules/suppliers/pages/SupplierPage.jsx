// src/modules/suppliers/pages/SupplierPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, Eye, Package } from "lucide-react";
import { useDeleteSupplier, useSuppliers } from "../services/suppliers.service.js";
import { getSupplierLabels } from "../labels/supplierLabels.js";
import { useSettings } from "../../settings/hooks/useSettings.js";
import PaginatedList from "../../../shared/components/PaginatedList.jsx";
import SupplierModal from "../components/SupplierModal.jsx";
import PageHeading from "../../../shared/components/PageHeading.jsx";
import ScreenTabButton from "../../../shared/components/ScreenTabButton.jsx";
import { showError, showSuccess } from "../../../shared/utilities/toastHelpers.js";
import PermissionGuard from "../../../shared/components/PermissionGuard.jsx";
import BigViewImage from "../../../shared/components/BigViewImage.jsx";

export default function SupplierPage() {
    const navigate = useNavigate();
    const { settings } = useSettings();
    const language = settings?.language || "en";
    const labels = getSupplierLabels(language);
    
    const [deleteSupplier]   = useDeleteSupplier();

    const [modal,      setModal]      = useState(null);

    const handleDelete = async (id) => {
        try {
            await deleteSupplier(id).unwrap();
            showSuccess(labels.supplierDeleted);
        } catch (error) {
            showError(error?.data?.message || labels.failedToDelete);
        }
    };

    return (
        <div className="h-screen flex flex-col">
            {modal && (
                <SupplierModal
                    mode={modal.mode}
                    supplierId={modal.id}
                    onClose={() => setModal(null)}
                />
            )}

            <div className="flex-none">
                <PageHeading
                    heading={labels.supplierManagement}
                    subheading={labels.manageSuppliers}
                    leftActions={
                        <PermissionGuard 
                            execute={() => setModal({ mode: "create" })} 
                            permission="suppliers.create" 
                            isConfirmation={false}
                        >
                            <div>
                                <ScreenTabButton lucideIcon={Plus} text={labels.addSupplier} />
                            </div>
                        </PermissionGuard>
                    }
                />
            </div>

            <PaginatedList
                rtkQuery={useSuppliers}
                limit={20}
                dataKey="data"
                wrapperClassName="flex-1"
                renderItems={(suppliers) => (
                    <div className="overflow-x-auto rounded-2xl overflow-hidden"
                        style={{ border: "1px solid var(--border)" }}>
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr className="text-xs uppercase tracking-wider"
                                    style={{ background: "var(--surface-muted)", borderBottom: "1px solid var(--border)", color: "var(--muted)" }}>
                                    <th className="px-4 py-3 font-semibold">Image</th>
                                    <th className="px-4 py-3 font-semibold">{labels.name}</th>
                                    <th className="px-4 py-3 font-semibold">{labels.type}</th>
                                    <th className="px-4 py-3 font-semibold">{labels.phone}</th>
                                    <th className="px-4 py-3 font-semibold">{labels.email}</th>
                                    <th className="px-4 py-3 font-semibold text-center">{labels.status}</th>
                                    <th className="px-4 py-3 font-semibold text-center">{labels.actions}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {suppliers.map(s => (
                                    <SupplierRow
                                        key={s._id}
                                        supplier={s}
                                        onEdit={() => setModal({ mode: "update", id: s._id })}
                                        onDelete={() => handleDelete(s._id)}
                                        onView={() => navigate(`/suppliers/${s._id}`)}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                renderEmpty={() => (
                    <p className="text-center py-12 text-sm" style={{ color: "var(--muted)" }}>
                        {labels.noSuppliersFound}
                    </p>
                )}
            />
        </div>
    );
}

function SupplierRow({ supplier, onEdit, onDelete, onView }) {
    const { settings } = useSettings();
    const language = settings?.language || "en";
    const labels = getSupplierLabels(language);
    
    const isActive = supplier?.isActive ?? true;
    const IMAGE_BASE = "http://localhost:5001/uploads";
    const [imageLoadState, setImageLoadState] = useState(undefined);

    const handleImageLoad = () => setImageLoadState(true);
    const handleImageError = () => setImageLoadState(false);

    const PlaceholderImg = ({ size = 11, name = "" }) => (
        <div className={`w-${size} h-${size} rounded-xl bg-(--surface-muted) flex items-center justify-center shrink-0`}>
            {name ? <span className="text-lg font-bold text-(--muted)">{name.charAt(0).toUpperCase()}</span> : <Package className="w-5 h-5 text-(--muted)" strokeWidth={1.5} />}
        </div>
    );

    return (
        <tr 
            className="transition" 
            style={{ borderBottom: "1px solid var(--border)" }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--surface-muted)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>

            <td className="px-4 py-3">
                <div className="relative inline-block shrink-0">
                    {supplier?.image && imageLoadState === true ? (
                        <BigViewImage 
                            src={`${IMAGE_BASE}/${supplier.image}`} 
                            alt={supplier.name}
                            className="w-11 h-11 rounded-xl object-cover ring-1 ring-(--border)"
                            onLoad={handleImageLoad}
                            onError={handleImageError}
                        />
                    ) : (
                        <div className="relative">
                            {supplier?.image && imageLoadState === undefined ? (
                                <BigViewImage 
                                    src={`${IMAGE_BASE}/${supplier.image}`} 
                                    alt={supplier.name}
                                    className="w-11 h-11 rounded-xl object-cover ring-1 ring-(--border)"
                                    onLoad={handleImageLoad}
                                    onError={handleImageError}
                                />
                            ) : (
                                <PlaceholderImg size={11} name={supplier.name} />
                            )}
                        </div>
                    )}
                    {isActive && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2" style={{ background: "#16a34a", borderColor: "var(--surface)" }}></div>
                    )}
                </div>
            </td>
            <td className="px-4 py-3 font-semibold" style={{ color: "var(--ink)" }}>
                {supplier?.name ?? "—"}
            </td>
            <td className="px-4 py-3 text-xs" style={{ color: "var(--ink)" }}>
                {supplier?.type ?? "—"}
            </td>
            <td className="px-4 py-3 text-xs font-mono" style={{ color: "var(--muted)" }}>
                {supplier?.phone ?? "—"}
            </td>
            <td className="px-4 py-3 text-xs" style={{ color: "var(--muted)" }}>
                {supplier?.email ?? "—"}
            </td>
            <td className="px-4 py-3 text-center">
                <span className="px-2 py-0.5 rounded-lg text-xs font-semibold"
                    style={{
                        background: isActive ? "rgba(15,118,110,0.1)" : "rgba(107,114,128,0.1)",
                        color:      isActive ? "var(--accent-2)"       : "#6b7280",
                    }}>
                    {isActive ? labels.active : labels.inactive}
                </span>
            </td>
            <td className="px-4 py-3">
                <div className="flex justify-center gap-2">
                    <button
                        onClick={onView}
                        className="w-8 h-8 flex items-center justify-center rounded-lg transition"
                        style={{ color: "var(--muted)" }}
                        onMouseEnter={e => { e.currentTarget.style.color = "var(--accent-2)"; e.currentTarget.style.background = "rgba(15,118,110,0.08)"; }}
                        onMouseLeave={e => { e.currentTarget.style.color = "var(--muted)"; e.currentTarget.style.background = "transparent"; }}
                        title="View Details"
                    >
                        <Eye className="w-3.5 h-3.5" />
                    </button>
                    <PermissionGuard execute={onEdit} permission="suppliers.update" isConfirmation={true}>
                        <button
                            className="px-3 py-1 text-xs rounded-lg font-medium transition flex items-center gap-1"
                            style={{ background: "rgba(15,118,110,0.08)", color: "var(--accent-2)", border: "1px solid rgba(15,118,110,0.2)" }}
                            onMouseEnter={e => e.currentTarget.style.background = "rgba(15,118,110,0.15)"}
                            onMouseLeave={e => e.currentTarget.style.background = "rgba(15,118,110,0.08)"}
                            title={labels.edit}>
                            <Pencil className="w-3 h-3" />
                        </button>
                    </PermissionGuard>
                    <PermissionGuard execute={onDelete} permission="suppliers.delete" isConfirmation={true}>
                        <button
                            className="px-3 py-1 text-xs rounded-lg font-medium transition flex items-center gap-1"
                            style={{ background: "rgba(220,38,38,0.06)", color: "#dc2626", border: "1px solid rgba(220,38,38,0.15)" }}
                            onMouseEnter={e => e.currentTarget.style.background = "rgba(220,38,38,0.12)"}
                            onMouseLeave={e => e.currentTarget.style.background = "rgba(220,38,38,0.06)"}
                            title={labels.delete}>
                            <Trash2 className="w-3 h-3" />
                        </button>
                    </PermissionGuard>
                </div>
            </td>
        </tr>
    );
}

