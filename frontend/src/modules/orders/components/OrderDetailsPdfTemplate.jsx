import React from "react";

const styles = {
    page: { padding: "2.5rem", backgroundColor: "#ffffff", minHeight: "100vh", color: "#18181b", fontFamily: "Arial, sans-serif" },
    header: { textAlign: "center", marginBottom: "1.5rem" },
    logo: { display: "inline-flex", flexDirection: "column", alignItems: "center", lineHeight: 1, marginBottom: "0.5rem" },
    logoMain: { fontSize: "1.875rem", lineHeight: "2.25rem", fontWeight: 800, letterSpacing: "2px", color: "#18181b" },
    logoSub: { fontSize: "0.75rem", lineHeight: "1rem", fontWeight: 600, letterSpacing: "0.3em", color: "#71717a", marginTop: "0.25rem" },
    title: { fontSize: "1.5rem", lineHeight: "2rem", fontWeight: 700, textAlign: "center", color: "#18181b", margin: "0 0 1.5rem" },
    metaRow: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", gap: "1.5rem" },
    label: { fontSize: "0.75rem", lineHeight: "1rem", fontWeight: 600, color: "#71717a", margin: "0 0 0.25rem" },
    customer: { fontSize: "0.875rem", lineHeight: "1.25rem", fontWeight: 700, textTransform: "uppercase", color: "#18181b", margin: 0 },
    mutedText: { fontSize: "0.75rem", lineHeight: "1rem", color: "#52525b", margin: "0.25rem 0 0" },
    metaBox: { display: "flex", flexDirection: "column", gap: "0.5rem", minWidth: "240px" },
    borderedRow: { border: "1px solid #d4d4d8", padding: "0.5rem 0.75rem", display: "flex", justifyContent: "space-between", fontSize: "0.875rem", lineHeight: "1.25rem" },
    table: { width: "100%", borderCollapse: "collapse", marginBottom: "1rem", fontSize: "0.875rem", lineHeight: "1.25rem", border: "1px solid #d4d4d8" },
    headerCell: { padding: "0.5rem 0.75rem", fontWeight: 600, textAlign: "left", backgroundColor: "#27272a", color: "#ffffff", border: "1px solid #3f3f46" },
    rightHeaderCell: { padding: "0.5rem 0.75rem", fontWeight: 600, textAlign: "right", backgroundColor: "#27272a", color: "#ffffff", border: "1px solid #3f3f46" },
    cell: { padding: "0.5rem 0.75rem", border: "1px solid #e4e4e7" },
    rightCell: { padding: "0.5rem 0.75rem", textAlign: "right", border: "1px solid #e4e4e7" },
    smallMuted: { display: "block", fontSize: "10px", lineHeight: 1, color: "#a1a1aa" },
    summaryRow: { display: "flex", justifyContent: "space-between", gap: "1.5rem", marginBottom: "1.5rem" },
    summaryBox: { border: "1px solid #d4d4d8", padding: "0.75rem", fontSize: "0.875rem", lineHeight: "1.25rem", minWidth: "260px" },
    summaryHeading: { fontWeight: 600, margin: "0 0 0.5rem" },
    summaryLine: { display: "flex", justifyContent: "space-between", padding: "0.25rem 0" },
    totalLine: { display: "flex", justifyContent: "space-between", padding: "0.25rem 0", fontWeight: 700, borderTop: "1px solid #d4d4d8", marginTop: "0.25rem", paddingTop: "0.25rem" },
    totalsBox: { border: "1px solid #d4d4d8", minWidth: "280px", fontSize: "0.875rem", lineHeight: "1.25rem" },
    totalsLine: { display: "flex", justifyContent: "space-between", padding: "0.5rem 0.75rem", borderBottom: "1px solid #e4e4e7" },
    section: { marginBottom: "1.5rem" },
    sectionHeading: { fontSize: "1.125rem", lineHeight: "1.75rem", fontWeight: 600, margin: "0 0 0.75rem", color: "#18181b" },
    accountBox: { border: "1px solid #d4d4d8", padding: "1rem", marginBottom: "1.5rem", backgroundColor: "#fafafa" },
    accountGrid: { display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: "1rem" },
    accountLabel: { fontSize: "0.75rem", lineHeight: "1rem", textTransform: "uppercase", fontWeight: 700, margin: "0 0 0.25rem", color: "#71717a" },
    accountValue: { fontSize: "1.125rem", lineHeight: "1.75rem", fontWeight: 700, margin: 0 },
    signoff: { border: "1px solid #d4d4d8", marginBottom: "1rem" },
    signoffRow: { display: "flex", fontSize: "0.875rem", lineHeight: "1.25rem" },
    signoffCell: { width: "50%", textAlign: "center", padding: "0.75rem" },
    footer: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", fontSize: "0.75rem", lineHeight: "1rem", color: "#71717a" },
    tableFooter: { backgroundColor: "#27272a", color: "#ffffff", fontWeight: 700 },
    tableFooterCell: { padding: "0.75rem 0.75rem", border: "1px solid #3f3f46" },
    tableFooterCellRight: { padding: "0.75rem 0.75rem", border: "1px solid #3f3f46", textAlign: "right" },
};

