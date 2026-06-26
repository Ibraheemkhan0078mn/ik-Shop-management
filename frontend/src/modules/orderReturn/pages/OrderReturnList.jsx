// ─── pages/OrderReturnList.jsx ────────────────────────────────────────────
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Eye, Trash2, ArrowLeft, Edit } from "lucide-react";
import { showSuccess, showError } from "../../../shared/utilities/toastHelpers.js";
import OrderReturnModal from "../components/OrderReturnModal.jsx";
import PageHeading from "../../../shared/components/PageHeading.jsx";
import { getPaginatedOrderReturns, deleteOrderReturn as deleteOrderReturnApi } from "../api/orderReturn.api.js";

const OrderReturnList = () => {
    const navigate = useNavigate();
    const [showModal, setShowModal] = useState(false);
    const [selectedReturn, setSelectedReturn] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isViewMode, setIsViewMode] = useState(false);
    const [returns, setReturns] = useState([]);
    const [loading, setLoading] = useState(false);
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
    const language = "en";

    const fetchReturns = async (page = 1) => {
        setLoading(true);
        try {
            const response = await getPaginatedOrderReturns({ page, limit: 10 });
            setReturns(response.data || []);
            setPagination({
                page: response.page || 1,
                limit: response.limit || 10,
                total: response.total || 0,
                totalPages: response.totalPages || 0,
            });
        } catch (error) {
            showError(error?.response?.data?.message || "Failed to fetch returns");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReturns(1);
    }, []);

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this return?")) {
            try {
                await deleteOrderReturnApi(id);
                showSuccess("Return deleted successfully");
                fetchReturns(pagination.page);
            } catch (error) {
                showError(error?.response?.data?.message || "Failed to delete return");
            }
        }
    };

    const handleEdit = (returnItem) => {
        setSelectedReturn(returnItem);
        setIsEditMode(true);
        setIsViewMode(false);
        setShowModal(true);
    };

    const handleView = (returnItem) => {
        setSelectedReturn(returnItem);
        setIsEditMode(false);
        setIsViewMode(true);
        setShowModal(true);
    };

    const handleModalClose = () => {
        setShowModal(false);
        setSelectedReturn(null);
        setIsEditMode(false);
        setIsViewMode(false);
        fetchReturns(pagination.page);
    };

    const handlePageChange = (newPage) => {
        fetchReturns(newPage);
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
                    onClose={handleModalClose}
                    editData={selectedReturn}
                    isEditMode={isEditMode}
                    isViewMode={isViewMode}
                />
            )}

            <div className="flex-none">
                <PageHeading
                    heading="Order Returns"
                    subheading="Manage all order returns"
                >
                    <div className="flex gap-2">
                        <button
                            onClick={() => navigate(-1)}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg transition"
                            style={{ background: "var(--surface-muted)", color: "var(--ink)", border: "1px solid var(--border)" }}
                        >
                            <ArrowLeft className="w-5 h-5" />
                            Back
                        </button>
                        <button
                            onClick={() => setShowModal(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg transition"
                            style={{ background: "var(--accent-2)", color: "white" }}
                        >
                            <Plus className="w-5 h-5" />
                            New Return
                        </button>
                    </div>
                </PageHeading>
            </div>

            <div className="flex-1 overflow-hidden p-6">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-[var(--muted)]">Loading...</p>
                    </div>
                ) : (
                    <>
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
                                                        onClick={() => handleView(returnItem)}
                                                        className="p-2 hover:bg-[var(--app-bg)] rounded-lg transition-colors"
                                                        title="View Details"
                                                    >
                                                        <Eye className="w-4 h-4 text-[var(--muted)]" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleEdit(returnItem)}
                                                        className="p-2 hover:bg-[var(--app-bg)] rounded-lg transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Edit className="w-4 h-4 text-[var(--accent-2)]" />
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

                        {returns.length === 0 && (
                            <p className="text-center py-12 text-sm text-[var(--muted)]">
                                No returns found.
                            </p>
                        )}

                        {pagination.totalPages > 1 && (
                            <div className="flex items-center justify-between mt-4">
                                <p className="text-sm text-[var(--muted)]">
                                    Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} returns
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handlePageChange(pagination.page - 1)}
                                        disabled={pagination.page === 1}
                                        className="px-3 py-1 rounded border border-[var(--border)] disabled:opacity-50 hover:bg-[var(--app-bg)]"
                                    >
                                        Previous
                                    </button>
                                    <span className="px-3 py-1 text-[var(--ink)]">
                                        Page {pagination.page} of {pagination.totalPages}
                                    </span>
                                    <button
                                        onClick={() => handlePageChange(pagination.page + 1)}
                                        disabled={pagination.page === pagination.totalPages}
                                        className="px-3 py-1 rounded border border-[var(--border)] disabled:opacity-50 hover:bg-[var(--app-bg)]"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default OrderReturnList;