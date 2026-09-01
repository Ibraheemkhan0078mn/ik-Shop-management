// src/reports/components/MainBusinessReport.jsx
import React, { useState, useMemo } from "react";
import { RefreshCw, ChevronDown, ChevronUp, DollarSign, ShoppingCart, Package, Receipt, Users, AlertCircle, Wallet, Filter, HandCoins, Calendar, TrendingUp, TrendingDown } from "lucide-react";
import { useGetMainBusinessReportKPIQuery, useGetMainBusinessReportDataQuery } from "../services/reports.service.js";
import { showError } from "../../../shared/utilities/toastHelpers.js";
import PdfModal from "../../../shared/components/PdfModal.jsx";
import MainBusinessReportPdfTemplate from "../components/MainBusinessReportPdfTemplate.jsx";
import { useSettings } from "../../settings/hooks/useSettings.js";
import { getReportsLabels } from "../labels/reportsLabels.js";

// ---------- Breakdown row ----------
function BreakdownItem({ label, value, count, percentage, color }) {
    return (
        <div className="flex items-center justify-between py-2.5 border-b last:border-b-0" style={{ borderColor: 'var(--border)' }}>
            <div className="flex-1 min-w-0 flex items-center gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
                <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--ink)' }}>{label}</p>
                    <p className="text-xs" style={{ color: 'var(--muted)' }}>{count} transactions</p>
                </div>
            </div>
            <div className="text-right shrink-0 pl-3">
                <p className="text-sm font-bold tabular-nums" style={{ color: 'var(--ink)' }}>Rs {value?.toLocaleString() || 0}</p>
                <p className="text-xs" style={{ color }}>{percentage}%</p>
            </div>
        </div>
    );
}

// ---------- Transaction table renderer ----------
function renderTransactionRow(transaction, type, formatDate, onExpandOrder) {
    switch (type) {
        case 'sales':
            return (
                <>
                    <td className="px-4 py-2.5 text-sm" style={{ color: 'var(--ink)' }}>
                        <button 
                            onClick={() => onExpandOrder && onExpandOrder(transaction)}
                            className="text-left hover:underline flex items-center gap-1"
                        >
                            {transaction.orderNumber}
                            <ChevronDown size={14} style={{ color: 'var(--muted)' }} />
                        </button>
                    </td>
                    <td className="px-4 py-2.5 text-sm" style={{ color: 'var(--ink)' }}>{transaction.customerName || 'Walk-in'}</td>
                    <td className="px-4 py-2.5 text-sm capitalize" style={{ color: 'var(--muted)' }}>{transaction.paymentMethod}</td>
                    <td className="px-4 py-2.5 text-sm text-right tabular-nums" style={{ color: 'var(--muted)' }}>Rs {transaction.totalCostPrice?.toLocaleString() || 0}</td>
                    <td className="px-4 py-2.5 text-sm text-right tabular-nums" style={{ color: 'var(--ink)' }}>Rs {transaction.totalSalePrice?.toLocaleString() || 0}</td>
                    <td className="px-4 py-2.5 text-sm font-semibold text-right tabular-nums" style={{ color: 'var(--accent-2)' }}>Rs {transaction.amount?.toLocaleString() || 0}</td>
                    <td className="px-4 py-2.5 text-sm font-semibold text-right tabular-nums" style={{ color: transaction.orderProfit >= 0 ? '#10b981' : '#dc2626' }}>
                        Rs {transaction.orderProfit?.toLocaleString() || 0}
                        <div className="text-xs mt-0.5">({transaction.orderMargin}%)</div>
                    </td>
                    <td className="px-4 py-2.5 text-sm text-right" style={{ color: 'var(--muted)' }}>{formatDate(transaction.date)}</td>
                </>
            );
        case 'purchases':
            return (
                <>
                    <td className="px-4 py-2.5 text-sm" style={{ color: 'var(--ink)' }}>
                        <button 
                            onClick={() => onExpandOrder && onExpandOrder(transaction)}
                            className="text-left hover:underline flex items-center gap-1"
                        >
                            {transaction.invoiceNumber || 'N/A'}
                            <ChevronDown size={14} style={{ color: 'var(--muted)' }} />
                        </button>
                    </td>
                    <td className="px-4 py-2.5 text-sm" style={{ color: 'var(--ink)' }}>{transaction.supplierName || 'Unknown'}</td>
                    <td className="px-4 py-2.5 text-sm text-right tabular-nums" style={{ color: 'var(--muted)' }}>Rs {transaction.subtotal?.toLocaleString() || 0}</td>
                    <td className="px-4 py-2.5 text-sm text-right tabular-nums" style={{ color: '#f59e0b' }}>Rs {transaction.totalItemsDiscount?.toLocaleString() || 0}</td>
                    <td className="px-4 py-2.5 text-sm text-right tabular-nums" style={{ color: '#8b5cf6' }}>Rs {transaction.totalItemsTax?.toLocaleString() || 0}</td>
                    <td className="px-4 py-2.5 text-sm font-semibold text-right tabular-nums" style={{ color: 'var(--accent-2)' }}>Rs {transaction.amount?.toLocaleString() || 0}</td>
                    <td className="px-4 py-2.5 text-sm capitalize text-right" style={{ 
                        color: transaction.status === 'delivered' ? '#10b981' : transaction.status === 'rejected' ? '#dc2626' : 'var(--muted)' 
                    }}>
                        {transaction.status || 'ordered'}
                    </td>
                    <td className="px-4 py-2.5 text-sm text-right" style={{ color: 'var(--muted)' }}>{formatDate(transaction.date)}</td>
                </>
            );
        case 'expenses':
            return (
                <>
                    <td className="px-4 py-2.5 text-sm" style={{ color: 'var(--ink)' }}>{transaction.title}</td>
                    <td className="px-4 py-2.5 text-sm capitalize" style={{ color: 'var(--muted)' }}>{transaction.category}</td>
                    <td className="px-4 py-2.5 text-sm" style={{ color: 'var(--muted)' }}>{transaction.description || '-'}</td>
                    <td className="px-4 py-2.5 text-sm font-semibold text-right tabular-nums" style={{ color: 'var(--accent-2)' }}>Rs {transaction.amount?.toLocaleString() || 0}</td>
                    <td className="px-4 py-2.5 text-sm text-right" style={{ color: 'var(--muted)' }}>{formatDate(transaction.date)}</td>
                </>
            );
        case 'wastages':
            return (
                <>
                    <td className="px-4 py-2.5 text-sm" style={{ color: 'var(--ink)' }}>{transaction.productName}</td>
                    <td className="px-4 py-2.5 text-sm text-right tabular-nums" style={{ color: 'var(--muted)' }}>{transaction.quantity}</td>
                    <td className="px-4 py-2.5 text-sm text-right tabular-nums" style={{ color: 'var(--muted)' }}>Rs {transaction.costPrice?.toLocaleString() || 0}</td>
                    <td className="px-4 py-2.5 text-sm font-semibold text-right tabular-nums" style={{ color: 'var(--accent-2)' }}>Rs {transaction.totalLoss?.toLocaleString() || 0}</td>
                    <td className="px-4 py-2.5 text-sm text-right" style={{ color: 'var(--muted)' }}>{formatDate(transaction.date)}</td>
                </>
            );
        case 'purchaseReturns':
            return (
                <>
                    <td className="px-4 py-2.5 text-sm" style={{ color: 'var(--ink)' }}>{transaction.returnNumber}</td>
                    <td className="px-4 py-2.5 text-sm" style={{ color: 'var(--ink)' }}>{transaction.supplierName || 'N/A'}</td>
                    <td className="px-4 py-2.5 text-sm font-semibold text-right tabular-nums" style={{ color: 'var(--accent-2)' }}>Rs {transaction.amount?.toLocaleString() || 0}</td>
                    <td className="px-4 py-2.5 text-sm text-right" style={{ color: 'var(--muted)' }}>{formatDate(transaction.date)}</td>
                </>
            );
        case 'productReturns':
            return (
                <>
                    <td className="px-4 py-2.5 text-sm" style={{ color: 'var(--ink)' }}>{transaction.returnNumber}</td>
                    <td className="px-4 py-2.5 text-sm" style={{ color: 'var(--ink)' }}>{transaction.customerName || 'N/A'}</td>
                    <td className="px-4 py-2.5 text-sm font-semibold text-right tabular-nums" style={{ color: 'var(--accent-2)' }}>Rs {transaction.amount?.toLocaleString() || 0}</td>
                    <td className="px-4 py-2.5 text-sm text-right" style={{ color: 'var(--muted)' }}>{formatDate(transaction.date)}</td>
                </>
            );
        case 'salaryPayments':
            return (
                <>
                    <td className="px-4 py-2.5 text-sm" style={{ color: 'var(--ink)' }}>{transaction.staffName}</td>
                    <td className="px-4 py-2.5 text-sm font-semibold text-right tabular-nums" style={{ color: 'var(--accent-2)' }}>Rs {transaction.amount?.toLocaleString() || 0}</td>
                    <td className="px-4 py-2.5 text-sm text-right" style={{ color: 'var(--muted)' }}>{formatDate(transaction.date)}</td>
                </>
            );
        default:
            return null;
    }
}

