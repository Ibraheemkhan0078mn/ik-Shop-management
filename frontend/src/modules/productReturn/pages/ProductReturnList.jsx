import React, { useState } from "react";
import { Plus, Search, Edit, Trash2, Eye, Package, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import {
    useGetAllProductReturnsQuery,
    useDeleteProductReturnMutation,
    useUpdateReturnStatusMutation,
} from "../services/productReturn.service.js";
import ProductReturnModal from "../components/ProductReturnModal.jsx";

const ProductReturnList = () => {
    const [language, setLanguage] = useState("en");
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedReturn, setSelectedReturn] = useState(null);

    const { data: returnsData, isLoading, refetch } = useGetAllProductReturnsQuery({
        page: currentPage,
        limit: 10,
        search: searchTerm,
        status: statusFilter,
    });

    const [deleteReturn] = useDeleteProductReturnMutation();
    const [updateStatus] = useUpdateReturnStatusMutation();

    const returns = returnsData?.data || [];
    const totalPages = returnsData?.totalPages || 1;

    const handleDelete = async (id) => {
        if (window.confirm(language === "en" ? "Are you sure you want to delete this return?" : "کیا آپ واقعی یہ واپسی حذف کرنا چاہتے ہیں؟")) {
            try {
                await deleteReturn(id).unwrap();
                toast.success(language === "en" ? "Return deleted successfully" : "واپسی کامیابی سے حذف ہو گئی");
                refetch();
            } catch (error) {
                toast.error(error?.response?.data?.message || "Failed to delete return");
            }
        }
    };

    const handleStatusChange = async (id, status) => {
        try {
            await updateStatus({ id, status }).unwrap();
            toast.success(language === "en" ? "Status updated successfully" : "اسٹیٹس کامیابی سے اپ ڈیٹ ہو گیا");
            refetch();
        } catch (error) {
            toast.error(error?.response?.data?.message || "Failed to update status");
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
        <div className="min-h-screen bg-(--surface) p-6 rounded-3xl border border-(--border) shadow-[0_18px_50px_rgba(64,45,28,0.12)]">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-(--ink)">
                        {language === "en" ? "Product Returns" : "پروڈکٹ واپسی"}
                    </h1>
                    <p className="text-(--muted) mt-1">
                        {language === "en" ? "Manage all product returns" : "تمام پروڈکٹ واپسی کا انتظام کریں"}
                    </p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-(--accent-2) text-white rounded-lg hover:bg-(--accent-2)/90 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    {language === "en" ? "New Return" : "نیا واپسی"}
                </button>
            </div>

            {/* Filters */}
            <div className="flex gap-4 mb-6">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-(--muted)" />
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder={language === "en" ? "Search by return number, order number, or customer name..." : "واپسی نمبر، آرڈر نمبر، یا گاہک کا نام تلاش کریں..."}
                        className="w-full pl-10 pr-4 py-2 border border-(--border) rounded-lg bg-(--surface-muted) text-(--ink) focus:outline-none focus:ring-2 focus:ring-(--accent-2)"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-4 py-2 border border-(--border) rounded-lg bg-(--surface-muted) text-(--ink) focus:outline-none focus:ring-2 focus:ring-(--accent-2)"
                >
                    <option value="">
                        {language === "en" ? "All Status" : "تمام اسٹیٹس"}
                    </option>
                    <option value="pending">{language === "en" ? "Pending" : "زیر التواء"}</option>
                    <option value="approved">{language === "en" ? "Approved" : "منظور شدہ"}</option>
                    <option value="rejected">{language === "en" ? "Rejected" : "مسترد"}</option>
                    <option value="completed">{language === "en" ? "Completed" : "مکمل"}</option>
                </select>
                <button
                    onClick={() => refetch()}
                    className="px-4 py-2 border border-(--border) rounded-lg text-(--ink) hover:bg-(--surface-muted) transition-colors"
                >
                    <RefreshCw className="w-5 h-5" />
                </button>
            </div>

            {/* Table */}
            <div className="bg-(--surface-muted) rounded-2xl border border-(--border) overflow-hidden">
                {isLoading ? (
                    <div className="p-8 text-center text-(--muted)">
                        {language === "en" ? "Loading..." : "لوڈ ہو رہا ہے..."}
                    </div>
                ) : returns.length === 0 ? (
                    <div className="p-8 text-center text-(--muted)">
                        <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>{language === "en" ? "No returns found" : "کوئی واپسی نہیں ملی"}</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-(--surface)">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-(--muted) uppercase">
                                    {language === "en" ? "Return Number" : "واپسی نمبر"}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-(--muted) uppercase">
                                    {language === "en" ? "Order Number" : "آرڈر نمبر"}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-(--muted) uppercase">
                                    {language === "en" ? "Customer" : "گاہک"}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-(--muted) uppercase">
                                    {language === "en" ? "Items" : "آئٹمز"}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-(--muted) uppercase">
                                    {language === "en" ? "Refund Amount" : "واپسی کی رقم"}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-(--muted) uppercase">
                                    {language === "en" ? "Status" : "اسٹیٹس"}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-(--muted) uppercase">
                                    {language === "en" ? "Date" : "تاریخ"}
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-(--muted) uppercase">
                                    {language === "en" ? "Actions" : "ایکشنز"}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-(--border)">
                            {returns.map((returnItem) => (
                                <tr key={returnItem._id} className="hover:bg-(--surface)">
                                    <td className="px-6 py-4 text-sm font-medium text-(--ink)">
                                        {returnItem.returnNumber}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-(--muted)">
                                        {returnItem.referenceOrderNumber}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-(--ink)">
                                        {returnItem.customerName || "-"}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-(--muted)">
                                        {returnItem.items?.length || 0}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-(--accent-2)">
                                        ${returnItem.totalRefundAmount?.toFixed(2) || "0.00"}
                                    </td>
                                    <td className="px-6 py-4">
                                        <select
                                            value={returnItem.returnStatus}
                                            onChange={(e) => handleStatusChange(returnItem._id, e.target.value)}
                                            className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(returnItem.returnStatus)}`}
                                        >
                                            <option value="pending">{language === "en" ? "Pending" : "زیر التواء"}</option>
                                            <option value="approved">{language === "en" ? "Approved" : "منظور شدہ"}</option>
                                            <option value="rejected">{language === "en" ? "Rejected" : "مسترد"}</option>
                                            <option value="completed">{language === "en" ? "Completed" : "مکمل"}</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-(--muted)">
                                        {new Date(returnItem.returnDate || returnItem.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
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
                )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                    <button
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 border border-(--border) rounded-lg text-(--ink) hover:bg-(--surface-muted) transition-colors disabled:opacity-50"
                    >
                        {language === "en" ? "Previous" : "پچھلا"}
                    </button>
                    <span className="text-sm text-(--muted)">
                        Page {currentPage} of {totalPages}
                    </span>
                    <button
                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 border border-(--border) rounded-lg text-(--ink) hover:bg-(--surface-muted) transition-colors disabled:opacity-50"
                    >
                        {language === "en" ? "Next" : "اگلا"}
                    </button>
                </div>
            )}

            {/* Modal */}
            <ProductReturnModal
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false);
                    refetch();
                }}
            />
        </div>
    );
};

export default ProductReturnList;
