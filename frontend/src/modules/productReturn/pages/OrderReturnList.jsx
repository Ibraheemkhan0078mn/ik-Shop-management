// ─── pages/OrderReturnList.jsx ────────────────────────────────────────────
import React, { useState } from "react";
import { Plus, Eye, Trash2 } from "lucide-react";
import { showSuccess, showError } from "../../../shared/utilities/toastHelpers.js";
import PaginatedList from "../../../shared/components/PaginatedList.jsx";
import OrderReturnModal from "../components/OrderReturnModal.jsx";
import PageHeading from "../../../shared/components/PageHeading.jsx";
import { useDeleteOrderReturnMutation, useGetPaginatedOrderReturnsQuery } from "../services/orderReturn.service.js";

const OrderReturnList = () => {
    const [showModal, setShowModal] = useState(false);
    const [selectedReturn, setSelectedReturn] = useState(null);
    const [deleteOrderReturn] = useDeleteOrderReturnMutation();
    const language = "en";

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this return?")) {
            try {
                await deleteOrderReturn(id).unwrap();
                showSuccess("Return deleted successfully");
            } catch (error) {
                showError(error?.data?.message || "Failed to delete return");
            }
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case "pending": return "bg-yellow-100 text-yellow-700";
            case "approved": return "bg-green-100 text-green-700";
            case "rejected": return "bg-red-100 text-red-700";
            case "completed": return "bg-blue-100 text-blue-700";
            default: return "bg-gray-100 text-gray-700";
        }
    };

    return (
        <div className="h-screen flex flex-col bg-[var(--app-bg)]">
            {showModal && (
                <OrderReturnModal
                    isOpen={showModal}
                    onClose={() => setShowModal(false)}
                />
            )}

            <div className="flex-none">
                <PageHeading
                    heading="Order Returns"
                    subheading="Manage all order returns"
                >
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-[var(--accent-2)] text-white rounded-lg hover:opacity-90 transition-opacity"
                    >
                        <Plus className="w-5 h-5" />
                        New Return
                    </button>
                </PageHeading>
            </div>

            <PaginatedList
                rtkQuery={useGetPaginatedOrderReturnsQuery}
                limit={10}
                dataKey="data"
                wrapperClassName="flex-1"
                renderItems={(returns) => (
                    <div className="overflow-x-auto rounded-2xl overflow-hidden border border-[var(--border)]">
                        <table className="w-full text-sm text-left bg-[var(--surface)]">
                            <thead>
                                <tr className="text-xs uppercase tracking-wider bg-[var(--app-bg)] border-b border-[var(--border)] text-[var(--muted)]">
                                    <th className="px-4 py-3 font-semibold">Return #</th>
                                    <th className="px-4 py-3 font-semibold">Order #</th>
                                    <th className="px-4 py-3 font-semibold">Customer</th>
                                    <th className="px-4 py-3 font-semibold text-center">Items</th>
                                    <th className="px-4 py-3 font-semibold text-right">Refund</th>
                                    <th className="px-4 py-3 font-semibold text-center">Status</th>
                                    <th className="px-4 py-3 font-semibold">Date</th>
                                    <th className="px-4 py-3 font-semibold text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {returns.map((returnItem) => (
                                    <tr key={returnItem._id} className="transition border-b border-[var(--border)] hover:bg-[var(--app-bg)]">
                                        <td className="px-4 py-3 font-medium text-[var(--ink)]">
                                            {returnItem.returnNumber}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-[var(--muted)]">
                                            {returnItem.referenceOrderNumber}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-[var(--ink)]">
                                            {returnItem.customerName || "-"}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-center text-[var(--muted)]">
                                            {returnItem.items?.length || 0}
                                        </td>
                                        <td className="px-4 py-3 text-sm font-medium text-right text-[var(--accent-2)]">
                                            ${returnItem.totalRefundAmount?.toFixed(2) || "0.00"}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(returnItem.returnStatus)}`}>
                                                {returnItem.returnStatus}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-[var(--muted)]">
                                            {new Date(returnItem.returnDate || returnItem.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2 justify-center">
                                                <button
                                                    onClick={() => setSelectedReturn(returnItem)}
                                                    className="p-2 hover:bg-[var(--app-bg)] rounded-lg transition-colors"
                                                    title="View Details"
                                                >
                                                    <Eye className="w-4 h-4 text-[var(--muted)]" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(returnItem._id)}
                                                    className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                renderEmpty={() => (
                    <p className="text-center py-12 text-sm text-[var(--muted)]">
                        No returns found.
                    </p>
                )}
            />
        </div>
    );
};

export default OrderReturnList;