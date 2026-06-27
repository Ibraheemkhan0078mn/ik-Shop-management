import React from 'react';
import { DollarSign, TrendingUp, ShoppingCart, Package } from 'lucide-react';
import KPICard from './KPICard.jsx';
import TimeRangeFilter from './TimeRangeFilter.jsx';
import { useGetSalesRevenueKPIsQuery } from '../services/dashboard.service.js';

export default function SalesRevenueKPIs() {
  const [filter, setFilter] = React.useState('30D');
  const { data: kpis, isLoading } = useGetSalesRevenueKPIsQuery(filter);

  return (
    <div className="space-y-4">
      {/* Shared Filter */}
      <div className="flex justify-end">
        <TimeRangeFilter value={filter} onChange={setFilter} />
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KPICard
          label="Total Revenue"
          value={kpis?.totalRevenue}
          subLabel="Retail + Wholesale combined"
          secondary={{
            'Retail': kpis?.retailRevenue,
            'Wholesale': kpis?.wholesaleRevenue,
          }}
          icon={DollarSign}
          color="bg-green-500"
          loading={isLoading}
        />

        <KPICard
          label="Retail Revenue"
          value={kpis?.retailRevenue}
          subLabel={`(${kpis?.retailOrders} orders)`}
          icon={ShoppingCart}
          color="bg-blue-500"
          loading={isLoading}
        />

        <KPICard
          label="Wholesale Revenue"
          value={kpis?.wholesaleRevenue}
          subLabel={`(${kpis?.wholesaleOrders} orders)`}
          icon={Package}
          color="bg-purple-500"
          loading={isLoading}
        />

        <KPICard
          label="Total Orders"
          value={kpis?.totalOrders}
          subLabel={`Retail: ${kpis?.retailOrders} | Wholesale: ${kpis?.wholesaleOrders}`}
          icon={ShoppingCart}
          color="bg-cyan-500"
          loading={isLoading}
        />

        <KPICard
          label="Average Order Value"
          value={kpis?.avgOrderValue}
          secondary={{
            'Retail AOV': kpis?.retailAvgOrderValue,
            'Wholesale AOV': kpis?.wholesaleAvgOrderValue,
          }}
          icon={TrendingUp}
          color="bg-orange-500"
          loading={isLoading}
        />

        <KPICard
          label="Gross Profit"
          value={kpis?.grossProfit}
          subLabel={`${kpis?.grossMargin}% margin`}
          icon={TrendingUp}
          color="bg-emerald-500"
          loading={isLoading}
        />
      </div>
    </div>
  );
}
