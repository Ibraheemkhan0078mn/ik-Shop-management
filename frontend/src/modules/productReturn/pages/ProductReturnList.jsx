import React, { useState } from "react";
import { Plus, Edit, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import api from "@shared/services/api.js";
import PaginatedList from "@shared/components/PaginatedList.jsx";
import ProductReturnModal from "../components/ProductReturnModal.jsx";
import PageHeading from "@shared/components/PageHeading.jsx";

const ProductReturnList = () => {
    const [language, setLanguage] = useState("en");
    const [showModal, setShowModal] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const handleDelete = async (id) => {
        if (window.confirm(language === "en" ? "Are you sure you want to delete this return?" : "کیا آپ واقعی یہ واپسی حذف کرنا چاہتے ہیں؟")) {
            try {
                await api.delete(`/api/product-returns/${id}`);
                toast.success(language === "en" ? "Return deleted successfully" : "واپسی کامیابی سے حذف ہو گئی");
                setRefreshKey(prev => prev + 1);
            } catch (error) {
                toast.error(error?.response?.data?.message || "Failed to delete return");
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
        <div className="h-screen flex flex-col">
            {showModal && (
                <ProductReturnModal
                    isOpen={showModal}
                    onClose={() => {
                        setShowModal(false);
                        setRefreshKey(prev => prev + 1);
                    }}
                />
            )}

            <div className="flex-none">
                <PageHeading
                    heading={language === "en" ? "Product Returns" : "پروڈکٹ واپسی"}
                    subheading={language === "en" ? "Manage all product returns" : "تمام پروڈکٹ واپسی کا انتظام کریں"}
                >
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-(--accent-2) text-white rounded-lg hover:bg-(--accent-2)/90 transition-colors"
                    >
                        <Plus className="w-5 h-5" />
                        {language === "en" ? "New Return" : "نیا واپسی"}
                    </button>
                </PageHeading>
            </div>

            <PaginatedList
                key={refreshKey}
                endpoint="/product-returns/pagination"
                limit={10}
                dataKey="data"
                wrapperClassName="flex-1"
                renderItems={(returns) => (
                    <div className="overflow-x-auto rounded-2xl overflow-hidden"
                        style={{ border: "1px solid var(--border)" }}>
                        <table className="w-full text-sm text-left">
                            <thead>
                                <tr className="text-xs uppercase tracking-wider"
                                    style={{ background: "var(--surface-muted)", borderBottom: "1px solid var(--border)", color: "var(--muted)" }}>
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
                                    <tr key={returnItem._id} className="transition" style={{ borderBottom: "1px solid var(--border)" }}
                                        onMouseEnter={e => e.currentTarget.style.background = "var(--surface-muted)"}
                                        onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                                        <td className="px-4 py-3 font-medium" style={{ color: "var(--ink)" }}>
                                            {returnItem.returnNumber}
                                        </td>
                                        <td className="px-4 py-3 text-sm" style={{ color: "var(--muted)" }}>
                                            {returnItem.referenceOrderNumber}
                                        </td>
                                        <td className="px-4 py-3 text-sm" style={{ color: "var(--ink)" }}>
                                            {returnItem.customerName || "-"}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-center" style={{ color: "var(--muted)" }}>
                                            {returnItem.items?.length || 0}
                                        </td>
                                        <td className="px-4 py-3 text-sm font-medium text-right" style={{ color: "var(--accent-2)" }}>
                                            ${returnItem.totalRefundAmount?.toFixed(2) || "0.00"}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(returnItem.returnStatus)}`}>
                                                {returnItem.returnStatus}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm" style={{ color: "var(--muted)" }}>
                                            {new Date(returnItem.returnDate || returnItem.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex gap-2 justify-center">
                                                <button
                                                    onClick={() => setSelectedReturn(returnItem)}
                                                    className="p-2 hover:bg-(--surface) rounded-lg transition-colors"
                                                    title={language === "en" ? "View Details" : "تفصیلات دیکھیں"}
                                                >
                                                    <Eye className="w-4 h-4 text-(--muted)" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(returnItem._id)}
                                                    className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                                                    title={language === "en" ? "Delete" : "حذف کریں"}
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
                    <p className="text-center py-12 text-sm" style={{ color: "var(--muted)" }}>
                        No returns found.
                    </p>
                )}
            />
        </div>
    );
};

export default ProductReturnList;