const formatNumber = (value) => Number(value || 0).toLocaleString();

export default function OrderDetailsPdfTemplate({ order = {}, payments = [], labels = {}, showCustomerKPI = false, qarzaSummary = null }) {
    const date = order?.createdAt ? new Date(order.createdAt).toLocaleDateString() : "-";
    const customerName = order?.customerData?.name || order?.customerName || "Walk-in Customer";
    const cashIn = Number(qarzaSummary?.cashIn ?? 0);
    const cashOut = Number(qarzaSummary?.cashOut ?? 0);
    const overall = Number(qarzaSummary?.overall ?? cashIn - cashOut);
    const toGive = Math.max(overall, 0);
    const toReceive = Math.max(-overall, 0);
    const items = order?.items || [];
    const totalQty = items.reduce((sum, item) => sum + (item.quantity || 0), 0);
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

            <table style={styles.table}>
                <thead>
                    <tr>
                        <th style={styles.headerCell}>#</th>
                        <th style={styles.headerCell}>Product Name</th>
                        <th style={styles.headerCell}>Batch No</th>
                        <th style={styles.rightHeaderCell}>Unit Price</th>
                        <th style={styles.rightHeaderCell}>Item Discount</th>
                        <th style={styles.rightHeaderCell}>Item Tax</th>
                        <th style={styles.rightHeaderCell}>Overall Discount Share</th>
                        <th style={styles.rightHeaderCell}>Sold Value Per Unit</th>
                        <th style={styles.rightHeaderCell}>Quantity</th>
                        <th style={styles.rightHeaderCell}>Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, index) => {
                        const quantity = Number(item.quantity || 0);
                        const lineTotal = Number(item.unitPrice || 0) * quantity;
                        const itemTax = Number(item.taxAmount || 0);
                        const itemDiscount = Number(item.discountAmount || 0);
                        const finalTotal = lineTotal - itemDiscount + itemTax;
                        const soldValuePerUnit = item.soldValue ? (item.soldValue / quantity) : Number(item.unitPrice || 0);
                        
                        // Use the stored proportional discount share from the item (not equal split)
                        const overallDiscountAmount = Number(order?.discountAmount || 0);
                        const overallDiscountShare = Number(item.orderDiscountShare || 0);

                        return <tr key={index}>
                            <td style={styles.cell}>{index + 1}</td>
                            <td style={styles.cell}>{item.name || "-"}{item.portionType && <span style={{ fontSize: "0.75rem", color: "#71717a" }}> ({item.portionType})</span>}</td>
                            <td style={styles.cell}>{item.batchNumber || "-"}</td>
                            <td style={styles.rightCell}>{formatNumber(item.unitPrice)}</td>
                            <td style={{ ...styles.rightCell, color: "#dc2626" }}>{item.discountType === "fixed" ? formatNumber(item.discountPercent) : formatPercent(item.discountPercent)}<span style={styles.smallMuted}>-{formatNumber(itemDiscount)}</span></td>
                            <td style={{ ...styles.rightCell, color: "#15803d" }}>{item.taxType === "fixed" ? formatNumber(item.taxPercent) : formatPercent(item.taxPercent)}<span style={styles.smallMuted}>+{formatNumber(itemTax)}</span></td>
                            <td style={{ ...styles.rightCell, color: "#f59e0b" }}>{overallDiscountAmount > 0 ? <span>-{formatNumber(overallDiscountShare)}</span> : "-"}</td>
                            <td style={{ ...styles.rightCell, fontWeight: 600 }}>{formatNumber(soldValuePerUnit)}</td>
                            <td style={styles.rightCell}>{quantity}</td>
                            <td style={{ ...styles.rightCell, fontWeight: 600 }}>{formatNumber(finalTotal)}</td>
                        </tr>;
                    })}
                </tbody>
                <tfoot>
                    <tr style={styles.tableFooter}>
                        <td colSpan="8" style={styles.tableFooterCell}>Grand Total</td>
                        <td style={styles.tableFooterCellRight}>{totalQty}</td>
                        <td style={styles.tableFooterCellRight}>Rs {formatNumber(order?.totalAmount)}</td>
                    </tr>
                </tfoot>
            </table>

            {payments.length > 0 && <div style={styles.section}><h3 style={styles.sectionHeading}>Payment Transactions</h3><table style={{ ...styles.table, marginBottom: 0 }}><thead><tr>
                <th style={styles.headerCell}>Date</th><th style={styles.headerCell}>Method</th><th style={styles.rightHeaderCell}>Amount</th><th style={styles.rightHeaderCell}>Cash</th><th style={styles.rightHeaderCell}>Credit</th>
            </tr></thead><tbody>{payments.map((payment, index) => <tr key={index}><td style={styles.cell}>{new Date(payment.transactionDate || payment.paymentDate || payment.date).toLocaleDateString()}</td><td style={{ ...styles.cell, textTransform: "capitalize" }}>{payment.method === "credit" ? `Credit (${payment.creditAccount?.name || "Account"})` : payment.method || "-"}</td><td style={{ ...styles.rightCell, fontWeight: 600 }}>{formatNumber(payment.amount)}</td><td style={styles.rightCell}>{formatNumber(payment.cashAmount)}</td><td style={styles.rightCell}>{formatNumber(payment.creditAmount)}</td></tr>)}</tbody></table></div>}

            {showCustomerKPI && qarzaSummary && <div style={styles.accountBox}><h3 style={styles.sectionHeading}>Customer Account Summary</h3><div style={styles.accountGrid}><div><p style={styles.accountLabel}>Cash In</p><p style={{ ...styles.accountValue, color: "#16a34a" }}>Rs {formatNumber(cashIn)}</p></div><div><p style={styles.accountLabel}>Cash Out</p><p style={{ ...styles.accountValue, color: "#dc2626" }}>Rs {formatNumber(cashOut)}</p></div><div><p style={styles.accountLabel}>To Give</p><p style={{ ...styles.accountValue, color: "#f59e0b" }}>Rs {formatNumber(toGive)}</p></div><div><p style={styles.accountLabel}>To Receive</p><p style={{ ...styles.accountValue, color: "#8b5cf6" }}>Rs {formatNumber(toReceive)}</p></div></div><div style={{ ...styles.totalLine, marginTop: "1rem", paddingTop: "0.75rem" }}><span>Overall Balance</span><span style={{ color: overall >= 0 ? "#f59e0b" : "#8b5cf6" }}>Rs {formatNumber(Math.abs(overall))}</span></div></div>}

            <div style={styles.signoff}><div style={styles.signoffRow}><div style={{ ...styles.signoffCell, borderRight: "1px solid #d4d4d8" }}><p style={{ margin: 0 }}>Prepared By</p></div><div style={styles.signoffCell}><p style={{ margin: 0 }}>Approved By</p></div></div></div>
            <div style={styles.footer}><p style={{ fontStyle: "italic", maxWidth: "70%", margin: 0 }}>{labels.footerNote || "This is a computer generated document, does not required any signature"}</p><p style={{ margin: 0 }}>Print Time: {new Date().toLocaleString()}</p></div>
        </div>
    );
}
