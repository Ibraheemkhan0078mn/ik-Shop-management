import React, { useState, useMemo } from "react";
import { Truck, DollarSign, RefreshCw, Filter, Eye, Star, AlertCircle, X } from "lucide-react";
import { useGetSupplierReportQuery } from "../services/reports.service.js";
import { showError } from "../../../shared/utilities/toastHelpers.js";
import PdfModal from "../../../shared/components/PdfModal.jsx";
import SupplierReportPdfTemplate from "../components/SupplierReportPdfTemplate.jsx";
import { useSettings } from "../../settings/hooks/useSettings.js";
import { getReportsLabels } from "../labels/reportsLabels.js";

function getInitials(name) {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.[0] || "";
    const second = parts.length > 1 ? parts[1][0] : "";
    return (first + second).toUpperCase();
}

function Avatar({ name, large = false }) {
    return (
        <div
            className={`${large ? 'w-12 h-12 text-sm' : 'w-8 h-8 text-xs'} rounded-full flex items-center justify-center font-bold shrink-0`}
            style={{ background: 'var(--accent-2)17', color: 'var(--accent-2)' }}
        >
            {getInitials(name)}
        </div>
    );
}

function KpiCard({ label, value, sub, icon: Icon, color }) {
    return (
        <div className="rounded-2xl border p-4 transition-shadow hover:shadow-sm" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}17` }}>
                    <Icon size={18} style={{ color }} />
                </div>
                <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-wide truncate" style={{ color: 'var(--muted)' }}>{label}</p>
                    <p className="text-sm font-bold tabular-nums truncate" style={{ color: 'var(--ink)' }}>{value}</p>
                    {sub && <p className="text-xs truncate" style={{ color: 'var(--muted)' }}>{sub}</p>}
                </div>
            </div>
        </div>
    );
}

const DELIVERY_COLORS = {
    delivered: { bg: '#10b98117', fg: '#10b981', bd: '#10b98140' },
    ordered: { bg: '#f59e0b17', fg: '#f59e0b', bd: '#f59e0b40' },
    rejected: { bg: '#dc262617', fg: '#dc2626', bd: '#dc262640' },
    default: { bg: 'var(--surface-muted)', fg: 'var(--muted)', bd: 'var(--border)' },
};

function StatusBadge({ status, labelText }) {
    const c = DELIVERY_COLORS[status] || DELIVERY_COLORS.default;
    return (
        <span className="inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full border" style={{ background: c.bg, color: c.fg, borderColor: c.bd }}>
            {labelText}
        </span>
    );
}

export default function SupplierReport() {
    const { settings } = useSettings();
    const language = settings?.language || "en";
    const labels = getReportsLabels(language);
    const [period, setPeriod] = useState("today");
    const [supplierName, setSupplierName] = useState("");
    const [paymentStatus, setPaymentStatus] = useState("all");
    const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState(null);

    const getDatesFromPeriod = (periodValue) => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        switch (periodValue) {
            case "today":
                return { from: today.toISOString().split('T')[0], to: today.toISOString().split('T')[0] };
            case "month": {
                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                return { from: monthStart.toISOString().split('T')[0], to: monthEnd.toISOString().split('T')[0] };
            }
            case "3month": {
                const threeMonthStart = new Date(now.getFullYear(), now.getMonth() - 3, 1);
                const threeMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                return { from: threeMonthStart.toISOString().split('T')[0], to: threeMonthEnd.toISOString().split('T')[0] };
            }
            case "year": {
                const yearStart = new Date(now.getFullYear(), 0, 1);
                const yearEnd = new Date(now.getFullYear(), 11, 31);
                return { from: yearStart.toISOString().split('T')[0], to: yearEnd.toISOString().split('T')[0] };
            }
            default:
                return { from: today.toISOString().split('T')[0], to: today.toISOString().split('T')[0] };
        }
    };

    const dates = useMemo(() => getDatesFromPeriod(period), [period]);
    const filters = useMemo(() => ({
        fromDate: dates.from,
        toDate: dates.to,
        supplierName, paymentStatus
    }), [dates.from, dates.to, supplierName, paymentStatus]);

    const { data, isLoading, isFetching, error, refetch } = useGetSupplierReportQuery(filters);

    if (error) {
        showError(error?.data?.message || "Failed to load supplier report");
    }

    const handleRefresh = () => refetch();

    const summary = data?.summary || {};
    const suppliers = data?.data || [];

    const showLoader = isLoading || isFetching;

    const formatDate = (dateStr) => {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleDateString();
    };

    const deliveryLabel = (status) => status === 'delivered' ? 'Received' : status === 'ordered' ? 'Pending' : (status || "—");

    return (
        <div className="p-6 min-h-screen" style={{ background: 'var(--app-bg)' }}>
            {/* Header */}
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                <div>
                    <h1 className="text-2xl font-bold font-display" style={{ color: 'var(--ink)' }}>{labels.supplierReport}</h1>
                    <p className="text-sm" style={{ color: 'var(--muted)' }}>{labels.supplierAnalytics}</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={handleRefresh} className="px-4 py-2 rounded-xl border transition-colors flex items-center gap-2" style={{ borderColor: 'var(--border)', background: 'var(--surface)', color: 'var(--ink)' }}>
                        <RefreshCw size={16} className={showLoader ? "animate-spin" : ""} style={{ color: 'var(--accent-2)' }} />
                        {labels.refresh}
                    </button>
                    <button onClick={() => setIsPdfModalOpen(true)} className="px-4 py-2 rounded-xl text-white transition-opacity hover:opacity-90 flex items-center gap-2" style={{ background: 'var(--accent-2)' }}>
                        {labels.exportPdf}
                    </button>
                </div>
            </div>

            {/* Filter bar */}
            <div className="rounded-2xl border p-4 mb-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <div className="flex items-center gap-2 mb-3">
                    <Filter size={16} style={{ color: 'var(--accent-2)' }} />
                    <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>{labels.filters}</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--muted)' }}>{labels.period}</label>
                        <select
                            value={period}
                            onChange={(e) => setPeriod(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2"
                            style={{ borderColor: 'var(--border)', background: 'var(--app-bg)', color: 'var(--ink)' }}
                        >
                            <option value="today">{labels.today}</option>
                            <option value="month">{labels.thisMonth}</option>
                            <option value="3month">{labels.last3Months}</option>
                            <option value="year">{labels.thisYear}</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--muted)' }}>{labels.supplier}</label>
                        <input
                            type="text"
                            placeholder="Supplier name..."
                            value={supplierName}
                            onChange={(e) => setSupplierName(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2"
                            style={{ borderColor: 'var(--border)', background: 'var(--app-bg)', color: 'var(--ink)' }}
                        />
                    </div>
                    <div>
                        <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--muted)' }}>{labels.status}</label>
                        <select
                            value={paymentStatus}
                            onChange={(e) => setPaymentStatus(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border text-sm focus:outline-none focus:ring-2"
                            style={{ borderColor: 'var(--border)', background: 'var(--app-bg)', color: 'var(--ink)' }}
                        >
                            <option value="all">{labels.allStatuses}</option>
                            <option value="paid">{labels.paid}</option>
                            <option value="unpaid">{labels.unpaid}</option>
                            <option value="partial">{labels.partial}</option>
                        </select>
                    </div>
                </div>
            </div>

            {showLoader ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--accent-2)' }}></div>
                </div>
            ) : (
                <div>
                    {/* KPI Cards */}
                    <div className="flex flex-wrap gap-3 mb-6">
                        <KpiCard label={labels.totalSuppliers} value={summary.totalSuppliers || 0} icon={Truck} color="var(--accent-2)" />
                        <KpiCard label={labels.totalPurchases} value={`Rs ${(summary.totalPurchases || 0).toLocaleString()}`} icon={DollarSign} color="#3b82f6" />
                        <KpiCard label={labels.totalPaid} value={`Rs ${(summary.totalPaid || 0).toLocaleString()}`} icon={DollarSign} color="#10b981" />
                        <KpiCard label={labels.totalDue} value={`Rs ${(summary.totalDue || 0).toLocaleString()}`} icon={AlertCircle} color="#dc2626" />
                        <KpiCard
                            label={labels.topSupplier}
                            value={summary.topSupplier?.name || "—"}
                            sub={`Rs ${(summary.topSupplier?.amount || 0).toLocaleString()}`}
                            icon={Star}
                            color="#f59e0b"
                        />
                    </div>

                    {/* Supplier Table */}
                    <div className="rounded-2xl border overflow-hidden" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                        <div className="p-4 border-b" style={{ borderColor: 'var(--border)' }}>
                            <h2 className="text-lg font-semibold" style={{ color: 'var(--ink)' }}>{labels.supplierReport}</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead style={{ background: 'var(--surface-muted)' }}>
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>#</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>{labels.supplier}</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>{labels.totalPurchases}</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>{labels.totalBills}</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>{labels.dueAmount}</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>{labels.lastPurchase}</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>{labels.actions}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                                    {suppliers.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" className="px-4 py-8 text-center" style={{ color: 'var(--muted)' }}>{labels.noDataFound}</td>
                                        </tr>
                                    ) : (
                                        suppliers.map((supplier) => (
                                            <tr key={supplier._id} className="transition-colors" style={{ background: 'transparent' }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-muted)'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                                <td className="px-4 py-3 font-bold tabular-nums" style={{ color: 'var(--accent-2)' }}>#{supplier.rank}</td>
                                                <td className="px-4 py-3 text-sm font-medium" style={{ color: 'var(--ink)' }}>
                                                    <div className="flex items-center gap-2.5">
                                                        <Avatar name={supplier.name} />
                                                        <span>{supplier.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right font-semibold tabular-nums" style={{ color: 'var(--accent-2)' }}>Rs {(supplier.totalPurchases || 0).toLocaleString()}</td>
                                                <td className="px-4 py-3 text-right font-medium tabular-nums" style={{ color: '#3b82f6' }}>{supplier.totalOrders || 0}</td>
                                                <td className="px-4 py-3 text-right font-medium tabular-nums" style={{ color: '#dc2626' }}>Rs {(supplier.totalDue || 0).toLocaleString()}</td>
                                                <td className="px-4 py-3 text-sm" style={{ color: 'var(--muted)' }}>{formatDate(supplier.lastPurchase)}</td>
                                                <td className="px-4 py-3 text-center">
                                                    <button
                                                        onClick={() => setSelectedSupplier(supplier)}
                                                        className="p-2 rounded-lg transition-colors"
                                                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--app-bg)'}
                                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                        title={labels.viewDetails}
                                                    >
                                                        <Eye size={16} style={{ color: 'var(--accent-2)' }} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Supplier Detail Modal */}
            {selectedSupplier && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedSupplier(null)}>
                    <div className="rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }} onClick={(e) => e.stopPropagation()}>
                        <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
                            <h2 className="text-lg font-semibold" style={{ color: 'var(--ink)' }}>{labels.supplierDetails}</h2>
                            <button onClick={() => setSelectedSupplier(null)} className="p-2 rounded-lg transition-colors"
                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--app-bg)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                <X size={20} style={{ color: 'var(--muted)' }} />
                            </button>
                        </div>
                        <div className="p-5">
                            {/* Basic Info */}
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--ink)' }}>Basic Information</h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center gap-3 col-span-2">
                                        <Avatar name={selectedSupplier.name} large />
                                        <div>
                                            <p className="text-xs" style={{ color: 'var(--muted)' }}>Name</p>
                                            <p className="font-medium" style={{ color: 'var(--ink)' }}>{selectedSupplier.name}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs" style={{ color: 'var(--muted)' }}>Phone</p>
                                        <p className="font-medium" style={{ color: 'var(--ink)' }}>{selectedSupplier.phone || "—"}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs" style={{ color: 'var(--muted)' }}>Address</p>
                                        <p className="font-medium" style={{ color: 'var(--ink)' }}>{selectedSupplier.address || "—"}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--ink)' }}>Statistics</h3>
                                <div className="grid grid-cols-3 gap-3">
                                    <div className="p-3 rounded-xl" style={{ background: 'var(--surface-muted)' }}>
                                        <p className="text-xs" style={{ color: 'var(--muted)' }}>Total Purchases</p>
                                        <p className="font-semibold tabular-nums" style={{ color: 'var(--accent-2)' }}>Rs {(selectedSupplier.totalPurchases || 0).toLocaleString()}</p>
                                    </div>
                                    <div className="p-3 rounded-xl" style={{ background: 'var(--surface-muted)' }}>
                                        <p className="text-xs" style={{ color: 'var(--muted)' }}>Total Bills</p>
                                        <p className="font-semibold tabular-nums" style={{ color: 'var(--ink)' }}>{selectedSupplier.totalBills || 0}</p>
                                    </div>
                                    <div className="p-3 rounded-xl" style={{ background: 'var(--surface-muted)' }}>
                                        <p className="text-xs" style={{ color: 'var(--muted)' }}>Outstanding Due</p>
                                        <p className="font-semibold tabular-nums" style={{ color: '#dc2626' }}>Rs {(selectedSupplier.totalDue || 0).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Purchase History */}
                            <div>
                                <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--ink)' }}>Purchase History</h3>
                                <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--border)' }}>
                                    <table className="w-full text-sm">
                                        <thead style={{ background: 'var(--surface-muted)' }}>
                                            <tr>
                                                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Date</th>
                                                <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Bill No</th>
                                                <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Amount</th>
                                                <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Paid</th>
                                                <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Due</th>
                                                <th className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Delivery</th>
                                                <th className="px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted)' }}>Reject</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y" style={{ borderColor: 'var(--border)' }}>
                                            {selectedSupplier.purchases && selectedSupplier.purchases.length > 0 ? (
                                                selectedSupplier.purchases.map((purchase) => {
                                                    const paidAmount = purchase.paidAmount || 0;
                                                    const dueAmount = purchase.totalAmount - paidAmount;
                                                    const isRejected = purchase.status === 'rejected';

                                                    return (
                                                        <tr key={purchase._id}>
                                                            <td className="px-3 py-2" style={{ color: 'var(--muted)' }}>{formatDate(purchase.createdAt)}</td>
                                                            <td className="px-3 py-2" style={{ color: 'var(--ink)' }}>{purchase.invoiceNumber || "—"}</td>
                                                            <td className="px-3 py-2 text-right font-medium tabular-nums" style={{ color: 'var(--accent-2)' }}>Rs {(purchase.totalAmount || 0).toLocaleString()}</td>
                                                            <td className="px-3 py-2 text-right tabular-nums" style={{ color: '#10b981' }}>Rs {paidAmount.toLocaleString()}</td>
                                                            <td className="px-3 py-2 text-right tabular-nums" style={{ color: '#dc2626' }}>Rs {dueAmount.toLocaleString()}</td>
                                                            <td className="px-3 py-2 text-center">
                                                                <StatusBadge status={purchase.status} labelText={deliveryLabel(purchase.status)} />
                                                            </td>
                                                            <td className="px-3 py-2 text-center">
                                                                <StatusBadge status={isRejected ? 'rejected' : 'delivered'} labelText={isRejected ? 'Yes' : 'No'} />
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            ) : (
                                                <tr>
                                                    <td colSpan="7" className="px-3 py-4 text-center" style={{ color: 'var(--muted)' }}>No purchase history</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* PDF Modal */}
            <PdfModal
                isOpen={isPdfModalOpen}
                onClose={() => setIsPdfModalOpen(false)}
                fileName={`${labels.supplierReport}.pdf`}
                labels={labels}
            >
                <SupplierReportPdfTemplate
                    summary={summary}
                    suppliers={suppliers}
                    labels={labels}
                    selectedPeriodLabel={period}
                />
            </PdfModal>
        </div>
    );
}