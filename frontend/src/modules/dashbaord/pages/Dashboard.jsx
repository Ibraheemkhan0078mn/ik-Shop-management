import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp, DollarSign, AlertTriangle, Calendar, CheckCircle2,
  ArrowUpRight, ArrowDownRight, Package, ShoppingCart, CreditCard,
  Wallet, Users, Truck, RefreshCw, Zap, PieChart,
} from "lucide-react";
import { toast } from "sonner";
import api from "../../../shared/services/api.js";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart as RechartsPieChart, Pie, Cell } from "recharts";

// ─── Reusable Card ─────────────────────────────────────────────────────────
const Card = ({ children, className = "" }) => (
  <div className={`card ${className}`}>{children}</div>
);

// ─── Reusable Stat Card ────────────────────────────────────────────────────
const StatCard = ({ title, value, icon: Icon, color }) => (
  <Card className="hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <p className="text-sm text-[var(--muted)] mb-1">{title}</p>
        <p className="text-2xl font-bold text-[var(--ink)]">Rs {value?.toLocaleString() || 0}</p>
      </div>
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
    </div>
  </Card>
);

// ─── Section Card ──────────────────────────────────────────────────────────
const SectionCard = ({ title, children, action }) => (
  <Card>
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-lg font-semibold text-[var(--ink)]">{title}</h3>
      {action && (
        <button className="text-sm text-[var(--accent-2)] hover:opacity-80 transition-opacity">
          {action}
        </button>
      )}
    </div>
    {children}
  </Card>
);

// ─── List Item ─────────────────────────────────────────────────────────────
const ListItem = ({ icon: Icon, iconColor, primary, secondary, rightTop, rightBottom }) => (
  <div className="flex items-center justify-between p-3 bg-[var(--app-bg)] rounded-lg">
    <div className="flex items-center gap-3">
      {Icon && <Icon size={16} className={iconColor} />}
      <div>
        <p className="text-sm font-medium text-[var(--ink)]">{primary}</p>
        <p className="text-xs text-[var(--muted)]">{secondary}</p>
      </div>
    </div>
    <div className="text-right">
      <p className="text-sm font-semibold text-[var(--ink)]">{rightTop}</p>
      <p className="text-xs text-[var(--muted)]">{rightBottom}</p>
    </div>
  </div>
);

