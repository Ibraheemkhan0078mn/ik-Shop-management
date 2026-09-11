import React from "react";

const styles = {
    page: { padding: "2.5rem", backgroundColor: "#ffffff", minHeight: "100vh", color: "#1f2937", fontFamily: "Arial, sans-serif" },
    header: { textAlign: "center", marginBottom: "1.5rem" },
    logo: { display: "inline-flex", flexDirection: "column", alignItems: "center", lineHeight: 1, marginBottom: "0.5rem" },
    logoMain: { fontSize: "1.875rem", lineHeight: "2.25rem", fontWeight: 800, letterSpacing: "2px", color: "#111827" },
    logoSub: { fontSize: "0.75rem", lineHeight: "1rem", fontWeight: 600, letterSpacing: "0.3em", color: "#6b7280", marginTop: "0.25rem" },
    title: { fontSize: "1.5rem", lineHeight: "2rem", fontWeight: 700, textAlign: "center", color: "#111827", margin: "0 0 1.5rem" },
    metaRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", gap: "1.5rem" },
    label: { fontSize: "0.75rem", lineHeight: "1rem", fontWeight: 600, color: "#6b7280", margin: "0 0 0.25rem" },
    customer: { fontSize: "0.875rem", lineHeight: "1.25rem", fontWeight: 700, textTransform: "uppercase", color: "#111827", margin: 0 },
    mutedText: { fontSize: "0.75rem", lineHeight: "1rem", color: "#4b5563", margin: "0.25rem 0 0" },
    metaBox: { display: "flex", flexDirection: "column", gap: "0.5rem", minWidth: "240px" },
    borderedRow: { border: "1px solid #d1d5db", padding: "0.5rem 0.75rem", display: "flex", justifyContent: "space-between", fontSize: "0.875rem", lineHeight: "1.25rem" },
    table: { width: "100%", borderCollapse: "collapse", marginBottom: "1rem", fontSize: "0.875rem", lineHeight: "1.25rem" },
    headerCell: { padding: "0.5rem 0.75rem", fontWeight: 600, textAlign: "left" },
    rightHeaderCell: { padding: "0.5rem 0.75rem", fontWeight: 600, textAlign: "right" },
    cell: { padding: "0.5rem 0.75rem" },
    rightCell: { padding: "0.5rem 0.75rem", textAlign: "right" },
    smallMuted: { display: "block", fontSize: "10px", lineHeight: 1, color: "#9ca3af" },
    summaryRow: { display: "flex", justifyContent: "space-between", gap: "1.5rem", marginBottom: "1.5rem" },
    summaryBox: { border: "1px solid #d1d5db", padding: "0.75rem", fontSize: "0.875rem", lineHeight: "1.25rem", minWidth: "260px" },
    summaryHeading: { fontWeight: 600, margin: "0 0 0.5rem" },
    summaryLine: { display: "flex", justifyContent: "space-between", padding: "0.25rem 0" },
    totalLine: { display: "flex", justifyContent: "space-between", padding: "0.25rem 0", fontWeight: 700, borderTop: "1px solid #d1d5db", marginTop: "0.25rem", paddingTop: "0.25rem" },
    totalsBox: { border: "1px solid #d1d5db", minWidth: "280px", fontSize: "0.875rem", lineHeight: "1.25rem" },
    totalsLine: { display: "flex", justifyContent: "space-between", padding: "0.5rem 0.75rem", borderBottom: "1px solid #e5e7eb" },
    section: { marginBottom: "1.5rem" },
    sectionHeading: { fontSize: "1.125rem", lineHeight: "1.75rem", fontWeight: 600, margin: "0 0 0.75rem", color: "#111827" },
    accountBox: { border: "1px solid #d1d5db", padding: "1rem", marginBottom: "1.5rem", backgroundColor: "#f9fafb" },
    accountGrid: { display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "1rem" },
    accountLabel: { fontSize: "0.75rem", lineHeight: "1rem", textTransform: "uppercase", fontWeight: 700, margin: "0 0 0.25rem", color: "#6b7280" },
    accountValue: { fontSize: "1.125rem", lineHeight: "1.75rem", fontWeight: 700, margin: 0 },
    signoff: { border: "1px solid #d1d5db", marginBottom: "1rem" },
    signoffRow: { display: "flex", fontSize: "0.875rem", lineHeight: "1.25rem" },
    signoffCell: { width: "50%", textAlign: "center", padding: "0.75rem" },
    footer: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", fontSize: "0.75rem", lineHeight: "1rem", color: "#6b7280" },
};

