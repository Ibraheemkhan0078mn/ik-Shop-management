// src/modules/suppliers/pages/SupplierPage.jsx
import { useState, useCallback }   from "react";
import { Plus }                    from "lucide-react";
import { useSelector }             from "react-redux";
import { useDeleteSupplier }       from "../services/suppliers.service.js";
import PaginatedList               from "@shared/components/PaginatedList.jsx";
import SupplierModal               from "../components/SupplierModal.jsx";
import PageHeading                 from "@shared/components/PageHeading.jsx";

export default function SupplierPage() {
    const language           = useSelector(s => s.auth?.user?.language ?? "en");
    const [deleteSupplier]   = useDeleteSupplier();

    const [modal,      setModal]      = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

    const refresh = useCallback(() => setRefreshKey(k => k + 1), []);

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm("Delete this supplier?")) return;
        await deleteSupplier(id);
        refresh();
    };

    return (
        <div className="h-screen flex flex-col">
            {modal && (
                <SupplierModal
                    mode={modal.mode}
                    supplierId={modal.id}
                    onClose={() => setModal(null)}
                    onSuccess={refresh}
                />
            )}

            <div className="flex-none">
                <PageHeading
                    heading={language === "en" ? "Suppliers" : "سپلائرز"}
                    subheading={language === "en" ? "Manage your suppliers" : "اپنے سپلائرز کا انتظام کریں"}
                >
                    <div className="flex flex-wrap items-center gap-3 mt-4">
                        <button className="btn-add" onClick={() => setModal({ mode: "create" })}>
                            <Plus className="w-4 h-4" />
                            {language === "en" ? "Add Supplier" : "سپلائر شامل کریں"}
                        </button>
                    </div>
                </PageHeading>
            </div>

            <PaginatedList
                key={refreshKey}
                endpoint="/suppliers/pagination"
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
                                    <th className="px-4 py-3 font-semibold">Name</th>
                                    <th className="px-4 py-3 font-semibold">Contact</th>
                                    <th className="px-4 py-3 font-semibold">Type</th>
                                    <th className="px-4 py-3 font-semibold">Phone</th>
                                    <th className="px-4 py-3 font-semibold">Email</th>
                                    <th className="px-4 py-3 font-semibold text-center">Status</th>
                                    <th className="px-4 py-3 font-semibold text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {suppliers.map(s => (
                                    <SupplierRow
                                        key={s._id}
                                        supplier={s}
                                        onEdit={e => { e.stopPropagation(); setModal({ mode: "update", id: s._id }); }}
                                        onDelete={e => handleDelete(s._id, e)}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                renderEmpty={() => (
                    <p className="text-center py-12 text-sm" style={{ color: "var(--muted)" }}>
                        No suppliers found.
                    </p>
                )}
            />
        </div>
    );
}

function SupplierRow({ supplier, onEdit, onDelete }) {
    const isActive = supplier?.isActive ?? true;

    return (
        <tr className="transition" style={{ borderBottom: "1px solid var(--border)" }}
            onMouseEnter={e => e.currentTarget.style.background = "var(--surface-muted)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>

            <td className="px-4 py-3 font-semibold" style={{ color: "var(--ink)" }}>
                {supplier?.name ?? "—"}
            </td>
            <td className="px-4 py-3 text-xs" style={{ color: "var(--muted)" }}>
                {supplier?.contactPerson ?? "—"}
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
                    {isActive ? "Active" : "Inactive"}
                </span>
            </td>
            <td className="px-4 py-3">
                <div className="flex justify-center gap-2" onClick={e => e.stopPropagation()}>
                    <button onClick={onEdit}
                        className="px-3 py-1 text-xs rounded-lg font-medium transition"
                        style={{ background: "rgba(15,118,110,0.08)", color: "var(--accent-2)", border: "1px solid rgba(15,118,110,0.2)" }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(15,118,110,0.15)"}
                        onMouseLeave={e => e.currentTarget.style.background = "rgba(15,118,110,0.08)"}>
                        Edit
                    </button>
                    <button onClick={onDelete}
                        className="px-3 py-1 text-xs rounded-lg font-medium transition"
                        style={{ background: "rgba(220,38,38,0.06)", color: "#dc2626", border: "1px solid rgba(220,38,38,0.15)" }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(220,38,38,0.12)"}
                        onMouseLeave={e => e.currentTarget.style.background = "rgba(220,38,38,0.06)"}>
                        Delete
                    </button>
                </div>
            </td>
        </tr>
    );
}

