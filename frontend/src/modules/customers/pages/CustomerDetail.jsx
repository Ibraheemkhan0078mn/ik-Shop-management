import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Edit, Package, Calendar, DollarSign, User, Phone, MapPin, CreditCard } from "lucide-react";
import { useCustomer } from "../services/customers.service.js";
import { useOrdersByCustomer } from "../../orders/services/orders.service.js";
import { getCustomerLabels } from "../labels/customerLabels.js";
import { useSettings } from "../../settings/hooks/useSettings.js";

const IMAGE_BASE_URL = "http://localhost:5001";

export default function CustomerDetail() {
    const navigate = useNavigate();
    const { id } = useParams();
    
    const { settings } = useSettings();
    const language = settings?.language || "en";
    const labels = getCustomerLabels(language);
    
    const [activeTab, setActiveTab] = useState("details");
    const [startDate, setStartDate] = useState(() => {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        return firstDay.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
    
    const { data: customerData, isLoading } = useCustomer(id);
    const { data: ordersData } = useOrdersByCustomer({ 
        customerId: id, 
        startDate, 
        endDate 
    });

    const customer = customerData;
    const orders = ordersData?.data || [];

    if (isLoading) {
        return <div className="p-6 text-center">{labels.loading}</div>;
    }

    if (!customer) {
        return <div className="p-6 text-center">Customer not found</div>;
    }

    return (
        <div className="p-6 bg-[var(--app-bg)] min-h-screen">
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate("/customers")}
                    className="p-2 hover:bg-[var(--hover)] rounded-md"
                >
                    <ArrowLeft size={20} className="text-[var(--ink)]" />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-[var(--ink)] font-display">{customer.name}</h1>
                    <p className="text-sm text-[var(--muted)]">{customer.phoneNo || "No phone"}</p>
                </div>
                <button
                    onClick={() => navigate(`/customers/edit/${id}`)}
                    className="btn-add"
                >
                    <Edit size={16} /> {labels.edit}
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-[var(--border)]">
                {["details", "orders"].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-4 py-2 capitalize ${
                            activeTab === tab
                                ? "border-b-2 border-[var(--accent-2)] text-[var(--accent-2)]"
                                : "text-[var(--muted)] hover:text-[var(--ink)]"
                        }`}
                    >
                        {tab === "details" ? "Customer Details" : "Orders"}
                    </button>
                ))}
            </div>

            {/* Details Tab */}
            {activeTab === "details" && (
                <div className="card p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2 flex items-start gap-4">
                            {customer.image ? (
                                <img 
                                    src={`${IMAGE_BASE_URL}/uploads/${customer.image}`} 
                                    alt={customer.name} 
                                    className="w-24 h-24 rounded-xl object-cover ring-1 ring-[var(--border)]" 
                                />
                            ) : (
                                <div className="w-24 h-24 rounded-xl bg-[var(--surface-muted)] flex items-center justify-center text-3xl font-bold text-[var(--muted)]">
                                    {customer.name?.charAt(0).toUpperCase()}
                                </div>
                            )}
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold text-[var(--ink)]">{customer.name}</h3>
                                <p className="text-sm text-[var(--muted)] mt-1">{customer.address || "No address"}</p>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm text-[var(--muted)]">Phone</label>
                            <p className="font-medium text-[var(--ink)]">{customer.phoneNo || "—"}</p>
                        </div>
                        <div>
                            <label className="text-sm text-[var(--muted)]">CNIC</label>
                            <p className="font-medium text-[var(--ink)]">{customer.cnic || "—"}</p>
                        </div>
                        <div>
                            <label className="text-sm text-[var(--muted)]">Address</label>
                            <p className="font-medium text-[var(--ink)]">{customer.address || "—"}</p>
                        </div>
                        <div>
                            <label className="text-sm text-[var(--muted)]">Status</label>
                            <span className={`px-2 py-1 text-xs rounded-full ${customer.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {customer.isActive ? "Active" : "Inactive"}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* Orders Tab */}
            {activeTab === "orders" && (
                <div className="card p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-[var(--ink)]">Customer Orders</h3>
                        <div className="flex gap-2">
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)]"
                            />
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="px-3 py-2 text-sm rounded-lg border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)]"
                            />
                        </div>
                    </div>
                    {orders.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead style={{ background: "var(--surface-muted)" }}>
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">Order #</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">Date</th>
                                        <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-[var(--muted)]">Total</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-[var(--muted)]">Payment</th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-[var(--muted)]">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y" style={{ borderColor: "var(--border)" }}>
                                    {orders.map((order) => (
                                        <tr key={order._id} className="hover:bg-[var(--surface-muted)]">
                                            <td className="px-4 py-3 text-sm font-medium text-[var(--ink)]">{order.orderNumber}</td>
                                            <td className="px-4 py-3 text-sm text-[var(--muted)]">
                                                {new Date(order.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3 text-sm font-semibold text-right text-[var(--accent-2)]">
                                                Rs {order.totalAmount?.toLocaleString() || 0}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-[var(--muted)] capitalize">
                                                {order.paymentMethod}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`px-2 py-1 text-xs rounded-full ${
                                                    order.status === 'completed' 
                                                        ? 'bg-green-100 text-green-700' 
                                                        : 'bg-red-100 text-red-700'
                                                }`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Package size={48} className="text-[var(--muted)] mb-4 mx-auto" />
                            <p className="text-[var(--muted)]">No orders found for this customer</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
