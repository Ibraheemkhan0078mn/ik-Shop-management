// src/modules/productPurchases/pages/ProductPurchase.jsx
import { useState, useRef } from "react";
import { Plus }                           from "lucide-react";
import { useSelector }                    from "react-redux";
import { useNavigate }                    from "react-router-dom";
import { useDeletePurchase, usePurchases } from "../services/purchases.service.js";
import PaginatedList                      from "@shared/components/PaginatedList.jsx";
import PurchaseModal                      from "../components/PurchaseModal.jsx";
import ViewPurchaseDetail                 from "../components/ViewPurchaseDetail.jsx";
import PageHeading                        from "@shared/components/PageHeading.jsx";

export default function ProductPurchasePage() {
    const language         = useSelector(s => s.auth?.user?.language ?? "en");
    const navigate         = useNavigate();
    const [deletePurchase] = useDeletePurchase();

    const [modal,        setModal]        = useState(null);
    const [viewPurchase, setViewPurchase] = useState(null);

    const listRef = useRef(null);

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm("Delete this purchase?")) return;
        await deletePurchase(id);
    };

    return (
        <div className="h-screen flex flex-col">
            {/* ── modals ── */}
            {modal && (
                <PurchaseModal
                    mode={modal.mode}
                    purchaseId={modal.id}
                    onClose={() => setModal(null)}
                />
            )}
            {viewPurchase && (
                <ViewPurchaseDetail
                    purchase={viewPurchase}
                    language={language}
                    onClose={() => setViewPurchase(null)}
                />
            )}

            <div className="flex-none">
                <PageHeading
                    heading={language === "en" ? "Purchases" : "خریداری"}
                    subheading={language === "en" ? "Manage your purchases" : "اپنی خریداری کا انتظام کریں"}
                >
                    <div className="flex flex-wrap items-center gap-3 mt-4">
                        <button className="btn-add" onClick={() => setModal({ mode: "create" })}>
                            <Plus className="w-4 h-4" />
                            {language === "en" ? "Add Purchase" : "خرید شامل کریں"}
                        </button>
                        <button className="btn-add" onClick={() => navigate("/suppliers")}>
                            <Plus className="w-4 h-4" />
                            {language === "en" ? "Suppliers" : "سپلائر"}
                        </button>
                    </div>
                </PageHeading>
            </div>

            {/* ── list ── */}
            <PaginatedList
                rtkQuery={usePurchases}
                limit={20}
                dataKey="data"
                wrapperClassName="flex-1"
                renderItems={(purchases) => (
                    <div className="overflow-x-auto rounded-2xl overflow-hidden border-edge">
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr className="text-xs uppercase tracking-wider bg-surface-muted border-b border-edge text-ink-muted">
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
                    <p className="text-center py-12 text-sm text-ink-muted">
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
        <tr className="cursor-pointer transition border-b border-edge hover:bg-surface-muted"
            onClick={onView}>

            <td className="px-4 py-3 font-medium text-ink">
                {purchase?.supplier?.name ?? "—"}
            </td>
            <td className="px-4 py-3 font-mono text-xs text-ink-muted">
                {purchase?.invoiceNumber ?? "—"}
            </td>
            <td className="px-4 py-3 text-center text-ink">
                {purchase?.items?.length ?? 0}
            </td>
            <td className="px-4 py-3 text-right font-semibold tabular-nums text-primary">
                Rs {(purchase?.totalAmount ?? 0).toLocaleString()}
            </td>
            <td className="px-4 py-3 text-ink-muted">{date}</td>
            <td className="px-4 py-3">
                <div className="flex justify-center gap-2" onClick={e => e.stopPropagation()}>
                    <button onClick={onEdit}
                        className="px-3 py-1 text-xs rounded-lg font-medium transition bg-primary-hover text-primary border border-edge-brand hover:bg-primary-hover/80">
                        Edit
                    </button>
                    <button onClick={onDelete}
                        className="px-3 py-1 text-xs rounded-lg font-medium transition bg-red-50 text-red-500 border border-red-200 hover:bg-red-100">
                        Delete
                    </button>
                </div>
            </td>
        </tr>
    );
}

