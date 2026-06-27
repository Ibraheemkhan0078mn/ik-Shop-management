import React from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import ChartCard from './ChartCard.jsx';
import { useGetTopSellingProductsQuery, useGetSalesByCategoryQuery } from '../services/dashboard.service.js';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export default function ProductCategoryCharts() {
  const [topProductsFilter, setTopProductsFilter] = React.useState('30D');
  const [topProductsMetric, setTopProductsMetric] = React.useState('revenue');
  const [categoryFilter, setCategoryFilter] = React.useState('30D');

  const { data: topProductsData, isLoading: topProductsLoading } = useGetTopSellingProductsQuery({ range: topProductsFilter, metric: topProductsMetric });
  const { data: categoryData, isLoading: categoryLoading } = useGetSalesByCategoryQuery(categoryFilter);

  const topProductsChartData = topProductsData?.map(d => ({
    name: d.name,
    [topProductsMetric === 'revenue' ? 'Revenue' : 'Units']: topProductsMetric === 'revenue' ? d.revenue : d.unitsSold,
  })) || [];

  const categoryChartData = categoryData?.map(d => ({
    name: d.name,
    revenue: d.revenue,
    orderCount: d.orderCount,
  })) || [];

  const pieChartData = categoryData?.map(d => ({
    name: d.name,
    value: d.revenue,
  })) || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Top Selling Products */}
      <ChartCard
        title="Top Selling Products"
        loading={topProductsLoading}
        height={300}
        showFilter
        defaultFilter="30D"
        onFilterChange={setTopProductsFilter}
        emptyMessage="No sales data for this period"
        isEmpty={topProductsChartData.length === 0}
        filterSlot={
          <select
            value={topProductsMetric}
            onChange={(e) => setTopProductsMetric(e.target.value)}
            className="px-3 py-1.5 border border-[var(--border)] rounded-lg text-sm bg-[var(--app-bg)]"
          >
            <option value="revenue">By Revenue</option>
            <option value="units">By Units Sold</option>
          </select>
        }
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={topProductsChartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis type="number" stroke="var(--muted)" />
            <YAxis dataKey="name" type="category" width={100} stroke="var(--muted)" />
            <Tooltip />
            <Legend />
            <Bar 
              dataKey={topProductsMetric === 'revenue' ? 'Revenue' : 'Units'} 
              fill="#10b981" 
              name={topProductsMetric === 'revenue' ? 'Revenue' : 'Units Sold'}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Sales by Category */}
      <ChartCard
        title="Sales by Category"
        loading={categoryLoading}
        height={300}
        showFilter
        defaultFilter="30D"
        onFilterChange={setCategoryFilter}
        emptyMessage="No category data for this period"
        isEmpty={categoryChartData.length === 0}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieChartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(entry) => `${entry.name}: Rs ${entry.value.toLocaleString()}`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {pieChartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
