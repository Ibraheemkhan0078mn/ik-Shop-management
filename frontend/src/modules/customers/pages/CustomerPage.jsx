import { useState } from "react";
import { Plus, Printer, Download } from "lucide-react";
import { useSelector } from "react-redux";
import { useDeleteCustomer, useCustomers } from "../services/customers.service.js";
import PaginatedList from "../../../shared/components/PaginatedList.jsx";
import PageHeading from "../../../shared/components/PageHeading.jsx";
import ScreenTabButton from "../../../shared/components/ScreenTabButton.jsx";
import CustomerModal from "../components/CustomerModal.jsx";
import { showError, showSuccess } from "../../../shared/utilities/toastHelpers.js";

const IMAGE_BASE_URL = "http://localhost:5001";

export default function CustomerPage() {
    const language = useSelector((s) => s.auth?.user?.language ?? "en");
    const [deleteCustomer] = useDeleteCustomer();
    const [modal, setModal] = useState(null);

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm("Delete this customer?")) return;
        try {
            await deleteCustomer(id).unwrap();
            showSuccess("Customer deleted successfully");
        } catch (error) {
            showError(error?.data?.message || "Failed to delete customer");
        }
    };

    return (
        <div className="h-screen flex flex-col">
            {modal && <CustomerModal mode={modal.mode} customerId={modal.id} onClose={() => setModal(null)} />}

            <div className="flex-none">
                <PageHeading
                    heading={language === "en" ? "Customers" : "گاہک"}
                    subheading={language === "en" ? "Manage your customers" : "اپنے گاہکوں کا انتظام کریں"}
                    leftActions={
                        <div onClick={() => setModal({ mode: "create" })}>
                            <ScreenTabButton lucideIcon={Plus} text={language === "en" ? "Add Customer" : "گاہک شامل کریں"} />
                        </div>
                    }
                    rightActions={
                        <>
                            <button onClick={() => console.log("Print")} className="p-2 rounded-lg transition-all hover:bg-[var(--surface-muted)]" style={{ color: "var(--muted)" }}>
                                <Printer size={18} />
                            </button>
                            <button onClick={() => console.log("Export")} className="p-2 rounded-lg transition-all hover:bg-[var(--surface-muted)]" style={{ color: "var(--muted)" }}>
                                <Download size={18} />
                            </button>
                        </>
                    }
                />
            </div>

            <PaginatedList
                rtkQuery={useCustomers}
                limit={20}
                dataKey="data"
                wrapperClassName="flex-1"
                renderItems={(customers) => (
                    <div className="overflow-x-auto rounded-2xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr className="text-xs uppercase tracking-wider" style={{ background: "var(--surface-muted)", borderBottom: "1px solid var(--border)", color: "var(--muted)" }}>
                                    <th className="px-4 py-3 font-semibold">Image</th>
                                    <th className="px-4 py-3 font-semibold">Name</th>
                                    <th className="px-4 py-3 font-semibold">Phone</th>
                                    <th className="px-4 py-3 font-semibold">CNIC</th>
                                    <th className="px-4 py-3 font-semibold">Address</th>
                                    <th className="px-4 py-3 font-semibold text-center">Status</th>
                                    <th className="px-4 py-3 font-semibold text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {customers.map((customer) => (
                                    <CustomerRow
                                        key={customer._id}
                                        customer={customer}
                                        onEdit={(e) => { e.stopPropagation(); setModal({ mode: "update", id: customer._id }); }}
                                        onDelete={(e) => handleDelete(customer._id, e)}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                renderEmpty={() => <p className="text-center py-12 text-sm" style={{ color: "var(--muted)" }}>No customers found.</p>}
            />
        </div>
    );
}

function CustomerRow({ customer, onEdit, onDelete }) {
    const isActive = customer?.isActive ?? true;

    return (
        <tr className="transition" style={{ borderBottom: "1px solid var(--border)" }} onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-muted)")} onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
            <td className="px-4 py-3">
                <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border" style={{ borderColor: "var(--border)" }}>
                    {customer?.image ? (
                        <img src={`${IMAGE_BASE_URL}/uploads/${customer.image}`} alt={customer?.name ?? "Customer"} className="h-full w-full object-cover" />
                    ) : (
                        <span className="text-xs" style={{ color: "var(--muted)" }}>No</span>
                    )}
                </div>
            </td>
            <td className="px-4 py-3 font-semibold" style={{ color: "var(--ink)" }}>{customer?.name ?? "—"}</td>
            <td className="px-4 py-3 text-xs" style={{ color: "var(--muted)" }}>{customer?.phoneNo ?? "—"}</td>
            <td className="px-4 py-3 text-xs" style={{ color: "var(--muted)" }}>{customer?.cnic ?? "—"}</td>
            <td className="px-4 py-3 text-xs" style={{ color: "var(--muted)" }}>{customer?.address ?? "—"}</td>
            <td className="px-4 py-3 text-center">
                <span className="px-2 py-0.5 rounded-lg text-xs font-semibold" style={{ background: isActive ? "rgba(15,118,110,0.1)" : "rgba(107,114,128,0.1)", color: isActive ? "var(--accent-2)" : "#6b7280" }}>
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
