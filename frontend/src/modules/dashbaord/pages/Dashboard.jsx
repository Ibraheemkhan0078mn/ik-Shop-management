import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Zap } from 'lucide-react';
import { getDashboardLabels } from '../labels/dashboardLabels.js';
import { useSettings } from '../../settings/hooks/useSettings.js';
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
  const { settings } = useSettings();
  const language = settings?.language || "en";
  const labels = getDashboardLabels(language);

  const handleRefresh = () => {
    dashboardApi.util.invalidateTags(['Dashboard']);
  };

  return (
    <div className="p-6 bg-[var(--app-bg)] min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--ink)] font-display">{labels.dashboard}</h1>
          <p className="text-sm text-[var(--muted)]">{labels.businessOverview}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate("/quick-list")}
            className="btn-add"
          >
            <Zap size={16} /> {labels.quickList}
          </button>
          <button
            onClick={handleRefresh}
            className="btn-add"
          >
            <RefreshCw size={16} /> {labels.refresh}
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
        <h2 className="text-lg font-semibold text-[var(--ink)] mb-4">{labels.salesPerformance}</h2>
        <SalesCharts />
      </div>

      {/* Section 5: Product & Category Charts */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-[var(--ink)] mb-4">{labels.productsAndCategories}</h2>
        <ProductCategoryCharts />
      </div>

      {/* Section 6: Retail vs Wholesale Comparison */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-[var(--ink)] mb-4">{labels.retailVsWholesale}</h2>
        <RetailWholesaleComparison />
      </div>

      {/* Section 7: Inventory Overview Charts */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-[var(--ink)] mb-4">{labels.inventoryOverview}</h2>
        <InventoryOverviewCharts />
      </div>
    </div>
  );
}
