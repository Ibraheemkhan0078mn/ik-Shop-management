import { useState } from "react";
import { Plus } from "lucide-react";
import { useDeletePaymentMethod, usePaymentMethods } from "../services/paymentMethod.service.js";
import PageHeading from "../../../shared/components/PageHeading.jsx";
import ScreenTabButton from "../../../shared/components/ScreenTabButton.jsx";
import PaymentMethodModal from "../components/PaymentMethodModal.jsx";
import { showError, showSuccess } from "../../../shared/utilities/toastHelpers.js";

export default function PaymentMethodPage() {
    const [deletePaymentMethod] = useDeletePaymentMethod();
    const [modal, setModal] = useState(null);

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this payment method?")) return;
        try {
            await deletePaymentMethod(id).unwrap();
            showSuccess("Payment method deleted successfully");
        } catch (error) {
            showError(error?.data?.message || "Failed to delete payment method");
        }
    };

    return (
        <div className="h-screen flex flex-col">
            {modal && <PaymentMethodModal mode={modal.mode} paymentMethodId={modal.id} onClose={() => setModal(null)} />}

            <div className="flex-none">
                <PageHeading
                    heading="Payment Methods"
                    subheading="Manage payment methods for orders and purchases"
                    leftActions={
                        <div onClick={() => setModal({ mode: "create" })}>
                            <ScreenTabButton lucideIcon={Plus} text="Add Payment Method" />
                        </div>
                    }
                />
            </div>

            <div className="flex-1 p-6">
                <PaymentMethodTable 
                    onEdit={(id) => setModal({ mode: "update", id })}
                    onDelete={handleDelete}
                />
            </div>
        </div>
    );
}

function PaymentMethodTable({ onEdit, onDelete }) {
    const { data: paymentMethods = [], isLoading } = usePaymentMethods();

    if (isLoading) {
        return <div className="text-center py-12">Loading...</div>;
    }

    return (
        <div className="overflow-x-auto rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
            <table className="w-full text-sm text-left">
                <thead>
                    <tr className="text-xs uppercase tracking-wider" style={{ background: "var(--surface-muted)", borderBottom: "1px solid var(--border)", color: "var(--muted)" }}>
                        <th className="px-4 py-3 font-semibold">Name</th>
                        <th className="px-4 py-3 font-semibold text-center">Status</th>
                        <th className="px-4 py-3 font-semibold text-center">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {paymentMethods.map((pm) => (
                        <PaymentMethodRow
                            key={pm._id}
                            paymentMethod={pm}
                            onEdit={() => onEdit(pm._id)}
                            onDelete={(e) => onDelete(pm._id, e)}
                        />
                    ))}
                </tbody>
            </table>
            {paymentMethods.length === 0 && (
                <div className="text-center py-12 text-sm" style={{ color: "var(--muted)" }}>
                    No payment methods found
                </div>
            )}
        </div>
    );
}

function PaymentMethodRow({ paymentMethod, onEdit, onDelete }) {
    const isActive = paymentMethod?.isActive ?? true;

    return (
        <tr className="transition" style={{ borderBottom: "1px solid var(--border)" }} onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-muted)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
            <td className="px-4 py-3 font-semibold" style={{ color: "var(--ink)" }}>{paymentMethod?.name ?? "—"}</td>
            <td className="px-4 py-3 text-center">
                <span className={`px-2 py-0.5 rounded-lg text-xs font-semibold ${isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {isActive ? "Active" : "Inactive"}
                </span>
            </td>
            <td className="px-4 py-3">
                <div className="flex justify-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <button onClick={onEdit} className="px-3 py-1 text-xs rounded-lg font-medium transition" style={{ background: "rgba(15,118,110,0.08)", color: "var(--accent-2)", border: "1px solid rgba(15,118,110,0.2)" }}>
                        Edit
                    </button>
                    <button onClick={onDelete} className="px-3 py-1 text-xs rounded-lg font-medium transition" style={{ background: "rgba(220,38,38,0.06)", color: "#dc2626", border: "1px solid rgba(220,38,38,0.15)" }}>
                        Delete
                    </button>
                </div>
            </td>
        </tr>
    );
}