// ─── Main Component ────────────────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate();
  const [refreshKey, setRefreshKey] = useState(0);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── Fetch Dashboard Data ──────────────────────────────────────────────────
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/dashboard");
      setData(response.data.data);
    } catch (err) {
      setError(err.message || "Failed to load dashboard data");
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [refreshKey]);

  // ── Refresh ──────────────────────────────────────────────────────────────
  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <RefreshCw className="animate-spin text-[var(--accent-2)]" size={40} />
      </div>
    );
  }

  const kpis = data?.kpis || {};
  
  // Format chart data
  const salesChartData = (data?.salesChart || []).map(item => ({
    date: item._id,
    sales: item.total,
    orders: item.count || 0
  }));
  
  const purchaseChartData = (data?.purchaseChart || []).map(item => ({
    date: item._id,
    purchases: item.total
  }));
  
  const wastageChartData = (data?.wastageChart || []).map(item => ({
    date: item._id,
    wastage: item.total
  }));
  
  const paymentChartData = [
    { name: 'Cash', value: data?.paymentMethods?.cash || 0, color: '#10b981' },
    { name: 'Card', value: data?.paymentMethods?.card || 0, color: '#3b82f6' },
    { name: 'Credit', value: data?.paymentMethods?.credit || 0, color: '#f59e0b' },
    { name: 'Other', value: data?.paymentMethods?.other || 0, color: '#6b7280' },
  ].filter(item => item.value > 0);
  
  const categoryChartData = (data?.categorySales || []).slice(0, 6).map(item => ({
    name: item.name,
    revenue: item.totalRevenue,
    quantity: item.totalQuantity
  }));

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="p-6 bg-[var(--app-bg)] min-h-screen">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--ink)] font-display">Dashboard</h1>
          <p className="text-sm text-[var(--muted)]">Overview of your business performance</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate("/quick-list")}
            className="btn-add"
          >
            <Zap size={16} /> Quick List
          </button>
          <button
            onClick={handleRefresh}
            className="btn-add"
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* ── Stats Grid ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard title="Today's Sales" value={kpis.todayRevenue} icon={DollarSign} color="bg-green-500" />
        <StatCard title="Today's Purchase" value={kpis.todayPurchases} icon={ShoppingCart} color="bg-blue-500" />
        <StatCard title="Today's Profit" value={kpis.todayRevenue - kpis.todayPurchases - kpis.todayExpenses} icon={TrendingUp} color="bg-purple-500" />
        <StatCard title="Total Products" value={kpis.totalProducts} icon={Package} color="bg-cyan-500" />
        <StatCard title="Total Customers" value={kpis.totalCustomers} icon={Users} color="bg-orange-500" />
        <StatCard title="Total Suppliers" value={kpis.totalSuppliers} icon={Truck} color="bg-red-500" />
        <StatCard title="Today's Expense" value={kpis.todayExpenses} icon={CreditCard} color="bg-yellow-500" />
        <StatCard title="Monthly Revenue" value={kpis.monthlyRevenue} icon={Wallet} color="bg-indigo-500" />
        <StatCard title="Net Profit" value={kpis.netProfit} icon={TrendingUp} color="bg-emerald-500" />
        <StatCard title="Profit Margin" value={`${kpis.profitMargin}%`} icon={ArrowUpRight} color="bg-teal-500" />
        <StatCard title="Avg Order Value" value={kpis.avgOrderValue} icon={DollarSign} color="bg-rose-500" />
        <StatCard title="Inventory Value" value={kpis.totalInventoryValue} icon={Package} color="bg-amber-500" />
      </div>

      {/* ── Charts Row ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Sales Chart (7 days) */}
        <div className="lg:col-span-2">
          <Card>
            <h3 className="text-lg font-semibold text-[var(--ink)] mb-4 font-display">Sales Trend (7 Days)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={salesChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" stroke="var(--muted)" />
                <YAxis stroke="var(--muted)" />
                <Tooltip />
                <Legend />
                <Bar dataKey="sales" fill="#10b981" name="Sales (Rs)" />
                <Bar dataKey="orders" fill="#3b82f6" name="Orders" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Payment Methods Pie Chart */}
        <div>
          <Card>
            <h3 className="text-lg font-semibold text-[var(--ink)] mb-4 font-display">Payment Methods</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={paymentChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {paymentChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>

      {/* ── Second Charts Row ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Purchase vs Wastage Chart */}
        <Card>
          <h3 className="text-lg font-semibold text-[var(--ink)] mb-4 font-display">Purchases vs Wastage (7 Days)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={purchaseChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" stroke="var(--muted)" />
              <YAxis stroke="var(--muted)" />
              <Tooltip />
              <Legend />
              <Bar dataKey="purchases" fill="#3b82f6" name="Purchases (Rs)" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Category Sales Chart */}
        <Card>
          <h3 className="text-lg font-semibold text-[var(--ink)] mb-4 font-display">Category Sales</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={categoryChartData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis type="number" stroke="var(--muted)" />
              <YAxis dataKey="name" type="category" width={100} stroke="var(--muted)" />
              <Tooltip />
              <Legend />
              <Bar dataKey="revenue" fill="#8b5cf6" name="Revenue (Rs)" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* ── Bottom Grid ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Left Column */}
        <div className="space-y-6">
          <SectionCard title="Top Selling Products">
            {data?.topSellingProducts?.length ? (
              data.topSellingProducts.map((item, i) => (
                <ListItem
                  key={i}
                  primary={<RankBadge rank={i + 1} />}
                  secondary={item.name || 'Unknown'}
                  rightTop={`${item.totalQuantity || 0} sold`}
                  rightBottom={`Rs ${(item.totalRevenue || 0).toLocaleString()}`}
                />
              ))
            ) : (
              <EmptyState message="No data available" />
            )}
          </SectionCard>

          <SectionCard title="Top Customers">
            {data?.topCustomers?.length ? (
              data.topCustomers.map((item, i) => (
                <ListItem
                  key={i}
                  icon={Users}
                  iconColor="text-[var(--muted)]"
                  primary={item.name || 'Unknown'}
                  rightTop={`Rs ${(item.totalSpent || 0).toLocaleString()}`}
                  rightBottom={`${item.orderCount || 0} orders`}
                />
              ))
            ) : (
              <EmptyState message="No data available" />
            )}
          </SectionCard>
        </div>

        {/* Middle Column */}
        <div className="space-y-6">
          <SectionCard title="Financial Summary">
            <div className="space-y-3">
              <SummaryRow label="Total Receivables" value={data?.financialSummary?.totalReceivables || 0} isWarning />
              <SummaryRow label="Receivable Accounts" value={data?.financialSummary?.totalReceivablesCount || 0} isNumber />
              <hr className="border-[var(--border)]" />
              <SummaryRow label="Total Payables" value={data?.financialSummary?.totalPayables || 0} isDanger />
              <SummaryRow label="Payable Accounts" value={data?.financialSummary?.totalPayablesCount || 0} isNumber />
              <hr className="border-[var(--border)]" />
              <SummaryRow label="Net Profit" value={data?.financialSummary?.netProfit || 0} isProfit />
            </div>
          </SectionCard>

          <SectionCard title="Pending Approvals">
            <div className="space-y-2">
              <SummaryRow label="Pending Wastages" value={data?.pendingApprovals?.pendingWastages || 0} isNumber isWarning />
              <SummaryRow label="Pending Purchase Returns" value={data?.pendingApprovals?.pendingPurchaseReturns || 0} isNumber isWarning />
              <SummaryRow label="Pending Product Returns" value={data?.pendingApprovals?.pendingProductReturns || 0} isNumber isWarning />
            </div>
          </SectionCard>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <SectionCard title="Low Stock Products">
            {data?.lowStockAlerts?.length ? (
              data.lowStockAlerts.slice(0, 5).map((item, i) => (
                <ListItem
                  key={i}
                  icon={AlertTriangle}
                  iconColor="text-orange-500"
                  primary={item.name || 'Unknown'}
                  secondary={`Stock: ${item.currentStockLevel || 0}`}
                  rightTop={`Min: ${item.minStockLevel || 5}`}
                  rightBottom=""
                />
              ))
            ) : (
              <EmptyState message="No low stock items" />
            )}
          </SectionCard>

          <SectionCard title="Expiry Alerts">
            <div className="space-y-2">
              <SummaryRow label="Expired Batches" value={data?.expiryAlerts?.expiredBatches?.length || 0} isNumber isDanger />
              <SummaryRow label="Expiring in 30 Days" value={data?.expiryAlerts?.expiringIn30Days?.length || 0} isNumber isWarning />
            </div>
          </SectionCard>
        </div>
      </div>

      {/* ── Recent Sales & Purchases ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Recent Sales" action="View All">
          {data?.recentOrders?.length ? (
            data.recentOrders.slice(0, 5).map((sale, i) => (
              <ListItem
                key={i}
                icon={CheckCircle2}
                iconColor="text-green-500"
                primary={sale.orderNumber || 'N/A'}
                secondary={sale.customer?.name || 'Guest'}
                rightTop={`Rs ${(sale.totalAmount || 0).toLocaleString()}`}
                rightBottom={sale.createdAt ? new Date(sale.createdAt).toLocaleDateString() : 'N/A'}
              />
            ))
          ) : (
            <EmptyState message="No recent sales" />
          )}
        </SectionCard>

        <SectionCard title="Recent Purchases" action="View All">
          {data?.recentPurchases?.length ? (
            data.recentPurchases.slice(0, 5).map((purchase, i) => (
              <ListItem
                key={i}
                icon={ShoppingCart}
                iconColor="text-blue-500"
                primary={purchase.invoiceNumber || 'N/A'}
                secondary={purchase.supplier?.name || 'Unknown'}
                rightTop={`Rs ${(purchase.totalAmount || 0).toLocaleString()}`}
                rightBottom={purchase.createdAt ? new Date(purchase.createdAt).toLocaleDateString() : 'N/A'}
              />
            ))
          ) : (
            <EmptyState message="No recent purchases" />
          )}
        </SectionCard>
      </div>
    </div>
  );
}

// ─── Sub-Components ──────────────────────────────────────────────────────
const SummaryRow = ({ label, value, isProfit, isNumber, isWarning, isDanger }) => {
  let colorClass = "text-[var(--ink)]";
  if (isProfit) colorClass = value >= 0 ? "text-green-600" : "text-red-600";
  if (isWarning) colorClass = "text-orange-600";
  if (isDanger) colorClass = "text-red-600";

  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-[var(--muted)]">{label}</span>
      <span className={`font-semibold ${colorClass}`}>
        {isNumber ? value?.toLocaleString() || 0 : `Rs ${value?.toLocaleString() || 0}`}
      </span>
    </div>
  );
};

const RankBadge = ({ rank }) => (
  <span className="w-6 h-6 rounded-full bg-[var(--accent-2)]/10 text-[var(--accent-2)] flex items-center justify-center text-xs font-bold">
    {rank}
  </span>
);

const EmptyState = ({ message }) => (
  <p className="text-sm text-[var(--muted)] text-center py-4">{message}</p>
);















// import React, { useState, useEffect } from "react";
// import { useNavigate } from "react-router-dom";
// import {
//     TrendingUp,
//     DollarSign,
//     AlertTriangle,
//     Calendar,
//     CheckCircle2,
//     ArrowUpRight,
//     ArrowDownRight,
//     Package,
//     ShoppingCart,
//     CreditCard,
//     Wallet,
//     Users,
//     Truck,
//     RefreshCw,
//     Zap,
// } from "lucide-react";
// import { toast } from "sonner";
// import {
//     useGetDashboardSummaryQuery,
//     useGetTopSellingProductsQuery,
//     useGetTopCustomersQuery,
//     useGetLowStockProductsQuery,
//     useGetNearExpiryProductsQuery,
//     useGetRecentSalesQuery,
//     useGetRecentPurchasesQuery,
// } from "../../reports/services/reports.service.js";
// import {
//     BarChart,
//     Bar,
//     XAxis,
//     YAxis,
//     CartesianGrid,
//     Tooltip,
//     ResponsiveContainer,
//     LineChart,
//     Line,
//     Legend,
// } from "recharts";

// function Card({ children, className = "" }) {
//     return (
//         <div
//             className={`p-5 border bg-white border-gray-200 rounded-2xl shadow-sm ${className}`}
//         >
//             {children}
//         </div>
//     );
// }

// function StatCard({ title, value, icon: Icon, change, changeType, color }) {
//     return (
//         <Card className="hover:shadow-md transition-shadow">
//             <div className="flex items-start justify-between">
//                 <div className="flex-1">
//                     <p className="text-sm text-gray-500 mb-1">{title}</p>
//                     <p className="text-2xl font-bold text-gray-800">
//                         Rs {value?.toLocaleString() || 0}
//                     </p>
//                     {change !== undefined && (
//                         <div className={`flex items-center mt-2 text-sm ${changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
//                             {changeType === 'positive' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
//                             <span className="ml-1">{change}%</span>
//                         </div>
//                     )}
//                 </div>
//                 <div className={`p-3 rounded-xl ${color}`}>
//                     <Icon size={20} className="text-white" />
//                 </div>
//             </div>
//         </Card>
//     );
// }

// export default function Dashboard() {
//     const navigate = useNavigate();
//     const [refreshKey, setRefreshKey] = useState(0);

//     // Dashboard Summary
//     const { data: dashboardSummary, isLoading: summaryLoading, error: summaryError, refetch: refetchSummary } = useGetDashboardSummaryQuery();

//     // Dashboard Components
//     const { data: topProducts, isLoading: topProductsLoading, error: topProductsError, refetch: refetchTopProducts } = useGetTopSellingProductsQuery({ limit: 5 });
//     const { data: topCustomers, isLoading: topCustomersLoading, error: topCustomersError, refetch: refetchTopCustomers } = useGetTopCustomersQuery({ limit: 5 });
//     const { data: lowStock, isLoading: lowStockLoading, error: lowStockError, refetch: refetchLowStock } = useGetLowStockProductsQuery({ limit: 5 });
//     const { data: nearExpiry, isLoading: nearExpiryLoading, error: nearExpiryError, refetch: refetchNearExpiry } = useGetNearExpiryProductsQuery({ limit: 5 });
//     const { data: recentSales, isLoading: recentSalesLoading, error: recentSalesError, refetch: refetchRecentSales } = useGetRecentSalesQuery({ limit: 5 });
//     const { data: recentPurchases, isLoading: recentPurchasesLoading, error: recentPurchasesError, refetch: refetchRecentPurchases } = useGetRecentPurchasesQuery({ limit: 5 });

//     // Handle errors
//     useEffect(() => {
//         if (summaryError) toast.error("Failed to load dashboard summary");
//         if (topProductsError) toast.error("Failed to load top products");
//         if (topCustomersError) toast.error("Failed to load top customers");
//         if (lowStockError) toast.error("Failed to load low stock products");
//         if (nearExpiryError) toast.error("Failed to load near expiry products");
//         if (recentSalesError) toast.error("Failed to load recent sales");
//         if (recentPurchasesError) toast.error("Failed to load recent purchases");
//     }, [summaryError, topProductsError, topCustomersError, lowStockError, nearExpiryError, recentSalesError, recentPurchasesError]);

//     const handleRefresh = () => {
//         setRefreshKey(prev => prev + 1);
//         refetchSummary();
//         refetchTopProducts();
//         refetchTopCustomers();
//         refetchLowStock();
//         refetchNearExpiry();
//         refetchRecentSales();
//         refetchRecentPurchases();
//     };

//     const isLoading = summaryLoading || topProductsLoading || topCustomersLoading || lowStockLoading || nearExpiryLoading || recentSalesLoading || recentPurchasesLoading;

//     if (isLoading) {
//         return (
//             <div className="flex items-center justify-center h-screen">
//                 <RefreshCw className="animate-spin text-cyan-600" size={40} />
//             </div>
//         );
//     }

//     const summary = dashboardSummary?.data || {};

//     // Prepare chart data for Sales vs Purchase
//     const chartData = [
//         { name: 'Sales', Sales: summary.todaySales || 0, Purchase: summary.todayPurchase || 0 },
//     ];

//     return (
//         <div className="p-6 bg-gray-50 min-h-screen">
//             {/* Header */}
//             <div className="flex items-center justify-between mb-6">
//                 <div>
//                     <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
//                     <p className="text-sm text-gray-500">Overview of your business performance</p>
//                 </div>
//                 <div className="flex gap-2">
//                     <button
//                         onClick={() => navigate("/quick-list")}
//                         className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
//                     >
//                         <Zap size={16} />
//                         Quick List
//                     </button>
//                     <button
//                         onClick={handleRefresh}
//                         className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
//                     >
//                         <RefreshCw size={16} />
//                         Refresh
//                     </button>
//                 </div>
//             </div>

//             {/* Top Section - 8 Summary Cards */}
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
//                 {/* Row 1 */}
//                 <StatCard
//                     title="Today's Sales"
//                     value={summary.todaySales}
//                     icon={DollarSign}
//                     color="bg-green-500"
//                 />
//                 <StatCard
//                     title="Today's Purchase"
//                     value={summary.todayPurchase}
//                     icon={ShoppingCart}
//                     color="bg-blue-500"
//                 />
//                 <StatCard
//                     title="Today's Profit"
//                     value={summary.todayProfit}
//                     icon={TrendingUp}
//                     color="bg-purple-500"
//                     changeType={summary.todayProfit >= 0 ? 'positive' : 'negative'}
//                 />
//                 <StatCard
//                     title="Cash Balance"
//                     value={summary.cashBalance}
//                     icon={Wallet}
//                     color="bg-cyan-500"
//                 />

//                 {/* Row 2 */}
//                 <StatCard
//                     title="Total Receivable"
//                     value={summary.totalReceivable}
//                     icon={CreditCard}
//                     color="bg-orange-500"
//                 />
//                 <StatCard
//                     title="Total Payable"
//                     value={summary.totalPayable}
//                     icon={AlertTriangle}
//                     color="bg-red-500"
//                 />
//                 <StatCard
//                     title="Today's Expense"
//                     value={summary.todayExpense}
//                     icon={Package}
//                     color="bg-yellow-500"
//                 />
//                 <StatCard
//                     title="Inventory Value"
//                     value={summary.inventoryValue}
//                     icon={Truck}
//                     color="bg-indigo-500"
//                 />
//             </div>

//             {/* Middle Section - Chart + Business Summary */}
//             <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
//                 {/* Sales vs Purchase Chart - 70% */}
//                 <div className="lg:col-span-2">
//                     <Card>
//                         <h3 className="text-lg font-semibold text-gray-800 mb-4">Sales vs Purchase</h3>
//                         <ResponsiveContainer width="100%" height={300}>
//                             <BarChart data={chartData}>
//                                 <CartesianGrid strokeDasharray="3 3" />
//                                 <XAxis dataKey="name" />
//                                 <YAxis />
//                                 <Tooltip />
//                                 <Legend />
//                                 <Bar dataKey="Sales" fill="#10b981" />
//                                 <Bar dataKey="Purchase" fill="#3b82f6" />
//                             </BarChart>
//                         </ResponsiveContainer>
//                     </Card>
//                 </div>

//                 {/* Today's Business Summary - 30% */}
//                 <div>
//                     <Card>
//                         <h3 className="text-lg font-semibold text-gray-800 mb-4">Today's Summary</h3>
//                         <div className="space-y-3">
//                             <div className="flex justify-between items-center">
//                                 <span className="text-sm text-gray-600">Sales</span>
//                                 <span className="font-semibold text-gray-800">Rs {summary.todaySales?.toLocaleString() || 0}</span>
//                             </div>
//                             <div className="flex justify-between items-center">
//                                 <span className="text-sm text-gray-600">Purchase</span>
//                                 <span className="font-semibold text-gray-800">Rs {summary.todayPurchase?.toLocaleString() || 0}</span>
//                             </div>
//                             <div className="flex justify-between items-center">
//                                 <span className="text-sm text-gray-600">Expense</span>
//                                 <span className="font-semibold text-gray-800">Rs {summary.todayExpense?.toLocaleString() || 0}</span>
//                             </div>
//                             <div className="flex justify-between items-center">
//                                 <span className="text-sm text-gray-600">Profit</span>
//                                 <span className={`font-semibold ${summary.todayProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
//                                     Rs {summary.todayProfit?.toLocaleString() || 0}
//                                 </span>
//                             </div>
//                             <hr className="my-3" />
//                             <div className="flex justify-between items-center">
//                                 <span className="text-sm text-gray-600">New Members</span>
//                                 <span className="font-semibold text-gray-800">{summary.newMembers || 0}</span>
//                             </div>
//                             <div className="flex justify-between items-center">
//                                 <span className="text-sm text-gray-600">New Suppliers</span>
//                                 <span className="font-semibold text-gray-800">{summary.newSuppliers || 0}</span>
//                             </div>
//                             <div className="flex justify-between items-center">
//                                 <span className="text-sm text-gray-600">Low Stock</span>
//                                 <span className="font-semibold text-orange-600">{summary.lowStockCount || 0}</span>
//                             </div>
//                             <div className="flex justify-between items-center">
//                                 <span className="text-sm text-gray-600">Pending Credits</span>
//                                 <span className="font-semibold text-red-600">{summary.pendingCredits || 0}</span>
//                             </div>
//                         </div>
//                     </Card>
//                 </div>
//             </div>

//             {/* Below Chart Section - 4 panels */}
//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
//                 {/* Left: Top Selling Products + Top Customers */}
//                 <div className="space-y-6">
//                     {/* Top Selling Products */}
//                     <Card>
//                         <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Selling Products</h3>
//                         {topProducts?.data?.length > 0 ? (
//                             <div className="space-y-3">
//                                 {topProducts.data.map((item, index) => (
//                                     <div key={index} className="flex items-center justify-between">
//                                         <div className="flex items-center gap-3">
//                                             <span className="w-6 h-6 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center text-xs font-bold">
//                                                 {index + 1}
//                                             </span>
//                                             <span className="text-sm text-gray-700">{item.product?.name || 'Unknown'}</span>
//                                         </div>
//                                         <div className="text-right">
//                                             <p className="text-sm font-semibold text-gray-800">Rs {item.totalRevenue?.toLocaleString() || 0}</p>
//                                             <p className="text-xs text-gray-500">{item.totalQuantity || 0} sold</p>
//                                         </div>
//                                     </div>
//                                 ))}
//                             </div>
//                         ) : (
//                             <p className="text-sm text-gray-500 text-center py-4">No data available</p>
//                         )}
//                     </Card>

//                     {/* Top Customers */}
//                     <Card>
//                         <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Customers</h3>
//                         {topCustomers?.data?.length > 0 ? (
//                             <div className="space-y-3">
//                                 {topCustomers.data.map((item, index) => (
//                                     <div key={index} className="flex items-center justify-between">
//                                         <div className="flex items-center gap-3">
//                                             <Users size={16} className="text-gray-400" />
//                                             <span className="text-sm text-gray-700">{item._id || 'Unknown'}</span>
//                                         </div>
//                                         <div className="text-right">
//                                             <p className="text-sm font-semibold text-gray-800">Rs {item.totalSpent?.toLocaleString() || 0}</p>
//                                             <p className="text-xs text-gray-500">{item.orderCount || 0} orders</p>
//                                         </div>
//                                     </div>
//                                 ))}
//                             </div>
//                         ) : (
//                             <p className="text-sm text-gray-500 text-center py-4">No data available</p>
//                         )}
//                     </Card>
//                 </div>

//                 {/* Right: Low Stock Products + Near Expiry Products */}
//                 <div className="space-y-6">
//                     {/* Low Stock Products */}
//                     <Card>
//                         <h3 className="text-lg font-semibold text-gray-800 mb-4">Low Stock Products</h3>
//                         {lowStock?.data?.length > 0 ? (
//                             <div className="space-y-3">
//                                 {lowStock.data.map((item, index) => (
//                                     <div key={index} className="flex items-center justify-between">
//                                         <div className="flex items-center gap-3">
//                                             <AlertTriangle size={16} className="text-orange-500" />
//                                             <div>
//                                                 <p className="text-sm text-gray-700">{item.product?.name || 'Unknown'}</p>
//                                                 <p className="text-xs text-gray-500">Batch: {item.batchNumber || 'N/A'}</p>
//                                             </div>
//                                         </div>
//                                         <span className="text-sm font-semibold text-orange-600">{item.quantity || 0} left</span>
//                                     </div>
//                                 ))}
//                             </div>
//                         ) : (
//                             <p className="text-sm text-gray-500 text-center py-4">No low stock items</p>
//                         )}
//                     </Card>

//                     {/* Near Expiry Products */}
//                     <Card>
//                         <h3 className="text-lg font-semibold text-gray-800 mb-4">Near Expiry Products</h3>
//                         {nearExpiry?.data?.length > 0 ? (
//                             <div className="space-y-3">
//                                 {nearExpiry.data.map((item, index) => (
//                                     <div key={index} className="flex items-center justify-between">
//                                         <div className="flex items-center gap-3">
//                                             <Calendar size={16} className="text-red-500" />
//                                             <div>
//                                                 <p className="text-sm text-gray-700">{item.product?.name || 'Unknown'}</p>
//                                                 <p className="text-xs text-gray-500">Expires: {item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A'}</p>
//                                             </div>
//                                         </div>
//                                         <span className="text-sm font-semibold text-red-600">{item.quantity || 0} left</span>
//                                     </div>
//                                 ))}
//                             </div>
//                         ) : (
//                             <p className="text-sm text-gray-500 text-center py-4">No near expiry items</p>
//                         )}
//                     </Card>
//                 </div>
//             </div>

//             {/* Bottom Section - Recent Sales + Recent Purchases */}
//             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//                 {/* Recent Sales */}
//                 <Card>
//                     <div className="flex items-center justify-between mb-4">
//                         <h3 className="text-lg font-semibold text-gray-800">Recent Sales</h3>
//                         <button className="text-sm text-cyan-600 hover:text-cyan-700">View All</button>
//                     </div>
//                     {recentSales?.data?.length > 0 ? (
//                         <div className="space-y-3">
//                             {recentSales.data.map((sale, index) => (
//                                 <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
//                                     <div className="flex items-center gap-3">
//                                         <CheckCircle2 size={16} className="text-green-500" />
//                                         <div>
//                                             <p className="text-sm font-medium text-gray-800">{sale.orderNumber || 'N/A'}</p>
//                                             <p className="text-xs text-gray-500">{sale.customerName || 'Guest'}</p>
//                                         </div>
//                                     </div>
//                                     <div className="text-right">
//                                         <p className="text-sm font-semibold text-gray-800">Rs {sale.totalAmount?.toLocaleString() || 0}</p>
//                                         <p className="text-xs text-gray-500">{sale.createdAt ? new Date(sale.createdAt).toLocaleDateString() : 'N/A'}</p>
//                                     </div>
//                                 </div>
//                             ))}
//                         </div>
//                     ) : (
//                         <p className="text-sm text-gray-500 text-center py-4">No recent sales</p>
//                     )}
//                 </Card>

//                 {/* Recent Purchases */}
//                 <Card>
//                     <div className="flex items-center justify-between mb-4">
//                         <h3 className="text-lg font-semibold text-gray-800">Recent Purchases</h3>
//                         <button className="text-sm text-cyan-600 hover:text-cyan-700">View All</button>
//                     </div>
//                     {recentPurchases?.data?.length > 0 ? (
//                         <div className="space-y-3">
//                             {recentPurchases.data.map((purchase, index) => (
//                                 <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
//                                     <div className="flex items-center gap-3">
//                                         <ShoppingCart size={16} className="text-blue-500" />
//                                         <div>
//                                             <p className="text-sm font-medium text-gray-800">{purchase.invoiceNumber || 'N/A'}</p>
//                                             <p className="text-xs text-gray-500">{purchase.supplier?.name || 'Unknown'}</p>
//                                         </div>
//                                     </div>
//                                     <div className="text-right">
//                                         <p className="text-sm font-semibold text-gray-800">Rs {purchase.totalAmount?.toLocaleString() || 0}</p>
//                                         <p className="text-xs text-gray-500">{purchase.createdAt ? new Date(purchase.createdAt).toLocaleDateString() : 'N/A'}</p>
//                                     </div>
//                                 </div>
//                             ))}
//                         </div>
//                     ) : (
//                         <p className="text-sm text-gray-500 text-center py-4">No recent purchases</p>
//                     )}
//                 </Card>
//             </div>
//         </div>
//     );
// }
