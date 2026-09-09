import React from "react";

export default function QarzaPaymentPdfTemplate({ payment = {}, account = {}, summary = {}, labels = {} }) {
    const date = new Date(payment.date).toLocaleDateString();
    
    const STATUS_CONFIG = {
        cashin: { 
            label: "Cash In", 
            color: "#10b981", 
            bg: "rgba(16,185,129,0.1)" 
        },
        cashout: { 
            label: "Cash Out", 
            color: "#ef4444", 
            bg: "rgba(239,68,68,0.1)" 
        },
    };

    const config = STATUS_CONFIG[payment.type] || STATUS_CONFIG.cashin;

    return (
        <div style={{ padding: '1.5rem', backgroundColor: '#ffffff', minHeight: '100vh', fontFamily: 'Arial, sans-serif' }}>
            {/* Header */}
            <div style={{ marginBottom: '1.5rem', paddingBottom: '1rem', borderBottom: '2px solid #e5e7eb' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>{labels.paymentReceipt || "Payment Receipt"}</h1>
                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.25rem 0 0 0' }}>{labels.qarzaAccount || "Qarza Account"}</p>
            </div>

            {/* Account Information */}
            <div style={{ marginBottom: '1.5rem', padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {labels.accountDetails || "Account Details"}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                    <div>
                        <label style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 'bold', display: 'block' }}>{labels.accountName || "Account Name"}</label>
                        <p style={{ fontWeight: '600', color: '#111827', marginTop: '0.25rem', margin: 0 }}>{account.name || "—"}</p>
                    </div>
                    <div>
                        <label style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 'bold', display: 'block' }}>{labels.phone || "Phone"}</label>
                        <p style={{ fontWeight: '600', color: '#111827', marginTop: '0.25rem', margin: 0 }}>{account.phoneNo || "—"}</p>
                    </div>
                    <div>
                        <label style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 'bold', display: 'block' }}>{labels.accountType || "Account Type"}</label>
                        <p style={{ fontWeight: '600', color: '#111827', marginTop: '0.25rem', margin: 0, textTransform: 'capitalize' }}>{account.type || "—"}</p>
                    </div>
                    <div>
                        <label style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 'bold', display: 'block' }}>{labels.currentBalance || "Current Balance"}</label>
                        <p style={{ fontWeight: '600', color: '#111827', marginTop: '0.25rem', margin: 0 }}>Rs {(summary.overall || 0).toLocaleString()}</p>
                    </div>
                </div>
            </div>

            {/* Payment Details */}
            <div style={{ marginBottom: '1.5rem', padding: '1rem', border: '1px solid #e5e7eb', borderRadius: '0.5rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {labels.paymentDetails || "Payment Details"}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                    <div>
                        <label style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 'bold', display: 'block' }}>{labels.paymentType || "Payment Type"}</label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                            <div style={{ width: '2rem', height: '2rem', borderRadius: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: config.bg }}>
                                <span style={{ fontSize: '1rem', color: config.color, fontWeight: 'bold' }}>{payment.type === 'cashin' ? '↓' : '↑'}</span>
                            </div>
                            <span style={{ fontWeight: '600', color: '#111827', textTransform: 'capitalize' }}>{payment.type}</span>
                        </div>
                    </div>
                    <div>
                        <label style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 'bold', display: 'block' }}>{labels.amount || "Amount"}</label>
                        <p style={{ fontWeight: 'bold', fontSize: '1.5rem', marginTop: '0.25rem', margin: 0, color: config.color }}>
                            Rs {(payment.amount || 0).toLocaleString()}
                        </p>
                    </div>
                    <div>
                        <label style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 'bold', display: 'block' }}>{labels.date || "Date"}</label>
                        <p style={{ fontWeight: '600', color: '#111827', marginTop: '0.25rem', margin: 0 }}>{date}</p>
                    </div>
                    <div>
                        <label style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 'bold', display: 'block' }}>{labels.paymentId || "Payment ID"}</label>
                        <p style={{ fontWeight: '600', color: '#111827', marginTop: '0.25rem', margin: 0, fontSize: '0.75rem' }}>{payment._id || "—"}</p>
                    </div>
                    {payment.notes && (
                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 'bold', display: 'block' }}>{labels.notes || "Notes"}</label>
                            <p style={{ color: '#111827', marginTop: '0.25rem', margin: 0 }}>{payment.notes}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Summary */}
            <div style={{ padding: '1rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', color: '#111827', marginBottom: '0.75rem' }}>{labels.accountSummary || "Account Summary"}</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' }}>
                    <div style={{ textAlign: 'center', padding: '0.5rem' }}>
                        <p style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 'bold', margin: 0 }}>{labels.manualCashIn || "Manual Cash In"}</p>
                        <p style={{ fontWeight: '600', color: '#16a34a', marginTop: '0.25rem', margin: 0 }}>Rs {(summary.manualCashIn || 0).toLocaleString()}</p>
                    </div>
                    <div style={{ textAlign: 'center', padding: '0.5rem' }}>
                        <p style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 'bold', margin: 0 }}>{labels.manualCashOut || "Manual Cash Out"}</p>
                        <p style={{ fontWeight: '600', color: '#dc2626', marginTop: '0.25rem', margin: 0 }}>Rs {(summary.manualCashOut || 0).toLocaleString()}</p>
                    </div>
                    <div style={{ textAlign: 'center', padding: '0.5rem' }}>
                        <p style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 'bold', margin: 0 }}>{labels.posAmount || "POS"}</p>
                        <p style={{ fontWeight: '600', color: '#ea580c', marginTop: '0.25rem', margin: 0 }}>Rs {(summary.posAmount || 0).toLocaleString()}</p>
                    </div>
                    <div style={{ textAlign: 'center', padding: '0.5rem' }}>
                        <p style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 'bold', margin: 0 }}>{labels.purchaseAmount || "Purchase"}</p>
                        <p style={{ fontWeight: '600', color: '#9333ea', marginTop: '0.25rem', margin: 0 }}>Rs {(summary.purchaseAmount || 0).toLocaleString()}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
