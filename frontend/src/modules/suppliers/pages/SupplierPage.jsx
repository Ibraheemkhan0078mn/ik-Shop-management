// src/modules/suppliers/pages/SupplierPage.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { useSelector } from "react-redux";
import { useDeleteSupplier, useSuppliers } from "../services/suppliers.service.js";
import { getSupplierLabels } from "../labels/supplierLabels.js";
import { useSettings } from "../../settings/hooks/useSettings.js";
import PaginatedList from "../../../shared/components/PaginatedList.jsx";
import SupplierModal from "../components/SupplierModal.jsx";
import PageHeading from "../../../shared/components/PageHeading.jsx";
import ScreenTabButton from "../../../shared/components/ScreenTabButton.jsx";
import { showError, showSuccess } from "../../../shared/utilities/toastHelpers.js";
import PermissionGuard from "../../../shared/components/PermissionGuard.jsx";

export default function SupplierPage() {
    const { settings } = useSettings();
    const language = settings?.language || "en";
    const labels = getSupplierLabels(language);
    
    const [deleteSupplier]   = useDeleteSupplier();

    const [modal,      setModal]      = useState(null);

    const handleDelete = async (id, e) => {
        e?.stopPropagation();
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
                        <div onClick={() => setModal({ mode: "create" })}>
                            <ScreenTabButton lucideIcon={Plus} text={labels.addSupplier} />
                        </div>
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
                                        onEdit={e => { e?.stopPropagation(); setModal({ mode: "update", id: s._id }); }}
                                        onDelete={e => handleDelete(s._id, e)}
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

function SupplierRow({ supplier, onEdit, onDelete }) {
    const navigate = useNavigate();
    const { settings } = useSettings();
    const language = settings?.language || "en";
    const labels = getSupplierLabels(language);
    
    const isActive = supplier?.isActive ?? true;

    return (
        <tr 
            className="transition cursor-pointer" 
            style={{ borderBottom: "1px solid var(--border)" }}
            onClick={() => navigate(`/suppliers/${supplier._id}`)}
            onMouseEnter={e => e.currentTarget.style.background = "var(--surface-muted)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>

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
                <div className="flex justify-center gap-2" onClick={e => e.stopPropagation()}>
                    <PermissionGuard execute={() => onEdit?.()} permission="suppliers.update" isConfirmation={true}>
                        <button
                            className="px-3 py-1 text-xs rounded-lg font-medium transition"
                            style={{ background: "rgba(15,118,110,0.08)", color: "var(--accent-2)", border: "1px solid rgba(15,118,110,0.2)" }}
                            onMouseEnter={e => e.currentTarget.style.background = "rgba(15,118,110,0.15)"}
                            onMouseLeave={e => e.currentTarget.style.background = "rgba(15,118,110,0.08)"}>
                            {labels.edit}
                        </button>
                    </PermissionGuard>
                    <PermissionGuard execute={() => onDelete?.()} permission="suppliers.delete" isConfirmation={true}>
                        <button
                            className="px-3 py-1 text-xs rounded-lg font-medium transition"
                            style={{ background: "rgba(220,38,38,0.06)", color: "#dc2626", border: "1px solid rgba(220,38,38,0.15)" }}
                            onMouseEnter={e => e.currentTarget.style.background = "rgba(220,38,38,0.12)"}
                            onMouseLeave={e => e.currentTarget.style.background = "rgba(220,38,38,0.06)"}>
                            {labels.delete}
                        </button>
                    </PermissionGuard>
                </div>
            </td>
        </tr>
    );
}

