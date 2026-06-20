import React, { useState, useEffect } from "react";
import {
    TrendingUp,
    DollarSign,
    AlertTriangle,
    Calendar,
    CheckCircle2,
    ArrowUpRight,
    ArrowDownRight,
    Package,
    ShoppingCart,
    CreditCard,
    Wallet,
    Users,
    Truck,
    RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import {
    useGetDashboardSummaryQuery,
    useGetTopSellingProductsQuery,
    useGetTopCustomersQuery,
    useGetLowStockProductsQuery,
    useGetNearExpiryProductsQuery,
    useGetRecentSalesQuery,
    useGetRecentPurchasesQuery,
} from "../../reports/services/reports.service.js";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LineChart,
    Line,
    Legend,
} from "recharts";

function Card({ children, className = "" }) {
    return (
        <div
            className={`p-5 border bg-white border-gray-200 rounded-2xl shadow-sm ${className}`}
        >
            {children}
        </div>
    );
}

function StatCard({ title, value, icon: Icon, change, changeType, color }) {
    return (
        <Card className="hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <p className="text-sm text-gray-500 mb-1">{title}</p>
                    <p className="text-2xl font-bold text-gray-800">
                        Rs {value?.toLocaleString() || 0}
                    </p>
                    {change !== undefined && (
                        <div className={`flex items-center mt-2 text-sm ${changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                            {changeType === 'positive' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                            <span className="ml-1">{change}%</span>
                        </div>
                    )}
                </div>
                <div className={`p-3 rounded-xl ${color}`}>
                    <Icon size={20} className="text-white" />
                </div>
            </div>
        </Card>
    );
}

export default function Dashboard() {
    const [refreshKey, setRefreshKey] = useState(0);

    // Dashboard Summary
    const { data: dashboardSummary, isLoading: summaryLoading, error: summaryError, refetch: refetchSummary } = useGetDashboardSummaryQuery();

    // Dashboard Components
    const { data: topProducts, isLoading: topProductsLoading, error: topProductsError, refetch: refetchTopProducts } = useGetTopSellingProductsQuery({ limit: 5 });
    const { data: topCustomers, isLoading: topCustomersLoading, error: topCustomersError, refetch: refetchTopCustomers } = useGetTopCustomersQuery({ limit: 5 });
    const { data: lowStock, isLoading: lowStockLoading, error: lowStockError, refetch: refetchLowStock } = useGetLowStockProductsQuery({ limit: 5 });
    const { data: nearExpiry, isLoading: nearExpiryLoading, error: nearExpiryError, refetch: refetchNearExpiry } = useGetNearExpiryProductsQuery({ limit: 5 });
    const { data: recentSales, isLoading: recentSalesLoading, error: recentSalesError, refetch: refetchRecentSales } = useGetRecentSalesQuery({ limit: 5 });
    const { data: recentPurchases, isLoading: recentPurchasesLoading, error: recentPurchasesError, refetch: refetchRecentPurchases } = useGetRecentPurchasesQuery({ limit: 5 });

    // Handle errors
    useEffect(() => {
        if (summaryError) toast.error("Failed to load dashboard summary");
        if (topProductsError) toast.error("Failed to load top products");
        if (topCustomersError) toast.error("Failed to load top customers");
        if (lowStockError) toast.error("Failed to load low stock products");
        if (nearExpiryError) toast.error("Failed to load near expiry products");
        if (recentSalesError) toast.error("Failed to load recent sales");
        if (recentPurchasesError) toast.error("Failed to load recent purchases");
    }, [summaryError, topProductsError, topCustomersError, lowStockError, nearExpiryError, recentSalesError, recentPurchasesError]);

    const handleRefresh = () => {
        setRefreshKey(prev => prev + 1);
        refetchSummary();
        refetchTopProducts();
        refetchTopCustomers();
        refetchLowStock();
        refetchNearExpiry();
        refetchRecentSales();
        refetchRecentPurchases();
    };

    const isLoading = summaryLoading || topProductsLoading || topCustomersLoading || lowStockLoading || nearExpiryLoading || recentSalesLoading || recentPurchasesLoading;

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <RefreshCw className="animate-spin text-cyan-600" size={40} />
            </div>
        );
    }

    const summary = dashboardSummary?.data || {};

    // Prepare chart data for Sales vs Purchase
    const chartData = [
        { name: 'Sales', Sales: summary.todaySales || 0, Purchase: summary.todayPurchase || 0 },
    ];

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
                    <p className="text-sm text-gray-500">Overview of your business performance</p>
                </div>
                <button
                    onClick={handleRefresh}
                    className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
                >
                    <RefreshCw size={16} />
                    Refresh
                </button>
            </div>

            {/* Top Section - 8 Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {/* Row 1 */}
                <StatCard
                    title="Today's Sales"
                    value={summary.todaySales}
                    icon={DollarSign}
                    color="bg-green-500"
                />
                <StatCard
                    title="Today's Purchase"
                    value={summary.todayPurchase}
                    icon={ShoppingCart}
                    color="bg-blue-500"
                />
                <StatCard
                    title="Today's Profit"
                    value={summary.todayProfit}
                    icon={TrendingUp}
                    color="bg-purple-500"
                    changeType={summary.todayProfit >= 0 ? 'positive' : 'negative'}
                />
                <StatCard
                    title="Cash Balance"
                    value={summary.cashBalance}
                    icon={Wallet}
                    color="bg-cyan-500"
                />

                {/* Row 2 */}
                <StatCard
                    title="Total Receivable"
                    value={summary.totalReceivable}
                    icon={CreditCard}
                    color="bg-orange-500"
                />
                <StatCard
                    title="Total Payable"
                    value={summary.totalPayable}
                    icon={AlertTriangle}
                    color="bg-red-500"
                />
                <StatCard
                    title="Today's Expense"
                    value={summary.todayExpense}
                    icon={Package}
                    color="bg-yellow-500"
                />
                <StatCard
                    title="Inventory Value"
                    value={summary.inventoryValue}
                    icon={Truck}
                    color="bg-indigo-500"
                />
            </div>

            {/* Middle Section - Chart + Business Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Sales vs Purchase Chart - 70% */}
                <div className="lg:col-span-2">
                    <Card>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Sales vs Purchase</h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="Sales" fill="#10b981" />
                                <Bar dataKey="Purchase" fill="#3b82f6" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Card>
                </div>

                {/* Today's Business Summary - 30% */}
                <div>
                    <Card>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Today's Summary</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Sales</span>
                                <span className="font-semibold text-gray-800">Rs {summary.todaySales?.toLocaleString() || 0}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Purchase</span>
                                <span className="font-semibold text-gray-800">Rs {summary.todayPurchase?.toLocaleString() || 0}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Expense</span>
                                <span className="font-semibold text-gray-800">Rs {summary.todayExpense?.toLocaleString() || 0}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Profit</span>
                                <span className={`font-semibold ${summary.todayProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    Rs {summary.todayProfit?.toLocaleString() || 0}
                                </span>
                            </div>
                            <hr className="my-3" />
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">New Members</span>
                                <span className="font-semibold text-gray-800">{summary.newMembers || 0}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">New Suppliers</span>
                                <span className="font-semibold text-gray-800">{summary.newSuppliers || 0}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Low Stock</span>
                                <span className="font-semibold text-orange-600">{summary.lowStockCount || 0}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Pending Credits</span>
                                <span className="font-semibold text-red-600">{summary.pendingCredits || 0}</span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Below Chart Section - 4 panels */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Left: Top Selling Products + Top Customers */}
                <div className="space-y-6">
                    {/* Top Selling Products */}
                    <Card>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Selling Products</h3>
                        {topProducts?.data?.length > 0 ? (
                            <div className="space-y-3">
                                {topProducts.data.map((item, index) => (
                                    <div key={index} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <span className="w-6 h-6 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center text-xs font-bold">
                                                {index + 1}
                                            </span>
                                            <span className="text-sm text-gray-700">{item.product?.name || 'Unknown'}</span>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-semibold text-gray-800">Rs {item.totalRevenue?.toLocaleString() || 0}</p>
                                            <p className="text-xs text-gray-500">{item.totalQuantity || 0} sold</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 text-center py-4">No data available</p>
                        )}
                    </Card>

                    {/* Top Customers */}
                    <Card>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Customers</h3>
                        {topCustomers?.data?.length > 0 ? (
                            <div className="space-y-3">
                                {topCustomers.data.map((item, index) => (
                                    <div key={index} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Users size={16} className="text-gray-400" />
                                            <span className="text-sm text-gray-700">{item._id || 'Unknown'}</span>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-semibold text-gray-800">Rs {item.totalSpent?.toLocaleString() || 0}</p>
                                            <p className="text-xs text-gray-500">{item.orderCount || 0} orders</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 text-center py-4">No data available</p>
                        )}
                    </Card>
                </div>

                {/* Right: Low Stock Products + Near Expiry Products */}
                <div className="space-y-6">
                    {/* Low Stock Products */}
                    <Card>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Low Stock Products</h3>
                        {lowStock?.data?.length > 0 ? (
                            <div className="space-y-3">
                                {lowStock.data.map((item, index) => (
                                    <div key={index} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <AlertTriangle size={16} className="text-orange-500" />
                                            <div>
                                                <p className="text-sm text-gray-700">{item.product?.name || 'Unknown'}</p>
                                                <p className="text-xs text-gray-500">Batch: {item.batchNumber || 'N/A'}</p>
                                            </div>
                                        </div>
                                        <span className="text-sm font-semibold text-orange-600">{item.quantity || 0} left</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 text-center py-4">No low stock items</p>
                        )}
                    </Card>

                    {/* Near Expiry Products */}
                    <Card>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Near Expiry Products</h3>
                        {nearExpiry?.data?.length > 0 ? (
                            <div className="space-y-3">
                                {nearExpiry.data.map((item, index) => (
                                    <div key={index} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Calendar size={16} className="text-red-500" />
                                            <div>
                                                <p className="text-sm text-gray-700">{item.product?.name || 'Unknown'}</p>
                                                <p className="text-xs text-gray-500">Expires: {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A'}</p>
                                            </div>
                                        </div>
                                        <span className="text-sm font-semibold text-red-600">{item.quantity || 0} left</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-500 text-center py-4">No near expiry items</p>
                        )}
                    </Card>
                </div>
            </div>

            {/* Bottom Section - Recent Sales + Recent Purchases */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Sales */}
                <Card>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">Recent Sales</h3>
                        <button className="text-sm text-cyan-600 hover:text-cyan-700">View All</button>
                    </div>
                    {recentSales?.data?.length > 0 ? (
                        <div className="space-y-3">
                            {recentSales.data.map((sale, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <CheckCircle2 size={16} className="text-green-500" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-800">{sale.orderNumber || 'N/A'}</p>
                                            <p className="text-xs text-gray-500">{sale.customerName || 'Guest'}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold text-gray-800">Rs {sale.totalAmount?.toLocaleString() || 0}</p>
                                        <p className="text-xs text-gray-500">{sale.createdAt ? new Date(sale.createdAt).toLocaleDateString() : 'N/A'}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 text-center py-4">No recent sales</p>
                    )}
                </Card>

                {/* Recent Purchases */}
                <Card>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">Recent Purchases</h3>
                        <button className="text-sm text-cyan-600 hover:text-cyan-700">View All</button>
                    </div>
                    {recentPurchases?.data?.length > 0 ? (
                        <div className="space-y-3">
                            {recentPurchases.data.map((purchase, index) => (
                                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <ShoppingCart size={16} className="text-blue-500" />
                                        <div>
                                            <p className="text-sm font-medium text-gray-800">{purchase.invoiceNumber || 'N/A'}</p>
                                            <p className="text-xs text-gray-500">{purchase.supplier?.name || 'Unknown'}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold text-gray-800">Rs {purchase.totalAmount?.toLocaleString() || 0}</p>
                                        <p className="text-xs text-gray-500">{purchase.createdAt ? new Date(purchase.createdAt).toLocaleDateString() : 'N/A'}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 text-center py-4">No recent purchases</p>
                    )}
                </Card>
            </div>
        </div>
    );
}
