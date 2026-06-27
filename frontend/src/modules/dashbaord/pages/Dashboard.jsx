import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Zap } from 'lucide-react';
import AlertBar from '../components/AlertBar.jsx';
import SalesRevenueKPIs from '../components/SalesRevenueKPIs.jsx';
import InventoryAlertKPIs from '../components/InventoryAlertKPIs.jsx';
import SalesCharts from '../components/SalesCharts.jsx';
import ProductCategoryCharts from '../components/ProductCategoryCharts.jsx';
import RetailWholesaleComparison from '../components/RetailWholesaleComparison.jsx';
import InventoryOverviewCharts from '../components/InventoryOverviewCharts.jsx';
import { dashboardApi } from '../services/dashboard.service.js';

export default function Dashboard() {
  const navigate = useNavigate();

  const handleRefresh = () => {
    dashboardApi.util.invalidateTags(['Dashboard']);
  };

  return (
    <div className="p-6 bg-[var(--app-bg)] min-h-screen">
      {/* Header */}
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

      {/* Section 1: Alert Bar */}
      <AlertBar />

      {/* Section 2: Sales & Revenue KPIs */}
      <div className="mb-8">
        <SalesRevenueKPIs />
      </div>

      {/* Section 3: Inventory Alert KPIs */}
      <div className="mb-8">
        <InventoryAlertKPIs />
      </div>

      {/* Section 4: Sales Charts */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-[var(--ink)] mb-4">Sales Performance</h2>
        <SalesCharts />
      </div>

      {/* Section 5: Product & Category Charts */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-[var(--ink)] mb-4">Products & Categories</h2>
        <ProductCategoryCharts />
      </div>

      {/* Section 6: Retail vs Wholesale Comparison */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-[var(--ink)] mb-4">Retail vs Wholesale</h2>
        <RetailWholesaleComparison />
      </div>

      {/* Section 7: Inventory Overview Charts */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-[var(--ink)] mb-4">Inventory Overview</h2>
        <InventoryOverviewCharts />
      </div>
    </div>
  );
}
