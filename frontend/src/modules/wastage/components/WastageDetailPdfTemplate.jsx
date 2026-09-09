import React from "react";

export default function WastageDetailPdfTemplate({ wastage = {}, labels = {} }) {
    const date = new Date(wastage?.wastageDate ?? wastage?.createdAt).toLocaleDateString();

    return (
        <div style={{ padding: '1.5rem', backgroundColor: '#ffffff', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
            {/* Header */}
            <div style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '2px solid #e5e7eb' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>{labels.wastageDetails || "Wastage Details"}</h1>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.25rem 0 0 0' }}>{wastage?.wastageNumber || "—"} · {date}</p>
            </div>

            {/* Status row */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '0.5rem',
                        fontSize: '0.875rem',
                        fontWeight: '600',
                        backgroundColor: wastage?.status === "approved" ? '#dcfce7' :
                                       wastage?.status === "pending" ? '#fef9c3' :
                                       wastage?.status === "rejected" ? '#fee2e2' :
                                       wastage?.status === "draft" ? '#f3f4f6' : '#dbeafe',
                        color: wastage?.status === "approved" ? '#166534' :
                               wastage?.status === "pending" ? '#854d0e' :
                               wastage?.status === "rejected" ? '#991b1b' :
                               wastage?.status === "draft" ? '#374151' : '#1e40af'
                    }}>
                        {wastage?.status || "Unknown"}
                    </span>
                </div>
            </div>

            <div style={{ borderBottom: '1px solid #e5e7eb', marginTop: '1.5rem', marginBottom: '1.5rem' }} />

            {/* Wastage Information */}
            <div style={{ marginBottom: '1.5rem' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280', marginBottom: '0.75rem', margin: 0 }}>Wastage Information</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                    <div>
                        <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280', marginBottom: '0.25rem', margin: 0 }}>Wastage Number</p>
                        <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#111827', margin: 0 }}>{wastage?.wastageNumber || "—"}</p>
                    </div>
                    <div>
                        <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280', marginBottom: '0.25rem', margin: 0 }}>Reason</p>
                        <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#111827', margin: 0, textTransform: 'capitalize' }}>{wastage?.reason?.replace(/_/g, " ") || "—"}</p>
                    </div>
                    <div>
                        <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280', marginBottom: '0.25rem', margin: 0 }}>Wastage Date</p>
                        <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#111827', margin: 0 }}>{date}</p>
                    </div>
                    <div>
                        <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280', marginBottom: '0.25rem', margin: 0 }}>Status</p>
                        <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#111827', margin: 0, textTransform: 'capitalize' }}>{wastage?.status || "—"}</p>
                    </div>
                </div>
                {wastage?.notes && (
                    <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '1rem', fontStyle: 'italic', margin: 0 }}>{wastage.notes}</p>
                )}
            </div>

            <div style={{ borderBottom: '1px solid #e5e7eb', marginTop: '1.5rem', marginBottom: '1.5rem' }} />

            {/* Financial Details */}
            <div style={{ marginBottom: '1.5rem' }}>
                <p style={{ fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280', marginBottom: '0.75rem', margin: 0 }}>Financial Details</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                    <div>
                        <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280', marginBottom: '0.25rem', margin: 0 }}>Total Items</p>
                        <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#111827', margin: 0 }}>{wastage?.totalItems || wastage?.items?.length || 0}</p>
                    </div>
                    <div>
                        <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280', marginBottom: '0.25rem', margin: 0 }}>Total Quantity</p>
                        <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#111827', margin: 0 }}>{wastage?.totalQuantity || 0}</p>
                    </div>
                    <div>
                        <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280', marginBottom: '0.25rem', margin: 0 }}>Total Loss Amount</p>
                        <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#dc2626', margin: 0 }}>Rs {(wastage?.totalLossAmount ?? 0).toLocaleString()}</p>
                    </div>
                </div>
            </div>

            <div style={{ borderBottom: '1px solid #e5e7eb', marginTop: '1.5rem', marginBottom: '1.5rem' }} />

            {/* Wasted Items */}
            <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                    <p style={{ fontSize: '0.75rem', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280', margin: 0 }}>
                        Wasted Items ({wastage?.items?.length || 0})
                    </p>
                </div>
                <table style={{ width: '100%', border: '1px solid #e5e7eb' }}>
                    <thead style={{ backgroundColor: '#f3f4f6' }}>
                        <tr>
                            <th style={{ padding: '0.5rem 1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: '#4b5563', borderBottom: '1px solid #e5e7eb' }}>Product</th>
                            <th style={{ padding: '0.5rem 1rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: '#4b5563', borderBottom: '1px solid #e5e7eb' }}>Qty</th>
                            <th style={{ padding: '0.5rem 1rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: '#4b5563', borderBottom: '1px solid #e5e7eb' }}>Cost Price</th>
                            <th style={{ padding: '0.5rem 1rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', color: '#4b5563', borderBottom: '1px solid #e5e7eb' }}>Loss Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {wastage?.items?.map((item, index) => (
                            <React.Fragment key={index}>
                                <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                                    <td style={{ padding: '0.75rem 1rem' }}>
                                        <p style={{ fontWeight: '500', color: '#111827', margin: 0 }}>{item.product?.name || item.productName || "—"}</p>
                                        {item.product?._id && <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0.25rem 0 0 0' }}>ID: {item.product._id}</p>}
                                        {item.batchNumber && <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0.25rem 0 0 0' }}>Batch: {item.batchNumber}</p>}
                                    </td>
                                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center', color: '#111827' }}>{item.quantity || 0}</td>
                                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', color: '#111827' }}>Rs {(item.costPrice || 0).toLocaleString()}</td>
                                    <td style={{ padding: '0.75rem 1rem', textAlign: 'right', fontWeight: '600', color: '#dc2626' }}>Rs {((item.quantity || 0) * (item.costPrice || 0)).toLocaleString()}</td>
                                </tr>
                                <tr style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                                    <td colSpan="4" style={{ padding: '1rem' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                                            <div style={{ padding: '0.75rem', backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}>
                                                <p style={{ fontSize: '0.75rem', fontWeight: '600', color: '#4b5563', marginBottom: '0.5rem', margin: 0 }}>Item Details</p>
                                                <div style={{ fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <span style={{ color: '#374151' }}>Product ID:</span>
                                                        <span style={{ fontFamily: 'monospace', color: '#111827' }}>{item.product?._id || item.productId || "—"}</span>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <span style={{ color: '#374151' }}>Product Name:</span>
                                                        <span style={{ fontFamily: 'monospace', color: '#111827' }}>{item.product?.name || item.productName || "—"}</span>
                                                    </div>
                                                    {item.batchNumber && (
                                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                            <span style={{ color: '#374151' }}>Batch Number:</span>
                                                            <span style={{ fontFamily: 'monospace', color: '#111827' }}>{item.batchNumber}</span>
                                                        </div>
                                                    )}
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <span style={{ color: '#374151' }}>Quantity:</span>
                                                        <span style={{ fontFamily: 'monospace', color: '#111827' }}>{item.quantity || 0}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid #e5e7eb', fontSize: '0.75rem', color: '#6b7280', textAlign: 'center' }}>
                <p style={{ fontStyle: 'italic', margin: 0 }}>This is a computer generated document</p>
                <p style={{ margin: '0.25rem 0 0 0' }}>Generated on: {new Date().toLocaleString()}</p>
            </div>
        </div>
    );
}
