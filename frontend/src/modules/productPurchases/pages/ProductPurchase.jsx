// src/modules/productPurchases/pages/ProductPurchase.jsx
import { useState, useRef, useCallback } from "react";
import { Plus }                           from "lucide-react";
import { useSelector }                    from "react-redux";
import { useNavigate }                    from "react-router-dom";
import { useDeletePurchase }              from "../services/purchases.service.js";
import PaginatedList                      from "../../../components/common/PaginatedList.jsx";
import PurchaseModal                      from "../components/PurchaseModal.jsx";
import ViewPurchaseDetail                 from "../components/ViewPurchaseDetail.jsx";

export default function ProductPurchasePage() {
    const language         = useSelector(s => s.auth?.user?.language ?? "en");
    const navigate         = useNavigate();
    const [deletePurchase] = useDeletePurchase();

    const [modal,        setModal]        = useState(null);   // null | { mode: "create" } | { mode: "update", id }
    const [viewPurchase, setViewPurchase] = useState(null);
    const [refreshKey,   setRefreshKey]   = useState(0);      // increment to force PaginatedList refetch

    const listRef = useRef(null);

    const refresh = useCallback(() => setRefreshKey(k => k + 1), []);

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm("Delete this purchase?")) return;
        await deletePurchase(id);
        refresh();
    };

    return (
        <div>
            {/* ── modals ── */}
            {modal && (
                <PurchaseModal
                    mode={modal.mode}
                    purchaseId={modal.id}
                    onClose={() => setModal(null)}
                    onSuccess={refresh}
                />
            )}
            {viewPurchase && (
                <ViewPurchaseDetail
                    purchase={viewPurchase}
                    language={language}
                    onClose={() => setViewPurchase(null)}
                />
            )}

            {/* ── toolbar ── */}
            <div className="flex flex-wrap items-center gap-3 mb-4">
                <button className="btn-add" onClick={() => setModal({ mode: "create" })}>
                    <Plus className="w-4 h-4" />
                    {language === "en" ? "Add Purchase" : "خرید شامل کریں"}
                </button>
                <button className="btn-add" onClick={() => navigate("/suppliers")}>
                    <Plus className="w-4 h-4" />
                    {language === "en" ? "Suppliers" : "سپلائر"}
                </button>
            </div>

            {/* ── list — refreshKey forces re-mount → new fetch ── */}
            <PaginatedList
                key={refreshKey}
                endpoint="/purchases/pagination"
                limit={20}
                dataKey="data"
                wrapperClassName="min-h-0"
                renderItems={(purchases) => (
                    <div className="overflow-x-auto rounded-2xl overflow-hidden"
                        style={{ border: "1px solid var(--border)" }}>
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr className="text-xs uppercase tracking-wider"
                                    style={{
                                        background: "var(--surface-muted)",
                                        borderBottom: "1px solid var(--border)",
                                        color: "var(--muted)",
                                    }}>
                                    <th className="px-4 py-3 font-semibold">Supplier</th>
                                    <th className="px-4 py-3 font-semibold">Invoice</th>
                                    <th className="px-4 py-3 font-semibold text-center">Items</th>
                                    <th className="px-4 py-3 font-semibold text-right">Total</th>
                                    <th className="px-4 py-3 font-semibold">Date</th>
                                    <th className="px-4 py-3 font-semibold text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {purchases.map(p => (
                                    <PurchaseRow
                                        key={p._id}
                                        purchase={p}
                                        onView={() => setViewPurchase(p)}
                                        onEdit={e => { e.stopPropagation(); setModal({ mode: "update", id: p._id }); }}
                                        onDelete={e => handleDelete(p._id, e)}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                renderEmpty={() => (
                    <p className="text-center py-12 text-sm" style={{ color: "var(--muted)" }}>
                        No purchases found.
                    </p>
                )}
            />
        </div>
    );
}

function PurchaseRow({ purchase, onView, onEdit, onDelete }) {
    const date = new Date(purchase?.date ?? purchase?.createdAt).toLocaleDateString();

    return (
        <tr className="cursor-pointer transition"
            style={{ borderBottom: "1px solid var(--border)" }}
            onClick={onView}
            onMouseEnter={e => e.currentTarget.style.background = "var(--surface-muted)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}>

            <td className="px-4 py-3 font-medium" style={{ color: "var(--ink)" }}>
                {purchase?.supplier?.name ?? "—"}
            </td>
            <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--muted)" }}>
                {purchase?.invoiceNumber ?? "—"}
            </td>
            <td className="px-4 py-3 text-center" style={{ color: "var(--ink)" }}>
                {purchase?.items?.length ?? 0}
            </td>
            <td className="px-4 py-3 text-right font-semibold tabular-nums" style={{ color: "var(--accent-2)" }}>
                Rs {(purchase?.totalAmount ?? 0).toLocaleString()}
            </td>
            <td className="px-4 py-3" style={{ color: "var(--muted)" }}>{date}</td>
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
