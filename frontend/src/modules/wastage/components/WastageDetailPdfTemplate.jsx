import React from "react";

export default function WastageDetailPdfTemplate({ wastage = {}, labels = {} }) {
    const date = new Date(wastage?.wastageDate ?? wastage?.createdAt).toLocaleDateString();

    return (
        <div className="p-6 bg-white min-h-screen">
            {/* Header */}
            <div className="mb-6 pb-4 border-b-2 border-gray-200">
                <h1 className="text-2xl font-bold text-gray-900">{labels.wastageDetails || "Wastage Details"}</h1>
                <p className="text-sm text-gray-500">{wastage?.wastageNumber || "—"} · {date}</p>
            </div>

            {/* Status row */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                        wastage?.status === "approved" ? "bg-green-100 text-green-700" :
                        wastage?.status === "pending" ? "bg-yellow-100 text-yellow-700" :
                        wastage?.status === "rejected" ? "bg-red-100 text-red-700" :
                        wastage?.status === "draft" ? "bg-gray-100 text-gray-700" :
                        "bg-blue-100 text-blue-700"
                    }`}>
                        {wastage?.status || "Unknown"}
                    </span>
                </div>
            </div>

            <div className="border-b border-gray-200 my-6" />

            {/* Wastage Information */}
            <div className="mb-6">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Wastage Information</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                        <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Wastage Number</p>
                        <p className="text-sm font-semibold text-gray-900">{wastage?.wastageNumber || "—"}</p>
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Reason</p>
                        <p className="text-sm font-semibold text-gray-900 capitalize">{wastage?.reason?.replace(/_/g, " ") || "—"}</p>
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Wastage Date</p>
                        <p className="text-sm font-semibold text-gray-900">{date}</p>
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Status</p>
                        <p className="text-sm font-semibold text-gray-900 capitalize">{wastage?.status || "—"}</p>
                    </div>
                </div>
                {wastage?.notes && (
                    <p className="text-sm text-gray-500 mt-4 italic">{wastage.notes}</p>
                )}
            </div>

            <div className="border-b border-gray-200 my-6" />

            {/* Financial Details */}
            <div className="mb-6">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Financial Details</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                        <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Total Items</p>
                        <p className="text-sm font-semibold text-gray-900">{wastage?.totalItems || wastage?.items?.length || 0}</p>
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Total Quantity</p>
                        <p className="text-sm font-semibold text-gray-900">{wastage?.totalQuantity || 0}</p>
                    </div>
                    <div>
                        <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">Total Loss Amount</p>
                        <p className="text-sm font-semibold text-red-600">Rs {(wastage?.totalLossAmount ?? 0).toLocaleString()}</p>
                    </div>
                </div>
            </div>

            <div className="border-b border-gray-200 my-6" />

            {/* Wasted Items */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        Wasted Items ({wastage?.items?.length || 0})
                    </p>
                </div>
                <table className="w-full border border-gray-200">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-semibold uppercase text-gray-600 border-b">Product</th>
                            <th className="px-4 py-2 text-center text-xs font-semibold uppercase text-gray-600 border-b">Qty</th>
                            <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-gray-600 border-b">Cost Price</th>
                            <th className="px-4 py-2 text-right text-xs font-semibold uppercase text-gray-600 border-b">Loss Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {wastage?.items?.map((item, index) => (
                            <React.Fragment key={index}>
                                <tr className="border-b">
                                    <td className="px-4 py-3">
                                        <p className="font-medium text-gray-900">{item.product?.name || item.productName || "—"}</p>
                                        {item.product?._id && <p className="text-xs text-gray-500">ID: {item.product._id}</p>}
                                        {item.batchNumber && <p className="text-xs text-gray-500">Batch: {item.batchNumber}</p>}
                                    </td>
                                    <td className="px-4 py-3 text-center text-gray-900">{item.quantity || 0}</td>
                                    <td className="px-4 py-3 text-right text-gray-900">Rs {(item.costPrice || 0).toLocaleString()}</td>
                                    <td className="px-4 py-3 text-right font-semibold text-red-600">Rs {((item.quantity || 0) * (item.costPrice || 0)).toLocaleString()}</td>
                                </tr>
                                <tr className="border-b bg-gray-50">
                                    <td colSpan="4" className="px-4 py-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="p-3 bg-white border border-gray-200 rounded-lg">
                                                <p className="text-xs font-semibold text-gray-600 mb-2">Item Details</p>
                                                <div className="text-xs space-y-1">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-700">Product ID:</span>
                                                        <span className="font-mono text-gray-900">{item.product?._id || item.productId || "—"}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-700">Product Name:</span>
                                                        <span className="font-mono text-gray-900">{item.product?.name || item.productName || "—"}</span>
                                                    </div>
                                                    {item.batchNumber && (
                                                        <div className="flex justify-between">
                                                            <span className="text-gray-700">Batch Number:</span>
                                                            <span className="font-mono text-gray-900">{item.batchNumber}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-700">Quantity:</span>
                                                        <span className="font-mono text-gray-900">{item.quantity || 0}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="p-3 bg-white border border-gray-200 rounded-lg">
                                                <p className="text-xs font-semibold text-gray-600 mb-2">Loss Calculation</p>
                                                <div className="text-xs space-y-1">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-700">Cost Price:</span>
                                                        <span className="font-mono text-gray-900">Rs {(item.costPrice || 0).toLocaleString()}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-700">Quantity:</span>
                                                        <span className="font-mono text-gray-900">{item.quantity || 0}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-700">Line Total:</span>
                                                        <span className="font-mono text-gray-900">Rs {((item.costPrice || 0) * (item.quantity || 0)).toLocaleString()}</span>
                                                    </div>
                                                    <div className="h-px bg-gray-200 my-1"></div>
                                                    <div className="flex justify-between font-semibold">
                                                        <span className="text-gray-900">Loss Amount:</span>
                                                        <span className="font-mono text-red-700">Rs {((item.quantity || 0) * (item.costPrice || 0)).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            </React.Fragment>
                        ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                        <tr>
                            <td colSpan="3" className="px-4 py-2 text-right font-bold text-gray-900">Total Loss:</td>
                            <td className="px-4 py-2 text-right font-bold text-red-600 text-lg">Rs {(wastage?.totalLossAmount ?? 0).toLocaleString()}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}
