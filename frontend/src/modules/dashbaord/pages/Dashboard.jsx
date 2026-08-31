import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardLabels } from '../labels/dashboardLabels.js';
import { useSettings } from '../../settings/hooks/useSettings.js';
import AlertBar from '../components/AlertBar.jsx';
import SalesRevenueKPIs from '../components/SalesRevenueKPIs.jsx';
import InventoryAlertKPIs from '../components/InventoryAlertKPIs.jsx';
import SalesCharts from '../components/SalesCharts.jsx';
import TopProductsByRevenue from '../components/TopProductsByRevenue.jsx';
import TopProductsByUnits from '../components/TopProductsByUnits.jsx';
import RetailWholesaleComparison from '../components/RetailWholesaleComparison.jsx';
import TimeRangeFilter from '../components/TimeRangeFilter.jsx';

export default function Dashboard() {
  const navigate = useNavigate();
  const { settings } = useSettings();
  const language = settings?.language || "en";
  const labels = getDashboardLabels(language);
  
  const [globalDateFilter, setGlobalDateFilter] = React.useState('30D');

  return (
    <div className="p-6 bg-[var(--app-bg)] min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--ink)] font-display">{labels.dashboard}</h1>
          <p className="text-sm text-[var(--muted)]">{labels.businessOverview}</p>
        </div>
        <div className="flex gap-2 items-center">
          <TimeRangeFilter value={globalDateFilter} onChange={setGlobalDateFilter} size="default" />
        </div>
      </div>

      {/* Section 1: Alert Bar */}
      <AlertBar />

      {/* Section 2: Sales & Revenue KPIs */}
      <div className="mb-8">
        <SalesRevenueKPIs filter={globalDateFilter} />
      </div>

      {/* Section 3: Inventory Alert KPIs */}
      <div className="mb-8">
        <InventoryAlertKPIs filter={globalDateFilter} />
      </div>

      {/* Section 4: Sales Charts */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-[var(--ink)] mb-4">{labels.salesPerformance}</h2>
        <SalesCharts filter={globalDateFilter} />
      </div>

      {/* Section 5: Top Selling Products */}
      <div className="mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TopProductsByRevenue filter={globalDateFilter} />
          <TopProductsByUnits filter={globalDateFilter} />
        </div>
      </div>

      {/* Section 6: Retail vs Wholesale Comparison */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-[var(--ink)] mb-4">{labels.retailVsWholesale}</h2>
        <RetailWholesaleComparison filter={globalDateFilter} />
      </div>
    </div>
  );
}
