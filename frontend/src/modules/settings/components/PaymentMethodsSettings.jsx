import { useState } from "react";
import { Plus } from "lucide-react";
import { useDeletePaymentMethod, usePaymentMethods } from "../services/paymentMethod.service.js";
import { showError, showSuccess } from "../../../shared/utilities/toastHelpers.js";
import PaymentMethodModal from "./PaymentMethodModal.jsx";
import PermissionGuard from "../../../shared/components/PermissionGuard.jsx";

export default function PaymentMethodsSettings({ labels }) {
    const [deletePaymentMethod] = useDeletePaymentMethod();
    const [modal, setModal] = useState(null);

    const handleDelete = async (id, e) => {
        e?.stopPropagation();
        try {
            await deletePaymentMethod(id).unwrap();
            showSuccess(labels.paymentMethodDeleted);
        } catch (error) {
            showError(error?.data?.message || labels.paymentMethodFailed);
        }
    };

    return (
        <div className="space-y-4">
            {modal && <PaymentMethodModal mode={modal.mode} paymentMethodId={modal.id} onClose={() => setModal(null)} labels={labels} />}
            
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-[var(--ink)]">{labels.paymentMethodsSettings}</h3>
                <button onClick={() => setModal({ mode: "create" })} className="btn-add flex items-center gap-2">
                    <Plus size={16} />
                    {labels.addPaymentMethod}
                </button>
            </div>

            <PaymentMethodTable onEdit={(id) => setModal({ mode: "update", id })} onDelete={handleDelete} labels={labels} />
        </div>
    );
}

function PaymentMethodTable({ onEdit, onDelete, labels }) {
    const { data: paymentMethods = [], isLoading } = usePaymentMethods();

    if (isLoading) {
        return <div className="text-center py-12">{labels.loading || "Loading..."}</div>;
    }

    return (
        <div className="overflow-x-auto rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
            <table className="w-full text-sm text-left">
                <thead>
                    <tr className="text-xs uppercase tracking-wider" style={{ background: "var(--surface-muted)", borderBottom: "1px solid var(--border)", color: "var(--muted)" }}>
                        <th className="px-4 py-3 font-semibold">{labels.name || "Name"}</th>
                        <th className="px-4 py-3 font-semibold text-center">{labels.status || "Status"}</th>
                        <th className="px-4 py-3 font-semibold text-center">{labels.actions || "Actions"}</th>
                    </tr>
                </thead>
                <tbody>
                    {paymentMethods.map((pm) => (
                        <PaymentMethodRow
                            key={pm._id}
                            paymentMethod={pm}
                            onEdit={() => onEdit(pm._id)}
                            onDelete={(e) => onDelete(pm._id, e)}
                            labels={labels}
                        />
                    ))}
                </tbody>
            </table>
            {paymentMethods.length === 0 && (
                <div className="text-center py-12 text-sm" style={{ color: "var(--muted)" }}>
                    {labels.noPaymentMethods || "No payment methods found"}
                </div>
            )}
        </div>
    );
}

function PaymentMethodRow({ paymentMethod, onEdit, onDelete, labels }) {
    const isActive = paymentMethod?.isActive ?? true;

    return (
        <tr className="transition" style={{ borderBottom: "1px solid var(--border)" }} onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-muted)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
            <td className="px-4 py-3 font-semibold" style={{ color: "var(--ink)" }}>{paymentMethod?.name ?? "—"}</td>
            <td className="px-4 py-3 text-center">
                <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {isActive ? (labels.active || "Active") : (labels.inactive || "Inactive")}
                </span>
            </td>
            <td className="px-4 py-3">
                <div className="flex justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <PermissionGuard execute={() => onEdit?.()} permission="settings.view" isConfirmation={true}>
                        <button onClick={(e) => e?.stopPropagation()} className="px-3 py-1 text-xs rounded-lg font-medium transition" style={{ background: "rgba(15,118,110,0.08)", color: "var(--accent-2)", border: "1px solid rgba(15,118,110,0.2)" }}>
                            {labels.edit || "Edit"}
                        </button>
                    </PermissionGuard>
                    <PermissionGuard execute={() => onDelete?.()} permission="settings.view" isConfirmation={true}>
                        <button onClick={(e) => e?.stopPropagation()} className="px-3 py-1 text-xs rounded-lg font-medium transition" style={{ background: "rgba(220,38,38,0.06)", color: "#dc2626", border: "1px solid rgba(220,38,38,0.15)" }}>
                            {labels.delete || "Delete"}
                        </button>
                    </PermissionGuard>
                </div>
            </td>
        </tr>
    );
}