const formatNumber = (value) => Number(value || 0).toLocaleString();

export default function OrderDetailsPdfTemplate({ order = {}, payments = [], labels = {}, showCustomerKPI = false, qarzaSummary = null }) {
    const totalPaid = Number(order?.paid ?? 0);
    const remainingAmount = Number(order?.remainingAmount ?? 0);
    const date = order?.createdAt ? new Date(order.createdAt).toLocaleDateString() : "-";
    const customerName = order?.customerData?.name || order?.customerName || "Walk-in Customer";
    const cashIn = Number(qarzaSummary?.cashIn ?? 0);
    const cashOut = Number(qarzaSummary?.cashOut ?? 0);
    const overall = Number(qarzaSummary?.overall ?? cashIn - cashOut);
    const toGive = Math.max(overall, 0);
    const toReceive = Math.max(-overall, 0);
    const items = order?.items || [];
    const totalQty = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    const totalItemDiscount = items.reduce((sum, item) => sum + Number(item.discountAmount || 0), 0);
    const totalItemTax = items.reduce((sum, item) => sum + Number(item.taxAmount || 0) * Number(item.quantity || 0), 0);
    const formatPercent = (value) => `${value || 0}%`;

    return (
        <div style={styles.page}>
            <div style={styles.header}>
                <div style={styles.logo}><span style={styles.logoMain}>LOGIN</span><span style={styles.logoSub}>LARAIB</span></div>
            </div>
            <h2 style={styles.title}>Afrasiab Mobile Accesories</h2>

            <div style={styles.metaRow}>
                <div>
                    <p style={styles.label}>Customer:</p>
                    <p style={styles.customer}>{customerName}</p>
                    {order?.customerData?.phoneNo && <p style={styles.mutedText}>Phone: {order.customerData.phoneNo}</p>}
                    {order?.customerData?.address && <p style={styles.mutedText}>Address: {order.customerData.address}</p>}
                </div>
                <div style={styles.metaBox}><div style={styles.borderedRow}><span style={{ fontWeight: 600 }}>Order #: {order?.orderNumber || "-"}</span><span style={{ fontWeight: 600 }}>Date: {date}</span></div></div>
            </div>

            <table style={styles.table}><thead><tr style={{ backgroundColor: "#111827", color: "#ffffff" }}>
                <th style={styles.headerCell}>#</th><th style={styles.headerCell}>Item &amp; Description</th><th style={styles.rightHeaderCell}>Qty</th><th style={styles.rightHeaderCell}>Unit Price</th><th style={styles.rightHeaderCell}>Disc</th><th style={styles.rightHeaderCell}>Tax</th><th style={styles.rightHeaderCell}>Total</th>
            </tr></thead><tbody>
                {items.map((item, index) => {
                    const quantity = Number(item.quantity || 0);
                    const lineTotal = Number(item.unitPrice || 0) * quantity;
                    const itemTax = Number(item.taxAmount || 0) * quantity;
                    const itemDiscount = Number(item.discountAmount || 0);
                    const finalTotal = lineTotal - itemDiscount + itemTax;
                    return <tr key={index} style={{ borderBottom: "1px solid #e5e7eb" }}>
                        <td style={styles.cell}>{index + 1}</td><td style={styles.cell}>{item.name || "-"}{item.portionType && <span style={{ fontSize: "0.75rem", color: "#6b7280" }}> ({item.portionType})</span>}</td><td style={styles.rightCell}>{quantity}</td><td style={styles.rightCell}>{formatNumber(item.unitPrice)}</td>
                        <td style={{ ...styles.rightCell, color: "#dc2626" }}>{formatPercent(item.discountPercent)}<span style={styles.smallMuted}>-{formatNumber(itemDiscount)}</span></td><td style={{ ...styles.rightCell, color: "#15803d" }}>{formatPercent(item.taxPercent)}<span style={styles.smallMuted}>+{formatNumber(itemTax)}</span></td><td style={{ ...styles.rightCell, fontWeight: 600 }}>{formatNumber(finalTotal)}</td>
                    </tr>;
                })}
                <tr style={{ backgroundColor: "#f3f4f6", fontWeight: 700 }}><td style={styles.cell} colSpan={2}>Sub Total</td><td style={styles.rightCell}>{totalQty}</td><td style={styles.cell}></td><td style={styles.rightCell}>{formatNumber(totalItemDiscount)}</td><td style={styles.rightCell}>{formatNumber(totalItemTax)}</td><td style={styles.rightCell}>{formatNumber(order?.subtotal)}</td></tr>
            </tbody></table>

            <div style={styles.summaryRow}>
                <div style={styles.summaryBox}><p style={styles.summaryHeading}>Payment Summary:</p><div style={styles.summaryLine}><span>Total Amount</span><span>{formatNumber(order?.totalAmount)}</span></div><div style={styles.summaryLine}><span>Total Paid</span><span>{formatNumber(totalPaid)}</span></div><div style={styles.totalLine}><span>Remaining Balance</span><span>{formatNumber(remainingAmount)}</span></div></div>
                <div style={styles.totalsBox}><div style={styles.totalsLine}><span>Subtotal</span><span>{formatNumber(order?.subtotal)}</span></div><div style={{ ...styles.totalsLine, color: "#dc2626" }}><span>Discount</span><span>-{formatNumber(order?.discountAmount)}</span></div><div style={{ ...styles.totalsLine, color: "#15803d" }}><span>Tax</span><span>+{formatNumber(order?.totalTaxAmount)}</span></div><div style={{ ...styles.totalsLine, borderBottom: 0, fontWeight: 700 }}><span>Total Amount</span><span>{formatNumber(order?.totalAmount)}</span></div></div>
            </div>

            {payments.length > 0 && <div style={styles.section}><h3 style={styles.sectionHeading}>Payment Transactions</h3><table style={{ ...styles.table, marginBottom: 0 }}><thead><tr style={{ backgroundColor: "#f3f4f6" }}>
                <th style={{ ...styles.headerCell, borderBottom: "1px solid #d1d5db" }}>Date</th><th style={{ ...styles.headerCell, borderBottom: "1px solid #d1d5db" }}>Method</th><th style={{ ...styles.rightHeaderCell, borderBottom: "1px solid #d1d5db" }}>Amount</th><th style={{ ...styles.rightHeaderCell, borderBottom: "1px solid #d1d5db" }}>Cash</th><th style={{ ...styles.rightHeaderCell, borderBottom: "1px solid #d1d5db" }}>Credit</th>
            </tr></thead><tbody>{payments.map((payment, index) => <tr key={index} style={{ borderBottom: "1px solid #e5e7eb" }}><td style={styles.cell}>{new Date(payment.transactionDate || payment.paymentDate || payment.date).toLocaleDateString()}</td><td style={{ ...styles.cell, textTransform: "capitalize" }}>{payment.method === "credit" ? `Credit (${payment.creditAccount?.name || "Account"})` : payment.method || "-"}</td><td style={{ ...styles.rightCell, fontWeight: 600 }}>{formatNumber(payment.amount)}</td><td style={styles.rightCell}>{formatNumber(payment.cashAmount)}</td><td style={styles.rightCell}>{formatNumber(payment.creditAmount)}</td></tr>)}</tbody></table></div>}

            {showCustomerKPI && qarzaSummary && <div style={styles.accountBox}><h3 style={styles.sectionHeading}>Customer Account Summary</h3><div style={styles.accountGrid}><div><p style={styles.accountLabel}>Cash In</p><p style={{ ...styles.accountValue, color: "#16a34a" }}>Rs {formatNumber(cashIn)}</p></div><div><p style={styles.accountLabel}>Cash Out</p><p style={{ ...styles.accountValue, color: "#dc2626" }}>Rs {formatNumber(cashOut)}</p></div><div><p style={styles.accountLabel}>To Give</p><p style={{ ...styles.accountValue, color: "#f59e0b" }}>Rs {formatNumber(toGive)}</p></div><div><p style={styles.accountLabel}>To Receive</p><p style={{ ...styles.accountValue, color: "#8b5cf6" }}>Rs {formatNumber(toReceive)}</p></div></div><div style={{ ...styles.totalLine, marginTop: "1rem", paddingTop: "0.75rem" }}><span>Overall Balance</span><span style={{ color: overall >= 0 ? "#f59e0b" : "#8b5cf6" }}>Rs {formatNumber(Math.abs(overall))}</span></div></div>}

            <div style={styles.signoff}><div style={styles.signoffRow}><div style={{ ...styles.signoffCell, borderRight: "1px solid #d1d5db" }}><p style={{ margin: 0 }}>Prepared By</p></div><div style={styles.signoffCell}><p style={{ margin: 0 }}>Approved By</p></div></div></div>
            <div style={styles.footer}><p style={{ fontStyle: "italic", maxWidth: "70%", margin: 0 }}>{labels.footerNote || "This is a computer generated document, does not required any signature"}</p><p style={{ margin: 0 }}>Print Time: {new Date().toLocaleString()}</p></div>
        </div>
    );
}