function getTableHeaders(type, labels) {
    switch (type) {
        case 'sales': return [labels.orderNumber, labels.customer, labels.paymentMethod, 'Total Cost', 'Total Sale', labels.amount, 'Profit (Margin)', labels.date];
        case 'purchases': return [labels.invoiceNumber, labels.supplier, 'Subtotal', 'Discount', 'Tax', labels.amount, 'Status', labels.date];
        case 'expenses': return [labels.title, labels.category, labels.description, labels.amount, labels.date];
        case 'wastages': return [labels.product, labels.quantity, labels.costPrice, labels.totalLoss, labels.date];
        case 'purchaseReturns': return [labels.returnNumber, labels.supplier, labels.amount, labels.date];
        case 'productReturns': return [labels.returnNumber, labels.customer, labels.amount, labels.date];
        case 'salaryPayments': return [labels.staffName, labels.amount, labels.date];
        default: return [];
    }
}

function TransactionTable({ transactions, type, labels }) {
    const [expandedOrderId, setExpandedOrderId] = React.useState(null);

    if (!transactions || transactions.length === 0) {
        return <p className="text-sm py-6 text-center" style={{ color: 'var(--muted)' }}>{labels.noTransactionsInPeriod}</p>;
    }

    // Helper function for better date formatting
    const formatDate = (dateStr) => {
        try {
            return new Date(dateStr).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch (error) {
            return 'Invalid Date';
        }
    };

    const handleExpandOrder = (transaction) => {
        if (type === 'sales' && transaction.items && transaction.items.length > 0) {
            setExpandedOrderId(expandedOrderId === transaction.id ? null : transaction.id);
        }
    };

    const displayTransactions = transactions.slice(0, MAX_TRANSACTIONS_DISPLAY);

    return (
        <div className="rounded-lg border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
            <div className="overflow-x-auto">
                <table className="w-full" role="table" aria-label={`${type} transactions`}>
                    <thead style={{ background: 'var(--surface-muted)' }}>
                        <tr>
                            {getTableHeaders(type, labels).map((header, idx) => (
                                <th key={idx} className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                        {displayTransactions.map((transaction, idx) => (
                            <React.Fragment key={idx}>
                                <tr className="transition-colors" style={{ background: 'transparent' }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-muted)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                    {renderTransactionRow(transaction, type, formatDate, handleExpandOrder)}
                                </tr>
                                {/* Expanded order details row */}
                                {type === 'sales' && expandedOrderId === transaction.id && transaction.items && (
                                    <tr style={{ background: 'var(--surface-muted)' }}>
                                        <td colSpan={getTableHeaders(type, labels).length} className="px-4 py-4">
                                            <div className="space-y-3">
                                                {/* Order Summary */}
                                                <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
                                                    <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Order Details</p>
                                                    <div className="flex gap-4 text-xs" style={{ color: 'var(--muted)' }}>
                                                        <span>Type: <strong style={{ color: 'var(--ink)' }}>{transaction.orderType}</strong></span>
                                                        <span>Status: <strong style={{ color: 'var(--ink)' }}>{transaction.status}</strong></span>
                                                        {transaction.waiter && <span>Waiter: <strong style={{ color: 'var(--ink)' }}>{transaction.waiter}</strong></span>}
                                                    </div>
                                                </div>
                                                
                                                {/* Items Table */}
                                                <div className="rounded border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
                                                    <table className="w-full text-sm">
                                                        <thead style={{ background: 'var(--app-bg)' }}>
                                                            <tr>
                                                                <th className="px-3 py-2 text-left text-xs font-semibold" style={{ color: 'var(--muted)' }}>Product</th>
                                                                <th className="px-3 py-2 text-left text-xs font-semibold" style={{ color: 'var(--muted)' }}>Batch</th>
                                                                <th className="px-3 py-2 text-right text-xs font-semibold" style={{ color: 'var(--muted)' }}>Qty</th>
                                                                <th className="px-3 py-2 text-right text-xs font-semibold" style={{ color: 'var(--muted)' }}>Cost/Unit</th>
                                                                <th className="px-3 py-2 text-right text-xs font-semibold" style={{ color: 'var(--muted)' }}>Sale/Unit</th>
                                                                <th className="px-3 py-2 text-right text-xs font-semibold" style={{ color: 'var(--muted)' }}>Discount</th>
                                                                <th className="px-3 py-2 text-right text-xs font-semibold" style={{ color: 'var(--muted)' }}>Tax</th>
                                                                <th className="px-3 py-2 text-right text-xs font-semibold" style={{ color: 'var(--muted)' }}>Item Total</th>
                                                                <th className="px-3 py-2 text-right text-xs font-semibold" style={{ color: 'var(--muted)' }}>Profit</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                                                            {transaction.items.map((item, itemIdx) => (
                                                                <tr key={itemIdx}>
                                                                    <td className="px-3 py-2" style={{ color: 'var(--ink)' }}>
                                                                        <div>{item.productName}</div>
                                                                        {item.portionType !== 'full' && (
                                                                            <div className="text-xs capitalize" style={{ color: 'var(--muted)' }}>({item.portionType})</div>
                                                                        )}
                                                                    </td>
                                                                    <td className="px-3 py-2 text-xs" style={{ color: 'var(--muted)' }}>{item.batchNumber || 'N/A'}</td>
                                                                    <td className="px-3 py-2 text-right tabular-nums" style={{ color: 'var(--ink)' }}>{item.quantity}</td>
                                                                    <td className="px-3 py-2 text-right tabular-nums" style={{ color: 'var(--muted)' }}>
                                                                        Rs {item.costPrice?.toLocaleString() || 0}
                                                                        <div className="text-xs mt-0.5" style={{ color: '#10b981' }}>
                                                                            (Total: {item.itemCostTotal?.toLocaleString()})
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-3 py-2 text-right tabular-nums" style={{ color: 'var(--ink)' }}>
                                                                        Rs {item.unitPrice?.toLocaleString() || 0}
                                                                        <div className="text-xs mt-0.5" style={{ color: 'var(--accent-2)' }}>
                                                                            (Total: {item.itemSaleTotal?.toLocaleString()})
                                                                        </div>
                                                                    </td>
                                                                    <td className="px-3 py-2 text-right tabular-nums text-xs" style={{ color: '#f59e0b' }}>
                                                                        {item.discountAmount > 0 ? (
                                                                            <>
                                                                                <div>Rs {item.discountAmount.toLocaleString()}</div>
                                                                                <div className="mt-0.5">({item.discountPercent}%)</div>
                                                                            </>
                                                                        ) : '-'}
                                                                    </td>
                                                                    <td className="px-3 py-2 text-right tabular-nums text-xs" style={{ color: '#8b5cf6' }}>
                                                                        {item.taxAmount > 0 ? (
                                                                            <>
                                                                                <div>Rs {item.taxAmount.toLocaleString()}</div>
                                                                                <div className="mt-0.5">({item.taxPercent}%)</div>
                                                                            </>
                                                                        ) : '-'}
                                                                    </td>
                                                                    <td className="px-3 py-2 text-right tabular-nums font-semibold" style={{ color: 'var(--accent-2)' }}>
                                                                        Rs {item.itemTotal?.toLocaleString() || 0}
                                                                    </td>
                                                                    <td className="px-3 py-2 text-right tabular-nums font-semibold" style={{ color: item.itemProfit >= 0 ? '#10b981' : '#dc2626' }}>
                                                                        Rs {item.itemProfit?.toLocaleString() || 0}
                                                                        <div className="text-xs mt-0.5">({item.itemMargin}%)</div>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                        <tfoot style={{ background: 'var(--surface-muted)', borderTop: '2px solid var(--border)' }}>
                                                            <tr className="font-semibold">
                                                                <td colSpan="3" className="px-3 py-2 text-right" style={{ color: 'var(--ink)' }}>Order Totals:</td>
                                                                <td className="px-3 py-2 text-right tabular-nums" style={{ color: 'var(--muted)' }}>Rs {transaction.totalCostPrice?.toLocaleString() || 0}</td>
                                                                <td className="px-3 py-2 text-right tabular-nums" style={{ color: 'var(--ink)' }}>Rs {transaction.totalSalePrice?.toLocaleString() || 0}</td>
                                                                <td className="px-3 py-2 text-right tabular-nums" style={{ color: '#f59e0b' }}>Rs {transaction.totalItemDiscounts?.toLocaleString() || 0}</td>
                                                                <td className="px-3 py-2 text-right tabular-nums" style={{ color: '#8b5cf6' }}>Rs {transaction.totalItemTaxes?.toLocaleString() || 0}</td>
                                                                <td className="px-3 py-2 text-right tabular-nums" style={{ color: 'var(--accent-2)' }}>Rs {transaction.amount?.toLocaleString() || 0}</td>
                                                                <td className="px-3 py-2 text-right tabular-nums" style={{ color: transaction.orderProfit >= 0 ? '#10b981' : '#dc2626' }}>
                                                                    Rs {transaction.orderProfit?.toLocaleString() || 0}
                                                                    <div className="text-xs mt-0.5">({transaction.orderMargin}%)</div>
                                                                </td>
                                                            </tr>
                                                        </tfoot>
                                                    </table>
                                                </div>
                                                
                                                {/* Additional Info */}
                                                {transaction.note && (
                                                    <div className="mt-2 p-2 rounded" style={{ background: 'var(--app-bg)' }}>
                                                        <p className="text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>Note:</p>
                                                        <p className="text-sm" style={{ color: 'var(--ink)' }}>{transaction.note}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                
                                {/* Expanded purchase details row */}
                                {type === 'purchases' && expandedOrderId === transaction.id && transaction.items && (
                                    <tr style={{ background: 'var(--surface-muted)' }}>
                                        <td colSpan={getTableHeaders(type, labels).length} className="px-4 py-4">
                                            <div className="space-y-3">
                                                {/* Purchase Summary */}
                                                <div className="flex items-center justify-between pb-2 border-b" style={{ borderColor: 'var(--border)' }}>
                                                    <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Purchase Details</p>
                                                    <div className="flex gap-4 text-xs" style={{ color: 'var(--muted)' }}>
                                                        <span>Status: <strong style={{ color: transaction.status === 'delivered' ? '#10b981' : transaction.status === 'rejected' ? '#dc2626' : 'var(--ink)' }}>{transaction.status}</strong></span>
                                                        <span>Payment: <strong style={{ color: 'var(--ink)' }}>{transaction.paymentStatus}</strong></span>
                                                        {transaction.shippingCost > 0 && <span>Shipping: <strong style={{ color: 'var(--ink)' }}>Rs {transaction.shippingCost.toLocaleString()}</strong></span>}
                                                    </div>
                                                </div>
                                                
                                                {/* Items Table */}
                                                <div className="rounded border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
                                                    <table className="w-full text-sm">
                                                        <thead style={{ background: 'var(--app-bg)' }}>
                                                            <tr>
                                                                <th className="px-3 py-2 text-left text-xs font-semibold" style={{ color: 'var(--muted)' }}>Product</th>
                                                                <th className="px-3 py-2 text-left text-xs font-semibold" style={{ color: 'var(--muted)' }}>Batch</th>
                                                                <th className="px-3 py-2 text-right text-xs font-semibold" style={{ color: 'var(--muted)' }}>Qty</th>
                                                                <th className="px-3 py-2 text-right text-xs font-semibold" style={{ color: 'var(--muted)' }}>Price/Unit</th>
                                                                <th className="px-3 py-2 text-right text-xs font-semibold" style={{ color: 'var(--muted)' }}>Subtotal</th>
                                                                <th className="px-3 py-2 text-right text-xs font-semibold" style={{ color: 'var(--muted)' }}>Discount</th>
                                                                <th className="px-3 py-2 text-right text-xs font-semibold" style={{ color: 'var(--muted)' }}>Tax</th>
                                                                <th className="px-3 py-2 text-right text-xs font-semibold" style={{ color: 'var(--muted)' }}>Total</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                                                            {transaction.items.map((item, itemIdx) => (
                                                                <tr key={itemIdx}>
                                                                    <td className="px-3 py-2" style={{ color: 'var(--ink)' }}>
                                                                        <div>{item.productName}</div>
                                                                        <div className="text-xs" style={{ color: 'var(--muted)' }}>{item.category}</div>
                                                                    </td>
                                                                    <td className="px-3 py-2 text-xs" style={{ color: 'var(--muted)' }}>
                                                                        {item.batchNumber || 'N/A'}
                                                                        {item.expiryDate && (
                                                                            <div className="text-xs mt-0.5">Exp: {new Date(item.expiryDate).toLocaleDateString()}</div>
                                                                        )}
                                                                    </td>
                                                                    <td className="px-3 py-2 text-right tabular-nums" style={{ color: 'var(--ink)' }}>{item.quantity}</td>
                                                                    <td className="px-3 py-2 text-right tabular-nums" style={{ color: 'var(--ink)' }}>Rs {item.price?.toLocaleString() || 0}</td>
                                                                    <td className="px-3 py-2 text-right tabular-nums" style={{ color: 'var(--muted)' }}>Rs {item.itemSubtotal?.toLocaleString() || 0}</td>
                                                                    <td className="px-3 py-2 text-right tabular-nums text-xs" style={{ color: '#f59e0b' }}>
                                                                        {item.discountAmount > 0 ? (
                                                                            <>
                                                                                <div>Rs {item.discountAmount.toLocaleString()}</div>
                                                                                <div className="mt-0.5">({item.discount}{item.discountType === 'percentage' ? '%' : ''})</div>
                                                                            </>
                                                                        ) : '-'}
                                                                    </td>
                                                                    <td className="px-3 py-2 text-right tabular-nums text-xs" style={{ color: '#8b5cf6' }}>
                                                                        {item.taxAmount > 0 ? (
                                                                            <>
                                                                                <div>Rs {item.taxAmount.toLocaleString()}</div>
                                                                                <div className="mt-0.5">({item.tax}{item.taxType === 'percentage' ? '%' : ''})</div>
                                                                            </>
                                                                        ) : '-'}
                                                                    </td>
                                                                    <td className="px-3 py-2 text-right tabular-nums font-semibold" style={{ color: 'var(--accent-2)' }}>
                                                                        Rs {item.itemTotal?.toLocaleString() || 0}
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                        <tfoot style={{ background: 'var(--surface-muted)', borderTop: '2px solid var(--border)' }}>
                                                            <tr className="font-semibold">
                                                                <td colSpan="4" className="px-3 py-2 text-right" style={{ color: 'var(--ink)' }}>Purchase Totals:</td>
                                                                <td className="px-3 py-2 text-right tabular-nums" style={{ color: 'var(--muted)' }}>Rs {transaction.totalItemsSubtotal?.toLocaleString() || 0}</td>
                                                                <td className="px-3 py-2 text-right tabular-nums" style={{ color: '#f59e0b' }}>Rs {transaction.totalItemsDiscount?.toLocaleString() || 0}</td>
                                                                <td className="px-3 py-2 text-right tabular-nums" style={{ color: '#8b5cf6' }}>Rs {transaction.totalItemsTax?.toLocaleString() || 0}</td>
                                                                <td className="px-3 py-2 text-right tabular-nums" style={{ color: 'var(--accent-2)' }}>Rs {transaction.amount?.toLocaleString() || 0}</td>
                                                                </tr>
                                                        </tfoot>
                                                    </table>
                                                </div>
                                                
                                                {/* Additional Info */}
                                                {transaction.notes && (
                                                    <div className="mt-2 p-2 rounded" style={{ background: 'var(--app-bg)' }}>
                                                        <p className="text-xs font-semibold mb-1" style={{ color: 'var(--muted)' }}>Notes:</p>
                                                        <p className="text-sm" style={{ color: 'var(--ink)' }}>{transaction.notes}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
            {transactions.length > MAX_TRANSACTIONS_DISPLAY && (
                <div className="px-4 py-2.5 text-xs text-center border-t" style={{ color: 'var(--muted)', borderColor: 'var(--border)', background: 'var(--surface-muted)' }}>
                    {labels.showingFirst50 || 'Showing first'} {MAX_TRANSACTIONS_DISPLAY} {labels.of || 'of'} {transactions.length} {labels.transactions}
                </div>
            )}
        </div>
    );
}
// ---------- Mini metric chip ----------
function MetricChip({ label, value, isCurrency = true, showPercentage = false, color }) {
    if (value === undefined || value === null) return null;
    const displayValue = isCurrency
        ? `Rs ${Number(value).toLocaleString()}`
        : `${Number(value).toLocaleString()}${showPercentage ? '%' : ''}`;

    return (
        <div
            className="flex flex-col items-start gap-1 px-3 py-2 rounded-lg min-w-[100px] border"
            style={{ background: 'var(--surface-muted)', borderColor: 'var(--border)' }}
        >
            <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: color }} />
                <p className="text-[10px] font-semibold uppercase tracking-wide truncate" style={{ color: 'var(--muted)' }}>
                    {label}
                </p>
            </div>
            <p className="text-sm font-bold tabular-nums truncate" style={{ color: 'var(--ink)' }}>
                {displayValue}
            </p>
        </div>
    );
}

// ---------- Full-width source section ----------
function SourceSection({ eyebrow, title, description, icon: Icon, color, kpiValue, count, metrics, breakdown, breakdownLabelKey, transactions, transactionType, isExpanded, onToggle, extraBreakdown, labels }) {
    return (
        <div
            className="rounded-2xl border overflow-hidden transition-colors"
            style={{
                background: 'var(--surface)',
                borderColor: isExpanded ? color : 'var(--border)',
            }}
        >
            <button onClick={onToggle} className="w-full flex items-center justify-between gap-4 p-5 text-left">
                <div className="flex items-start gap-3.5 min-w-0">
                    <div className="shrink-0 rounded-xl p-2.5 flex items-center justify-center" style={{ background: 'var(--surface-muted)' }}>
                        <Icon size={20} style={{ color }} />
                    </div>
                    <div className="min-w-0">
                        {eyebrow && (
                            <p className="text-[11px] font-bold uppercase tracking-wider mb-0.5" style={{ color }}>
                                {eyebrow}
                            </p>
                        )}
                        <h3 className="text-base font-semibold truncate" style={{ color: 'var(--ink)' }}>{title}</h3>
                        <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--muted)' }}>
                            {description} · {count} {labels.transactions}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    <p className="text-xl font-bold tabular-nums text-right" style={{ color: 'var(--ink)' }}>
                        Rs {kpiValue?.toLocaleString() || 0}
                    </p>
                    <div className="rounded-full p-1.5 border" style={{ borderColor: 'var(--border)' }}>
                        {isExpanded ? <ChevronUp size={16} style={{ color }} /> : <ChevronDown size={16} style={{ color: 'var(--muted)' }} />}
                    </div>
                </div>
            </button>

            {metrics && metrics.length > 0 && (
                <div className="px-5 pb-4 flex flex-wrap gap-2 border-t pt-3" style={{ borderColor: 'var(--border)' }}>
                    {metrics.map((m, idx) => (
                        <MetricChip key={idx} label={m.label} value={m.value} isCurrency={m.isCurrency} color={m.color} />
                    ))}
                </div>
            )}

            {isExpanded && (
                <div className="px-5 pb-5 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
                    {breakdown && breakdown.length > 0 && (
                        <div className="mb-4">
                            <p className="text-sm font-semibold mb-1" style={{ color: 'var(--ink)' }}>{labels.breakdown}</p>
                            <div className="space-y-0">
                                {breakdown.map((item, idx) => (
                                    <BreakdownItem key={idx} label={item[breakdownLabelKey]} value={item.total} count={item.count} percentage={item.percentage} color={color} />
                                ))}
                            </div>
                        </div>
                    )}
                    {extraBreakdown}
                    {transactions && transactions.length > 0 && (
                        <div>
                            <p className="text-sm font-semibold mb-2" style={{ color: 'var(--ink)' }}>{labels.transactions}</p>
                            <TransactionTable transactions={transactions} type={transactionType} labels={labels} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function GroupHeading({ eyebrow, title, description }) {
    return (
        <div className="mb-5">
            {eyebrow && <p className="text-[11px] font-bold uppercase tracking-wider mb-1.5" style={{ color: 'var(--accent-2)' }}>{eyebrow}</p>}
            <h2 className="text-xl font-semibold" style={{ color: 'var(--ink)' }}>{title}</h2>
            {description && <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{description}</p>}
        </div>
    );
}

const SECTION_KEYS = ['sales', 'purchases', 'expenses', 'salaries', 'purchaseReturns', 'productReturns', 'wastages', 'qarza'];
const MAX_TRANSACTIONS_DISPLAY = 50;

// Color constants to replace hardcoded values
const COLORS = {
    sales: '#10b981',
    purchases: '#3b82f6',
    expenses: '#ef4444',
    salaries: '#8b5cf6',
    wastage: '#dc2626',
    purchaseReturns: '#06b6d4',
    productReturns: '#f59e0b',
    qarza: '#0f766e',
    qarzaPayable: '#7c3aed',
    profit: '#10b981',
    loss: '#dc2626'
};

export default function MainBusinessReport() {
    const { settings } = useSettings();
    const language = settings?.language || "en";
    const labels = getReportsLabels(language);

    const PERIOD_OPTIONS = useMemo(() => [
        { value: "all", label: "All time" },
        { value: "today", label: labels.today },
        { value: "month", label: labels.thisMonth },
        { value: "3month", label: labels.last3Months },
        { value: "year", label: labels.thisYear },
        { value: "custom", label: labels.customRange },
    ], [labels]);

    const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
    const [period, setPeriod] = useState("all");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [expandedSections, setExpandedSections] = useState({});

    const filters = { period };
    if (period === "custom" && fromDate && toDate) {
        filters.fromDate = fromDate;
        filters.toDate = toDate;
    }

    const kpiQuery = useGetMainBusinessReportKPIQuery(filters);
    const dataQuery = useGetMainBusinessReportDataQuery(filters);
    const isLoading = kpiQuery.isLoading || dataQuery.isLoading;
    const isFetching = kpiQuery.isFetching || dataQuery.isFetching;
    const error = kpiQuery.error || dataQuery.error;

    const handleRefresh = () => {
        kpiQuery.refetch();
        dataQuery.refetch();
    };

    // Handle errors properly - don't render if there's an error
    if (error) {
        showError(error?.data?.message || "Failed to load report");
        return (
            <div className="p-6 min-h-screen flex items-center justify-center" style={{ background: 'var(--app-bg)' }}>
                <div className="text-center">
                    <p className="text-lg font-semibold mb-2" style={{ color: 'var(--ink)' }}>Failed to load report</p>
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>{error?.data?.message || "Please try again"}</p>
                    <button
                        onClick={handleRefresh}
                        className="mt-4 px-4 py-2 rounded-xl text-white transition-opacity hover:opacity-90"
                        style={{ background: 'var(--accent-2)' }}
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    const showLoader = isLoading || isFetching;

    const toggleSection = (key) => {
        setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleExpandAll = () => {
        const all = {};
        SECTION_KEYS.forEach(k => { all[k] = true; });
        setExpandedSections(all);
    };

    const handleCollapseAll = () => setExpandedSections({});

    const summary = kpiQuery.data?.summary || {};
    const details = kpiQuery.data?.details || {};
    const breakdowns = dataQuery.data?.breakdowns || {};
    const transactions = dataQuery.data?.transactions || {};

    const qarzaNet = (summary.totalReceivable || 0) - (summary.totalPayable || 0);
    const isProfit = summary.netProfit >= 0;
    const selectedPeriodLabel = PERIOD_OPTIONS.find(p => p.value === period)?.label || '';

    // Stat used for the hero strip — includes all major business metrics
    const heroStats = [
        { label: labels.totalSales, value: summary.totalSales, icon: ShoppingCart, color: COLORS.sales, subLabel: `Profit: Rs ${summary.grossProfit?.toLocaleString() || 0} (${summary.grossMarginPercentage || 0}%)`, subColor: summary.grossProfit >= 0 ? '#10b981' : '#dc2626' },
        { label: labels.totalPurchases, value: summary.totalPurchases, icon: Package, color: COLORS.purchases },
        { label: labels.totalExpenses, value: summary.totalExpenses, icon: Receipt, color: COLORS.expenses },
        { label: labels.totalSalaries, value: summary.totalSalaries, icon: Users, color: COLORS.salaries },
        { label: labels.wastageLoss, value: summary.totalWastage, icon: AlertCircle, color: COLORS.wastage },
    ];

    return (
        <div className="p-6 min-h-screen" style={{ background: 'var(--app-bg)' }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold font-display" style={{ color: 'var(--ink)' }}>{labels.mainBusinessReport}</h1>
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>{labels.businessOverview}</p>
                </div>
                <div className="flex gap-2 no-print">
                    <button
                        onClick={handleRefresh}
                        className="px-4 py-2 rounded-xl border transition-colors flex items-center gap-2"
                        style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--ink)' }}
                    >
                        <RefreshCw size={16} className={showLoader ? "animate-spin" : ""} style={{ color: 'var(--accent-2)' }} />
                        {labels.refresh}
                    </button>
                    <button
                        onClick={() => setIsPdfModalOpen(true)}
                        className="px-4 py-2 rounded-xl text-white transition-opacity hover:opacity-90 flex items-center gap-2"
                        style={{ background: 'var(--accent-2)' }}
                    >
                        {labels.exportPdf}
                    </button>
                </div>
            </div>

            {/* Date filter — redesigned as a single unified bar with pill segmented control */}
            <div
                className="rounded-2xl border p-4 mb-6 no-print"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="flex items-center gap-2 shrink-0" style={{ color: 'var(--muted)' }}>
                            <Calendar size={16} style={{ color: 'var(--accent-2)' }} />
                            <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{labels.periodFilter}</span>
                        </div>
                        <div className="flex gap-1 p-1 rounded-xl flex-wrap" style={{ background: 'var(--app-bg)' }}>
                            {PERIOD_OPTIONS.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => setPeriod(opt.value)}
                                    className="px-3.5 py-1.5 text-sm rounded-lg font-medium transition-all"
                                    style={{
                                        background: period === opt.value ? 'var(--accent-2)' : 'transparent',
                                        color: period === opt.value ? 'white' : 'var(--muted)'
                                    }}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                        <button
                            onClick={handleExpandAll}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors"
                            style={{ borderColor: 'var(--border)', background: 'transparent', color: 'var(--muted)' }}
                        >
                            {labels.expandAll}
                        </button>
                        <button
                            onClick={handleCollapseAll}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors"
                            style={{ borderColor: 'var(--border)', background: 'transparent', color: 'var(--muted)' }}
                        >
                            {labels.collapseAll}
                        </button>
                    </div>
                </div>
                {period === "custom" && (
                    <div className="flex gap-2 mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            className="px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2"
                            style={{ borderColor: 'var(--border)', background: 'var(--app-bg)', color: 'var(--ink)' }}
                        />
                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            className="px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2"
                            style={{ borderColor: 'var(--border)', background: 'var(--app-bg)', color: 'var(--ink)' }}
                        />
                    </div>
                )}
            </div>

            {showLoader ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--accent-2)' }}></div>
                </div>
            ) : (
                <div>
                    {/* ===================== HERO: FINAL BUSINESS RESULT ===================== */}
                    <div className="mb-6">
                        <div
                            className="rounded-2xl border p-6"
                            style={{
                                background: 'var(--surface)',
                                borderColor: 'var(--border)'
                            }}
                        >
                            <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                                <div>
                                    <p className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--muted)' }}>
                                        {labels.finalBusinessResult} · {selectedPeriodLabel}
                                    </p>
                                    <h2 className="text-xl font-semibold" style={{ color: 'var(--ink)' }}>
                                        {labels.businessOverview || 'Business Overview'}
                                    </h2>
                                </div>
                                <div className="flex gap-6">
                                    <div className="text-right">
                                        <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted)' }}>Net Qarza</p>
                                        <p className="text-xl font-bold tabular-nums" style={{ color: qarzaNet >= 0 ? '#0f766e' : '#7c3aed' }}>
                                            Rs {qarzaNet.toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* KPI Stats Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                {heroStats.map((s, idx) => (
                                    <div
                                        key={idx}
                                        className="flex flex-col gap-2 p-4 rounded-xl border"
                                        style={{ background: 'var(--app-bg)', borderColor: 'var(--border)' }}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="rounded-lg p-2" style={{ background: `${s.color}17` }}>
                                                <s.icon size={18} style={{ color: s.color }} />
                                            </div>
                                            <p className="text-xs font-semibold uppercase tracking-wide truncate" style={{ color: 'var(--muted)' }}>
                                                {s.label}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold tabular-nums truncate" style={{ color: 'var(--ink)' }}>
                                                Rs {(s.value || 0).toLocaleString()}
                                            </p>
                                            {s.subLabel && (
                                                <p className="text-xs font-medium mt-1" style={{ color: s.subColor || 'var(--muted)' }}>
                                                    {s.subLabel}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Final Profit Calculation */}
                            <div className="mt-6 pt-6 border-t" style={{ borderColor: 'var(--border)' }}>
                                <div className="flex items-center justify-between flex-wrap gap-4">
                                    <div className="flex-1">
                                        <p className="text-xs font-medium mb-1" style={{ color: 'var(--muted)' }}>
                                            Calculation: Sales - Salaries - Expenses - Wastage + Returns
                                        </p>
                                        <div className="flex items-center gap-3">
                                            <Wallet size={20} style={{ color: isProfit ? '#10b981' : '#dc2626' }} />
                                            <span className="text-sm font-semibold" style={{ color: isProfit ? '#10b981' : '#dc2626' }}>
                                                {isProfit ? 'Net Profit' : 'Net Loss'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-3xl font-bold tabular-nums" style={{ color: isProfit ? '#10b981' : '#dc2626' }}>
                                            Rs {Math.abs(summary.netProfit || 0).toLocaleString()}
                                        </p>
                                        <p className="text-sm font-medium mt-1" style={{ color: 'var(--muted)' }}>
                                            Margin: {summary.netMarginPercentage || 0}%
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ===================== PER-SOURCE FULL WIDTH SECTIONS ===================== */}
                    <div className="mb-8">
                        <GroupHeading title={labels.paymentSourceSections} description={labels.businessOverview} />
                        <div className="space-y-4">
                            <SourceSection
                                eyebrow={labels.sales} title={labels.sales} description={labels.revenueFromCompletedOrders}
                                icon={ShoppingCart} color={COLORS.sales} kpiValue={summary.totalSales} count={details.salesCount || 0}
                                metrics={[
                                    { label: labels.grossProfit || 'Margin', value: summary.salesMargin, isCurrency: true },
                                    { label: labels.retailSales || 'Retail', value: summary.retailSales, isCurrency: true },
                                    { label: labels.wholesaleSales || 'Wholesale', value: summary.wholesaleSales, isCurrency: true },
                                    { label: labels.avgOrderValue || 'Avg Order', value: details.avgOrderValue, isCurrency: true },
                                ]}
                                breakdown={breakdowns.salesByPaymentMethod} breakdownLabelKey="method"
                                transactions={transactions.sales} transactionType="sales"
                                isExpanded={!!expandedSections.sales} onToggle={() => toggleSection('sales')} labels={labels}
                            />

                            <SourceSection
                                eyebrow={labels.purchases} title={labels.purchases} description={labels.costOfInventoryPurchases}
                                icon={Package} color={COLORS.purchases} kpiValue={summary.totalPurchases} count={details.purchaseCount || 0}
                                metrics={[
                                    { label: 'Avg Invoice', value: details.avgPurchaseValue, isCurrency: true },
                                    { label: 'Suppliers', value: details.supplierCount, isCurrency: false, showPercentage: false },
                                ]}
                                breakdown={breakdowns.purchasesBySupplier} breakdownLabelKey="supplierName"
                                transactions={transactions.purchases} transactionType="purchases"
                                isExpanded={!!expandedSections.purchases} onToggle={() => toggleSection('purchases')} labels={labels}
                            />

                            <SourceSection
                                eyebrow={labels.expenses} title={labels.expenses} description={labels.operatingExpenses}
                                icon={Receipt} color={COLORS.expenses} kpiValue={summary.totalExpenses} count={details.expenseCount || 0}
                                metrics={[{ label: 'Avg/Txn', value: details.avgExpenseValue, isCurrency: true }]}
                                breakdown={breakdowns.expensesByCategory} breakdownLabelKey="category"
                                transactions={transactions.expenses} transactionType="expenses"
                                isExpanded={!!expandedSections.expenses} onToggle={() => toggleSection('expenses')} labels={labels}
                            />

                            <SourceSection
                                eyebrow={labels.salaries} title={labels.salaries} description={labels.staffSalaryPayments}
                                icon={Users} color={COLORS.salaries} kpiValue={summary.totalSalaries} count={details.salaryPaymentCount || 0}
                                metrics={[
                                    { label: 'Avg/Staff', value: details.avgSalaryPerStaff, isCurrency: true },
                                    { label: 'Staff Count', value: details.staffCount, isCurrency: false, showPercentage: false },
                                ]}
                                breakdown={breakdowns.salariesByStaff} breakdownLabelKey="staffName"
                                transactions={transactions.salaryPayments} transactionType="salaryPayments"
                                isExpanded={!!expandedSections.salaries} onToggle={() => toggleSection('salaries')} labels={labels}
                            />

                            <SourceSection
                                eyebrow={labels.purchaseReturns} title={labels.purchaseReturns} description={labels.returnsSentToSuppliers}
                                icon={TrendingUp} color={COLORS.purchaseReturns} kpiValue={summary.totalPurchaseReturns} count={details.purchaseReturnCount || 0}
                                breakdown={breakdowns.purchaseReturnsBySupplier} breakdownLabelKey="supplierName"
                                transactions={transactions.purchaseReturns} transactionType="purchaseReturns"
                                isExpanded={!!expandedSections.purchaseReturns} onToggle={() => toggleSection('purchaseReturns')} labels={labels}
                            />

                            <SourceSection
                                eyebrow={labels.saleReturns} title={labels.saleReturns} description={labels.customerProductReturns}
                                icon={TrendingDown} color={COLORS.productReturns} kpiValue={summary.totalProductReturns} count={details.productReturnCount || 0}
                                breakdown={breakdowns.productReturnsByReason} breakdownLabelKey="reason"
                                transactions={transactions.productReturns} transactionType="productReturns"
                                isExpanded={!!expandedSections.productReturns} onToggle={() => toggleSection('productReturns')} labels={labels}
                            />

                            <SourceSection
                                eyebrow={labels.wastage} title={labels.wastage} description={labels.inventoryWastageCost}
                                icon={AlertCircle} color={COLORS.wastage} kpiValue={summary.totalWastage} count={details.wastageCount || 0}
                                metrics={[{ label: '% of Purchases', value: details.wastagePercentOfPurchases, isCurrency: false, showPercentage: true }]}
                                transactions={transactions.wastages} transactionType="wastages"
                                isExpanded={!!expandedSections.wastages} onToggle={() => toggleSection('wastages')} labels={labels}
                                extraBreakdown={breakdowns.wastagesByProduct && breakdowns.wastagesByProduct.length > 0 && (
                                    <div className="mb-4">
                                        <p className="text-sm font-semibold mb-1" style={{ color: 'var(--ink)' }}>{labels.byProduct}</p>
                                        <div className="space-y-0">
                                            {breakdowns.wastagesByProduct.map((item, idx) => (
                                                <div key={idx} className="flex items-center justify-between py-2.5 border-b last:border-b-0" style={{ borderColor: 'var(--border)' }}>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium truncate" style={{ color: 'var(--ink)' }}>{item.productName}</p>
                                                        <p className="text-xs" style={{ color: 'var(--muted)' }}>{item.count} {labels.records} • {item.totalQuantity} {labels.units}</p>
                                                    </div>
                                                    <div className="text-right shrink-0 pl-3">
                                                        <p className="text-sm font-bold tabular-nums" style={{ color: 'var(--ink)' }}>Rs {item.total?.toLocaleString() || 0}</p>
                                                        <p className="text-xs" style={{ color: COLORS.wastage }}>{item.percentage}%</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            />

                            <SourceSection
                                eyebrow={labels.qarza || labels.qarzaReceivablePayable} title={labels.qarzaReceivablePayable} description={labels.outstandingCredit}
                                icon={HandCoins} color={COLORS.qarza} kpiValue={qarzaNet} count={details.qarzaReceivableCount + details.qarzaPayableCount || 0}
                                metrics={[
                                    { label: labels.receivable, value: summary.totalReceivable, isCurrency: true, color: COLORS.qarza },
                                    { label: labels.payable, value: summary.totalPayable, isCurrency: true, color: COLORS.qarzaPayable },
                                ]}
                                isExpanded={!!expandedSections.qarza} onToggle={() => toggleSection('qarza')} labels={labels}
                            />
                        </div>
                    </div>
                </div>
            )}

            <PdfModal isOpen={isPdfModalOpen} onClose={() => setIsPdfModalOpen(false)} fileName={`${labels.mainBusinessReport}.pdf`} labels={labels}>
                <MainBusinessReportPdfTemplate
                    summary={summary} details={details} breakdowns={breakdowns} transactions={transactions}
                    labels={labels} selectedPeriodLabel={selectedPeriodLabel}
                    initialExpandedSections={{ sales: true, purchases: true, expenses: true, salaries: true, purchaseReturns: true, productReturns: true, wastages: true, qarza: true }}
                />
            </PdfModal>
        </div>
    );
}